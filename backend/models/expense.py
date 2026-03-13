from __future__ import annotations
from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base

if TYPE_CHECKING:
    from models.user import User
    from models.category import Category


class Expense(Base):
    __tablename__ = "expenses"

    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    description: Mapped[str | None] = mapped_column(Text)

    expense_date: Mapped[date] = mapped_column(Date)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))

    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )

    user: Mapped[User] = relationship(back_populates="expenses")

    category: Mapped[Category | None] = relationship(
        back_populates="expenses",
        passive_deletes=True,
    )
