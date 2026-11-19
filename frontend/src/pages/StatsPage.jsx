import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import Button from '../components/Button.jsx'
import { EmptyState, ErrorState } from '../components/EmptyState.jsx'
import Icon from '../components/Icon.jsx'
import WeekChart from '../components/WeekChart.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import useStats from '../hooks/useStats.js'
import useWebSocket from '../hooks/useWebSocket.js'
import {
  formatDateTime,
  humanMinutes,
  minutesText,
  plural,
} from '../lib/format.js'

const MODE_LABELS = {
  focus: 'Фокус',
  short_break: 'Короткий перерыв',
  long_break: 'Длинный перерыв',
}

function Metric({ label, value, meta, icon }) {
  return (
    <div className="metric-card">
      <div className="metric-card__top">
        <span className="metric-card__label">{label}</span>
        <Icon name={icon} size={16} />
      </div>
      <p className="metric-card__value">{value}</p>
      <p className="metric-card__meta">{meta}</p>
    </div>
  )
}

export default function StatsPage() {
  const { token } = useAuth()
  const { stats, loading, error, refresh, reload } = useStats(token)
  const [sessions, setSessions] = useState(null)
  const [historyError, setHistoryError] = useState('')
  const [showAll, setShowAll] = useState(false)

  const loadSessions = useCallback(async () => {
    if (!token) return
    try {
      const data = await api('/sessions?limit=50&days=30', { token })
      setSessions(data)
      setHistoryError('')
    } catch (requestError) {
      if (requestError.status !== 401) setHistoryError(requestError.message)
    }
  }, [token])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  useEffect(() => {
    document.title = 'Статистика — Фокус'
  }, [])

  useWebSocket({
    token,
    onEvent: (event) => {
      if (event.type === 'session_changed') {
        refresh()
        loadSessions()
      }
    },
  })

  const week = stats?.week ?? []
  const weekMinutes = week.reduce((sum, day) => sum + day.minutes, 0)
  const weekSessions = week.reduce((sum, day) => sum + day.sessions, 0)
  const hasWeekData = weekSessions > 0
  const visibleSessions = sessions
    ? showAll
      ? sessions
      : sessions.slice(0, 12)
    : []

  if (error && !stats) {
    return (
      <div className="panel">
        <ErrorState
          title="Статистика недоступна"
          text={error}
          onRetry={reload}
        />
      </div>
    )
  }

  return (
    <>
      <div className="page-head">
        <div className="page-head__main">
          <p className="eyebrow">Статистика</p>
          <h1>Ваш ритм за неделю.</h1>
          <p className="page-head__text">
            Только завершённые фокус-сессии. Паузы и отмены не искажают картину.
          </p>
        </div>
        <div className="page-head__actions">
          <Link className="btn btn--secondary" to="/">
            <Icon name="grid" size={16} />
            К задачам
          </Link>
        </div>
      </div>

      <div className="stats-metrics">
        <Metric
          label="Фокус за неделю"
          value={loading && !stats ? '…' : humanMinutes(weekMinutes)}
          meta={`${weekSessions} ${plural(weekSessions, [
            'сессия',
            'сессии',
            'сессий',
          ])} за 7 дней`}
          icon="clock"
        />
        <Metric
          label="Серия"
          value={
            loading && !stats
              ? '…'
              : `${stats?.streak_days ?? 0} ${plural(stats?.streak_days ?? 0, [
                  'день',
                  'дня',
                  'дней',
                ])}`
          }
          meta={
            stats?.streak_days
              ? 'Подряд с фокус-сессиями'
              : 'Начните серию сегодня'
          }
          icon="flame"
        />
        <Metric
          label="Сегодня"
          value={loading && !stats ? '…' : minutesText(stats?.today.minutes ?? 0)}
          meta={`${stats?.today.sessions ?? 0} ${plural(
            stats?.today.sessions ?? 0,
            ['сессия', 'сессии', 'сессий']
          )} · ${stats?.today.completed_tasks ?? 0} ${plural(
            stats?.today.completed_tasks ?? 0,
            ['задача', 'задачи', 'задач']
          )} закрыто`}
          icon="target"
        />
        <Metric
          label="Всего в фокусе"
          value={loading && !stats ? '…' : humanMinutes(stats?.total_minutes ?? 0)}
          meta={`${stats?.total_sessions ?? 0} ${plural(
            stats?.total_sessions ?? 0,
            ['сессия', 'сессии', 'сессий']
          )} за всё время`}
          icon="chart"
        />
      </div>

      <section className="panel chart-panel" aria-labelledby="week-heading">
        <div className="chart-panel__head">
          <div>
            <h2 className="panel__title" id="week-heading">
              Неделя
            </h2>
            <p className="page-head__text" style={{ marginTop: 4 }}>
              Минуты фокуса по дням. Сегодняшний день выделен.
            </p>
          </div>
          <span className="chip chip--accent">
            <Icon name="clock" size={13} />
            {minutesText(weekMinutes)}
          </span>
        </div>
        {loading && !stats ? (
          <div
            className="skeleton"
            style={{ height: 190, marginTop: 24, borderRadius: 12 }}
            aria-label="Загрузка графика"
          />
        ) : (
          <>
            <WeekChart week={week} />
            {!hasWeekData ? (
              <p className="field__hint" style={{ textAlign: 'center', marginTop: 10 }}>
                Пока нет завершённых сессий. Запустите таймер на главной — данные
                появятся здесь.
              </p>
            ) : null}
          </>
        )}
      </section>

      <div className="stats-columns">
        <section className="panel" aria-labelledby="by-task-heading">
          <div className="panel__head">
            <h2 className="panel__title" id="by-task-heading">
              По задачам
            </h2>
            <span className="badge">7 дней</span>
          </div>
          <div className="panel__body">
            {stats?.by_task?.length ? (
              <div className="by-task-list">
                {stats.by_task.map((item) => {
                  const max = Math.max(
                    ...stats.by_task.map((entry) => entry.minutes),
                    1
                  )
                  return (
                    <div className="by-task-item" key={item.task_id}>
                      <div className="by-task-item__top">
                        <span className="by-task-item__title">{item.title}</span>
                        <span className="by-task-item__value">
                          {minutesText(item.minutes)}
                        </span>
                      </div>
                      <div className="progress">
                        <div
                          className="progress__bar"
                          style={{
                            width: `${Math.max(4, (item.minutes / max) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <EmptyState
                icon="list"
                title="Нет данных по задачам"
                text="Фокус-сессии, привязанные к задачам, появятся здесь."
              />
            )}
          </div>
        </section>

        <section className="panel history-panel" aria-labelledby="history-heading">
          <div className="panel__head">
            <h2 className="panel__title" id="history-heading">
              История сессий
            </h2>
            <span className="panel__count">{sessions?.length ?? 0}</span>
          </div>
          <div className="panel__body" style={{ paddingBottom: 0 }}>
            <p className="field__hint">
              Последние 30 дней. Отменённые сессии отмечены отдельно.
            </p>
          </div>

          {historyError && !sessions ? (
            <ErrorState
              title="История недоступна"
              text={historyError}
              onRetry={loadSessions}
            />
          ) : sessions === null ? (
            <div style={{ padding: 20 }}>
              <div className="skeleton" style={{ height: 42, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 42, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 42 }} />
            </div>
          ) : sessions.length === 0 ? (
            <EmptyState
              icon="clock"
              title="Пока нет сессий"
              text="Завершите первую фокус-сессию — она появится здесь."
            >
              <Link className="btn btn--primary btn--sm" to="/">
                Начать фокус
              </Link>
            </EmptyState>
          ) : (
            <>
              <div className="history-table-desktop">
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Когда</th>
                      <th>Режим</th>
                      <th>Задача</th>
                      <th>Длительность</th>
                      <th>Итог</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleSessions.map((session) => (
                      <tr key={session.id}>
                        <td className="table__num">
                          {formatDateTime(session.started_at)}
                        </td>
                        <td>
                          <span
                            className={`mode-tag ${
                              session.mode !== 'focus' ? 'mode-tag--break' : ''
                            }`.trim()}
                          >
                            <span className="mode-tag__dot" />
                            {MODE_LABELS[session.mode] || session.mode}
                          </span>
                        </td>
                        <td>{session.task_title || 'Без задачи'}</td>
                        <td className="table__num">
                          {Math.round(session.planned_seconds / 60)} мин
                        </td>
                        <td>
                          {session.status === 'completed' ? (
                            <span className="badge badge--accent">Завершена</span>
                          ) : (
                            <span className="badge">Прервана</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </div>

              <div className="history-cards">
                {visibleSessions.map((session) => (
                  <article className="history-card" key={session.id}>
                    <div className="history-card__top">
                      <span className="history-card__date">
                        {formatDateTime(session.started_at)}
                      </span>
                      {session.status === 'completed' ? (
                        <span className="badge badge--accent">Завершена</span>
                      ) : (
                        <span className="badge">Прервана</span>
                      )}
                    </div>
                    <p className="history-card__task">
                      {session.task_title || 'Без задачи'}
                    </p>
                    <div className="history-card__meta">
                      <span
                        className={`mode-tag ${
                          session.mode !== 'focus' ? 'mode-tag--break' : ''
                        }`.trim()}
                      >
                        <span className="mode-tag__dot" />
                        {MODE_LABELS[session.mode] || session.mode}
                      </span>
                      <span className="task-meta__sep" aria-hidden="true" />
                      <span>{Math.round(session.planned_seconds / 60)} мин</span>
                    </div>
                  </article>
                ))}
              </div>

              {sessions.length > 12 ? (
                <div style={{ padding: 16, textAlign: 'center' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAll((value) => !value)}
                  >
                    {showAll
                      ? 'Показать меньше'
                      : `Показать все (${sessions.length})`}
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>
    </>
  )
}
