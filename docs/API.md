# LoanEase API Documentation

## Overview

LoanEase API is a RESTful API built with FastAPI that powers the loan application platform. This document provides detailed information about all available endpoints.

**Base URL:** `http://localhost:8001/api`

---

## Authentication

### Admin Login

Authenticate as admin to access the dashboard.

**Endpoint:** `POST /api/admin/login`

**Request Body:**
```json
{
  "password": "admin123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful"
}
```

**Response (401 Unauthorized):**
```json
{
  "detail": "Invalid password"
}
```

---

## Applications

### Create Application

Submit a new loan application.

**Endpoint:** `POST /api/applications`

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "phone": "5551234567",
  "date_of_birth": "1990-01-15",
  "street_address": "123 Main Street",
  "city": "New York",
  "state": "NY",
  "zip_code": "10001",
  "annual_income": 75000,
  "employment_status": "employed",
  "loan_amount_requested": 2500,
  "ssn_last_four": "1234"
}
```

**Validation Rules:**
| Field | Rules |
|-------|-------|
| `first_name` | Required, 1-50 characters |
| `last_name` | Required, 1-50 characters |
| `email` | Required, valid email format |
| `phone` | Required, 10-15 digits |
| `date_of_birth` | Required, ISO date format (YYYY-MM-DD) |
| `street_address` | Required, 1-200 characters |
| `city` | Required, 1-100 characters |
| `state` | Required, 2-letter state code |
| `zip_code` | Required, 5-10 characters |
| `annual_income` | Required, greater than 0 |
| `employment_status` | Required, one of: employed, part_time, self_employed, retired, unemployed, student |
| `loan_amount_requested` | Required, between $100 and $5,000 |
| `ssn_last_four` | Required, exactly 4 digits |

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "phone": "5551234567",
  "date_of_birth": "1990-01-15",
  "street_address": "123 Main Street",
  "city": "New York",
  "state": "NY",
  "zip_code": "10001",
  "annual_income": 75000,
  "employment_status": "employed",
  "loan_amount_requested": 2500,
  "ssn_last_four": "1234",
  "status": "pending",
  "approval_token": null,
  "loan_accepted": false,
  "banking_info_submitted": false,
  "document_upload_token": null,
  "document_request_message": null,
  "documents": [],
  "created_at": "2025-01-05T21:30:00.000Z"
}
```

### Get All Applications

Retrieve all loan applications.

**Endpoint:** `GET /api/applications`

**Response (200 OK):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "status": "pending",
    "loan_amount_requested": 2500,
    "created_at": "2025-01-05T21:30:00.000Z"
    // ... other fields
  }
]
```

### Get Application by ID

Retrieve a specific application.

**Endpoint:** `GET /api/applications/{application_id}`

**Response (200 OK):** Same as create response

**Response (404 Not Found):**
```json
{
  "detail": "Application not found"
}
```

### Update Application Status

Update the status of an application.

**Endpoint:** `PATCH /api/applications/{application_id}/status`

**Request Body:**
```json
{
  "status": "approved",
  "document_request_message": "Please upload proof of income"  // Optional, for documents_required status
}
```

**Valid Status Values:**
- `pending` - Initial status
- `under_review` - Application being reviewed
- `documents_required` - Additional documents needed
- `approved` - Application approved (generates approval_token)
- `rejected` - Application rejected

**Response (200 OK):** Updated application object

---

## Banking Information

### Accept Loan & Submit Banking Info

For approved applicants to accept loan terms and provide banking information.

**Endpoint:** `POST /api/applications/accept-loan`

**Request Body:**
```json
{
  "application_id": "550e8400-e29b-41d4-a716-446655440000",
  "token": "approval-token-from-application",
  "agree_to_terms": true,
  "account_number": "123456789012",
  "routing_number": "021000021",
  "card_number": "4111111111111111",
  "card_cvv": "123",
  "card_expiration": "12/25"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Loan accepted and banking information submitted successfully"
}
```

### Get Banking Information

Retrieve banking information for an application. Requires admin password for full details.

**Endpoint:** `GET /api/applications/{application_id}/banking-info`

**Query Parameters:**
- `full` (boolean): Set to `true` to get full banking details
- `password` (string): Admin password (required when `full=true`)

**Example - Masked Info:**
```
GET /api/applications/{id}/banking-info
```

**Response:**
```json
{
  "id": "banking-info-id",
  "application_id": "application-id",
  "account_number_last_four": "9012",
  "routing_number_last_four": "0021",
  "card_last_four": "1111",
  "card_expiration": "12/25",
  "submitted_at": "2025-01-05T21:35:00.000Z"
}
```

**Example - Full Info:**
```
GET /api/applications/{id}/banking-info?full=true&password=admin123
```

**Response:**
```json
{
  "id": "banking-info-id",
  "application_id": "application-id",
  "account_number": "123456789012",
  "routing_number": "021000021",
  "card_number": "4111111111111111",
  "card_cvv": "123",
  "card_expiration": "12/25",
  "submitted_at": "2025-01-05T21:35:00.000Z"
}
```

---

## Documents

### Upload Document

Upload a supporting document for an application.

**Endpoint:** `POST /api/applications/{application_id}/upload-document`

**Query Parameters:**
- `token` (string): Document upload token from application

**Request:** `multipart/form-data`
- `file`: The document file (PDF, JPG, PNG, max 10MB)

**Response (200 OK):**
```json
{
  "success": true,
  "document": {
    "id": "document-id",
    "filename": "proof_of_income.pdf",
    "stored_filename": "app-id_uuid.pdf",
    "content_type": "application/pdf",
    "size": 102400,
    "uploaded_at": "2025-01-05T21:40:00.000Z"
  }
}
```

### Download Document

Download an uploaded document.

**Endpoint:** `GET /api/applications/{application_id}/documents/{document_id}`

**Response:** File download

---

## Notifications

### Get All Notifications

Retrieve notifications, optionally filtered by recipient type.

**Endpoint:** `GET /api/notifications`

**Query Parameters:**
- `recipient_type` (string, optional): Filter by `admin` or `applicant`

**Response (200 OK):**
```json
[
  {
    "id": "notification-id",
    "recipient_type": "applicant",
    "recipient_email": "john.doe@example.com",
    "application_id": "application-id",
    "subject": "Application Received - LoanEase",
    "message": "Dear John, Thank you for submitting...",
    "read": false,
    "created_at": "2025-01-05T21:30:00.000Z"
  }
]
```

### Get Applicant Notifications

Get notifications for a specific applicant by email.

**Endpoint:** `GET /api/notifications/applicant/{email}`

**Response (200 OK):** Array of notifications

### Mark Notification as Read

**Endpoint:** `PATCH /api/notifications/{notification_id}/read`

**Response (200 OK):**
```json
{
  "success": true
}
```

### Get Unread Count

**Endpoint:** `GET /api/notifications/unread-count`

**Query Parameters:**
- `recipient_type` (string, optional): Filter by type

**Response (200 OK):**
```json
{
  "count": 5
}
```

---

## Utilities

### Loan Calculator

Calculate loan payment details.

**Endpoint:** `GET /api/calculator`

**Query Parameters:**
- `amount` (float): Loan amount ($100-$5,000)
- `rate` (float, optional): Annual interest rate (default: 8.5)
- `term` (int, optional): Loan term in months (default: 36)

**Example:**
```
GET /api/calculator?amount=2500&rate=8.5&term=12
```

**Response (200 OK):**
```json
{
  "loan_amount": 2500.0,
  "interest_rate": 8.5,
  "loan_term_months": 12,
  "monthly_payment": 218.05,
  "total_payment": 2616.59,
  "total_interest": 116.59
}
```

### Dashboard Statistics

Get statistics for the admin dashboard.

**Endpoint:** `GET /api/stats`

**Response (200 OK):**
```json
{
  "total_applications": 150,
  "pending": 25,
  "under_review": 30,
  "approved": 80,
  "rejected": 15,
  "total_requested_amount": 375000.0,
  "approved_amount": 200000.0
}
```

### Verify Approval Token

Verify an approval token for loan acceptance.

**Endpoint:** `GET /api/applications/verify/{token}`

**Response (200 OK):** Application object

**Response (404 Not Found):**
```json
{
  "detail": "Invalid or expired link"
}
```

### Verify Document Upload Token

Verify a document upload token.

**Endpoint:** `GET /api/applications/document-upload/{token}`

**Response (200 OK):** Application object

---

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request:**
```json
{
  "detail": "Validation error message"
}
```

**401 Unauthorized:**
```json
{
  "detail": "Invalid credentials"
}
```

**404 Not Found:**
```json
{
  "detail": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "detail": "An unexpected error occurred"
}
```

---

## Rate Limiting

Currently, no rate limiting is implemented. For production, consider adding rate limiting using FastAPI middleware or a reverse proxy like Nginx.

---

## CORS

The API accepts requests from origins specified in the `CORS_ORIGINS` environment variable. For development, this is typically set to `*` (all origins). For production, specify your frontend domain.
