#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["alembic", "sqlalchemy", "psycopg[binary]"]
# ///
"""Verify the published revisions and SQL against disposable PostgreSQL 18.

Run: uv run scripts/verify-database-migrations.py
Requires Docker and Go. Creates its own loopback-only database, temp Go module,
and temp Alembic authoring copy; removes all of them on exit. No real database.
"""
import importlib.metadata
from concurrent.futures import ThreadPoolExecutor
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import time

from alembic import command
from alembic.config import Config
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
import psycopg
import sqlalchemy as sa

ROOT = Path(__file__).resolve().parents[1]
EXAMPLES = ROOT / "src/components/migrations/examples"
NAME = f"infra-illustrated-migrations-{os.getpid()}"
CHECKS = []
sys.dont_write_bytecode = True


def check(label, condition):
    assert condition, label
    CHECKS.append(label)
    print(f"PASS: {label}", flush=True)


def sql_error(connection, sql, code):
    try:
        connection.execute(sql)
    except psycopg.Error as error:
        assert error.sqlstate == code, (error.sqlstate, code)
    else:
        raise AssertionError(f"Expected SQLSTATE {code}")


subprocess.run(["docker", "run", "--rm", "-d", "--name", NAME,
                "-e", "POSTGRES_PASSWORD=illustrated", "-e", "POSTGRES_DB=lesson",
                "-p", "127.0.0.1::5432", "postgres:18-alpine"], check=True,
               stdout=subprocess.DEVNULL)
try:
    binding = subprocess.check_output(["docker", "port", NAME, "5432/tcp"], text=True).strip()
    port = binding.rsplit(":", 1)[1]
    dsn = f"postgresql://postgres:illustrated@127.0.0.1:{port}/lesson"
    os.environ["DATABASE_URL"] = dsn.replace("postgresql://", "postgresql+psycopg://")
    for attempt in range(60):
        try:
            db = psycopg.connect(dsn, autocommit=True)
            break
        except psycopg.OperationalError:
            if attempt == 59:
                raise
            time.sleep(1)
    cfg = Config(str(EXAMPLES / "alembic.ini"))
    command.upgrade(cfg, "001")
    db.execute("INSERT INTO orders (id, total_cents) VALUES (1042,6200),(1043,1800),(1044,4500),(1045,3200),(1046,9100),(1047,2700)")
    check("old application reads its original columns", db.execute("SELECT id,total_cents FROM orders ORDER BY id LIMIT 1").fetchone() == (1042, 6200))
    sql_error(db, "SELECT currency FROM orders", "42703")
    check("new application first fails on the absent column", True)

    # Actually generate a candidate from the final model in an isolated authoring copy.
    with tempfile.TemporaryDirectory(prefix="migration-author-") as directory:
        author = Path(directory) / "example"
        shutil.copytree(EXAMPLES, author)
        for path in (author / "alembic/versions").glob("00[23]_*.py"):
            path.unlink()
        author_cfg = Config(str(author / "alembic.ini"))
        revision = command.revision(author_cfg, message="candidate currency", autogenerate=True)
        candidate = Path(revision.path).read_text()
        check("Alembic autogenerate produces a candidate for review", "add_column" in candidate and "currency" in candidate)

    command.upgrade(cfg, "002")
    check("adding a nullable column then setting a default leaves old rows NULL", db.execute("SELECT count(*) FROM orders WHERE currency IS NULL").fetchone()[0] == 6)
    db.execute("INSERT INTO orders (id,total_cents) VALUES (1048,7500)")
    check("old writer omitting currency gets the database default", db.execute("SELECT currency FROM orders WHERE id=1048").fetchone()[0] == "USD")
    check("compatible reader falls back for historical rows", db.execute("SELECT COALESCE(currency,'USD') FROM orders WHERE id=1042").fetchone()[0] == "USD")

    batch = (EXAMPLES / "backfill.sql").read_text()
    with db.transaction():
        first = db.execute(batch).fetchall()
    check("published batch updates and commits only two rows", sorted(first) == [(1042,), (1043,)])
    try:
        with db.transaction():
            db.execute(batch)
            raise RuntimeError("interrupt before commit")
    except RuntimeError:
        pass
    check("interrupted batch rolls back without losing previous commits", db.execute("SELECT id,currency FROM orders WHERE id IN (1042,1044,1045) ORDER BY id").fetchall() == [(1042,"USD"),(1044,None),(1045,None)])

    try:
        command.upgrade(cfg, "003")
    except sa.exc.IntegrityError:
        pass
    else:
        raise AssertionError("Constraint must reject unfilled data")
    check("tightening before backfill fails and keeps revision 002", db.execute("SELECT version_num FROM alembic_version").fetchone()[0] == "002")
    check("failed transactional migration does not leave its check constraint", db.execute("SELECT count(*) FROM pg_constraint WHERE conname='currency_present'").fetchone()[0] == 0)

    db.execute("INSERT INTO orders VALUES (1049,9000,'EUR')")
    with db.transaction():
        db.execute(batch)
    with db.transaction():
        db.execute(batch)
    check("resumed batches finish remaining rows", db.execute("SELECT count(*) FROM orders WHERE currency IS NULL").fetchone()[0] == 0)
    check("backfill never overwrites populated non-USD currency", db.execute("SELECT currency FROM orders WHERE id=1049").fetchone()[0] == "EUR")
    command.upgrade(cfg, "003")
    sql_error(db, "INSERT INTO orders VALUES (1050,1000,NULL)", "23502")
    db.execute("INSERT INTO orders (id,total_cents) VALUES (1051,1000)")
    check("NOT NULL rejects explicit NULL but still allows defaulted inserts", db.execute("SELECT currency FROM orders WHERE id=1051").fetchone()[0] == "USD")

    # Independent connections reproduce the illustrated DDL wait and timeout.
    blocker = psycopg.connect(dsn)
    blocker.execute("SELECT * FROM orders")
    migration = psycopg.connect(dsn, autocommit=True)
    migration.execute("SET lock_timeout = '200ms'")
    sql_error(migration, "ALTER TABLE orders ADD COLUMN note text", "55P03")
    check("DDL times out behind an open SELECT transaction", blocker.execute("SELECT 1").fetchone()[0] == 1)
    migration.execute("SET lock_timeout = '5s'")
    with ThreadPoolExecutor(max_workers=1) as workers:
        pending = workers.submit(migration.execute, "ALTER TABLE orders ADD COLUMN note text")
        for _ in range(40):
            wait = db.execute("SELECT wait_event_type FROM pg_stat_activity WHERE pid=%s", (migration.info.backend_pid,)).fetchone()
            if wait and wait[0] == "Lock":
                break
            time.sleep(.05)
        else:
            raise AssertionError("DDL did not enter the lock queue")
        later = psycopg.connect(dsn, autocommit=True)
        later.execute("SET lock_timeout = '200ms'")
        sql_error(later, "SELECT id FROM orders LIMIT 1", "55P03")
        later.close()
        check("a later SELECT waits behind the queued conflicting DDL", True)
        blocker.commit()
        pending.result(timeout=3)
    migration.execute("ALTER TABLE orders DROP COLUMN note")
    blocker.close()
    migration.close()
    check("DDL succeeds after the blocker ends", True)
    try:
        with db.transaction():
            db.execute("CREATE INDEX CONCURRENTLY orders_currency_idx ON orders(currency)")
    except psycopg.Error as error:
        check("concurrent index build rejects a transaction block", error.sqlstate == "25001")
    else:
        raise AssertionError("Expected concurrent index transaction error")
    db.execute("CREATE INDEX CONCURRENTLY orders_currency_idx ON orders(currency)")
    db.execute("DROP INDEX orders_currency_idx")

    with tempfile.TemporaryDirectory(prefix="migration-go-") as directory:
        directory = Path(directory)
        shutil.copy(EXAMPLES / "go/main.go", directory / "main.go")
        subprocess.run(["go", "mod", "init", "example.com/infra-illustrated/migration-check"], cwd=directory, check=True, capture_output=True)
        subprocess.run(["go", "get", "github.com/jackc/pgx/v5"], cwd=directory, check=True, capture_output=True)
        output = subprocess.check_output(["go", "run", "."], cwd=directory, env={**os.environ, "DATABASE_URL": dsn}, text=True)
        check("published Go pgx example reads the Alembic-managed database", output.strip() == "Order 1042: 6200 cents USD")
        package = subprocess.check_output(["go", "list", "-m", "github.com/jackc/pgx/v5"], cwd=directory, text=True).strip()
        print(package, flush=True)

    command.stamp(cfg, "001")
    check("stamp changes the marker without undoing currency", db.execute("SELECT currency FROM orders WHERE id=1049").fetchone()[0] == "EUR" and db.execute("SELECT version_num FROM alembic_version").fetchone()[0] == "001")
    command.stamp(cfg, "003")
    command.downgrade(cfg, "001")
    check("destructive downgrade removes currency while keeping order rows", db.execute("SELECT count(*) FROM orders").fetchone()[0] == 9 and db.execute("SELECT count(*) FROM information_schema.columns WHERE table_name='orders' AND column_name='currency'").fetchone()[0] == 0)
    print(f"PASS: {len(CHECKS)} database/package checks. PostgreSQL {db.execute('SHOW server_version').fetchone()[0]}; Alembic {importlib.metadata.version('alembic')}; SQLAlchemy {sa.__version__}; psycopg {psycopg.__version__}.", flush=True)
    db.close()
finally:
    subprocess.run(["docker", "rm", "-f", NAME], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
