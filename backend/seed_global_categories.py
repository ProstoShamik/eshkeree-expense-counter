import asyncio
import argparse
import sys
from sqlalchemy import select
from core.database import init_db, close_db, AsyncSessionLocal
from models.category import Category

# Define your default global categories here
GLOBAL_CATEGORIES = [
    "Food",
    "Transport",
    "Housing",
    "Utilities",
    "Insurance",
    "Healthcare",
    "Savings",
    "Personal",
    "Entertainment",
    "Education",
    "Gifts",
    "Donations",
    "Investments"
]

async def seed():
    await init_db()
    
    async with AsyncSessionLocal() as db:
        try:
            for category_name in GLOBAL_CATEGORIES:
                # Check if it already exists globally
                stmt = select(Category).where(
                    Category.name == category_name,
                    Category.user_id.is_(None)
                )
                result = await db.execute(stmt)
                existing = result.scalar_one_or_none()
                
                if not existing:
                    print(f"Adding global category: {category_name}")
                    new_category = Category(name=category_name, user_id=None)
                    db.add(new_category)
                else:
                    print(f"Category already exists: {category_name}")
            
            await db.commit()
            print("Successfully seeded global categories.")
        except Exception as e:
            await db.rollback()
            print(f"Error seeding categories: {e}", file=sys.stderr)
        finally:
            await close_db()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed global categories into the database.")
    args = parser.parse_args()
    
    asyncio.run(seed())
