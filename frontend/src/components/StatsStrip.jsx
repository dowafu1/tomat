import Icon from './Icon.jsx'
import { minutesText, plural, sessionsText } from '../lib/format.js'

function StatSkeleton() {
  return (
    <>
      <span className="skeleton" style={{ width: 44, height: 10, display: 'block' }} />
      <span
        className="skeleton"
        style={{ width: 92, height: 18, display: 'block', marginTop: 8 }}
      />
    </>
  )
}

export default function StatsStrip({ stats, loading }) {
  const today = stats?.today
  const sessions = today?.sessions ?? 0
  const minutes = today?.minutes ?? 0
  const completed = today?.completed_tasks ?? 0
  const streak = stats?.streak_days ?? 0

  return (
    <div className="stat-strip" aria-busy={loading || undefined}>
      <div className="stat">
        <div className="stat__icon">
          <Icon name="clock" size={16} />
        </div>
        <div className="stat__body">
          <p className="stat__label">Сегодня</p>
          {loading && !stats ? (
            <StatSkeleton />
          ) : (
            <>
              <p className="stat__value">
                {sessions ? sessionsText(sessions) : '0 сессий'}
              </p>
              <p className="stat__meta">
                {sessions
                  ? `${minutesText(minutes)} сфокусированной работы`
                  : 'Начните первую сессию'}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="stat">
        <div className="stat__icon">
          <Icon name="flame" size={16} />
        </div>
        <div className="stat__body">
          <p className="stat__label">Серия</p>
          {loading && !stats ? (
            <StatSkeleton />
          ) : (
            <>
              <p className="stat__value">
                {streak
                  ? `${streak} ${plural(streak, ['день', 'дня', 'дней'])} подряд`
                  : '0 дней'}
              </p>
              <p className="stat__meta">
                {streak ? 'Продолжайте в том же ритме' : 'Сессия сегодня начнёт серию'}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="stat">
        <div className="stat__icon">
          <Icon name="checkCircle" size={16} />
        </div>
        <div className="stat__body">
          <p className="stat__label">Сделано</p>
          {loading && !stats ? (
            <StatSkeleton />
          ) : (
            <>
              <p className="stat__value">
                {completed
                  ? `${completed} ${plural(completed, ['задача', 'задачи', 'задач'])}`
                  : '0 задач'}
              </p>
              <p className="stat__meta">
                {completed ? 'Хороший темп' : 'Отметьте выполненное в списке'}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
