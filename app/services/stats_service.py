"""Aggregated focus statistics in the user's configured timezone."""

from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import settings
from app.models import FocusSession, SessionMode, SessionStatus, Task
from app.schemas import StatsOut, TaskStat, TodayStats, WeekDay

WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]


def timezone_info() -> ZoneInfo:
    try:
        return ZoneInfo(settings.app_timezone)
    except Exception as exc:  # pragma: no cover - misconfiguration
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Некорректная часовая зона сервера",
        ) from exc


def local_today() -> date:
    return datetime.now(timezone.utc).astimezone(timezone_info()).date()


def day_bounds(day: date) -> tuple[datetime, datetime]:
    tz = timezone_info()
    start = datetime.combine(day, time.min, tzinfo=tz).astimezone(timezone.utc)
    end = (datetime.combine(day, time.min, tzinfo=tz) + timedelta(days=1)).astimezone(
        timezone.utc
    )
    return start, end


def _minutes(seconds: int | None) -> int:
    return int((seconds or 0) / 60)


def get_stats(db: Session, user_id: int) -> StatsOut:
    tz = timezone_info()
    today = local_today()
    today_start, today_end = day_bounds(today)
    week_start, _ = day_bounds(today - timedelta(days=6))

    completed_focus = (
        FocusSession.user_id == user_id,
        FocusSession.mode == SessionMode.FOCUS,
        FocusSession.status == SessionStatus.COMPLETED,
    )

    today_sessions = list(
        db.scalars(
            select(FocusSession).where(
                *completed_focus,
                FocusSession.completed_at >= today_start,
                FocusSession.completed_at < today_end,
            )
        ).all()
    )
    today_minutes = _minutes(sum(item.planned_seconds for item in today_sessions))
    completed_tasks = db.scalar(
        select(func.count(Task.id)).where(
            Task.user_id == user_id,
            Task.completed.is_(True),
            Task.completed_at >= today_start,
            Task.completed_at < today_end,
        )
    ) or 0

    week_rows = list(
        db.scalars(
            select(FocusSession).where(
                *completed_focus,
                FocusSession.completed_at >= week_start,
                FocusSession.completed_at < today_end,
            )
        ).all()
    )
    by_day: dict[date, list[FocusSession]] = {}
    for row in week_rows:
        local_day = row.completed_at.astimezone(tz).date()
        by_day.setdefault(local_day, []).append(row)

    week: list[WeekDay] = []
    for offset in range(6, -1, -1):
        day = today - timedelta(days=offset)
        rows = by_day.get(day, [])
        week.append(
            WeekDay(
                date=day,
                label=WEEKDAY_LABELS[day.weekday()],
                sessions=len(rows),
                minutes=_minutes(sum(item.planned_seconds for item in rows)),
            )
        )

    by_task_rows = db.execute(
        select(
            Task.id,
            Task.title,
            func.count(FocusSession.id),
            func.sum(FocusSession.planned_seconds),
        )
        .join(FocusSession, FocusSession.task_id == Task.id)
        .where(
            *completed_focus,
            FocusSession.completed_at >= week_start,
            FocusSession.completed_at < today_end,
        )
        .group_by(Task.id, Task.title)
        .order_by(func.sum(FocusSession.planned_seconds).desc())
        .limit(5)
    ).all()
    by_task = [
        TaskStat(
            task_id=row[0],
            title=row[1],
            sessions=row[2],
            minutes=_minutes(row[3]),
        )
        for row in by_task_rows
    ]

    streak_days = _streak_days(db, user_id, today, tz)

    total_sessions = db.scalar(
        select(func.count(FocusSession.id)).where(*completed_focus)
    ) or 0
    total_seconds = db.scalar(
        select(func.coalesce(func.sum(FocusSession.planned_seconds), 0)).where(
            *completed_focus
        )
    ) or 0

    return StatsOut(
        today=TodayStats(
            sessions=len(today_sessions),
            minutes=today_minutes,
            completed_tasks=int(completed_tasks),
        ),
        streak_days=streak_days,
        week=week,
        by_task=by_task,
        total_sessions=int(total_sessions),
        total_minutes=_minutes(int(total_seconds)),
        server_now=datetime.now(timezone.utc),
    )


def _streak_days(db: Session, user_id: int, today: date, tz: ZoneInfo) -> int:
    since, _ = day_bounds(today - timedelta(days=364))
    rows = db.scalars(
        select(FocusSession.completed_at).where(
            FocusSession.user_id == user_id,
            FocusSession.mode == SessionMode.FOCUS,
            FocusSession.status == SessionStatus.COMPLETED,
            FocusSession.completed_at >= since,
        )
    ).all()
    active_days = {
        stamp.astimezone(tz).date() for stamp in rows if stamp is not None
    }
    cursor = today if today in active_days else today - timedelta(days=1)
    streak = 0
    while cursor in active_days:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def today_focus_count(db: Session, user_id: int) -> int:
    today = local_today()
    start, end = day_bounds(today)
    return int(
        db.scalar(
            select(func.count(FocusSession.id)).where(
                FocusSession.user_id == user_id,
                FocusSession.mode == SessionMode.FOCUS,
                FocusSession.status == SessionStatus.COMPLETED,
                FocusSession.completed_at >= start,
                FocusSession.completed_at < end,
            )
        )
        or 0
    )
