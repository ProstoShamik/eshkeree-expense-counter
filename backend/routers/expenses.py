from fastapi import APIRouter, Depends, status, HTTPException
from core.database import DbSession
from core.dependencies import get_current_user
from core.logging import logger
from models.user import User
from schemas.expense import (
    ExpenseCreate,
    ExpenseDetail,
    ExpenseRead,
    ExpenseFilters,
    ExpenseListResponse,
    ExpenseUpdate,
)
import services.expenses

router = APIRouter(
    prefix="/expenses",
    tags=["expenses"],
    dependencies=[Depends(get_current_user)],
)


@router.post("/", response_model=ExpenseRead, status_code=status.HTTP_201_CREATED)
async def create_expense(
    expense_data: ExpenseCreate,
    db: DbSession,
    current_user: User = Depends(get_current_user),
):
    logger.info(f"User {current_user.id} is adding expense")
    return await services.expenses.create(db, expense_data, current_user.id)


@router.get("/", response_model=ExpenseListResponse)
async def get_expenses(
    db: DbSession,
    filters: ExpenseFilters = Depends(),
    current_user: User = Depends(get_current_user),
):
    logger.info(f"User {current_user.id} is fetching expenses")
    expenses, next_cursor = await services.expenses.get_many(db, current_user.id, filters)
    return ExpenseListResponse(
        data=[ExpenseRead.model_validate(e) for e in expenses],
        next_cursor=next_cursor,
        has_more=next_cursor is not None,
    )


@router.get("/{expense_id}", response_model=ExpenseDetail)
async def get_expense(
    expense_id: int,
    db: DbSession,
    current_user: User = Depends(get_current_user),
):
    expense = await services.expenses.get_by_id(db, expense_id, current_user.id)
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found"
        )
    return expense


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(
    expense_id: int,
    db: DbSession,
    current_user: User = Depends(get_current_user),
):
    logger.info(f"User {current_user.id} is deleting expense {expense_id}")
    deleted = await services.expenses.delete(db, expense_id, current_user.id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found"
        )


@router.patch("/{expense_id}", response_model=ExpenseRead)
async def update_expense(
    expense_id: int,
    expense_data: ExpenseUpdate,
    db: DbSession,
    current_user: User = Depends(get_current_user),
):
    logger.info(f"User {current_user.id} is updating expense {expense_id}")
    expense = await services.expenses.update(
        db, expense_id, expense_data, current_user.id
    )
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found"
        )
    return expense
