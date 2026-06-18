from __future__ import annotations

from collections.abc import AsyncGenerator
from datetime import datetime
from typing import Annotated

from fastapi import Depends
from sqlalchemy import DateTime, func, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from .config import settings
from core.logging import logger


engine = create_async_engine(settings.database.url, **settings.database.engine_kwargs())

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, **settings.database.session_kwargs()
)


class Base(DeclarativeBase):
    __abstract__ = True

    id: Mapped[int] = mapped_column(primary_key=True)

    __repr_attrs__: tuple[str, ...] = ()
    __repr_max_length__: int = 15

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    @property
    def _id_str(self) -> str | None:
        return str(self.id) if getattr(self, "id", None) is not None else None

    @property
    def _repr_attrs_str(self) -> str:
        if not self.__repr_attrs__:
            return ""

        max_length = self.__repr_max_length__
        values: list[str] = []
        single_attr = len(self.__repr_attrs__) == 1

        for key in self.__repr_attrs__:
            if not hasattr(self, key):
                raise KeyError(
                    f"Invalid attribute '{key}' in __repr_attrs__ of class {self.__class__.__name__}"
                )

            val = getattr(self, key)
            is_str = isinstance(val, str)

            val_str = str(val)
            if len(val_str) > max_length:
                val_str = val_str[:max_length] + "..."

            if is_str:
                val_str = f"'{val_str}'"

            values.append(val_str if single_attr else f"{key}:{val_str}")

        return " ".join(values)

    def __repr__(self) -> str:
        id_part = f"#{self._id_str}" if self._id_str else ""
        attrs_part = f" {self._repr_attrs_str}" if self._repr_attrs_str else ""
        return f"<{self.__class__.__name__} {id_part}{attrs_part}>"


async def get_db() -> AsyncGenerator[AsyncSession]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


DbSession = Annotated[AsyncSession, Depends(get_db)]


async def create_tables() -> None:
    logger.info("Creating tables in the database...")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    logger.info("Tables created successfully")


async def check_database_connection() -> bool:
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"Error connecting to the database: {e}")
        return False


def _import_models() -> None:
    from models import category, expense, user  # noqa: F401


async def init_db() -> None:
    logger.info("Initializing database...")

    try:
        if not await check_database_connection():
            raise ConnectionError("Unable to connect to the database")

        _import_models()

        logger.info("Database connection established")
        tables = list(Base.metadata.tables.keys())
        logger.info(f"Registered {len(tables)} tables: {', '.join(tables)}")

        if settings.database.auto_create_tables:
            await create_tables()
        else:
            logger.info("Automatic table creation is disabled")

        logger.info("Database initialized successfully")

    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise


async def close_db() -> None:
    logger.info("Closing database connections...")

    try:
        await engine.dispose()
        logger.info("Database connections closed")

    except Exception as e:
        logger.error(f"Error closing database connections: {e}")
        raise
