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
        """Test creating a loan application"""
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
            "loan_amount_requested": 25000.0,
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