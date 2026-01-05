# Loan Application Website PRD

## Original Problem Statement
Build a loan application website where visitors enter their basic information and zip code to apply for loans.

## User Personas
- **Borrowers**: Individuals seeking personal loans
- **Administrators**: Staff who review and approve/reject applications

## What's Been Implemented (Jan 2025)

### Phase 1 - MVP
- [x] Landing page with hero, features, CTA
- [x] Multi-step application form (Personal → Address → Financial)
- [x] Form validation with inline errors
- [x] Success page with reference ID

### Phase 2 - Admin & Notifications
- [x] Admin dashboard with password protection (admin123)
- [x] Dashboard stats & applications table with search/filter
- [x] Status management (pending → under_review → approved/rejected)
- [x] In-app notification system for both admin and applicants
- [x] Track Application page for borrowers

### Phase 3 - Calculator & Loan Acceptance
- [x] Loan Calculator on landing page with interactive sliders
- [x] Calculates monthly payment, total payment, total interest
- [x] Unique approval link generated when application approved
- [x] Admin can copy/view approval links for approved applications
- [x] AcceptLoan page at /accept-loan/:token for borrowers
- [x] Borrowers agree to terms via checkbox
- [x] Banking info collection (account#, routing#, card#, CVV, expiration)
- [x] Success confirmation after banking info submission
- [x] Admin sees "Banking" badge for completed submissions

## API Endpoints
- POST /api/applications - Submit new application
- GET /api/applications - List all applications
- GET /api/applications/{id} - Get single application
- PATCH /api/applications/{id}/status - Update status (generates token if approved)
- GET /api/applications/verify/{token} - Verify approval token
- POST /api/applications/accept-loan - Submit banking info
- POST /api/admin/login - Admin authentication
- GET /api/notifications - Get all notifications
- GET /api/notifications/applicant/{email} - Get applicant notifications
- GET /api/stats - Dashboard statistics
- GET /api/calculator - Calculate loan payments

## Prioritized Backlog
### P1 (High Priority)
- Real email notifications (SendGrid/Resend)
- Document upload for supporting docs
- Disbursement tracking & status

### P2 (Nice to Have)
- Multiple admin users with roles
- Application notes/comments
- Analytics dashboard
- Loan repayment tracking
