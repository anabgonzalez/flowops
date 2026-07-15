import type { Timeframe } from '../api/types'
import { Input, Label, Select } from './ui'

export function toLocalDateTimeInput(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function toDateInput(iso: string) {
  return toLocalDateTimeInput(iso).slice(0, 10)
}

function formatTime12h(time: string) {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

// Lets a dispatcher pick a saved timeframe (e.g. "Morning, 8-10 AM") instead
// of typing exact times - picking one fills in start/end for the chosen
// date. "Custom time..." falls back to manual datetime-local inputs for
// anything that doesn't fit a preset window.
export function ScheduleFields({
  idPrefix,
  timeframes,
  date,
  setDate,
  timeframeId,
  setTimeframeId,
  start,
  setStart,
  end,
  setEnd,
  required,
}: {
  idPrefix: string
  timeframes: Timeframe[]
  date: string
  setDate: (v: string) => void
  timeframeId: string
  setTimeframeId: (v: string) => void
  start: string
  setStart: (v: string) => void
  end: string
  setEnd: (v: string) => void
  required?: boolean
}) {
  function applyTimeframe(id: string, forDate: string) {
    const tf = timeframes.find((t) => t.id === id)
    if (tf && forDate) {
      setStart(`${forDate}T${tf.startTime}`)
      setEnd(`${forDate}T${tf.endTime}`)
    }
  }

  function handleTimeframeChange(id: string) {
    setTimeframeId(id)
    if (id !== 'custom') applyTimeframe(id, date)
  }

  function handleDateChange(newDate: string) {
    setDate(newDate)
    if (timeframeId !== 'custom') applyTimeframe(timeframeId, newDate)
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`${idPrefix}-date`}>Date</Label>
          <Input id={`${idPrefix}-date`} type="date" value={date} onChange={(e) => handleDateChange(e.target.value)} required={required} />
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-timeframe`}>Timeframe</Label>
          <Select id={`${idPrefix}-timeframe`} value={timeframeId} onChange={(e) => handleTimeframeChange(e.target.value)}>
            <option value="custom">Custom time...</option>
            {timeframes.map((tf) => (
              <option key={tf.id} value={tf.id}>
                {tf.name} ({formatTime12h(tf.startTime)}&ndash;{formatTime12h(tf.endTime)})
              </option>
            ))}
          </Select>
        </div>
      </div>
      {timeframeId === 'custom' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor={`${idPrefix}-start`}>Start</Label>
            <Input
              id={`${idPrefix}-start`}
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required={required}
            />
          </div>
          <div>
            <Label htmlFor={`${idPrefix}-end`}>End</Label>
            <Input
              id={`${idPrefix}-end`}
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              required={required}
            />
          </div>
        </div>
      )}
    </>
  )
}
