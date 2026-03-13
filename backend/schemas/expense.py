from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from schemas.category import CategoryRead
from enum import Enum

class ExpenseBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    amount: Decimal = Field(..., gt=0, max_digits=10, decimal_places=2)
    description: Optional[str] = Field(None, max_length=500)
    expense_date: Optional[date] = Field(default_factory=date.today)
    category_id: Optional[int] = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseRead(ExpenseBase):
    id: int
    created_at: datetime


class ExpenseUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    amount: Optional[Decimal] = Field(None, gt=0, max_digits=10, decimal_places=2)
    description: Optional[str] = Field(None, max_length=500)
    expense_date: Optional[date] = None
    category_id: Optional[int] = None

class ExpenseDetail(ExpenseRead):
    updated_at : datetime
    category: CategoryRead


class ExpenseSortField(str, Enum):
    date = "expense_date"
    amount = "amount"
    category = "category_id"

class SortOrder(str, Enum):
    asc = "asc"
    desc = "desc"

class ExpenseFilters(BaseModel):

    category_id: Optional[int] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    amount_from: Optional[Decimal] = Field(None, gt=0)
    amount_to: Optional[Decimal] = Field(None, gt=0)
    search: Optional[str] = Field(None, max_length=100)

    cursor: Optional[int] = None
    limit: int = Field(20, ge=1, le=100)

    sort_by: ExpenseSortField = ExpenseSortField.date
    sort_order: SortOrder = SortOrder.desc

class ExpenseListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    data: list[ExpenseRead]
    next_cursor: Optional[int]
    has_more: bool