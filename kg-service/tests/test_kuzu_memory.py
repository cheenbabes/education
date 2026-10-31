"""Guards against kg-service's memory regressing back to ~1.5 GB.

Two things drove it: kuzu.Database() sizing its buffer pool at 80% of the
host's RAM, and /graph-export opening a fresh Database (and buffer pool) on
every request.
"""

import asyncio
import shutil

import kuzu
import pytest

from api import graph_export as graph_export_api
from config import settings
from kg import query


@pytest.fixture
def database_opens(monkeypatch, tmp_path):
    """Point kg-service at a scratch copy of the db and record every open.

    Opening read-write rewrites the db file, so tests must not touch the
    tracked copy.
    """
    db_copy = tmp_path / "db"
    shutil.copy(settings.kuzu_db_path, db_copy)
    monkeypatch.setattr(settings, "kuzu_db_path", db_copy)
    monkeypatch.setattr(query, "_db_instance", None)

    opens = []
    real_database = kuzu.Database

    def recording_database(*args, **kwargs):
        opens.append(kwargs)
        return real_database(*args, **kwargs)

    monkeypatch.setattr(kuzu, "Database", recording_database)
    yield opens
    monkeypatch.setattr(query, "_db_instance", None)


def test_graph_export_reuses_the_shared_database(database_opens):
    for _ in range(5):
        result = asyncio.run(graph_export_api.graph_export())

    assert result["philosophies"]
    assert len(database_opens) == 1


def test_database_buffer_pool_is_capped(database_opens):
    query._get_connection()

    assert len(database_opens) == 1
    buffer_pool_size = database_opens[0].get("buffer_pool_size")
    assert buffer_pool_size == settings.kuzu_buffer_pool_mb * 1024 * 1024
    assert 0 < buffer_pool_size <= 256 * 1024 * 1024
