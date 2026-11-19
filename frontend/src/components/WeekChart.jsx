export default function WeekChart({ week = [] }) {
  const max = Math.max(1, ...week.map((day) => day.minutes))
  const total = week.reduce((sum, day) => sum + day.minutes, 0)
  const todayIndex = week.length - 1

  return (
    <div
      className={`week-chart ${total === 0 ? 'week-chart--empty' : ''}`.trim()}
      role="img"
      aria-label={`Фокус за семь дней: ${total} минут`}
    >
      {week.map((day, index) => {
        const height = day.minutes ? Math.max(6, Math.round((day.minutes / max) * 100)) : 0
        return (
          <div
            key={day.date}
            className={`week-bar ${index === todayIndex ? 'is-today' : ''} ${
              day.minutes ? '' : 'is-empty'
            }`.trim()}
            title={`${day.label}: ${day.minutes} мин, ${day.sessions} сессий`}
          >
            <span className="week-bar__value">
              {day.minutes ? day.minutes : '—'}
            </span>
            <div className="week-bar__track">
              <div
                className="week-bar__fill"
                style={{ height: `${height}%` }}
                aria-hidden="true"
              />
            </div>
            <span className="week-bar__label">{day.label}</span>
          </div>
        )
      })}
    </div>
  )
}
