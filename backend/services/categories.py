from __future__ import annotations
from core.database import DbSession
from sqlalchemy import select, or_

from models.category import Category
from schemas.category import CategoryCreate, CategoryUpdate


async def get_all(db: DbSession, user_id: int) -> list[Category]:
    result = await db.execute(
        select(Category).where(
            or_(Category.user_id == user_id, Category.user_id == None)
        )
    )
    return list(result.scalars().all())


async def create(db: DbSession, data: CategoryCreate, user_id: int) -> Category:
    category = Category(
        **data.model_dump(),
        user_id=user_id,
    )
    db.add(category)
    await db.flush()
    await db.refresh(category)
    return category


async def _get_simple(db: DbSession, category_id: int, user_id: int) -> Category | None:
    result = await db.execute(
        select(Category).where(
            Category.id == category_id,
            Category.user_id == user_id
        )
    )
    return result.scalar_one_or_none()


async def update(
    db: DbSession, category_id: int, data: CategoryUpdate, user_id: int
) -> Category | None:
    category = await _get_simple(db, category_id, user_id)
    if not category:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(category, key, value)
    await db.flush()
    await db.refresh(category)
    return category


async def delete(db: DbSession, category_id: int, user_id: int) -> bool:
    category = await _get_simple(db, category_id, user_id)
    if not category:
        return False
    await db.delete(category)
    return True
