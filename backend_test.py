import requests
import sys
import json
from datetime import datetime

class LoanApplicationAPITester:
    def __init__(self, base_url="https://loan-finder-38.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.test_application_id = None
        self.test_notification_id = None

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def test_api_root(self):
        """Test API root endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Response: {data}"
            self.log_test("API Root Endpoint", success, details)
            return success
        except Exception as e:
            self.log_test("API Root Endpoint", False, str(e))
            return False

    def test_create_application(self):
        """Test creating a loan application with new $100-$5000 limits"""
        test_data = {
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@example.com",
            "phone": "5551234567",
            "date_of_birth": "1990-01-15",
            "street_address": "123 Main Street",
            "city": "New York",
            "state": "NY",
            "zip_code": "10001",
            "annual_income": 75000.0,
            "employment_status": "employed",
            "loan_amount_requested": 2500.0,  # Within new $100-$5000 range
            "ssn_last_four": "1234"
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/applications",
                json=test_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                if 'id' in data:
                    self.test_application_id = data['id']
                    details += f", Application ID: {data['id'][:8]}..."
                else:
                    success = False
                    details += ", Missing application ID in response"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text[:200]}"
            
            self.log_test("Create Loan Application", success, details)
            return success
        except Exception as e:
            self.log_test("Create Loan Application", False, str(e))
            return False

    def test_get_application(self):
        """Test retrieving a specific application"""
        if not hasattr(self, 'test_application_id'):
            self.log_test("Get Specific Application", False, "No application ID available")
            return False
        
        try:
            response = requests.get(
                f"{self.api_url}/applications/{self.test_application_id}",
                timeout=10
            )
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                if data.get('id') == self.test_application_id:
                    details += f", Retrieved application: {data.get('first_name')} {data.get('last_name')}"
                else:
                    success = False
                    details += ", Application ID mismatch"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text[:200]}"
            
            self.log_test("Get Specific Application", success, details)
            return success
        except Exception as e:
            self.log_test("Get Specific Application", False, str(e))
            return False

    def test_get_all_applications(self):
        """Test retrieving all applications"""
        try:
            response = requests.get(f"{self.api_url}/applications", timeout=10)
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                if isinstance(data, list):
                    details += f", Found {len(data)} applications"
                else:
                    success = False
                    details += ", Response is not a list"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text[:200]}"
            
            self.log_test("Get All Applications", success, details)
            return success
        except Exception as e:
            self.log_test("Get All Applications", False, str(e))
            return False

    def test_invalid_application(self):
        """Test creating application with invalid data"""
        invalid_data = {
            "first_name": "",  # Empty required field
            "email": "invalid-email",  # Invalid email format
            "annual_income": -1000  # Negative income
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/applications",
                json=invalid_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            # Should return 422 for validation error
            success = response.status_code == 422
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f", Expected 422 validation error"
            
            self.log_test("Invalid Application Validation", success, details)
            return success
        except Exception as e:
            self.log_test("Invalid Application Validation", False, str(e))
            return False

    def test_nonexistent_application(self):
        """Test retrieving non-existent application"""
        fake_id = "00000000-0000-0000-0000-000000000000"
        
        try:
            response = requests.get(f"{self.api_url}/applications/{fake_id}", timeout=10)
            
            # Should return 404 for not found
            success = response.status_code == 404
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f", Expected 404 not found error"
            
            self.log_test("Non-existent Application", success, details)
            return success
        except Exception as e:
            self.log_test("Non-existent Application", False, str(e))
            return False

    def test_admin_login(self):
        """Test admin login endpoint"""
        # Test valid password
        try:
            response = requests.post(
                f"{self.api_url}/admin/login",
                json={"password": "admin123"},
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                if data.get('success') == True:
                    details += f", Login successful"
                else:
                    success = False
                    details += ", Login response invalid"
            
            self.log_test("Admin Login (Valid Password)", success, details)
        except Exception as e:
            self.log_test("Admin Login (Valid Password)", False, str(e))
        
        # Test invalid password
        try:
            response = requests.post(
                f"{self.api_url}/admin/login",
                json={"password": "wrongpassword"},
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            success = response.status_code == 401
            details = f"Status: {response.status_code}"
            
            self.log_test("Admin Login (Invalid Password)", success, details)
        except Exception as e:
            self.log_test("Admin Login (Invalid Password)", False, str(e))

    def test_update_application_status(self):
        """Test updating application status"""
        if not self.test_application_id:
            self.log_test("Update Application Status", False, "No application ID available")
            return False
        
        try:
            response = requests.patch(
                f"{self.api_url}/applications/{self.test_application_id}/status",
                json={"status": "under_review"},
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                if data.get('status') == 'under_review':
                    details += f", Status updated to under_review"
                else:
                    success = False
                    details += ", Status not updated correctly"
            
            self.log_test("Update Application Status", success, details)
            return success
        except Exception as e:
            self.log_test("Update Application Status", False, str(e))
            return False

    def test_get_notifications(self):
        """Test getting all notifications"""
        try:
            response = requests.get(f"{self.api_url}/notifications", timeout=10)
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                if isinstance(data, list):
                    details += f", Found {len(data)} notifications"
                    if len(data) > 0:
                        self.test_notification_id = data[0].get('id')
                else:
                    success = False
                    details += ", Response is not a list"
            
            self.log_test("Get All Notifications", success, details)
            return success
        except Exception as e:
            self.log_test("Get All Notifications", False, str(e))
            return False

    def test_get_applicant_notifications(self):
        """Test getting notifications for specific applicant"""
        test_email = "john.doe@example.com"
        try:
            response = requests.get(f"{self.api_url}/notifications/applicant/{test_email}", timeout=10)
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                if isinstance(data, list):
                    details += f", Found {len(data)} notifications for {test_email}"
                else:
                    success = False
                    details += ", Response is not a list"
            
            self.log_test("Get Applicant Notifications", success, details)
            return success
        except Exception as e:
            self.log_test("Get Applicant Notifications", False, str(e))
            return False

    def test_dashboard_stats(self):
        """Test getting dashboard statistics"""
        try:
            response = requests.get(f"{self.api_url}/stats", timeout=10)
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                required_fields = ['total_applications', 'pending', 'under_review', 'approved', 'rejected']
                if all(field in data for field in required_fields):
                    details += f", Stats: {data['total_applications']} total, {data['pending']} pending"
                else:
                    success = False
                    details += ", Missing required stat fields"
            
            self.log_test("Dashboard Statistics", success, details)
            return success
        except Exception as e:
            self.log_test("Dashboard Statistics", False, str(e))
            return False

    def test_mark_notification_read(self):
        """Test marking notification as read"""
        if not self.test_notification_id:
            self.log_test("Mark Notification Read", False, "No notification ID available")
            return False
        
        try:
            response = requests.patch(
                f"{self.api_url}/notifications/{self.test_notification_id}/read",
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                if data.get('success') == True:
                    details += f", Notification marked as read"
                else:
                    success = False
                    details += ", Mark read response invalid"
            
            self.log_test("Mark Notification Read", success, details)
            return success
        except Exception as e:
            self.log_test("Mark Notification Read", False, str(e))
            return False

    def test_unread_count(self):
        """Test getting unread notification count"""
        try:
            response = requests.get(f"{self.api_url}/notifications/unread-count", timeout=10)
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                if 'count' in data:
                    details += f", Unread count: {data['count']}"
                else:
                    success = False
                    details += ", Missing count field"
            
            self.log_test("Unread Notification Count", success, details)
            return success
        except Exception as e:
            self.log_test("Unread Notification Count", False, str(e))
            return False

    def test_loan_calculator(self):
        """Test loan calculator endpoint"""
        try:
            # Test with default parameters
            response = requests.get(f"{self.api_url}/calculator?amount=25000&rate=8.5&term=36", timeout=10)
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                required_fields = ['loan_amount', 'interest_rate', 'loan_term_months', 'monthly_payment', 'total_payment', 'total_interest']
                if all(field in data for field in required_fields):
                    details += f", Monthly payment: ${data['monthly_payment']}, Total: ${data['total_payment']}"
                    # Verify calculation makes sense
                    if data['loan_amount'] == 25000 and data['monthly_payment'] > 0:
                        details += ", Calculation valid"
                    else:
                        success = False
                        details += ", Invalid calculation results"
                else:
                    success = False
                    details += ", Missing required calculation fields"
            
            self.log_test("Loan Calculator", success, details)
            return success
        except Exception as e:
            self.log_test("Loan Calculator", False, str(e))
            return False

    def test_approve_application_and_token_generation(self):
        """Test approving application and generating approval token"""
        if not self.test_application_id:
            self.log_test("Approve Application & Token Generation", False, "No application ID available")
            return False
        
        try:
            # Update status to approved
            response = requests.patch(
                f"{self.api_url}/applications/{self.test_application_id}/status",
                json={"status": "approved"},
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                if data.get('status') == 'approved' and data.get('approval_token'):
                    self.approval_token = data.get('approval_token')
                    details += f", Status approved, Token generated: {self.approval_token[:8]}..."
                else:
                    success = False
                    details += ", Status not approved or token not generated"
            
            self.log_test("Approve Application & Token Generation", success, details)
            return success
        except Exception as e:
            self.log_test("Approve Application & Token Generation", False, str(e))
            return False

    def test_verify_approval_token(self):
        """Test verifying approval token"""
        if not hasattr(self, 'approval_token') or not self.approval_token:
            self.log_test("Verify Approval Token", False, "No approval token available")
            return False
        
        try:
            response = requests.get(f"{self.api_url}/applications/verify/{self.approval_token}", timeout=10)
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                if data.get('id') == self.test_application_id and data.get('status') == 'approved':
                    details += f", Token verified for application {data['id'][:8]}..."
                else:
                    success = False
                    details += ", Token verification failed or wrong application"
            
            self.log_test("Verify Approval Token", success, details)
            return success
        except Exception as e:
            self.log_test("Verify Approval Token", False, str(e))
            return False

    def test_accept_loan_banking_info(self):
        """Test accepting loan and submitting banking information"""
        if not hasattr(self, 'approval_token') or not self.approval_token:
            self.log_test("Accept Loan & Banking Info", False, "No approval token available")
            return False
        
        banking_data = {
            "application_id": self.test_application_id,
            "token": self.approval_token,
            "agree_to_terms": True,
            "account_number": "123456789012",
            "routing_number": "123456789",
            "card_number": "1234567890123456",
            "card_cvv": "123",
            "card_expiration": "12/25"
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/applications/accept-loan",
                json=banking_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                if data.get('success') == True:
                    details += f", Banking info submitted successfully"
                else:
                    success = False
                    details += ", Banking submission response invalid"
            
            self.log_test("Accept Loan & Banking Info", success, details)
            return success
        except Exception as e:
            self.log_test("Accept Loan & Banking Info", False, str(e))
            return False

    def test_banking_info_validation(self):
        """Test banking info validation with invalid data"""
        if not hasattr(self, 'approval_token'):
            self.log_test("Banking Info Validation", False, "No approval token available")
            return False
        
        # Test with missing required fields
        invalid_data = {
            "application_id": self.test_application_id,
            "token": self.approval_token,
            "agree_to_terms": False,  # Should fail
            "account_number": "123",  # Too short
            "routing_number": "123",  # Too short
            "card_number": "123",     # Too short
            "card_cvv": "1",          # Too short
            "card_expiration": "1"    # Too short
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/applications/accept-loan",
                json=invalid_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            # Should return 400 or 422 for validation error
            success = response.status_code in [400, 422]
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f", Expected 400/422 validation error"
            
            self.log_test("Banking Info Validation", success, details)
            return success
        except Exception as e:
            self.log_test("Banking Info Validation", False, str(e))
            return False

    def test_request_documents_status(self):
        """Test requesting documents and generating upload token"""
        if not self.test_application_id:
            self.log_test("Request Documents Status", False, "No application ID available")
            return False
        
        try:
            # Update status to documents_required with message
            response = requests.patch(
                f"{self.api_url}/applications/{self.test_application_id}/status",
                json={
                    "status": "documents_required",
                    "document_request_message": "Please upload proof of income and ID"
                },
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                if (data.get('status') == 'documents_required' and 
                    data.get('document_upload_token') and 
                    data.get('document_request_message')):
                    self.document_upload_token = data.get('document_upload_token')
                    details += f", Status updated, Token generated: {self.document_upload_token[:8]}..."
                    details += f", Message: {data.get('document_request_message')[:30]}..."
                else:
                    success = False
                    details += ", Status not updated or token/message not generated"
            
            self.log_test("Request Documents Status", success, details)
            return success
        except Exception as e:
            self.log_test("Request Documents Status", False, str(e))
            return False

    def test_verify_document_upload_token(self):
        """Test verifying document upload token"""
        if not hasattr(self, 'document_upload_token') or not self.document_upload_token:
            self.log_test("Verify Document Upload Token", False, "No document upload token available")
            return False
        
        try:
            response = requests.get(f"{self.api_url}/applications/document-upload/{self.document_upload_token}", timeout=10)
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                if data.get('id') == self.test_application_id and data.get('status') == 'documents_required':
                    details += f", Token verified for application {data['id'][:8]}..."
                else:
                    success = False
                    details += ", Token verification failed or wrong application"
            
            self.log_test("Verify Document Upload Token", success, details)
            return success
        except Exception as e:
            self.log_test("Verify Document Upload Token", False, str(e))
            return False

    def test_upload_document(self):
        """Test uploading a document"""
        if not hasattr(self, 'document_upload_token') or not self.document_upload_token:
            self.log_test("Upload Document", False, "No document upload token available")
            return False
        
        try:
            # Create a test PDF file content
            test_file_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF"
            
            files = {
                'file': ('test_document.pdf', test_file_content, 'application/pdf')
            }
            
            response = requests.post(
                f"{self.api_url}/applications/{self.test_application_id}/upload-document?token={self.document_upload_token}",
                files=files,
                timeout=10
            )
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                if data.get('success') == True and data.get('document'):
                    self.uploaded_document_id = data['document']['id']
                    details += f", Document uploaded: {data['document']['filename']}"
                else:
                    success = False
                    details += ", Upload response invalid"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text[:200]}"
            
            self.log_test("Upload Document", success, details)
            return success
        except Exception as e:
            self.log_test("Upload Document", False, str(e))
            return False

    def test_upload_invalid_document(self):
        """Test uploading invalid document (wrong file type)"""
        if not hasattr(self, 'document_upload_token') or not self.document_upload_token:
            self.log_test("Upload Invalid Document", False, "No document upload token available")
            return False
        
        try:
            # Create a test text file (invalid type)
            test_file_content = b"This is a text file, not a valid document type"
            
            files = {
                'file': ('test_document.txt', test_file_content, 'text/plain')
            }
            
            response = requests.post(
                f"{self.api_url}/applications/{self.test_application_id}/upload-document?token={self.document_upload_token}",
                files=files,
                timeout=10
            )
            
            # Should return 400 for invalid file type
            success = response.status_code == 400
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f", Expected 400 validation error for invalid file type"
            
            self.log_test("Upload Invalid Document", success, details)
            return success
        except Exception as e:
            self.log_test("Upload Invalid Document", False, str(e))
            return False

    def test_get_uploaded_document(self):
        """Test downloading uploaded document"""
        if not hasattr(self, 'uploaded_document_id') or not self.uploaded_document_id:
            self.log_test("Get Uploaded Document", False, "No uploaded document ID available")
            return False
        
        try:
            response = requests.get(
                f"{self.api_url}/applications/{self.test_application_id}/documents/{self.uploaded_document_id}",
                timeout=10
            )
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                # Check if it's a file response
                content_type = response.headers.get('content-type', '')
                if 'application/pdf' in content_type or 'application/octet-stream' in content_type:
                    details += f", Document downloaded, Content-Type: {content_type}"
                else:
                    success = False
                    details += f", Invalid content type: {content_type}"
            
            self.log_test("Get Uploaded Document", success, details)
            return success
        except Exception as e:
            self.log_test("Get Uploaded Document", False, str(e))
            return False

    def test_upload_with_invalid_token(self):
        """Test uploading document with invalid token"""
        try:
            test_file_content = b"%PDF-1.4\nTest PDF content"
            files = {
                'file': ('test_document.pdf', test_file_content, 'application/pdf')
            }
            
            fake_token = "invalid-token-12345"
            response = requests.post(
                f"{self.api_url}/applications/{self.test_application_id}/upload-document?token={fake_token}",
                files=files,
                timeout=10
            )
            
            # Should return 404 for invalid token
            success = response.status_code == 404
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f", Expected 404 for invalid token"
            
            self.log_test("Upload with Invalid Token", success, details)
            return success
        except Exception as e:
            self.log_test("Upload with Invalid Token", False, str(e))
            return False

    def test_get_banking_info(self):
        """Test getting banking info for application with submitted banking details"""
        if not self.test_application_id:
            self.log_test("Get Banking Info", False, "No application ID available")
            return False
        
        try:
            response = requests.get(
                f"{self.api_url}/applications/{self.test_application_id}/banking-info",
                timeout=10
            )
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                required_fields = ['account_number_last_four', 'routing_number_last_four', 'card_last_four', 'card_expiration']
                if all(field in data for field in required_fields):
                    details += f", Banking info retrieved - Account: ••••{data['account_number_last_four']}, Card: ••••{data['card_last_four']}"
                    # Verify last 4 digits format
                    if (len(data['account_number_last_four']) == 4 and 
                        len(data['routing_number_last_four']) == 4 and 
                        len(data['card_last_four']) == 4):
                        details += ", Last 4 digits format correct"
                    else:
                        success = False
                        details += ", Invalid last 4 digits format"
                else:
                    success = False
                    details += f", Missing required fields: {[f for f in required_fields if f not in data]}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text[:200]}"
            
            self.log_test("Get Banking Info", success, details)
            return success
        except Exception as e:
            self.log_test("Get Banking Info", False, str(e))
            return False

    def test_get_banking_info_no_submission(self):
        """Test getting banking info for application without banking info submitted"""
        # Create a new application without banking info
        test_data = {
            "first_name": "Jane",
            "last_name": "Smith",
            "email": "jane.smith@example.com",
            "phone": "5559876543",
            "date_of_birth": "1985-05-20",
            "street_address": "456 Oak Avenue",
            "city": "Los Angeles",
            "state": "CA",
            "zip_code": "90210",
            "annual_income": 85000.0,
            "employment_status": "employed",
            "loan_amount_requested": 30000.0,
            "ssn_last_four": "5678"
        }
        
        try:
            # Create application
            response = requests.post(
                f"{self.api_url}/applications",
                json=test_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code != 200:
                self.log_test("Get Banking Info (No Submission)", False, "Failed to create test application")
                return False
            
            app_data = response.json()
            test_app_id = app_data['id']
            
            # Try to get banking info (should fail)
            response = requests.get(
                f"{self.api_url}/applications/{test_app_id}/banking-info",
                timeout=10
            )
            
            # Should return 404 since no banking info submitted
            success = response.status_code == 404
            details = f"Status: {response.status_code}"
            
            if success:
                details += ", Correctly returned 404 for application without banking info"
            else:
                details += f", Expected 404 for application without banking info"
            
            self.log_test("Get Banking Info (No Submission)", success, details)
            return success
        except Exception as e:
            self.log_test("Get Banking Info (No Submission)", False, str(e))
            return False

    def test_get_banking_info_nonexistent_app(self):
        """Test getting banking info for non-existent application"""
        fake_id = "00000000-0000-0000-0000-000000000000"
        
        try:
            response = requests.get(
                f"{self.api_url}/applications/{fake_id}/banking-info",
                timeout=10
            )
            
            # Should return 404 for non-existent application
            success = response.status_code == 404
            details = f"Status: {response.status_code}"
            
            if success:
                details += ", Correctly returned 404 for non-existent application"
            else:
                details += f", Expected 404 for non-existent application"
            
            self.log_test("Get Banking Info (Non-existent App)", success, details)
            return success
        except Exception as e:
            self.log_test("Get Banking Info (Non-existent App)", False, str(e))
            return False

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting Backend API Tests...")
        print(f"Testing API at: {self.api_url}")
        print("-" * 50)
        
        # Test basic connectivity first
        if not self.test_api_root():
            print("❌ API root endpoint failed - stopping tests")
            return False
        
        # Test main functionality
        self.test_create_application()
        self.test_get_application()
        self.test_get_all_applications()
        
        # Test error handling
        self.test_invalid_application()
        self.test_nonexistent_application()
        
        # Test new admin and notification features
        print("\n🔐 Testing Admin & Notification Features...")
        self.test_admin_login()
        self.test_update_application_status()
        self.test_get_notifications()
        self.test_get_applicant_notifications()
        self.test_dashboard_stats()
        self.test_mark_notification_read()
        self.test_unread_count()
        
        # Test new loan calculator and approval features
        print("\n🧮 Testing Loan Calculator & Approval Features...")
        self.test_loan_calculator()
        self.test_approve_application_and_token_generation()
        self.test_verify_approval_token()
        self.test_accept_loan_banking_info()
        self.test_banking_info_validation()
        
        # Test new document upload features
        print("\n📄 Testing Document Upload Features...")
        self.test_request_documents_status()
        self.test_verify_document_upload_token()
        self.test_upload_document()
        self.test_upload_invalid_document()
        self.test_get_uploaded_document()
        self.test_upload_with_invalid_token()
        
        # Test new banking info features
        print("\n💳 Testing Banking Info Features...")
        self.test_get_banking_info()
        self.test_get_banking_info_no_submission()
        self.test_get_banking_info_nonexistent_app()
        
        # Print summary
        print("-" * 50)
        print(f"📊 Backend Tests Summary:")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = LoanApplicationAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'total_tests': tester.tests_run,
            'passed_tests': tester.tests_passed,
            'success_rate': (tester.tests_passed/tester.tests_run)*100 if tester.tests_run > 0 else 0,
            'test_results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())