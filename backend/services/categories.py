from __future__ import annotations
from core.database import DbSession
from fastapi import HTTPException, status
from sqlalchemy import select, or_, func

from models.category import Category
from schemas.category import CategoryCreate, CategoryUpdate


async def get_all(db: DbSession, user_id: int) -> list[Category]:
    result = await db.execute(
        select(Category).where(
            or_(Category.user_id == user_id, Category.user_id.is_(None))
        ).order_by(Category.user_id.is_not(None), func.lower(Category.name))
    )
    return list(result.scalars().all())


async def _ensure_name_available(
    db: DbSession,
    name: str,
    user_id: int,
    category_id: int | None = None,
) -> None:
    stmt = select(Category).where(
        Category.user_id == user_id,
        func.lower(Category.name) == name.lower(),
    )
    if category_id is not None:
        stmt = stmt.where(Category.id != category_id)

    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this name already exists",
        )


async def create(db: DbSession, data: CategoryCreate, user_id: int) -> Category:
    await _ensure_name_available(db, data.name, user_id)
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
            Category.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def update(
    db: DbSession, category_id: int, data: CategoryUpdate, user_id: int
) -> Category | None:
    category = await _get_simple(db, category_id, user_id)
    if not category:
        return None
    values = data.model_dump(exclude_unset=True)
    if "name" in values:
        await _ensure_name_available(db, values["name"], user_id, category_id)
    for key, value in values.items():
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
