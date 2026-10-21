import sqlalchemy as sa

# The desired final shape. The reviewed rollout reaches it in stages.
metadata = sa.MetaData()
orders = sa.Table(
    "orders", metadata,
    sa.Column("id", sa.Integer(), primary_key=True),
    sa.Column("total_cents", sa.Integer(), nullable=False),
    sa.Column("currency", sa.Text(), nullable=False, server_default=sa.text("'USD'")),
)
