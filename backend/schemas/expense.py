from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, model_validator
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
    category: Optional[CategoryRead] = None


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

    cursor: Optional[str] = None
    limit: int = Field(20, ge=1, le=100)

    sort_by: ExpenseSortField = ExpenseSortField.date
    sort_order: SortOrder = SortOrder.desc

    @model_validator(mode="after")
    def validate_ranges(self) -> "ExpenseFilters":
        if self.date_from and self.date_to and self.date_from > self.date_to:
            raise ValueError("date_from must be less than or equal to date_to")
        if self.amount_from and self.amount_to and self.amount_from > self.amount_to:
            raise ValueError("amount_from must be less than or equal to amount_to")
        return self

class ExpenseListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    data: list[ExpenseRead]
    next_cursor: Optional[str]
    has_more: bool
