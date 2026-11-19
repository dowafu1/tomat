"""Statistics contracts."""

from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel


class TodayStats(BaseModel):
    sessions: int
    minutes: int
    completed_tasks: int


class WeekDay(BaseModel):
    date: date
    label: str
    sessions: int
    minutes: int


class TaskStat(BaseModel):
    task_id: int
    title: str
    sessions: int
    minutes: int


class StatsOut(BaseModel):
    today: TodayStats
    streak_days: int
    week: list[WeekDay]
    by_task: list[TaskStat]
    total_sessions: int
    total_minutes: int
    server_now: datetime
