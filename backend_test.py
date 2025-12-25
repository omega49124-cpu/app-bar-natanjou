#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class BuvetteAPITester:
    def __init__(self, base_url="https://stock-tracker-612.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

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

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if success:
                try:
                    response_data = response.json()
                    details += f", Response: {json.dumps(response_data, indent=2)[:200]}..."
                except:
                    details += f", Response: {response.text[:100]}..."
            else:
                details += f", Expected: {expected_status}, Response: {response.text[:200]}"

            self.log_test(name, success, details)
            return success, response.json() if success and response.text else {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_seed_data(self):
        """Test seeding initial data"""
        return self.run_test("Seed Data", "POST", "seed", 200)

    def test_get_products(self):
        """Test getting products"""
        success, data = self.run_test("Get Products", "GET", "products", 200)
        if success and isinstance(data, list) and len(data) == 4:
            expected_products = ["Boisson", "Glace", "Café", "Vin"]
            found_products = [p.get("name") for p in data]
            if all(prod in found_products for prod in expected_products):
                self.log_test("Products Content Validation", True, f"Found all 4 products: {found_products}")
                return True, data
            else:
                self.log_test("Products Content Validation", False, f"Missing products. Found: {found_products}")
        elif success:
            self.log_test("Products Content Validation", False, f"Expected 4 products, got {len(data) if isinstance(data, list) else 'non-list'}")
        return success, data

    def test_stock_operations(self, products):
        """Test stock operations"""
        # Test get stock
        success, stock_data = self.run_test("Get Stock", "GET", "stock", 200)
        if not success:
            return False

        if not stock_data or len(stock_data) == 0:
            # Initialize stock first
            init_success, _ = self.run_test("Initialize Stock", "POST", "stock/init", 200)
            if init_success:
                success, stock_data = self.run_test("Get Stock After Init", "GET", "stock", 200)

        if success and stock_data and len(stock_data) > 0:
            # Test updating stock for first product
            first_product = stock_data[0]
            product_id = first_product.get("product_id")
            
            update_data = {
                "stock_initial": 50,
                "achats": 20,
                "pertes": 2
            }
            
            update_success, _ = self.run_test(
                f"Update Stock for {first_product.get('product_name', 'Unknown')}", 
                "PUT", 
                f"stock/{product_id}", 
                200, 
                update_data
            )
            return update_success
        
        return success

    def test_sales_operations(self, products):
        """Test sales operations"""
        if not products:
            return False

        # Test creating a sale
        first_product = products[0]
        sale_data = {
            "product_id": first_product["id"],
            "quantity": 2
        }
        
        success, sale_response = self.run_test("Create Sale", "POST", "sales", 200, sale_data)
        
        if success:
            # Test getting sales
            self.run_test("Get All Sales", "GET", "sales", 200)
            self.run_test("Get Today Sales", "GET", "sales/today", 200)
        
        return success

    def test_refund_operations(self, products):
        """Test refund operations"""
        if not products:
            return False

        # Test creating a refund
        refund_data = {
            "member_name": "Jean Test",
            "items": [
                {
                    "product_name": products[0]["name"],
                    "quantity": 1,
                    "unit_price": products[0]["price"]
                }
            ],
            "total_amount": products[0]["price"],
            "reason": "Test refund"
        }
        
        success, refund_response = self.run_test("Create Refund", "POST", "refunds", 200, refund_data)
        
        if success:
            # Test getting refunds
            self.run_test("Get All Refunds", "GET", "refunds", 200)
            
            # Test getting specific refund
            refund_id = refund_response.get("id")
            if refund_id:
                self.run_test("Get Specific Refund", "GET", f"refunds/{refund_id}", 200)
        
        return success

    def test_stats(self):
        """Test stats endpoint"""
        return self.run_test("Get Today Stats", "GET", "stats/today", 200)

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("API Root", "GET", "", 200)

def main():
    print("🧪 Starting Natanjou Buvette API Tests")
    print("=" * 50)
    
    tester = BuvetteAPITester()
    
    # Test sequence
    print("\n📦 Step 1: Seeding data...")
    seed_success, _ = tester.test_seed_data()
    
    print("\n🛍️ Step 2: Testing products...")
    products_success, products = tester.test_get_products()
    
    print("\n📊 Step 3: Testing stock operations...")
    stock_success = tester.test_stock_operations(products if products_success else [])
    
    print("\n💰 Step 4: Testing sales operations...")
    sales_success = tester.test_sales_operations(products if products_success else [])
    
    print("\n💸 Step 5: Testing refund operations...")
    refund_success = tester.test_refund_operations(products if products_success else [])
    
    print("\n📈 Step 6: Testing stats...")
    stats_success = tester.test_stats()
    
    print("\n🏠 Step 7: Testing root endpoint...")
    root_success = tester.test_root_endpoint()
    
    # Print summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    print(f"Tests run: {tester.tests_run}")
    print(f"Tests passed: {tester.tests_passed}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    # Print failed tests
    failed_tests = [r for r in tester.test_results if not r["success"]]
    if failed_tests:
        print(f"\n❌ Failed tests ({len(failed_tests)}):")
        for test in failed_tests:
            print(f"   - {test['test']}: {test['details']}")
    
    # Return appropriate exit code
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())