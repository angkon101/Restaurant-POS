from database import SessionLocal, engine, Base
import models

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. Seed Settings if not exists
    settings = db.query(models.RestaurantSettings).first()
    if not settings:
        settings = models.RestaurantSettings(
            name="Mijan's Restaurant",
            tagline="Delicious Food & Quick Service",
            address="42 Food Boulevard, City Center",
            phone="+91 98765 43210",
            currency_symbol="₹",
            tax_percentage=0.0,
            service_charge_percentage=0.0,
            receipt_header="Welcome to Mijan's Restaurant!",
            receipt_footer="Thank you for your visit! Please come again.",
            printer_paper_size="80mm"
        )
        db.add(settings)
    else:
        # Default currency to ₹ to match user's requested mockup
        settings.currency_symbol = "₹"

    # 2. Categories matching the mobile mockup
    cat_names = [
        {"name": "Starters", "icon": "Flame", "sort_order": 1},
        {"name": "Soups", "icon": "Coffee", "sort_order": 2},
        {"name": "Main Course - Veg", "icon": "Utensils", "sort_order": 3},
        {"name": "Main Course - Non-Veg", "icon": "Utensils", "sort_order": 4},
        {"name": "Breads & Rice", "icon": "Pizza", "sort_order": 5},
        {"name": "Beverages", "icon": "Coffee", "sort_order": 6},
        {"name": "Desserts", "icon": "IceCream", "sort_order": 7},
    ]

    # Clean old items and reseed with exact screenshot items
    db.query(models.MenuItem).delete()
    db.query(models.Category).delete()
    db.flush()

    cat_map = {}
    for c in cat_names:
        cat = models.Category(**c)
        db.add(cat)
        db.flush()
        cat_map[cat.name] = cat.id

    # 3. Seed Menu Items matching the user screenshot
    menu_items_data = [
        # Starters (matching screenshot)
        {
            "category_id": cat_map["Starters"],
            "name": "Paneer Tikka",
            "description": "Marinated cottage cheese cubes grilled in tandoor",
            "price": 250.00,
            "sku": "STR-01",
            "image_url": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=400&auto=format&fit=crop&q=80"
        },
        {
            "category_id": cat_map["Starters"],
            "name": "Veg Spring Rolls",
            "description": "Crispy rolled appetizer packed with julienned vegetables",
            "price": 150.00,
            "sku": "STR-02",
            "image_url": "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=80"
        },
        {
            "category_id": cat_map["Starters"],
            "name": "Hara Bhara Kabab",
            "description": "Pan-fried patties made with spinach, green peas and potatoes",
            "price": 80.00,
            "sku": "STR-03",
            "image_url": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&auto=format&fit=crop&q=80"
        },
        {
            "category_id": cat_map["Starters"],
            "name": "Tandoori Aloo",
            "description": "Baby potatoes marinated in hung curd and aromatic spices",
            "price": 220.00,
            "sku": "STR-04",
            "image_url": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop&q=80"
        },
        {
            "category_id": cat_map["Starters"],
            "name": "Crispy Corn",
            "description": "Fried sweet corn kernels tossed with spices and herbs",
            "price": 200.00,
            "sku": "STR-05",
            "image_url": "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&auto=format&fit=crop&q=80"
        },
        {
            "category_id": cat_map["Starters"],
            "name": "Paneer Malai Tikka",
            "description": "Mild and creamy tandoori paneer skewers with cardamom",
            "price": 150.00,
            "sku": "STR-06",
            "image_url": ""  # Letter fallback 'P' like screenshot!
        },
        {
            "category_id": cat_map["Starters"],
            "name": "Veg Manchurian Dry",
            "description": "Crispy vegetable balls tossed in spicy garlic soy sauce",
            "price": 200.00,
            "sku": "STR-07",
            "image_url": ""  # Letter fallback 'V' like screenshot!
        },
        {
            "category_id": cat_map["Starters"],
            "name": "Honey Chilli Potato",
            "description": "Crisp fried potato fingers coated in sweet spicy sauce",
            "price": 200.00,
            "sku": "STR-08",
            "image_url": ""  # Letter fallback 'H' like screenshot!
        },
        {
            "category_id": cat_map["Starters"],
            "name": "Tandoori Soya Chaap",
            "description": "Protein-rich soya chunks marinated and roasted in clay oven",
            "price": 100.00,
            "sku": "STR-09",
            "image_url": ""  # Letter fallback 'T' like screenshot!
        },

        # Soups
        {
            "category_id": cat_map["Soups"],
            "name": "Hot & Sour Soup",
            "description": "Spicy and tangy Asian vegetable broth with mushrooms",
            "price": 120.00,
            "sku": "SOP-01",
            "image_url": "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&auto=format&fit=crop&q=80"
        },
        {
            "category_id": cat_map["Soups"],
            "name": "Sweet Corn Soup",
            "description": "Creamy corn kernel soup flavored with light pepper",
            "price": 110.00,
            "sku": "SOP-02",
            "image_url": "https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?w=400&auto=format&fit=crop&q=80"
        },
        {
            "category_id": cat_map["Soups"],
            "name": "Tomato Basil Shorba",
            "description": "Traditional roasted tomato soup with fresh herbs",
            "price": 100.00,
            "sku": "SOP-03",
            "image_url": ""
        },

        # Main Course - Veg
        {
            "category_id": cat_map["Main Course - Veg"],
            "name": "Paneer Butter Masala",
            "description": "Rich and creamy tomato makhani gravy with soft paneer cubes",
            "price": 280.00,
            "sku": "MCV-01",
            "image_url": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&auto=format&fit=crop&q=80"
        },
        {
            "category_id": cat_map["Main Course - Veg"],
            "name": "Dal Makhani",
            "description": "Slow-cooked black lentils simmered with butter and cream",
            "price": 240.00,
            "sku": "MCV-02",
            "image_url": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&auto=format&fit=crop&q=80"
        },
        {
            "category_id": cat_map["Main Course - Veg"],
            "name": "Kadhai Paneer",
            "description": "Cottage cheese with bell peppers in spicy freshly ground kadhai masala",
            "price": 260.00,
            "sku": "MCV-03",
            "image_url": ""
        },

        # Breads & Rice
        {
            "category_id": cat_map["Breads & Rice"],
            "name": "Butter Naan",
            "description": "Soft leavened bread brushed with rich butter",
            "price": 45.00,
            "sku": "BRD-01",
            "image_url": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&auto=format&fit=crop&q=80"
        },
        {
            "category_id": cat_map["Breads & Rice"],
            "name": "Garlic Naan",
            "description": "Tandoori flatbread topped with minced roasted garlic & coriander",
            "price": 60.00,
            "sku": "BRD-02",
            "image_url": ""
        },
        {
            "category_id": cat_map["Breads & Rice"],
            "name": "Jeera Rice",
            "description": "Fragrant basmati rice tempered with cumin seeds and ghee",
            "price": 140.00,
            "sku": "BRD-03",
            "image_url": ""
        },

        # Beverages
        {
            "category_id": cat_map["Beverages"],
            "name": "Fresh Lime Soda",
            "description": "Chilled soda with fresh lime juice, sweet or salted",
            "price": 60.00,
            "sku": "BEV-01",
            "image_url": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&auto=format&fit=crop&q=80"
        },
        {
            "category_id": cat_map["Beverages"],
            "name": "Sweet Mango Lassi",
            "description": "Thick traditional yogurt shake blended with sweet mango pulp",
            "price": 90.00,
            "sku": "BEV-02",
            "image_url": "https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400&auto=format&fit=crop&q=80"
        },

        # Desserts
        {
            "category_id": cat_map["Desserts"],
            "name": "Gulab Jamun (2 pcs)",
            "description": "Warm golden milk-solid dumplings soaked in rose saffron syrup",
            "price": 70.00,
            "sku": "DES-01",
            "image_url": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop&q=80"
        },
        {
            "category_id": cat_map["Desserts"],
            "name": "Vanilla Ice Cream",
            "description": "Rich creamy vanilla scoop with chocolate drizzle",
            "price": 60.00,
            "sku": "DES-02",
            "image_url": ""
        }
    ]

    for m in menu_items_data:
        db.add(models.MenuItem(**m, is_available=True))

    db.commit()
    db.close()
    print("Database reseeded with mobile mockup menu items successfully.")

if __name__ == "__main__":
    seed_database()
