#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class BuvetteAPITester:
    def __init__(self, base_url="https://natanjou-kiosk.preview.emergentagent.com"):
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
        if success and isinstance(data, list) and len(data) >= 4:
            expected_products = ["Boisson", "Glace", "Café", "Vin"]
            found_products = [p.get("name") for p in data]
            if all(prod in found_products for prod in expected_products):
                self.log_test("Products Content Validation", True, f"Found all expected products: {found_products}")
                return True, data
            else:
                self.log_test("Products Content Validation", False, f"Missing products. Found: {found_products}")
        elif success:
            self.log_test("Products Content Validation", False, f"Expected at least 4 products, got {len(data) if isinstance(data, list) else 'non-list'}")
        return success, data

    def test_product_crud_operations(self):
        """Test product CRUD operations (new feature)"""
        print("\n🆕 Testing NEW FEATURE: Product CRUD Operations")
        
        # Test creating a new product
        new_product_data = {
            "name": "Test Produit",
            "price": 2.50,
            "category": "snack",
            "image_url": "https://example.com/test.jpg"
        }
        
        create_success, created_product = self.run_test(
            "Create New Product", "POST", "products", 200, new_product_data
        )
        
        if not create_success:
            return False
        
        product_id = created_product.get("id")
        if not product_id:
            self.log_test("Product Creation ID Check", False, "No ID returned from created product")
            return False
        
        # Verify product appears in products list
        get_success, products = self.run_test("Get Products After Creation", "GET", "products", 200)
        if get_success:
            product_names = [p.get("name") for p in products]
            if "Test Produit" in product_names:
                self.log_test("Product Appears in List", True, "New product found in products list")
            else:
                self.log_test("Product Appears in List", False, f"New product not found. Products: {product_names}")
        
        # Test deleting the product
        delete_success, _ = self.run_test(
            "Delete Product", "DELETE", f"products/{product_id}", 200
        )
        
        if delete_success:
            # Verify product is removed from list
            get_after_delete_success, products_after = self.run_test("Get Products After Deletion", "GET", "products", 200)
            if get_after_delete_success:
                product_names_after = [p.get("name") for p in products_after]
                if "Test Produit" not in product_names_after:
                    self.log_test("Product Removed from List", True, "Product successfully removed")
                else:
                    self.log_test("Product Removed from List", False, "Product still appears in list after deletion")
        
        return create_success and delete_success

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

    def test_admin_endpoints(self):
        """Test the new Administration endpoints - current focus"""
        print("\n🔧 Testing ADMINISTRATION ENDPOINTS (Current Focus)")
        print("=" * 50)
        
        # Step 1: Test backup endpoint
        print("\n💾 Step 1: Testing backup endpoint...")
        backup_success, backup_data = self.run_test("GET /api/admin/backup", "GET", "admin/backup", 200)
        
        if not backup_success:
            self.log_test("Admin Backup Endpoint", False, "Backup endpoint failed")
            return False
        
        # Validate backup structure
        required_fields = ["version", "timestamp", "data"]
        required_data_fields = ["products", "stock", "sales", "refunds"]
        
        backup_structure_valid = True
        for field in required_fields:
            if field not in backup_data:
                backup_structure_valid = False
                self.log_test(f"Backup Structure - {field}", False, f"Missing field: {field}")
        
        if "data" in backup_data:
            for data_field in required_data_fields:
                if data_field not in backup_data["data"]:
                    backup_structure_valid = False
                    self.log_test(f"Backup Data Structure - {data_field}", False, f"Missing data field: {data_field}")
        
        if backup_structure_valid:
            self.log_test("Backup Structure Validation", True, "All required fields present")
            print(f"   ✅ Backup contains: {len(backup_data['data']['products'])} products, {len(backup_data['data']['stock'])} stock entries, {len(backup_data['data']['sales'])} sales, {len(backup_data['data']['refunds'])} refunds")
        
        # Step 2: Test restore endpoint
        print("\n🔄 Step 2: Testing restore endpoint...")
        restore_success, restore_response = self.run_test("POST /api/admin/restore", "POST", "admin/restore", 200, backup_data)
        
        if restore_success:
            # Validate restore response structure
            if "message" in restore_response and "restored" in restore_response:
                restored_data = restore_response["restored"]
                expected_counts = {
                    "products": len(backup_data["data"]["products"]),
                    "stock": len(backup_data["data"]["stock"]),
                    "sales": len(backup_data["data"]["sales"]),
                    "refunds": len(backup_data["data"]["refunds"])
                }
                
                restore_counts_correct = True
                for collection, expected_count in expected_counts.items():
                    actual_count = restored_data.get(collection, -1)
                    if actual_count != expected_count:
                        restore_counts_correct = False
                        self.log_test(f"Restore Count - {collection}", False, f"Expected {expected_count}, got {actual_count}")
                
                if restore_counts_correct:
                    self.log_test("Restore Counts Validation", True, "All collection counts match backup")
                    print(f"   ✅ Restored: {restored_data}")
            else:
                self.log_test("Restore Response Structure", False, "Missing message or restored fields")
        
        # Step 3: Test factory reset endpoint
        print("\n🏭 Step 3: Testing factory reset endpoint...")
        factory_reset_success, factory_response = self.run_test("POST /api/admin/factory-reset", "POST", "admin/factory-reset", 200)
        
        if not factory_reset_success:
            self.log_test("Factory Reset Endpoint", False, "Factory reset endpoint failed")
            return False
        
        # Validate factory reset response
        if "message" in factory_response and "products_created" in factory_response:
            if factory_response["products_created"] == 4:
                self.log_test("Factory Reset Products Count", True, "Created exactly 4 products")
            else:
                self.log_test("Factory Reset Products Count", False, f"Expected 4 products, got {factory_response['products_created']}")
        else:
            self.log_test("Factory Reset Response Structure", False, "Missing message or products_created fields")
        
        # Step 4: Verify factory reset results
        print("\n🔍 Step 4: Verifying factory reset results...")
        
        # Check products
        products_success, products_after_reset = self.run_test("Get Products After Factory Reset", "GET", "products", 200)
        if products_success:
            if len(products_after_reset) == 4:
                self.log_test("Factory Reset - Product Count", True, "Exactly 4 products exist")
                
                # Check product names and prices
                expected_products = {
                    "Boisson": 1.00,
                    "Glace": 1.00,
                    "Café": 0.50,
                    "Vin": 7.00
                }
                
                products_correct = True
                found_products = {}
                for product in products_after_reset:
                    name = product.get("name")
                    price = product.get("price")
                    found_products[name] = price
                
                for expected_name, expected_price in expected_products.items():
                    if expected_name not in found_products:
                        products_correct = False
                        self.log_test(f"Factory Reset - Product {expected_name}", False, "Product not found")
                    elif found_products[expected_name] != expected_price:
                        products_correct = False
                        self.log_test(f"Factory Reset - Product {expected_name} Price", False, f"Expected {expected_price}, got {found_products[expected_name]}")
                
                if products_correct:
                    self.log_test("Factory Reset - Product Names and Prices", True, "All products have correct names and prices")
            else:
                self.log_test("Factory Reset - Product Count", False, f"Expected 4 products, got {len(products_after_reset)}")
        
        # Check stock entries
        stock_success, stock_after_reset = self.run_test("Get Stock After Factory Reset", "GET", "stock", 200)
        if stock_success:
            if len(stock_after_reset) == 4:
                self.log_test("Factory Reset - Stock Count", True, "Exactly 4 stock entries exist")
                
                # Check all stock values are 0
                stock_values_correct = True
                for stock in stock_after_reset:
                    product_name = stock.get("product_name", "Unknown")
                    for field in ["stock_initial", "achats", "ventes", "pertes", "stock_final"]:
                        value = stock.get(field, -1)
                        if value != 0:
                            stock_values_correct = False
                            self.log_test(f"Factory Reset - Stock {field} for {product_name}", False, f"Expected 0, got {value}")
                
                if stock_values_correct:
                    self.log_test("Factory Reset - Stock Values", True, "All stock values are 0")
            else:
                self.log_test("Factory Reset - Stock Count", False, f"Expected 4 stock entries, got {len(stock_after_reset)}")
        
        # Check sales and refunds are empty
        sales_success, sales_after_reset = self.run_test("Get Sales After Factory Reset", "GET", "sales", 200)
        if sales_success:
            if len(sales_after_reset) == 0:
                self.log_test("Factory Reset - Sales Empty", True, "Sales collection is empty")
            else:
                self.log_test("Factory Reset - Sales Empty", False, f"Expected 0 sales, got {len(sales_after_reset)}")
        
        refunds_success, refunds_after_reset = self.run_test("Get Refunds After Factory Reset", "GET", "refunds", 200)
        if refunds_success:
            if len(refunds_after_reset) == 0:
                self.log_test("Factory Reset - Refunds Empty", True, "Refunds collection is empty")
            else:
                self.log_test("Factory Reset - Refunds Empty", False, f"Expected 0 refunds, got {len(refunds_after_reset)}")
        
        # Overall admin endpoints test result
        overall_success = (backup_success and backup_structure_valid and 
                          restore_success and factory_reset_success)
        
        self.log_test("OVERALL ADMIN ENDPOINTS", overall_success, 
                     "All admin endpoints working correctly" if overall_success else "Admin endpoints have issues")
        
        return overall_success

    def test_reset_functionality(self):
        """Test the reset functionality - main focus of current testing"""
        print("\n🔄 Testing RESET FUNCTIONALITY (Current Focus)")
        print("=" * 50)
        
        # Step 1: Get current state before reset
        print("\n📊 Step 1: Getting current state...")
        stock_success, stock_before = self.run_test("Get Stock Before Reset", "GET", "stock", 200)
        sales_success, sales_before = self.run_test("Get Sales Before Reset", "GET", "sales", 200)
        
        if not stock_success or not sales_success:
            self.log_test("Reset Test Setup", False, "Could not get initial state")
            return False
        
        print(f"   📦 Stock entries before: {len(stock_before) if stock_before else 0}")
        print(f"   💰 Sales before: {len(sales_before) if sales_before else 0}")
        
        # Show current stock state for Boisson if it exists
        boisson_stock_before = None
        for stock in stock_before:
            if stock.get("product_name") == "Boisson":
                boisson_stock_before = stock
                print(f"   🥤 Boisson before reset: ventes={stock.get('ventes', 0)}, stock_final={stock.get('stock_final', 0)}")
                break
        
        # Step 2: Test the reset endpoint
        print("\n🔄 Step 2: Testing reset endpoint...")
        reset_success, reset_response = self.run_test("POST /api/stock/reset", "POST", "stock/reset", 200)
        
        if not reset_success:
            self.log_test("Reset Endpoint", False, "Reset endpoint failed")
            return False
        
        print(f"   ✅ Reset response: {reset_response}")
        
        # Step 3: Verify sales are deleted
        print("\n🗑️ Step 3: Verifying sales deletion...")
        sales_after_success, sales_after = self.run_test("Get Sales After Reset", "GET", "sales", 200)
        
        if sales_after_success:
            if len(sales_after) == 0:
                self.log_test("Sales Deletion", True, "All sales successfully deleted")
            else:
                self.log_test("Sales Deletion", False, f"Expected 0 sales, found {len(sales_after)}")
                return False
        else:
            self.log_test("Sales Deletion Check", False, "Could not verify sales deletion")
            return False
        
        # Step 4: Verify stock reset
        print("\n📊 Step 4: Verifying stock reset...")
        stock_after_success, stock_after = self.run_test("Get Stock After Reset", "GET", "stock", 200)
        
        if not stock_after_success:
            self.log_test("Stock After Reset Check", False, "Could not get stock after reset")
            return False
        
        # Verify all products have ventes = 0
        all_ventes_zero = True
        stock_recalculated_correctly = True
        
        for stock in stock_after:
            product_name = stock.get("product_name", "Unknown")
            ventes = stock.get("ventes", -1)
            stock_initial = stock.get("stock_initial", 0)
            achats = stock.get("achats", 0)
            pertes = stock.get("pertes", 0)
            stock_final = stock.get("stock_final", 0)
            
            # Check ventes is 0
            if ventes != 0:
                all_ventes_zero = False
                self.log_test(f"Ventes Reset for {product_name}", False, f"Expected ventes=0, got {ventes}")
            
            # Check stock_final calculation
            expected_stock_final = stock_initial + achats - 0 - pertes  # ventes should be 0 after reset
            if stock_final != expected_stock_final:
                stock_recalculated_correctly = False
                self.log_test(f"Stock Calculation for {product_name}", False, 
                            f"Expected stock_final={expected_stock_final} (initial:{stock_initial} + achats:{achats} - ventes:0 - pertes:{pertes}), got {stock_final}")
            
            # Special check for Boisson
            if product_name == "Boisson":
                print(f"   🥤 Boisson after reset: ventes={ventes}, stock_final={stock_final}")
                if boisson_stock_before:
                    print(f"      Before: ventes={boisson_stock_before.get('ventes', 0)}, stock_final={boisson_stock_before.get('stock_final', 0)}")
                    print(f"      Expected: ventes=0, stock_final={stock_initial + achats - pertes}")
        
        if all_ventes_zero:
            self.log_test("All Ventes Reset to Zero", True, "All products have ventes=0")
        
        if stock_recalculated_correctly:
            self.log_test("Stock Final Recalculation", True, "All stock_final values correctly recalculated")
        
        # Step 5: Verify preserved values
        print("\n🔒 Step 5: Verifying preserved values...")
        preserved_correctly = True
        
        for i, stock_after_item in enumerate(stock_after):
            # Find corresponding before item
            stock_before_item = None
            for stock_before_item_candidate in stock_before:
                if stock_before_item_candidate.get("product_id") == stock_after_item.get("product_id"):
                    stock_before_item = stock_before_item_candidate
                    break
            
            if stock_before_item:
                product_name = stock_after_item.get("product_name", "Unknown")
                
                # Check that stock_initial, achats, pertes are preserved
                for field in ["stock_initial", "achats", "pertes"]:
                    before_val = stock_before_item.get(field, 0)
                    after_val = stock_after_item.get(field, 0)
                    if before_val != after_val:
                        preserved_correctly = False
                        self.log_test(f"Preserve {field} for {product_name}", False, 
                                    f"Expected {field}={before_val}, got {after_val}")
        
        if preserved_correctly:
            self.log_test("Values Preservation", True, "stock_initial, achats, and pertes correctly preserved")
        
        # Overall reset test result
        overall_success = (reset_success and all_ventes_zero and 
                          stock_recalculated_correctly and preserved_correctly and 
                          len(sales_after) == 0)
        
        self.log_test("OVERALL RESET FUNCTIONALITY", overall_success, 
                     "Reset endpoint working correctly" if overall_success else "Reset functionality has issues")
        
        return overall_success

def main():
    print("🧪 Starting Natanjou Buvette API Tests - RESET FUNCTIONALITY FOCUS")
    print("=" * 60)
    
    tester = BuvetteAPITester()
    
    # Test sequence - focusing on reset functionality
    print("\n📦 Step 1: Seeding data...")
    seed_success, _ = tester.test_seed_data()
    
    print("\n🛍️ Step 2: Testing products...")
    products_success, products = tester.test_get_products()
    
    print("\n📊 Step 3: Testing stock operations...")
    stock_success = tester.test_stock_operations(products if products_success else [])
    
    print("\n💰 Step 4: Testing sales operations...")
    sales_success = tester.test_sales_operations(products if products_success else [])
    
    print("\n🔄 Step 5: MAIN FOCUS - Testing RESET functionality...")
    reset_success = tester.test_reset_functionality()
    
    print("\n🏠 Step 6: Testing root endpoint...")
    root_success = tester.test_root_endpoint()
    
    # Print summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY - RESET FUNCTIONALITY FOCUS")
    print("=" * 60)
    print(f"Tests run: {tester.tests_run}")
    print(f"Tests passed: {tester.tests_passed}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    # Highlight reset functionality
    print(f"\n🔄 RESET FUNCTIONALITY STATUS:")
    print(f"   Reset Endpoint Test: {'✅ PASSED' if reset_success else '❌ FAILED'}")
    
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