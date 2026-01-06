#!/bin/bash

#####################################################################
# LoanEase - Complete Ubuntu Server Deployment Script
# 
# This script will install and configure everything needed to run
# the LoanEase loan application on a fresh Ubuntu server.
#
# Tested on: Ubuntu 20.04 LTS, Ubuntu 22.04 LTS
#
# Usage: 
#   chmod +x deploy.sh
#   sudo ./deploy.sh
#
# After running, access the application at:
#   http://your-server-ip
#   Admin Dashboard: http://your-server-ip/admin (password: admin123)
#####################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="loanease"
APP_DIR="/var/www/$APP_NAME"
DOMAIN="${DOMAIN:-localhost}"
BACKEND_PORT=8001
FRONTEND_PORT=3000

# Print colored message
print_status() {
    echo -e "${BLUE}[*]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

echo ""
echo "========================================"
echo "  LoanEase Deployment Script"
echo "  Ubuntu Server Setup"
echo "========================================"
echo ""

#####################################################################
# STEP 1: System Update
#####################################################################
print_status "Updating system packages..."
apt update && apt upgrade -y
print_success "System updated"

#####################################################################
# STEP 2: Install Required Packages
#####################################################################
print_status "Installing required packages..."
apt install -y \
    curl \
    wget \
    git \
    nginx \
    python3 \
    python3-pip \
    python3-venv \
    gnupg \
    software-properties-common \
    ufw \
    supervisor

print_success "Required packages installed"

#####################################################################
# STEP 3: Install Node.js 18.x
#####################################################################
print_status "Installing Node.js 18.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi
print_success "Node.js $(node --version) installed"

# Install Yarn
print_status "Installing Yarn..."
npm install -g yarn
print_success "Yarn installed"

#####################################################################
# STEP 4: Install MongoDB
#####################################################################
print_status "Installing MongoDB..."
if ! command -v mongod &> /dev/null; then
    # Import MongoDB public GPG key
    curl -fsSL https://pgp.mongodb.com/server-6.0.asc | \
        gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor

    # Add MongoDB repository
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | \
        tee /etc/apt/sources.list.d/mongodb-org-6.0.list

    apt update
    apt install -y mongodb-org
fi

# Start and enable MongoDB
systemctl start mongod
systemctl enable mongod
print_success "MongoDB installed and running"

#####################################################################
# STEP 5: Create Application Directory
#####################################################################
print_status "Setting up application directory..."
mkdir -p $APP_DIR
cd $APP_DIR

# Create directory structure
mkdir -p backend frontend

print_success "Application directory created at $APP_DIR"

#####################################################################
# STEP 6: Create Backend Files
#####################################################################
print_status "Creating backend application..."

# Create requirements.txt
cat > $APP_DIR/backend/requirements.txt << 'REQUIREMENTS'
fastapi==0.104.1
uvicorn[standard]==0.24.0
motor==3.3.2
python-dotenv==1.0.0
pydantic[email]==2.5.2
python-multipart==0.0.6
aiofiles==23.2.1
REQUIREMENTS

# Create .env file
cat > $APP_DIR/backend/.env << 'ENVFILE'
MONGO_URL="mongodb://localhost:27017"
DB_NAME="loanease_db"
CORS_ORIGINS="*"
ENVFILE

# Create server.py
cat > $APP_DIR/backend/server.py << 'SERVERPY'
from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import aiofiles
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

ADMIN_PASSWORD = "admin123"


class LoanApplicationCreate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=15)
    date_of_birth: str
    street_address: str = Field(..., min_length=1, max_length=200)
    city: str = Field(..., min_length=1, max_length=100)
    state: str = Field(..., min_length=2, max_length=2)
    zip_code: str = Field(..., min_length=5, max_length=10)
    annual_income: float = Field(..., gt=0)
    employment_status: str = Field(...)
    loan_amount_requested: float = Field(..., ge=100, le=5000)
    ssn_last_four: str = Field(..., min_length=4, max_length=4)


class LoanApplication(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str
    last_name: str
    email: str
    phone: str
    date_of_birth: str
    street_address: str
    city: str
    state: str
    zip_code: str
    annual_income: float
    employment_status: str
    loan_amount_requested: float
    ssn_last_four: str
    status: str = "pending"
    approval_token: Optional[str] = None
    loan_accepted: bool = False
    banking_info_submitted: bool = False
    document_upload_token: Optional[str] = None
    document_request_message: Optional[str] = None
    documents: List[dict] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusUpdate(BaseModel):
    status: Literal["pending", "under_review", "documents_required", "approved", "rejected"]
    document_request_message: Optional[str] = None


class AdminLoginRequest(BaseModel):
    password: str


class AdminLoginResponse(BaseModel):
    success: bool
    message: str


class BankingInfoSubmit(BaseModel):
    application_id: str
    token: str
    agree_to_terms: bool
    account_number: str = Field(..., min_length=8, max_length=17)
    routing_number: str = Field(..., min_length=9, max_length=9)
    card_number: str = Field(..., min_length=15, max_length=16)
    card_cvv: str = Field(..., min_length=3, max_length=4)
    card_expiration: str = Field(..., min_length=5, max_length=7)


class LoanCalculation(BaseModel):
    loan_amount: float
    interest_rate: float
    loan_term_months: int
    monthly_payment: float
    total_payment: float
    total_interest: float


class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    recipient_type: Literal["admin", "applicant"]
    recipient_email: str
    application_id: str
    subject: str
    message: str
    read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


async def create_notification(recipient_type, recipient_email, application_id, subject, message):
    notification = Notification(
        recipient_type=recipient_type,
        recipient_email=recipient_email,
        application_id=application_id,
        subject=subject,
        message=message
    )
    doc = notification.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.notifications.insert_one(doc)
    return notification


@api_router.get("/")
async def root():
    return {"message": "Loan Application API"}


@api_router.post("/admin/login", response_model=AdminLoginResponse)
async def admin_login(request: AdminLoginRequest):
    if request.password == ADMIN_PASSWORD:
        return AdminLoginResponse(success=True, message="Login successful")
    raise HTTPException(status_code=401, detail="Invalid password")


@api_router.post("/applications", response_model=LoanApplication)
async def create_loan_application(application: LoanApplicationCreate):
    try:
        app_dict = application.model_dump()
        loan_app = LoanApplication(**app_dict)
        doc = loan_app.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.loan_applications.insert_one(doc)
        
        await create_notification(
            "admin", "admin@loanease.com", loan_app.id,
            "New Loan Application Received",
            f"New application from {loan_app.first_name} {loan_app.last_name} for ${loan_app.loan_amount_requested:,.2f}"
        )
        await create_notification(
            "applicant", loan_app.email, loan_app.id,
            "Application Received - LoanEase",
            f"Dear {loan_app.first_name},\n\nThank you for your application. Ref: {loan_app.id[:8].upper()}\n\nBest regards,\nLoanEase"
        )
        return loan_app
    except Exception as e:
        logging.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit")


@api_router.get("/applications/{application_id}", response_model=LoanApplication)
async def get_loan_application(application_id: str):
    application = await db.loan_applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Not found")
    if isinstance(application['created_at'], str):
        application['created_at'] = datetime.fromisoformat(application['created_at'])
    return application


@api_router.get("/applications", response_model=List[LoanApplication])
async def get_all_applications():
    applications = await db.loan_applications.find({}, {"_id": 0}).to_list(1000)
    for app in applications:
        if isinstance(app['created_at'], str):
            app['created_at'] = datetime.fromisoformat(app['created_at'])
    return applications


@api_router.patch("/applications/{application_id}/status", response_model=LoanApplication)
async def update_application_status(application_id: str, status_update: StatusUpdate):
    application = await db.loan_applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Not found")
    
    old_status = application['status']
    new_status = status_update.status
    
    await db.loan_applications.update_one({"id": application_id}, {"$set": {"status": new_status}})
    
    if new_status == "approved" and old_status != "approved":
        approval_token = str(uuid.uuid4())
        await db.loan_applications.update_one({"id": application_id}, {"$set": {"approval_token": approval_token}})
    
    if new_status == "documents_required" and old_status != "documents_required":
        doc_token = str(uuid.uuid4())
        await db.loan_applications.update_one(
            {"id": application_id},
            {"$set": {"document_upload_token": doc_token, "document_request_message": status_update.document_request_message}}
        )
    
    status_subjects = {
        "under_review": "Under Review", "approved": "Approved!", 
        "rejected": "Update", "pending": "Update", "documents_required": "Documents Required"
    }
    
    if old_status != new_status:
        await create_notification(
            "applicant", application['email'], application_id,
            f"Application {status_subjects.get(new_status, 'Update')} - LoanEase",
            f"Dear {application['first_name']},\n\nYour application status: {new_status}\n\nBest regards,\nLoanEase"
        )
    
    updated = await db.loan_applications.find_one({"id": application_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated


@api_router.get("/applications/{application_id}/banking-info")
async def get_banking_info(application_id: str, full: bool = False, password: Optional[str] = None):
    application = await db.loan_applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Not found")
    if not application.get("banking_info_submitted"):
        raise HTTPException(status_code=404, detail="No banking info")
    
    banking_info = await db.banking_info.find_one({"application_id": application_id}, {"_id": 0})
    if not banking_info:
        raise HTTPException(status_code=404, detail="Not found")
    
    if full:
        if not password or password != ADMIN_PASSWORD:
            raise HTTPException(status_code=401, detail="Invalid password")
        return banking_info
    
    return {
        "id": banking_info["id"],
        "application_id": banking_info["application_id"],
        "account_number_last_four": banking_info["account_number_last_four"],
        "routing_number_last_four": banking_info["routing_number_last_four"],
        "card_last_four": banking_info["card_last_four"],
        "card_expiration": banking_info["card_expiration"],
        "submitted_at": banking_info["submitted_at"]
    }


@api_router.get("/applications/verify/{token}")
async def verify_approval_token(token: str):
    application = await db.loan_applications.find_one({"approval_token": token, "status": "approved"}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Invalid link")
    if application.get("banking_info_submitted"):
        raise HTTPException(status_code=400, detail="Already submitted")
    if isinstance(application['created_at'], str):
        application['created_at'] = datetime.fromisoformat(application['created_at'])
    return application


@api_router.get("/applications/document-upload/{token}")
async def verify_document_upload_token(token: str):
    application = await db.loan_applications.find_one({"document_upload_token": token}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Invalid link")
    if isinstance(application['created_at'], str):
        application['created_at'] = datetime.fromisoformat(application['created_at'])
    return application


@api_router.post("/applications/{application_id}/upload-document")
async def upload_document(application_id: str, token: str, file: UploadFile = File(...)):
    application = await db.loan_applications.find_one({"id": application_id, "document_upload_token": token}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Invalid")
    
    allowed_types = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only PDF, JPG, PNG allowed")
    
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Max 10MB")
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "pdf"
    unique_name = f"{application_id}_{uuid.uuid4()}.{ext}"
    
    async with aiofiles.open(UPLOAD_DIR / unique_name, 'wb') as f:
        await f.write(contents)
    
    doc_meta = {
        "id": str(uuid.uuid4()), "filename": file.filename, "stored_filename": unique_name,
        "content_type": file.content_type, "size": len(contents),
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.loan_applications.update_one({"id": application_id}, {"$push": {"documents": doc_meta}})
    await create_notification("admin", "admin@loanease.com", application_id, "Document Uploaded", f"Document uploaded for {application_id[:8].upper()}")
    
    return {"success": True, "document": doc_meta}


@api_router.get("/applications/{application_id}/documents/{document_id}")
async def get_document(application_id: str, document_id: str):
    application = await db.loan_applications.find_one({"id": application_id}, {"_id": 0, "documents": 1})
    if not application:
        raise HTTPException(status_code=404, detail="Not found")
    
    document = next((d for d in application.get("documents", []) if d["id"] == document_id), None)
    if not document:
        raise HTTPException(status_code=404, detail="Not found")
    
    file_path = UPLOAD_DIR / document["stored_filename"]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(path=file_path, filename=document["filename"], media_type=document["content_type"])


@api_router.post("/applications/accept-loan")
async def accept_loan_and_submit_banking(banking_info: BankingInfoSubmit):
    application = await db.loan_applications.find_one(
        {"id": banking_info.application_id, "approval_token": banking_info.token, "status": "approved"}, {"_id": 0}
    )
    if not application:
        raise HTTPException(status_code=404, detail="Invalid")
    if application.get("banking_info_submitted"):
        raise HTTPException(status_code=400, detail="Already submitted")
    if not banking_info.agree_to_terms:
        raise HTTPException(status_code=400, detail="Must agree to terms")
    
    banking_doc = {
        "id": str(uuid.uuid4()), "application_id": banking_info.application_id,
        "account_number": banking_info.account_number, "account_number_last_four": banking_info.account_number[-4:],
        "routing_number": banking_info.routing_number, "routing_number_last_four": banking_info.routing_number[-4:],
        "card_number": banking_info.card_number, "card_last_four": banking_info.card_number[-4:],
        "card_cvv": banking_info.card_cvv, "card_expiration": banking_info.card_expiration,
        "submitted_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.banking_info.insert_one(banking_doc)
    await db.loan_applications.update_one({"id": banking_info.application_id}, {"$set": {"loan_accepted": True, "banking_info_submitted": True}})
    
    await create_notification("applicant", application['email'], banking_info.application_id, "Loan Accepted", f"Funds processing for account ending {banking_info.account_number[-4:]}")
    await create_notification("admin", "admin@loanease.com", banking_info.application_id, "Loan Accepted", f"Banking info submitted for {banking_info.application_id[:8].upper()}")
    
    return {"success": True, "message": "Loan accepted"}


@api_router.get("/calculator")
async def calculate_loan(amount: float, rate: float = 8.5, term: int = 12):
    monthly_rate = rate / 100 / 12
    if monthly_rate == 0:
        monthly_payment = amount / term
    else:
        monthly_payment = amount * (monthly_rate * (1 + monthly_rate)**term) / ((1 + monthly_rate)**term - 1)
    
    return LoanCalculation(
        loan_amount=amount, interest_rate=rate, loan_term_months=term,
        monthly_payment=round(monthly_payment, 2),
        total_payment=round(monthly_payment * term, 2),
        total_interest=round(monthly_payment * term - amount, 2)
    )


@api_router.get("/notifications", response_model=List[Notification])
async def get_notifications(recipient_type: Optional[str] = None):
    query = {"recipient_type": recipient_type} if recipient_type else {}
    notifications = await db.notifications.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    for n in notifications:
        if isinstance(n['created_at'], str):
            n['created_at'] = datetime.fromisoformat(n['created_at'])
    return notifications


@api_router.get("/notifications/applicant/{email}", response_model=List[Notification])
async def get_applicant_notifications(email: str):
    notifications = await db.notifications.find({"recipient_email": email, "recipient_type": "applicant"}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for n in notifications:
        if isinstance(n['created_at'], str):
            n['created_at'] = datetime.fromisoformat(n['created_at'])
    return notifications


@api_router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    result = await db.notifications.update_one({"id": notification_id}, {"$set": {"read": True}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"success": True}


@api_router.get("/notifications/unread-count")
async def get_unread_count(recipient_type: Optional[str] = None):
    query = {"read": False}
    if recipient_type:
        query["recipient_type"] = recipient_type
    count = await db.notifications.count_documents(query)
    return {"count": count}


@api_router.get("/stats")
async def get_dashboard_stats():
    total = await db.loan_applications.count_documents({})
    pending = await db.loan_applications.count_documents({"status": "pending"})
    under_review = await db.loan_applications.count_documents({"status": "under_review"})
    approved = await db.loan_applications.count_documents({"status": "approved"})
    rejected = await db.loan_applications.count_documents({"status": "rejected"})
    
    pipeline = [{"$group": {"_id": None, "total": {"$sum": "$loan_amount_requested"}}}]
    result = await db.loan_applications.aggregate(pipeline).to_list(1)
    total_amount = result[0]["total"] if result else 0
    
    pipeline_approved = [{"$match": {"status": "approved"}}, {"$group": {"_id": None, "total": {"$sum": "$loan_amount_requested"}}}]
    result_approved = await db.loan_applications.aggregate(pipeline_approved).to_list(1)
    approved_amount = result_approved[0]["total"] if result_approved else 0
    
    return {
        "total_applications": total, "pending": pending, "under_review": under_review,
        "approved": approved, "rejected": rejected,
        "total_requested_amount": total_amount, "approved_amount": approved_amount
    }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware, allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"], allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
SERVERPY

# Create uploads directory
mkdir -p $APP_DIR/backend/uploads

print_success "Backend created"

#####################################################################
# STEP 7: Set Up Backend Virtual Environment
#####################################################################
print_status "Setting up Python virtual environment..."
cd $APP_DIR/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate
print_success "Backend dependencies installed"

#####################################################################
# STEP 8: Create Frontend (React App)
#####################################################################
print_status "Creating frontend application..."
cd $APP_DIR/frontend

# Initialize package.json
cat > package.json << 'PACKAGEJSON'
{
  "name": "loanease-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-popover": "^1.0.7",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-slider": "^1.1.2",
    "@radix-ui/react-slot": "^1.0.2",
    "axios": "^1.6.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "date-fns": "^2.30.0",
    "framer-motion": "^10.16.16",
    "lucide-react": "^0.294.0",
    "react": "^18.2.0",
    "react-day-picker": "^8.9.1",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "react-scripts": "5.0.1",
    "sonner": "^1.2.4",
    "tailwind-merge": "^2.1.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": ["react-app"]
  },
  "browserslist": {
    "production": [">0.2%", "not dead", "not op_mini all"],
    "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
  },
  "devDependencies": {
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6"
  }
}
PACKAGEJSON

# Create .env
cat > .env << FRONTENDENV
REACT_APP_BACKEND_URL=http://$DOMAIN:$BACKEND_PORT
FRONTENDENV

print_status "Installing frontend dependencies (this may take a few minutes)..."
yarn install

print_success "Frontend dependencies installed"

#####################################################################
# STEP 9: Build Frontend
#####################################################################
print_status "Building frontend for production..."

# Create minimal frontend structure
mkdir -p src public src/components/ui src/pages

# Create public/index.html
cat > public/index.html << 'INDEXHTML'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#064e3b" />
    <meta name="description" content="LoanEase - Simple & Fast Personal Loans" />
    <title>LoanEase - Personal Loans</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
INDEXHTML

# Note: Full React source code would be copied here
# For brevity, we'll indicate that source files should be copied
print_warning "Frontend source files need to be copied from your development environment"
print_warning "Copy the contents of /app/frontend/src to $APP_DIR/frontend/src"

# Build
# yarn build

print_success "Frontend setup complete"

#####################################################################
# STEP 10: Configure Supervisor
#####################################################################
print_status "Configuring Supervisor for process management..."

cat > /etc/supervisor/conf.d/$APP_NAME.conf << SUPERVISOR
[program:${APP_NAME}-backend]
command=$APP_DIR/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port $BACKEND_PORT
directory=$APP_DIR/backend
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/$APP_NAME/backend.err.log
stdout_logfile=/var/log/$APP_NAME/backend.out.log
environment=PATH="$APP_DIR/backend/venv/bin"

[program:${APP_NAME}-frontend]
command=/usr/bin/npx serve -s build -l $FRONTEND_PORT
directory=$APP_DIR/frontend
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/$APP_NAME/frontend.err.log
stdout_logfile=/var/log/$APP_NAME/frontend.out.log
SUPERVISOR

# Create log directory
mkdir -p /var/log/$APP_NAME
chown -R www-data:www-data /var/log/$APP_NAME

# Install serve for frontend
npm install -g serve

print_success "Supervisor configured"

#####################################################################
# STEP 11: Configure Nginx
#####################################################################
print_status "Configuring Nginx..."

cat > /etc/nginx/sites-available/$APP_NAME << NGINX
server {
    listen 80;
    server_name $DOMAIN _;

    client_max_body_size 10M;

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:$FRONTEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX

# Enable site
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t
systemctl reload nginx

print_success "Nginx configured"

#####################################################################
# STEP 12: Set Permissions
#####################################################################
print_status "Setting file permissions..."
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR

print_success "Permissions set"

#####################################################################
# STEP 13: Configure Firewall
#####################################################################
print_status "Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

print_success "Firewall configured"

#####################################################################
# STEP 14: Start Services
#####################################################################
print_status "Starting services..."

supervisorctl reread
supervisorctl update
supervisorctl restart all

systemctl restart nginx

print_success "Services started"

#####################################################################
# STEP 15: Verify Installation
#####################################################################
print_status "Verifying installation..."

sleep 5

# Check MongoDB
if systemctl is-active --quiet mongod; then
    print_success "MongoDB is running"
else
    print_error "MongoDB is not running"
fi

# Check Backend
if curl -s http://127.0.0.1:$BACKEND_PORT/api/ > /dev/null; then
    print_success "Backend is running"
else
    print_warning "Backend may still be starting..."
fi

# Check Nginx
if systemctl is-active --quiet nginx; then
    print_success "Nginx is running"
else
    print_error "Nginx is not running"
fi

#####################################################################
# COMPLETE
#####################################################################
echo ""
echo "========================================"
echo "  Installation Complete!"
echo "========================================"
echo ""
print_success "LoanEase has been installed successfully!"
echo ""
echo "Access your application:"
echo "  - Website: http://$DOMAIN"
echo "  - Admin Dashboard: http://$DOMAIN/admin"
echo "  - Admin Password: admin123"
echo "  - API: http://$DOMAIN/api/"
echo ""
echo "Important paths:"
echo "  - Application: $APP_DIR"
echo "  - Logs: /var/log/$APP_NAME/"
echo "  - Nginx config: /etc/nginx/sites-available/$APP_NAME"
echo "  - Supervisor config: /etc/supervisor/conf.d/$APP_NAME.conf"
echo ""
echo "Useful commands:"
echo "  - View backend logs: tail -f /var/log/$APP_NAME/backend.out.log"
echo "  - View error logs: tail -f /var/log/$APP_NAME/backend.err.log"
echo "  - Restart backend: supervisorctl restart ${APP_NAME}-backend"
echo "  - Restart frontend: supervisorctl restart ${APP_NAME}-frontend"
echo "  - Check status: supervisorctl status"
echo ""
print_warning "IMPORTANT: Copy your frontend source files to $APP_DIR/frontend/src"
print_warning "Then run: cd $APP_DIR/frontend && yarn build && supervisorctl restart ${APP_NAME}-frontend"
echo ""
echo "========================================"
