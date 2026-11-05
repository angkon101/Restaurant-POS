from database import SessionLocal, engine, Base
import models

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. Seed Settings if not exists
    settings = db.query(models.RestaurantSettings).first()
    if not settings:
        settings = models.RestaurantSettings(
            name="Mijan's Mini Bistro",
            tagline="Artisan Burgers, Pizza & Refreshing Drinks",
            address="42 Culinary Avenue, Downtown Food Street",
            phone="+1 (555) 789-2041",
            currency_symbol="$",
            tax_percentage=5.0,
            service_charge_percentage=0.0,
            receipt_header="Welcome to Mijan's Mini Bistro!",
            receipt_footer="Thank you for dining with us! Have a wonderful day.",
            printer_paper_size="80mm"
        )
        db.add(settings)

    # 2. Seed Tables if not exists
    if db.query(models.Table).count() == 0:
        default_tables = [
            {"number": "T-01", "name": "Window Booth 1", "capacity": 2, "section": "Window Side"},
            {"number": "T-02", "name": "Window Booth 2", "capacity": 4, "section": "Window Side"},
            {"number": "T-03", "name": "Central Table 1", "capacity": 4, "section": "Main Hall"},
            {"number": "T-04", "name": "Central Table 2", "capacity": 4, "section": "Main Hall"},
            {"number": "T-05", "name": "Family Round 1", "capacity": 6, "section": "Main Hall"},
            {"number": "T-06", "name": "Family Round 2", "capacity": 8, "section": "Main Hall"},
            {"number": "T-07", "name": "Patio Table A", "capacity": 2, "section": "Outdoor Patio"},
            {"number": "T-08", "name": "Patio Table B", "capacity": 4, "section": "Outdoor Patio"},
            {"number": "BAR-1", "name": "Bar Stool 1", "capacity": 1, "section": "Bar Counter"},
            {"number": "BAR-2", "name": "Bar Stool 2", "capacity": 1, "section": "Bar Counter"},
        ]
        for t in default_tables:
            db.add(models.Table(**t, status="AVAILABLE"))

    # 3. Seed Categories if not exists
    if db.query(models.Category).count() == 0:
        categories_data = [
            {"name": "Burgers & Sandwiches", "icon": "Utensils", "sort_order": 1},
            {"name": "Wood-Fired Pizza", "icon": "Pizza", "sort_order": 2},
            {"name": "Appetizers & Sides", "icon": "Flame", "sort_order": 3},
            {"name": "Refreshing Drinks", "icon": "Coffee", "sort_order": 4},
            {"name": "Sweet Desserts", "icon": "IceCream", "sort_order": 5},
        ]
        cat_map = {}
        for c in categories_data:
            cat = models.Category(**c)
            db.add(cat)
            db.flush()
            cat_map[cat.name] = cat.id

        # 4. Seed Menu Items
        menu_items_data = [
            # Burgers
            {
                "category_id": cat_map["Burgers & Sandwiches"],
                "name": "Classic Cheeseburger",
                "description": "Juicy beef patty, cheddar, lettuce, tomato, house secret sauce on brioche",
                "price": 8.50,
                "sku": "BGR-01"
            },
            {
                "category_id": cat_map["Burgers & Sandwiches"],
                "name": "Double Smash Bacon Burger",
                "description": "Two crispy-edged smash patties, smoky beef bacon, double American cheese",
                "price": 11.99,
                "sku": "BGR-02"
            },
            {
                "category_id": cat_map["Burgers & Sandwiches"],
                "name": "Spicy Crispy Chicken Burger",
                "description": "Fried chicken breast, jalapeño slaw, spicy chipotle mayo",
                "price": 9.50,
                "sku": "BGR-03"
            },
            {
                "category_id": cat_map["Burgers & Sandwiches"],
                "name": "Grilled Truffle Mushroom Melt",
                "description": "Sautéed portobello, Swiss cheese, truffle aioli on toasted sourdough",
                "price": 9.00,
                "sku": "BGR-04"
            },

            # Pizza
            {
                "category_id": cat_map["Wood-Fired Pizza"],
                "name": "Margherita Classica",
                "description": "San Marzano tomato sauce, fresh buffalo mozzarella, fresh basil, EVOO",
                "price": 12.00,
                "sku": "PIZ-01"
            },
            {
                "category_id": cat_map["Wood-Fired Pizza"],
                "name": "Pepperoni Rustica",
                "description": "Crispy pepperoni cups, mozzarella, hot honey drizzle, oregano",
                "price": 14.50,
                "sku": "PIZ-02"
            },
            {
                "category_id": cat_map["Wood-Fired Pizza"],
                "name": "BBQ Smoky Chicken Pizza",
                "description": "Grilled BBQ chicken, red onions, smoked gouda, cilantro",
                "price": 13.50,
                "sku": "PIZ-03"
            },

            # Appetizers
            {
                "category_id": cat_map["Appetizers & Sides"],
                "name": "Crispy French Fries (Large)",
                "description": "Golden salted skin-on fries served with herb dip",
                "price": 4.00,
                "sku": "APP-01"
            },
            {
                "category_id": cat_map["Appetizers & Sides"],
                "name": "Loaded Truffle Parmesan Fries",
                "description": "Fries tossed in white truffle oil, grated aged parmesan, parsley",
                "price": 6.50,
                "sku": "APP-02"
            },
            {
                "category_id": cat_map["Appetizers & Sides"],
                "name": "Spicy Buffalo Wings (6 pcs)",
                "description": "Crisp wings coated in tangy buffalo glaze with blue cheese dip",
                "price": 7.50,
                "sku": "APP-03"
            },
            {
                "category_id": cat_map["Appetizers & Sides"],
                "name": "Mozzarella Sticks (5 pcs)",
                "description": "Golden fried cheese sticks with rich marinara dip",
                "price": 5.50,
                "sku": "APP-04"
            },

            # Drinks
            {
                "category_id": cat_map["Refreshing Drinks"],
                "name": "Fresh Mint Lemonade",
                "description": "Freshly squeezed lemon juice, crushed mint, chilled club soda",
                "price": 3.50,
                "sku": "DRK-01"
            },
            {
                "category_id": cat_map["Refreshing Drinks"],
                "name": "Iced Vanilla Latte",
                "description": "Double espresso, cold milk, artisanal vanilla bean syrup",
                "price": 4.50,
                "sku": "DRK-02"
            },
            {
                "category_id": cat_map["Refreshing Drinks"],
                "name": "Craft Peach Iced Tea",
                "description": "Brewed black tea infused with sweet peach nectar",
                "price": 3.80,
                "sku": "DRK-03"
            },
            {
                "category_id": cat_map["Refreshing Drinks"],
                "name": "Cola / Soda Can (330ml)",
                "description": "Chilled sparkling beverage",
                "price": 2.00,
                "sku": "DRK-04"
            },

            # Desserts
            {
                "category_id": cat_map["Sweet Desserts"],
                "name": "Warm Molten Lava Cake",
                "description": "Decadent chocolate cake with molten center & vanilla gelato scoop",
                "price": 6.50,
                "sku": "DST-01"
            },
            {
                "category_id": cat_map["Sweet Desserts"],
                "name": "New York Cheesecake",
                "description": "Creamy baked cheesecake with strawberry compote drizzle",
                "price": 5.50,
                "sku": "DST-02"
            },
        ]
        for m in menu_items_data:
            db.add(models.MenuItem(**m, is_available=True))

    db.commit()
    db.close()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_database()
