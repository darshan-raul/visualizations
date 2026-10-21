"""After the backfill, validate and require currency."""
from alembic import op

revision = "003"
down_revision = "002"


def upgrade():
    op.execute("ALTER TABLE orders ADD CONSTRAINT currency_present CHECK (currency IS NOT NULL) NOT VALID")
    op.execute("ALTER TABLE orders VALIDATE CONSTRAINT currency_present")
    op.alter_column("orders", "currency", nullable=False)
    op.drop_constraint("currency_present", "orders", type_="check")


def downgrade():
    op.alter_column("orders", "currency", nullable=True)
