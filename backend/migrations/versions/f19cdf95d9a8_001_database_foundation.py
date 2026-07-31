"""001_database_foundation

Revision ID: f19cdf95d9a8
Revises: 
Create Date: 2026-07-24 18:41:31.953593

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f19cdf95d9a8'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the edupulse schema."""
    op.execute("CREATE SCHEMA IF NOT EXISTS edupulse")


def downgrade() -> None:
    """Drop the edupulse schema."""
    op.execute("DROP SCHEMA IF EXISTS edupulse CASCADE")
