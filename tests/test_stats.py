"""Statistics aggregation tests."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.models import FocusSession, SessionMode, SessionStatus


def test_streak_and_week_buckets(client, auth, db):
    user_id = auth["json"]["user"]["id"]
    now = datetime.now(timezone.utc)
    rows = []
    for days_ago in (0, 1, 2):
        rows.append(
            FocusSession(
                user_id=user_id,
                mode=SessionMode.FOCUS,
                status=SessionStatus.COMPLETED,
                planned_seconds=1500,
                remaining_seconds=0,
                started_at=now - timedelta(days=days_ago, minutes=30),
                completed_at=now - timedelta(days=days_ago, minutes=5),
            )
        )
    # A cancelled session must not affect the streak.
    rows.append(
        FocusSession(
            user_id=user_id,
            mode=SessionMode.FOCUS,
            status=SessionStatus.CANCELLED,
            planned_seconds=1500,
            remaining_seconds=100,
            started_at=now - timedelta(days=5),
            completed_at=now - timedelta(days=5),
        )
    )
    db.add_all(rows)
    db.commit()

    stats = client.get("/api/stats", headers=auth["headers"]).json()
    assert stats["streak_days"] == 3
    assert stats["today"]["sessions"] == 1
    assert len(stats["week"]) == 7
    assert stats["week"][-1]["sessions"] == 1
    assert stats["week"][-2]["sessions"] == 1
    assert sum(day["sessions"] for day in stats["week"]) == 3
    assert stats["total_sessions"] == 3
    assert stats["total_minutes"] == 75
