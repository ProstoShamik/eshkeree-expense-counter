from __future__ import annotations
from core.database import DbSession
from sqlalchemy import select, asc, desc
from sqlalchemy.orm import joinedload

from models.expense import Expense
from schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseFilters, SortOrder 

async def get_many(
    db: DbSession,
    user_id: int,
    filters: ExpenseFilters,
) -> tuple[list[Expense], bool]:
    query = select(Expense).where(Expense.user_id == user_id)

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

    # Cursor
    if filters.cursor:
        query = query.where(Expense.id < filters.cursor)

    # Сортировка
    sort_col = getattr(Expense, filters.sort_by.value)
    order_fn = desc if filters.sort_order == SortOrder.desc else asc
    query = query.order_by(order_fn(sort_col), desc(Expense.id))

    # limit + 1 чтобы понять есть ли ещё записи
    query = query.limit(filters.limit + 1)

    result = await db.execute(query)
    expenses = list(result.scalars().all())

    has_more = len(expenses) > filters.limit
    if has_more:
        expenses = expenses[:-1]

    return expenses, has_more

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
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(expense, key, value)
    await db.flush()
    await db.refresh(expense)
    return expense
