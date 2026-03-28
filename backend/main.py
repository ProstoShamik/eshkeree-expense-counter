from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.database import init_db, close_db
from core.logging import logger
from routers import auth, categories, expenses


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application is starting...")
    await init_db()
    yield
    await close_db()
    logger.info("Application has stopped.")


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(expenses.router)
