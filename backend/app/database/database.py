from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

engine = None
async_session = None


def get_engine():
    global engine
    if engine is None:
        engine = create_async_engine(settings.database_url, echo=settings.debug)
    return engine


def get_async_session():
    global async_session
    if async_session is None:
        async_session = async_sessionmaker(get_engine(), class_=AsyncSession, expire_on_commit=False)
    return async_session


class Base(DeclarativeBase):
    pass


async def get_db():
    session = get_async_session()
    async with session() as s:
        try:
            yield s
        finally:
            await s.close()


async def create_tables():
    async with get_engine().begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
