from __future__ import annotations
from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base

if TYPE_CHECKING:
    from models.expense import Expense
    from models.category import Category


class User(Base):
    __tablename__ = "users"

    username: Mapped[str] = mapped_column(String, unique=True, nullable=False)

    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)

    hashed_password: Mapped[str] = mapped_column(String, nullable=False)

    categories: Mapped[list[Category]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    expenses: Mapped[list[Expense]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
