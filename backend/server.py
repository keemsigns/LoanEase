from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Loan Application Models
class LoanApplicationCreate(BaseModel):
    # Personal Info
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=15)
    date_of_birth: str  # ISO format date string
    
    # Address Info
    street_address: str = Field(..., min_length=1, max_length=200)
    city: str = Field(..., min_length=1, max_length=100)
    state: str = Field(..., min_length=2, max_length=2)
    zip_code: str = Field(..., min_length=5, max_length=10)
    
    # Financial Info
    annual_income: float = Field(..., gt=0)
    employment_status: str = Field(...)
    loan_amount_requested: float = Field(..., gt=0)
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
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# API Routes
@api_router.get("/")
async def root():
    return {"message": "Loan Application API"}


@api_router.post("/applications", response_model=LoanApplication)
async def create_loan_application(application: LoanApplicationCreate):
    """Submit a new loan application"""
    try:
        app_dict = application.model_dump()
        loan_app = LoanApplication(**app_dict)
        
        # Convert to dict and serialize datetime for MongoDB
        doc = loan_app.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        
        await db.loan_applications.insert_one(doc)
        
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
