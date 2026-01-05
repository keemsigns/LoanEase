# Loan Application Website PRD

## Original Problem Statement
Build a loan application website where visitors or potential borrowers enter their basic information and zip code to apply for loans.

## User Personas
- **Borrowers**: Individuals seeking personal loans who want a quick, simple application process
- **Site Visitors**: People exploring loan options before committing to apply
- **Administrators**: Staff members who review and approve/reject loan applications

## Core Requirements
- Comprehensive loan application form collecting: Name, Email, Phone, DOB, Address, Income, Employment Status, Loan Amount, SSN (last 4)
- Admin dashboard to manage applications
- In-app notification system for status updates
- Application status tracking for borrowers

## Architecture
- **Frontend**: React with Shadcn UI, Framer Motion
- **Backend**: FastAPI with MongoDB (Motor async driver)
- **Database**: MongoDB - `loan_applications`, `notifications` collections

## What's Been Implemented (Jan 2025)
### Phase 1 - MVP
- [x] Landing page with hero, features, CTA
- [x] Multi-step application form (3 steps)
- [x] Form validation with inline errors
- [x] Success page with reference ID
- [x] Backend API for applications

### Phase 2 - Admin & Notifications
- [x] Admin dashboard with password protection (admin123)
- [x] Dashboard stats (total, pending, approved, rejected, total amount)
- [x] Applications table with search & filter
- [x] Application detail modal with full info
- [x] Status management (pending → under_review → approved/rejected)
- [x] In-app notification system (stored in DB)
- [x] Notifications to admin on new applications
- [x] Notifications to applicants on status changes
- [x] Track Application page for borrowers to check status by email

## API Endpoints
- POST /api/applications - Submit new application
- GET /api/applications - List all applications
- GET /api/applications/{id} - Get single application
- PATCH /api/applications/{id}/status - Update status
- POST /api/admin/login - Admin authentication
- GET /api/notifications - Get all notifications
- GET /api/notifications/applicant/{email} - Get applicant notifications
- GET /api/stats - Dashboard statistics

## Prioritized Backlog
### P1 (High Priority)
- Real email notifications (SendGrid/Resend integration)
- Application document upload
- PDF application summary export

### P2 (Nice to Have)
- Loan calculator tool
- Multiple admin users with roles
- Application notes/comments for admins
- Analytics & reporting dashboard

## Next Tasks
1. Integrate real email provider if needed
2. Add document upload capability
3. Build loan calculator widget
