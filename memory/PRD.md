# Loan Application Website PRD

## Original Problem Statement
Build a loan application website where visitors or potential borrowers enter their basic information and zip code to apply for loans.

## User Personas
- **Borrowers**: Individuals seeking personal loans who want a quick, simple application process
- **Site Visitors**: People exploring loan options before committing to apply

## Core Requirements
- Comprehensive loan application form collecting: Name, Email, Phone, DOB, Address (Street, City, State, ZIP), Income, Employment Status, Loan Amount, SSN (last 4 digits)
- Modern/Minimal UI design
- No admin dashboard
- No email notifications
- Data stored in MongoDB

## Architecture
- **Frontend**: React with Shadcn UI components, Framer Motion for animations
- **Backend**: FastAPI with MongoDB (Motor async driver)
- **Database**: MongoDB - `loan_applications` collection

## What's Been Implemented (Jan 2025)
- [x] Landing page with hero section, features grid, and CTA
- [x] Multi-step application form (3 steps: Personal Info → Address → Financial)
- [x] Form validation with inline error messages
- [x] Calendar date picker for DOB
- [x] State dropdown with all US states
- [x] Employment status dropdown
- [x] Success page with application reference ID
- [x] Backend API: POST /api/applications, GET /api/applications, GET /api/applications/{id}
- [x] Responsive design with warm sand/emerald theme

## Prioritized Backlog
### P0 (Critical)
- All P0 features implemented ✓

### P1 (High Priority)
- Admin dashboard to view/manage applications
- Email notifications on submission
- Application status tracking

### P2 (Nice to Have)
- PDF application summary download
- Save progress & resume later
- Loan calculator tool
- Document upload capability

## Next Tasks
1. Add admin authentication & dashboard
2. Implement email notifications (SendGrid/Resend)
3. Add application status workflow (pending → under review → approved/rejected)
