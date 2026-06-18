from __future__ import annotations
from datetime import date
from decimal import Decimal, InvalidOperation

from core.database import DbSession
from fastapi import HTTPException, status
from sqlalchemy import and_, func, or_, select, asc, desc
from sqlalchemy.orm import joinedload

from models.category import Category
from models.expense import Expense
from schemas.expense import (
    ExpenseCreate,
    ExpenseFilters,
    ExpenseSortField,
    ExpenseUpdate,
    SortOrder,
)


def _sort_expression(sort_by: ExpenseSortField):
    if sort_by == ExpenseSortField.category:
        return func.coalesce(Expense.category_id, 0)
    return getattr(Expense, sort_by.value)


def _encode_cursor(expense: Expense, sort_by: ExpenseSortField) -> str:
    if sort_by == ExpenseSortField.date:
        value = expense.expense_date.isoformat()
    elif sort_by == ExpenseSortField.amount:
        value = str(expense.amount)
    else:
        value = str(expense.category_id or 0)
    return f"{value}|{expense.id}"


def _decode_cursor(cursor: str, sort_by: ExpenseSortField) -> tuple[date | Decimal | int, int]:
    try:
        value_raw, id_raw = cursor.rsplit("|", 1)
        expense_id = int(id_raw)
        if sort_by == ExpenseSortField.date:
            value: date | Decimal | int = date.fromisoformat(value_raw)
        elif sort_by == ExpenseSortField.amount:
            value = Decimal(value_raw)
        else:
            value = int(value_raw)
        return value, expense_id
    except (ValueError, InvalidOperation) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid expense cursor",
        ) from exc


async def _ensure_category_accessible(
    db: DbSession,
    category_id: int | None,
    user_id: int,
) -> None:
    if category_id is None:
        return

    result = await db.execute(
        select(Category.id).where(
            Category.id == category_id,
            or_(Category.user_id == user_id, Category.user_id.is_(None)),
        )
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

async def get_many(
    db: DbSession,
    user_id: int,
    filters: ExpenseFilters,
) -> tuple[list[Expense], str | None]:
    query = (
        select(Expense)
        .options(joinedload(Expense.category))
        .where(Expense.user_id == user_id)
    )

    # Фильтры
    if filters.category_id:
        query = query.where(Expense.category_id == filters.category_id)
    if filters.date_from:
        query = query.where(Expense.expense_date >= filters.date_from)
    if filters.date_to:
        query = query.where(Expense.expense_date <= filters.date_to)
    if filters.amount_from:
        query = query.where(Expense.amount >= filters.amount_from)
    if filters.amount_to:
        query = query.where(Expense.amount <= filters.amount_to)
    if filters.search:
        query = query.where(Expense.description.ilike(f"%{filters.search}%"))

    # Сортировка
    sort_col = _sort_expression(filters.sort_by)
    order_fn = desc if filters.sort_order == SortOrder.desc else asc
    query = query.order_by(order_fn(sort_col), desc(Expense.id))

    # Cursor
    if filters.cursor:
        cursor_value, cursor_id = _decode_cursor(filters.cursor, filters.sort_by)
        sort_after = sort_col < cursor_value if filters.sort_order == SortOrder.desc else sort_col > cursor_value
        query = query.where(
            or_(
                sort_after,
                and_(sort_col == cursor_value, Expense.id < cursor_id),
            )
        )

    # limit + 1 чтобы понять есть ли ещё записи
    query = query.limit(filters.limit + 1)

    result = await db.execute(query)
    expenses = list(result.scalars().all())

    has_more = len(expenses) > filters.limit
    if has_more:
        expenses = expenses[:-1]

    next_cursor = _encode_cursor(expenses[-1], filters.sort_by) if has_more and expenses else None
    return expenses, next_cursor

async def get_all(db: DbSession, user_id: int) -> list[Expense]:
    result = await db.execute(select(Expense).where(Expense.user_id == user_id))
    return list(result.scalars().all())

async def get_by_id(db: DbSession, expense_id: int, user_id: int) -> Expense | None:
    result = await db.execute(
        select(Expense)
        .options(joinedload(Expense.category))
        .where(
            Expense.id == expense_id,
            Expense.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()

async def create(db: DbSession, data: ExpenseCreate, user_id: int) -> Expense:
    await _ensure_category_accessible(db, data.category_id, user_id)
    expense = Expense(
        **data.model_dump(),
        user_id=user_id,
    )
    db.add(expense)
    await db.flush()
    await db.refresh(expense)
    return expense

async def _get_simple(db: DbSession, expense_id: int, user_id: int) -> Expense | None:
    result = await db.execute(
        select(Expense).where(
            Expense.id == expense_id,
            Expense.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()

async def delete(db: DbSession, expense_id: int, user_id: int) -> bool:
    expense = await _get_simple(db, expense_id, user_id)
    if not expense:
        return False
    await db.delete(expense)
    return True

async def update(db: DbSession, expense_id: int, data: ExpenseUpdate, user_id: int) -> Expense | None:
    expense = await _get_simple(db, expense_id, user_id)
    if not expense:
        return None
    values = data.model_dump(exclude_unset=True)
    if "category_id" in values:
        await _ensure_category_accessible(db, values["category_id"], user_id)
    for key, value in values.items():
        setattr(expense, key, value)
    await db.flush()
    await db.refresh(expense)
    return expense
