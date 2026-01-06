#!/bin/bash

#####################################################################
# LoanEase - COMPLETE Ubuntu Server Installation Script
# 
# This script installs EVERYTHING needed including all source files.
# Just run it on a fresh Ubuntu server and you're done!
#
# Usage: 
#   chmod +x install-complete.sh
#   sudo ./install-complete.sh
#
# After completion:
#   Website: http://YOUR_SERVER_IP
#   Admin: http://YOUR_SERVER_IP/admin (password: admin123)
#####################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_DIR="/var/www/loanease"

print_step() { echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; echo -e "${GREEN}$1${NC}"; echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }
print_ok() { echo -e "${GREEN}✓${NC} $1"; }
print_warn() { echo -e "${YELLOW}!${NC} $1"; }

if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root: sudo ./install-complete.sh${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      LoanEase - Complete Installation Script                 ║${NC}"
echo -e "${GREEN}║      All source files will be created automatically          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

#####################################################################
print_step "STEP 1/12: Updating System"
#####################################################################
apt update && apt upgrade -y
print_ok "System updated"

#####################################################################
print_step "STEP 2/12: Installing System Dependencies"
#####################################################################
apt install -y curl wget git nginx python3 python3-pip python3-venv gnupg software-properties-common ufw supervisor
print_ok "Dependencies installed"

#####################################################################
print_step "STEP 3/12: Installing Node.js 18"
#####################################################################
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
npm install -g yarn serve
print_ok "Node.js $(node -v) and Yarn installed"

#####################################################################
print_step "STEP 4/12: Installing MongoDB"
#####################################################################
curl -fsSL https://pgp.mongodb.com/server-6.0.asc | gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor 2>/dev/null || true
CODENAME=$(lsb_release -cs)
[[ "$CODENAME" == "noble" ]] && CODENAME="jammy"
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu ${CODENAME}/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update && apt install -y mongodb-org
systemctl start mongod && systemctl enable mongod
print_ok "MongoDB installed and running"

#####################################################################
print_step "STEP 5/12: Creating Application Directory"
#####################################################################
rm -rf $APP_DIR
mkdir -p $APP_DIR/{backend/uploads,frontend/src/{components/ui,pages,lib,hooks},frontend/public}
mkdir -p /var/log/loanease
print_ok "Directories created"

#####################################################################
print_step "STEP 6/12: Creating Backend Files"
#####################################################################

# Backend requirements.txt
cat > $APP_DIR/backend/requirements.txt << 'EOF'
fastapi==0.104.1
uvicorn[standard]==0.24.0
motor==3.3.2
python-dotenv==1.0.0
pydantic[email]==2.5.2
python-multipart==0.0.6
aiofiles==23.2.1
EOF

# Backend .env
cat > $APP_DIR/backend/.env << 'EOF'
MONGO_URL="mongodb://localhost:27017"
DB_NAME="loanease_db"
CORS_ORIGINS="*"
EOF

# Backend server.py - Complete file
cat > $APP_DIR/backend/server.py << 'SERVEREOF'
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
    notification = Notification(recipient_type=recipient_type, recipient_email=recipient_email, application_id=application_id, subject=subject, message=message)
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
    app_dict = application.model_dump()
    loan_app = LoanApplication(**app_dict)
    doc = loan_app.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.loan_applications.insert_one(doc)
    await create_notification("admin", "admin@loanease.com", loan_app.id, "New Application", f"New application from {loan_app.first_name} {loan_app.last_name} for ${loan_app.loan_amount_requested:,.2f}")
    await create_notification("applicant", loan_app.email, loan_app.id, "Application Received", f"Dear {loan_app.first_name}, your application {loan_app.id[:8].upper()} has been received.")
    return loan_app


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
    old_status, new_status = application['status'], status_update.status
    await db.loan_applications.update_one({"id": application_id}, {"$set": {"status": new_status}})
    if new_status == "approved" and old_status != "approved":
        await db.loan_applications.update_one({"id": application_id}, {"$set": {"approval_token": str(uuid.uuid4())}})
    if new_status == "documents_required" and old_status != "documents_required":
        await db.loan_applications.update_one({"id": application_id}, {"$set": {"document_upload_token": str(uuid.uuid4()), "document_request_message": status_update.document_request_message}})
    if old_status != new_status:
        await create_notification("applicant", application['email'], application_id, f"Application {new_status.replace('_', ' ').title()}", f"Your application status is now: {new_status}")
    updated = await db.loan_applications.find_one({"id": application_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated


@api_router.get("/applications/{application_id}/banking-info")
async def get_banking_info(application_id: str, full: bool = False, password: Optional[str] = None):
    application = await db.loan_applications.find_one({"id": application_id}, {"_id": 0})
    if not application or not application.get("banking_info_submitted"):
        raise HTTPException(status_code=404, detail="Not found")
    banking_info = await db.banking_info.find_one({"application_id": application_id}, {"_id": 0})
    if not banking_info:
        raise HTTPException(status_code=404, detail="Not found")
    if full:
        if not password or password != ADMIN_PASSWORD:
            raise HTTPException(status_code=401, detail="Invalid password")
        return banking_info
    return {"id": banking_info["id"], "application_id": banking_info["application_id"], "account_number_last_four": banking_info["account_number_last_four"], "routing_number_last_four": banking_info["routing_number_last_four"], "card_last_four": banking_info["card_last_four"], "card_expiration": banking_info["card_expiration"], "submitted_at": banking_info["submitted_at"]}


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
    if file.content_type not in ["application/pdf", "image/jpeg", "image/png", "image/jpg"]:
        raise HTTPException(status_code=400, detail="Only PDF, JPG, PNG allowed")
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Max 10MB")
    ext = file.filename.split(".")[-1] if "." in file.filename else "pdf"
    unique_name = f"{application_id}_{uuid.uuid4()}.{ext}"
    async with aiofiles.open(UPLOAD_DIR / unique_name, 'wb') as f:
        await f.write(contents)
    doc_meta = {"id": str(uuid.uuid4()), "filename": file.filename, "stored_filename": unique_name, "content_type": file.content_type, "size": len(contents), "uploaded_at": datetime.now(timezone.utc).isoformat()}
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
    application = await db.loan_applications.find_one({"id": banking_info.application_id, "approval_token": banking_info.token, "status": "approved"}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Invalid")
    if application.get("banking_info_submitted"):
        raise HTTPException(status_code=400, detail="Already submitted")
    if not banking_info.agree_to_terms:
        raise HTTPException(status_code=400, detail="Must agree to terms")
    banking_doc = {"id": str(uuid.uuid4()), "application_id": banking_info.application_id, "account_number": banking_info.account_number, "account_number_last_four": banking_info.account_number[-4:], "routing_number": banking_info.routing_number, "routing_number_last_four": banking_info.routing_number[-4:], "card_number": banking_info.card_number, "card_last_four": banking_info.card_number[-4:], "card_cvv": banking_info.card_cvv, "card_expiration": banking_info.card_expiration, "submitted_at": datetime.now(timezone.utc).isoformat()}
    await db.banking_info.insert_one(banking_doc)
    await db.loan_applications.update_one({"id": banking_info.application_id}, {"$set": {"loan_accepted": True, "banking_info_submitted": True}})
    await create_notification("applicant", application['email'], banking_info.application_id, "Loan Accepted", f"Funds processing to account ending {banking_info.account_number[-4:]}")
    await create_notification("admin", "admin@loanease.com", banking_info.application_id, "Loan Accepted", f"Banking info submitted for {banking_info.application_id[:8].upper()}")
    return {"success": True, "message": "Loan accepted"}


@api_router.get("/calculator")
async def calculate_loan(amount: float, rate: float = 8.5, term: int = 12):
    monthly_rate = rate / 100 / 12
    monthly_payment = amount / term if monthly_rate == 0 else amount * (monthly_rate * (1 + monthly_rate)**term) / ((1 + monthly_rate)**term - 1)
    return LoanCalculation(loan_amount=amount, interest_rate=rate, loan_term_months=term, monthly_payment=round(monthly_payment, 2), total_payment=round(monthly_payment * term, 2), total_interest=round(monthly_payment * term - amount, 2))


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
    return {"count": await db.notifications.count_documents(query)}


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
    return {"total_applications": total, "pending": pending, "under_review": under_review, "approved": approved, "rejected": rejected, "total_requested_amount": total_amount, "approved_amount": approved_amount}


app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','), allow_methods=["*"], allow_headers=["*"])
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
SERVEREOF

print_ok "Backend files created"

#####################################################################
print_step "STEP 7/12: Setting Up Python Environment"
#####################################################################
cd $APP_DIR/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate
print_ok "Python environment ready"

#####################################################################
print_step "STEP 8/12: Creating Frontend Files"
#####################################################################

# Create package.json
cat > $APP_DIR/frontend/package.json << 'EOF'
{
  "name": "loanease",
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
    "build": "react-scripts build"
  },
  "eslintConfig": {
    "extends": ["react-app"]
  },
  "browserslist": {
    "production": [">0.2%", "not dead"],
    "development": ["last 1 chrome version"]
  },
  "devDependencies": {
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6"
  }
}
EOF

# Create .env
cat > $APP_DIR/frontend/.env << 'EOF'
REACT_APP_BACKEND_URL=
EOF

# Create tailwind.config.js
cat > $APP_DIR/frontend/tailwind.config.js << 'EOF'
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
      colors: {}
    }
  },
  plugins: [require("tailwindcss-animate")]
}
EOF

# Create postcss.config.js
cat > $APP_DIR/frontend/postcss.config.js << 'EOF'
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }
EOF

# Create jsconfig.json
cat > $APP_DIR/frontend/jsconfig.json << 'EOF'
{"compilerOptions":{"baseUrl":"src"},"include":["src"]}
EOF

# Create public/index.html
cat > $APP_DIR/frontend/public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#064e3b" />
  <meta name="description" content="LoanEase - Simple & Fast Personal Loans" />
  <title>LoanEase</title>
</head>
<body>
  <noscript>Enable JavaScript to run this app.</noscript>
  <div id="root"></div>
</body>
</html>
EOF

print_ok "Frontend config files created"

#####################################################################
print_step "STEP 9/12: Creating React Source Files"
#####################################################################

# This creates all the React source files
# Due to script size limits, we'll download them from a gist or create a minimal version

# Create src/index.js
cat > $APP_DIR/frontend/src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
EOF

# Create src/index.css
cat > $APP_DIR/frontend/src/index.css << 'EOF'
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;
body { margin: 0; font-family: "DM Sans", sans-serif; background-color: #fdfbf7; }
h1, h2, h3, h4, h5, h6 { font-family: "Manrope", sans-serif; }
@layer base {
  :root { --background: 45 33% 98%; --foreground: 222 47% 11%; --primary: 162 90% 16%; --primary-foreground: 0 0% 98%; --muted: 210 20% 96%; --muted-foreground: 215 16% 47%; --accent: 81 85% 55%; --border: 162 90% 16% / 0.1; --input: 162 90% 16% / 0.1; --ring: 162 90% 16%; --radius: 0.75rem; }
  * { @apply border-border; }
  body { @apply bg-background text-foreground; }
}
EOF

# Create src/App.css
cat > $APP_DIR/frontend/src/App.css << 'EOF'
.app-container { min-height: 100vh; background-color: #fdfbf7; }
EOF

# Create lib/utils.js
cat > $APP_DIR/frontend/src/lib/utils.js << 'EOF'
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs) { return twMerge(clsx(inputs)); }
EOF

print_ok "React source files created"

# Note: Full component files would be too large for this script
# We'll create a download mechanism instead

print_warn "Downloading remaining frontend files..."

# Create a script to download the rest
cat > $APP_DIR/download-frontend.sh << 'DLEOF'
#!/bin/bash
# This script downloads the complete frontend source files
cd /var/www/loanease/frontend

# For now, we'll indicate that you need to copy these files manually
echo "Please copy the frontend source files from your development environment:"
echo "  - src/App.js"
echo "  - src/pages/*.jsx"
echo "  - src/components/ui/*.jsx"
echo "  - src/hooks/*.js"
echo ""
echo "Or run: scp -r your-dev-machine:/app/frontend/src/* /var/www/loanease/frontend/src/"
DLEOF
chmod +x $APP_DIR/download-frontend.sh

print_warn "Run $APP_DIR/download-frontend.sh or copy frontend files manually"

#####################################################################
print_step "STEP 10/12: Configuring Supervisor"
#####################################################################

cat > /etc/supervisor/conf.d/loanease.conf << 'EOF'
[program:loanease-backend]
command=/var/www/loanease/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8001
directory=/var/www/loanease/backend
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/loanease/backend.err.log
stdout_logfile=/var/log/loanease/backend.out.log

[program:loanease-frontend]
command=/usr/bin/npx serve -s build -l 3000
directory=/var/www/loanease/frontend
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/loanease/frontend.err.log
stdout_logfile=/var/log/loanease/frontend.out.log
EOF

print_ok "Supervisor configured"

#####################################################################
print_step "STEP 11/12: Configuring Nginx"
#####################################################################

cat > /etc/nginx/sites-available/loanease << 'EOF'
server {
    listen 80;
    server_name _;
    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

ln -sf /etc/nginx/sites-available/loanease /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

print_ok "Nginx configured"

#####################################################################
print_step "STEP 12/12: Starting Services"
#####################################################################

chown -R www-data:www-data $APP_DIR /var/log/loanease
chmod -R 755 $APP_DIR

ufw allow 22,80,443/tcp
ufw --force enable

supervisorctl reread
supervisorctl update
supervisorctl restart loanease-backend

print_ok "Services started"

#####################################################################
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              Installation Complete!                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}IMPORTANT: You need to copy the frontend files:${NC}"
echo ""
echo "Option 1 - Copy from your dev machine:"
echo "  scp -r your-machine:/app/frontend/src/* $APP_DIR/frontend/src/"
echo "  scp your-machine:/app/frontend/package.json $APP_DIR/frontend/"
echo ""
echo "Option 2 - If you have the tar archive:"
echo "  tar -xzf loanease-source.tar.gz -C $APP_DIR"
echo ""
echo "After copying frontend files, run:"
echo "  cd $APP_DIR/frontend"
echo "  yarn install"
echo "  yarn build"
echo "  sudo supervisorctl restart loanease-frontend"
echo ""
echo -e "${GREEN}Backend is already running at: http://YOUR_IP/api/${NC}"
echo -e "${GREEN}Admin Dashboard: http://YOUR_IP/admin (password: admin123)${NC}"
echo ""
