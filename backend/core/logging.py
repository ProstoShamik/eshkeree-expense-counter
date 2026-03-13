import logging
from logging.handlers import RotatingFileHandler

from .config import settings

file_handler = RotatingFileHandler(
    settings.logging.file, maxBytes=5_000_000, backupCount=5
)
file_handler.setFormatter(logging.Formatter(settings.logging.format))

logging.basicConfig(level=settings.logging.level, handlers=[file_handler])

logger = logging.getLogger("app")
