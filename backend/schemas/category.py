from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator


class CategoryBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str = Field(..., min_length=1, max_length=100)

    @field_validator("name", mode="before")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        return value.strip() if isinstance(value, str) else value


class CategoryCreate(CategoryBase):
    pass


class CategoryRead(CategoryBase):
    id: int
    user_id: Optional[int] = None


class CategoryUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: Optional[str] = Field(None, min_length=1, max_length=100)
