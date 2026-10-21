"""The starting schema: all orders are understood to be USD."""
from alembic import op
import sqlalchemy as sa

revision = "001"
down_revision = None


def upgrade():
    op.create_table(
        "orders",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("total_cents", sa.Integer(), nullable=False),
    )


def downgrade():
    op.drop_table("orders")
