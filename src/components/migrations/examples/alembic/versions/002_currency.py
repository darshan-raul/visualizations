"""Expand first: add a column without changing historical rows."""
from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"


def upgrade():
    op.add_column("orders", sa.Column("currency", sa.Text(), nullable=True))
    # SET DEFAULT affects future inserts, not the rows already stored.
    op.alter_column("orders", "currency", server_default=sa.text("'USD'"))


def downgrade():
    # This loses currency information. It is not a general production recovery plan.
    op.drop_column("orders", "currency")
