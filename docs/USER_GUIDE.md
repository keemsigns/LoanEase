# LoanEase User Guide

This guide explains how to use the LoanEase loan application platform from both a borrower's and administrator's perspective.

---

## Table of Contents

1. [For Borrowers](#for-borrowers)
   - [Applying for a Loan](#applying-for-a-loan)
   - [Tracking Your Application](#tracking-your-application)
   - [Uploading Documents](#uploading-documents)
   - [Accepting Your Loan](#accepting-your-loan)
2. [For Administrators](#for-administrators)
   - [Accessing the Dashboard](#accessing-the-dashboard)
   - [Managing Applications](#managing-applications)
   - [Requesting Documents](#requesting-documents)
   - [Viewing Banking Information](#viewing-banking-information)

---

## For Borrowers

### Applying for a Loan

#### Step 1: Visit the Website

Go to the LoanEase homepage. You'll see:
- A loan calculator to estimate your payments
- Information about the loan process
- An "Apply Now" button

#### Step 2: Use the Loan Calculator (Optional)

Before applying, you can use the calculator to see estimated payments:
1. Adjust the loan amount slider ($100 - $5,000)
2. Adjust the loan term (3-24 months)
3. View your estimated monthly payment, total payment, and interest

#### Step 3: Start Your Application

Click "Apply Now" or "Start Application" to begin.

#### Step 4: Complete Personal Information

Fill in your personal details:
- First Name
- Last Name
- Email Address
- Phone Number
- Date of Birth (use the calendar picker)

Click "Continue" to proceed.

#### Step 5: Enter Your Address

Provide your current address:
- Street Address
- City
- State (select from dropdown)
- ZIP Code

Click "Continue" to proceed.

#### Step 6: Provide Financial Information

Enter your financial details:
- Annual Income
- Employment Status (select from dropdown)
- Loan Amount Requested ($100 - $5,000)
- Last 4 digits of your SSN

Click "Submit Application" to complete.

#### Step 7: Confirmation

You'll see a success page with:
- Your application reference number
- Next steps information
- Contact details for questions

**Save your reference number!** You'll need it to track your application.

---

### Tracking Your Application

#### How to Track

1. Go to the homepage
2. Click "Track Application" in the navigation
3. Enter the email address you used when applying
4. Click "Search"

#### What You'll See

- All messages and notifications about your application
- Current status of your application
- Any requests for additional information

#### Application Statuses

| Status | What It Means |
|--------|---------------|
| **Pending** | Application received, awaiting review |
| **Under Review** | Our team is reviewing your application |
| **Documents Required** | Additional documents needed (see below) |
| **Approved** | Congratulations! Your loan is approved |
| **Rejected** | Application was not approved |

---

### Uploading Documents

If additional documents are requested:

1. Go to "Track Application"
2. Enter your email and search
3. You'll see an orange "Documents Required" section
4. Read the message explaining what documents are needed
5. Click the upload area or drag files to upload
6. Accepted formats: PDF, JPG, PNG (max 10MB each)
7. Click "Upload Documents" when ready

**Tips:**
- Make sure documents are clear and readable
- Include all requested information
- You can upload multiple files

---

### Accepting Your Loan

Once approved, you'll receive a unique link to complete your loan:

#### Step 1: Access Your Approval Link

- Check your notifications on the Track Application page
- Click the link provided, or copy and paste it into your browser

#### Step 2: Review Loan Terms

You'll see:
- Your approved loan amount
- Terms and conditions
- A checkbox to agree to the terms

**Read carefully!** Make sure you understand the repayment terms.

#### Step 3: Enter Banking Information

Provide your banking details for fund disbursement:
- Bank Account Number
- Routing Number
- Card Number
- CVV
- Expiration Date

#### Step 4: Submit

1. Check the "I agree to loan terms" checkbox
2. Click "Accept Loan & Submit"
3. You'll see a confirmation that your loan is being processed

**Funds typically arrive within 1-3 business days.**

---

## For Administrators

### Accessing the Dashboard

1. Go to `/admin` (e.g., `https://your-site.com/admin`)
2. Enter the admin password
3. Click "Access Dashboard"

**Default password:** `admin123` (change this in production!)

---

### Managing Applications

#### Dashboard Overview

The dashboard shows:
- **Statistics Cards:**
  - Total Applications
  - Pending Review
  - Approved
  - Total Requested Amount

- **Applications Table:**
  - Applicant name and ID
  - Contact information
  - Requested amount
  - Current status
  - Submission date

#### Filtering Applications

Use the filters above the table:
- **Search:** Type name, email, or application ID
- **Status Filter:** Select a status to filter

#### Viewing Application Details

1. Find the application in the table
2. Click "Details" button
3. A modal will open showing:
   - Personal information
   - Address
   - Financial information
   - Uploaded documents (if any)
   - Status update options

#### Updating Application Status

In the application details modal:

1. Find the "Update Status" section
2. Click the appropriate status button:
   - **Pending** - Return to initial status
   - **Under Review** - Mark as being reviewed
   - **Request Docs** - Request additional documents
   - **Approved** - Approve the application
   - **Rejected** - Reject the application

When you approve an application:
- A unique approval link is generated
- The applicant is notified automatically

---

### Requesting Documents

1. Open the application details
2. Click "Request Docs" button
3. A text box will appear
4. Type a message explaining what documents are needed
   - Example: "Please upload proof of income and a valid ID"
5. Click "Send Request"

The applicant will:
- Receive a notification
- See the upload section when they track their application
- Be able to upload the requested documents

**To view uploaded documents:**
1. Open application details
2. Scroll to "Uploaded Documents" section
3. Click "View" to download any document

---

### Viewing Banking Information

For approved applications where the borrower has submitted banking info:

1. Open the application details
2. Find the "Payment Information" section (green background)
3. Click "View Banking Details"
4. **Enter your admin password again** (security verification)
5. Click "View Details"

You'll see:
- Full account number
- Full routing number
- Full card number
- CVV
- Expiration date

**Security Notice:** This information is sensitive. Do not screenshot or share.

---

### Notifications

#### Viewing Notifications

1. Click the bell icon in the header
2. See recent notifications
3. Click any notification to see details

#### Notification Types

- **New Application** - When someone submits an application
- **Document Uploaded** - When a borrower uploads documents
- **Status Changed** - When you change an application status
- **Loan Accepted** - When a borrower accepts their approved loan

---

### Refreshing Data

Click the "Refresh" button in the header to reload all data from the server.

---

### Logging Out

Click "Logout" in the header to end your admin session.

---

## Tips for Success

### For Borrowers

1. **Double-check your information** before submitting
2. **Use a valid email** - you'll receive important updates there
3. **Keep your reference number** safe
4. **Respond quickly** to document requests
5. **Read loan terms carefully** before accepting

### For Administrators

1. **Review applications promptly** - borrowers are waiting!
2. **Be specific** when requesting documents
3. **Verify information** before approving
4. **Keep the admin password secure**
5. **Log out** when leaving the computer

---

## Getting Help

### For Borrowers
- Track your application for updates
- Check the FAQ on the website
- Contact support via the information provided

### For Administrators
- Check the API documentation for technical details
- Review server logs for errors
- Contact the development team for technical support
