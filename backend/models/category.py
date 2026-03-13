from __future__ import annotations
from typing import TYPE_CHECKING

from sqlalchemy import String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base

if TYPE_CHECKING:
    from models.user import User
    from models.expense import Expense


class Category(Base):
    __tablename__ = "categories"

    __table_args__ = (UniqueConstraint("name", "user_id"),)

    name: Mapped[str] = mapped_column(String, nullable=False)

    # NULL = global caterory
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    user: Mapped[User | None] = relationship(back_populates="categories")

    expenses: Mapped[list[Expense]] = relationship(back_populates="category")
