import os

from alembic import context
from sqlalchemy import create_engine, pool
from models import metadata

# The release job supplies credentials through its environment.
engine = create_engine(os.environ["DATABASE_URL"], poolclass=pool.NullPool)
with engine.connect() as connection:
    context.configure(connection=connection, target_metadata=metadata)
    with context.begin_transaction():
        context.run_migrations()
