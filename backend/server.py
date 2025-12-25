from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ===== MODELS =====

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    price: float
    category: str
    image_url: Optional[str] = None

class ProductCreate(BaseModel):
    name: str
    price: float
    category: str
    image_url: Optional[str] = None

class StockEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    product_name: str
    stock_initial: int = 0
    achats: int = 0
    ventes: int = 0
    pertes: int = 0
    stock_final: int = 0
    date: str = Field(default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d"))

class StockUpdate(BaseModel):
    stock_initial: Optional[int] = None
    achats: Optional[int] = None
    pertes: Optional[int] = None

class Sale(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    product_name: str
    quantity: int
    unit_price: float
    total: float
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SaleCreate(BaseModel):
    product_id: str
    quantity: int

class Refund(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    member_name: str
    items: List[dict]
    total_amount: float
    reason: str
    receipt_number: str = Field(default_factory=lambda: f"RMB-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{str(uuid.uuid4())[:4].upper()}")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class RefundCreate(BaseModel):
    member_name: str
    items: List[dict]  # [{product_name, quantity, unit_price}]
    total_amount: float
    reason: str

# ===== PRODUCTS ROUTES =====

@api_router.get("/products", response_model=List[Product])
async def get_products():
    products = await db.products.find({}, {"_id": 0}).to_list(100)
    return products

@api_router.post("/products", response_model=Product)
async def create_product(product: ProductCreate):
    product_obj = Product(**product.model_dump())
    doc = product_obj.model_dump()
    await db.products.insert_one(doc)
    
    # Initialize stock entry for new product
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    stock_entry = StockEntry(
        product_id=product_obj.id,
        product_name=product_obj.name,
        stock_initial=0,
        achats=0,
        ventes=0,
        pertes=0,
        stock_final=0,
        date=today
    )
    await db.stock.insert_one(stock_entry.model_dump())
    
    return product_obj

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    # Also delete associated stock entries
    await db.stock.delete_many({"product_id": product_id})
    return {"message": "Product deleted"}

# ===== STOCK ROUTES =====

@api_router.get("/stock", response_model=List[StockEntry])
async def get_stock():
    stock = await db.stock.find({}, {"_id": 0}).to_list(100)
    return stock

@api_router.post("/stock/init")
async def init_stock():
    """Initialize stock entries for all products"""
    products = await db.products.find({}, {"_id": 0}).to_list(100)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    for product in products:
        existing = await db.stock.find_one({"product_id": product["id"], "date": today})
        if not existing:
            stock_entry = StockEntry(
                product_id=product["id"],
                product_name=product["name"],
                stock_initial=0,
                achats=0,
                ventes=0,
                pertes=0,
                stock_final=0,
                date=today
            )
            await db.stock.insert_one(stock_entry.model_dump())
    
    return {"message": "Stock initialized"}

@api_router.put("/stock/{product_id}")
async def update_stock(product_id: str, update: StockUpdate):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    stock = await db.stock.find_one({"product_id": product_id, "date": today}, {"_id": 0})
    if not stock:
        raise HTTPException(status_code=404, detail="Stock entry not found")
    
    update_data = {}
    if update.stock_initial is not None:
        update_data["stock_initial"] = update.stock_initial
    if update.achats is not None:
        update_data["achats"] = update.achats
    if update.pertes is not None:
        update_data["pertes"] = update.pertes
    
    # Recalculate stock_final
    new_stock = {**stock, **update_data}
    stock_final = new_stock["stock_initial"] + new_stock["achats"] - new_stock["ventes"] - new_stock["pertes"]
    update_data["stock_final"] = stock_final
    
    await db.stock.update_one(
        {"product_id": product_id, "date": today},
        {"$set": update_data}
    )
    
    updated = await db.stock.find_one({"product_id": product_id, "date": today}, {"_id": 0})
    return updated

# ===== SALES ROUTES =====

@api_router.get("/sales", response_model=List[Sale])
async def get_sales():
    sales = await db.sales.find({}, {"_id": 0}).to_list(1000)
    return sales

@api_router.get("/sales/today", response_model=List[Sale])
async def get_today_sales():
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    sales = await db.sales.find(
        {"timestamp": {"$regex": f"^{today}"}},
        {"_id": 0}
    ).to_list(1000)
    return sales

@api_router.delete("/sales")
async def delete_all_sales():
    """Delete all sales history"""
    result = await db.sales.delete_many({})
    return {"message": f"{result.deleted_count} ventes supprimées"}

@api_router.delete("/sales/{sale_id}")
async def delete_sale(sale_id: str):
    """Delete a single sale"""
    result = await db.sales.delete_one({"id": sale_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sale not found")
    return {"message": "Vente supprimée"}

@api_router.post("/sales", response_model=Sale)
async def create_sale(sale: SaleCreate):
    product = await db.products.find_one({"id": sale.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    total = product["price"] * sale.quantity
    sale_obj = Sale(
        product_id=sale.product_id,
        product_name=product["name"],
        quantity=sale.quantity,
        unit_price=product["price"],
        total=total
    )
    
    await db.sales.insert_one(sale_obj.model_dump())
    
    # Update stock ventes
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    stock = await db.stock.find_one({"product_id": sale.product_id, "date": today}, {"_id": 0})
    if stock:
        new_ventes = stock["ventes"] + sale.quantity
        stock_final = stock["stock_initial"] + stock["achats"] - new_ventes - stock["pertes"]
        await db.stock.update_one(
            {"product_id": sale.product_id, "date": today},
            {"$set": {"ventes": new_ventes, "stock_final": stock_final}}
        )
    
    return sale_obj

# ===== REFUNDS ROUTES =====

@api_router.get("/refunds", response_model=List[Refund])
async def get_refunds():
    refunds = await db.refunds.find({}, {"_id": 0}).to_list(1000)
    return refunds

@api_router.post("/refunds", response_model=Refund)
async def create_refund(refund: RefundCreate):
    refund_obj = Refund(**refund.model_dump())
    await db.refunds.insert_one(refund_obj.model_dump())
    return refund_obj

@api_router.get("/refunds/{refund_id}", response_model=Refund)
async def get_refund(refund_id: str):
    refund = await db.refunds.find_one({"id": refund_id}, {"_id": 0})
    if not refund:
        raise HTTPException(status_code=404, detail="Refund not found")
    return refund

# ===== SEED DATA =====

@api_router.post("/seed")
async def seed_data():
    """Seed initial products"""
    products = [
        {
            "id": str(uuid.uuid4()),
            "name": "Boisson",
            "price": 1.00,
            "category": "beverage",
            "image_url": "https://images.unsplash.com/photo-1527960392543-80cd0fa46382?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHw0fHxzb2RhJTIwY2FuJTIwY29sZCUyMGJldmVyYWdlfGVufDB8fHx8&ixlib=rb-4.1.0&q=85&w=200"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Glace",
            "price": 1.00,
            "category": "dessert",
            "image_url": "https://images.unsplash.com/photo-1559598561-526bcab44470?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwzfHxpY2UlMjBjcmVhbSUyMGNvbmUlMjBzdW1tZXJ8ZW58MHx8fHx8&ixlib=rb-4.1.0&q=85&w=200"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Café",
            "price": 0.50,
            "category": "beverage",
            "image_url": "https://images.unsplash.com/photo-1712818897188-74fb980cae7b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBjdXAlMjBsYXR0ZSUyMGFydHxlbnwwfHx8fHx8&ixlib=rb-4.1.0&q=85&w=200"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Vin",
            "price": 7.00,
            "category": "alcohol",
            "image_url": "https://images.unsplash.com/photo-1609422465501-13182f6d6783?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwzfHxyZWQlMjB3aW5lJTIwYm90dGxlJTIwZ2xhc3N8ZW58MHx8fHx8&ixlib=rb-4.1.0&q=85&w=200"
        }
    ]
    
    # Clear existing and insert new
    await db.products.delete_many({})
    await db.stock.delete_many({})
    await db.products.insert_many(products)
    
    # Initialize stock
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    for product in products:
        stock_entry = StockEntry(
            product_id=product["id"],
            product_name=product["name"],
            stock_initial=0,
            achats=0,
            ventes=0,
            pertes=0,
            stock_final=0,
            date=today
        )
        await db.stock.insert_one(stock_entry.model_dump())
    
    return {"message": "Data seeded successfully", "products": len(products)}

# ===== STATS =====

@api_router.get("/stats/today")
async def get_today_stats():
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Get today's sales
    sales = await db.sales.find(
        {"timestamp": {"$regex": f"^{today}"}},
        {"_id": 0}
    ).to_list(1000)
    
    total_sales = sum(s["total"] for s in sales)
    total_items = sum(s["quantity"] for s in sales)
    
    # Get today's refunds
    refunds = await db.refunds.find(
        {"timestamp": {"$regex": f"^{today}"}},
        {"_id": 0}
    ).to_list(1000)
    
    total_refunds = sum(r["total_amount"] for r in refunds)
    
    return {
        "date": today,
        "total_sales": total_sales,
        "total_items": total_items,
        "total_refunds": total_refunds,
        "net_revenue": total_sales - total_refunds,
        "num_transactions": len(sales),
        "num_refunds": len(refunds)
    }

@api_router.get("/")
async def root():
    return {"message": "Natanjou Buvette API"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
