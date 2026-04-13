"""Database connections: async SQLAlchemy (PostgreSQL) + Motor (MongoDB)."""

import ssl

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings

# ── PostgreSQL (Neon / local) ───────────────────────────────
connect_args = {}
db_url = settings.ASYNC_DATABASE_URL

# Enable SSL for cloud-hosted Postgres (Neon, Supabase, etc.)
if "neon.tech" in db_url or "supabase" in db_url or "sslmode=require" in settings.DATABASE_URL:
    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = ssl.CERT_NONE
    connect_args["ssl"] = ssl_ctx

engine = create_async_engine(
    db_url,
    echo=settings.DEBUG,
    connect_args=connect_args,
    pool_size=5,
    max_overflow=10,
)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# ── MongoDB Atlas / local ──────────────────────────────────
mongo_client: AsyncIOMotorClient = None
mongo_db = None


async def init_mongo():
    global mongo_client, mongo_db
    mongo_client = AsyncIOMotorClient(settings.MONGO_URL)
    mongo_db = mongo_client[settings.MONGO_DB]


async def close_mongo():
    global mongo_client
    if mongo_client:
        mongo_client.close()


def get_mongo_db():
    return mongo_db
