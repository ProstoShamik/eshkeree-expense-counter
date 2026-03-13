from schemas.category import CategoryCreate, CategoryRead, CategoryUpdate
from fastapi import HTTPException
from fastapi import APIRouter, Depends, status
from core.database import DbSession
from core.dependencies import get_current_user
from core.logging import logger
from models.user import User


import services.categories

router = APIRouter(
    prefix="/categories",
    tags=["categories"],
    dependencies=[Depends(get_current_user)],
)


@router.post("/", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
async def add_category(
    category: CategoryCreate,
    db: DbSession,
    current_user: User = Depends(get_current_user),
):
    logger.info(f"User {current_user.id} is adding category")
    return await services.categories.create(db, category, current_user.id)


@router.get("/", response_model=list[CategoryRead])
async def get_categories(
    db: DbSession,
    current_user: User = Depends(get_current_user),
):
    logger.info(f"User {current_user.id} is fetching categories")
    return await services.categories.get_all(db, current_user.id)


@router.patch("/{category_id}", response_model=CategoryRead)
async def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    db: DbSession,
    current_user: User = Depends(get_current_user),
):
    logger.info(f"User {current_user.id} is updating category {category_id}")
    category = await services.categories.update(
        db, category_id, category_data, current_user.id
    )
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Category not found"
        )
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    db: DbSession,
    current_user: User = Depends(get_current_user),
):
    logger.info(f"User {current_user.id} is deleting category {category_id}")
    deleted = await services.categories.delete(db, category_id, current_user.id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Category not found"
        )
