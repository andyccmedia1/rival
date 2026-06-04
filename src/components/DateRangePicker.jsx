import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWithinInterval, isBefore, addMonths, subMonths, isToday } from 'date-fns'

export default function DateRangePicker({ startDate, endDate, onChange }) {
  const [viewMonth, setViewMonth] = useState(startDate || new Date())
  const [selecting, setSelecting] = useState(null) // 'start' | 'end'
  const [hoverDate, setHoverDate] = useState(null)

  const monthStart = startOfMonth(viewMonth)
  const monthEnd = endOfMonth(viewMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const firstDayOfWeek = monthStart.getDay()
  const blanks = Array(firstDayOfWeek).fill(null)

  const handleDayClick = (day) => {
    const today = new Date()
    today.setHours(0,0,0,0)
    if (isBefore(day, today)) return

    if (!startDate || (startDate && endDate)) {
      onChange({ start: day, end: null })
      setSelecting('end')
    } else if (selecting === 'end' || !endDate) {
      if (isBefore(day, startDate)) {
        onChange({ start: day, end: null })
        setSelecting('end')
      } else {
        onChange({ start: startDate, end: day })
        setSelecting(null)
      }
    }
  }

  const isInRange = (day) => {
    if (!startDate) return false
    const rangeEnd = hoverDate && !endDate ? hoverDate : endDate
    if (!rangeEnd) return false
    return isWithinInterval(day, {
      start: isBefore(startDate, rangeEnd) ? startDate : rangeEnd,
      end: isBefore(startDate, rangeEnd) ? rangeEnd : startDate,
    })
  }

  const today = new Date()
  today.setHours(0,0,0,0)

  const diffDays = startDate && endDate
    ? Math.round((endDate - startDate) / 86400000)
    : null

  return (
    <div>
      <div style={{
        background: 'var(--glass)', border: '1px solid var(--glass-border)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 'var(--radius)', overflow: 'hidden',
        boxShadow: 'var(--shadow-soft)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderBottom: '1px solid var(--glass-border)',
          background: 'rgba(255,255,255,0.08)',
        }}>
          <button onClick={() => setViewMonth(m => subMonths(m, 1))} style={{
            background: 'none', border: 'none', fontSize: 20, cursor: 'pointer',
            color: 'var(--white)', fontWeight: 900, padding: '0 8px',
          }}>‹</button>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--white)', fontFamily: 'Sora, sans-serif' }}>
            {format(viewMonth, 'MMMM yyyy')}
          </span>
          <button onClick={() => setViewMonth(m => addMonths(m, 1))} style={{
            background: 'none', border: 'none', fontSize: 20, cursor: 'pointer',
            color: 'var(--white)', fontWeight: 900, padding: '0 8px',
          }}>›</button>
        </div>

        <div style={{ padding: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-soft)', padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {blanks.map((_, i) => <div key={`b${i}`} />)}
            {days.map(day => {
              const isPast = isBefore(day, today)
              const isStart = startDate && isSameDay(day, startDate)
              const isEnd = endDate && isSameDay(day, endDate)
              const inRange = isInRange(day)
              const todayDay = isToday(day)

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  onMouseEnter={() => !endDate && startDate && setHoverDate(day)}
                  onMouseLeave={() => setHoverDate(null)}
                  disabled={isPast}
                  style={{
                    padding: '7px 2px',
                    borderRadius: (isStart || isEnd) ? '50%' : inRange ? '0' : '50%',
                    background: isStart || isEnd ? 'var(--white)' : inRange ? 'rgba(255,255,255,0.18)' : 'transparent',
                    color: isStart || isEnd ? '#7B4FB0' : isPast ? 'var(--text-faint)' : 'var(--white)',
                    border: todayDay && !isStart && !isEnd ? '2px solid var(--white)' : '2px solid transparent',
                    fontSize: 13,
                    fontWeight: isStart || isEnd ? 800 : todayDay ? 700 : 500,
                    cursor: isPast ? 'not-allowed' : 'pointer',
                    transition: 'all 0.1s',
                    width: '100%',
                    aspectRatio: '1',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {format(day, 'd')}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <div style={{
          flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-sm)',
          background: startDate ? 'var(--purple-light)' : 'var(--surface)',
          border: `2px solid ${startDate ? 'var(--purple)' : 'var(--border)'}`,
        }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 2 }}>START</p>
          <p style={{ fontWeight: 800, fontSize: 14, color: startDate ? 'var(--purple)' : 'var(--text-muted)' }}>
            {startDate ? format(startDate, 'MMM d, yyyy') : 'Pick start date'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontWeight: 900, fontSize: 18 }}>→</div>
        <div style={{
          flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-sm)',
          background: endDate ? 'var(--pink-light)' : 'var(--surface)',
          border: `2px solid ${endDate ? 'var(--pink)' : 'var(--border)'}`,
        }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 2 }}>END</p>
          <p style={{ fontWeight: 800, fontSize: 14, color: endDate ? 'var(--pink-dark)' : 'var(--text-muted)' }}>
            {endDate ? format(endDate, 'MMM d, yyyy') : 'Pick end date'}
          </p>
        </div>
      </div>

      {diffDays !== null && (
        <div style={{
          marginTop: 10, textAlign: 'center', padding: '10px',
          background: 'rgba(91,233,185,0.18)', border: '1px solid var(--green)',
          backdropFilter: 'blur(8px)', borderRadius: 'var(--radius-sm)',
        }}>
          <p style={{ fontWeight: 700, color: 'var(--green)', fontSize: 14 }}>
            🗓️ {diffDays} day challenge
          </p>
        </div>
      )}

      {!startDate && (
        <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, textAlign: 'center' }}>
          Tap a start date on the calendar
        </p>
      )}
      {startDate && !endDate && (
        <p style={{ marginTop: 8, fontSize: 13, color: 'var(--purple)', fontWeight: 700, textAlign: 'center' }}>
          Now tap an end date ✨
        </p>
      )}
    </div>
  )
}
