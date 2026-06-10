import { parseISO, startOfWeek, eachDayOfInterval, format } from 'date-fns'

const weekKeyOf = (date) =>
  format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')

/**
 * Fair weekly-target scoring.
 * - Buckets the challenge into Mon–Sun weeks.
 * - Each goal contributes its weekly target (times_per_week) per week,
 *   PRORATED for partial start/end weeks (can't do a goal more than once a day).
 * - A player EARNS up to that target each week — extra reps beyond the
 *   weekly target don't over-credit.
 *
 * Returns { earned, total, pct } — total = max achievable, earned = capped completions.
 */
export function computeScore(player, goals, checkIns, challenge) {
  if (!player || !goals?.length) return { earned: 0, total: 0, pct: 0 }

  const start = parseISO(challenge.start_date)
  const end = parseISO(challenge.end_date)
  const days = eachDayOfInterval({ start, end })

  // how many challenge-days fall in each week bucket
  const daysPerWeek = {}
  for (const d of days) {
    const wk = weekKeyOf(d)
    daysPerWeek[wk] = (daysPerWeek[wk] || 0) + 1
  }

  // this player's check-ins, counted per week per goal (within range)
  const counts = {}
  for (const ci of checkIns) {
    if (ci.player_id !== player.id) continue
    if (ci.date < challenge.start_date || ci.date > challenge.end_date) continue
    const wk = weekKeyOf(parseISO(ci.date))
    counts[wk] = counts[wk] || {}
    counts[wk][ci.goal_id] = (counts[wk][ci.goal_id] || 0) + 1
  }

  let earned = 0
  let total = 0
  for (const wk of Object.keys(daysPerWeek)) {
    const dCount = daysPerWeek[wk]
    for (const g of goals) {
      const n = g.times_per_week || 7
      // prorate weekly target by days available this week; cap at days (1/day max).
      // ceil so a goal never silently drops out of a short start/end week.
      const target = Math.min(dCount, Math.max(1, Math.ceil((n * dCount) / 7)))
      if (target <= 0) continue
      total += target
      const did = counts[wk]?.[g.id] || 0
      earned += Math.min(did, target)
    }
  }

  const pct = total > 0 ? Math.round((earned / total) * 100) : 0
  return { earned, total, pct }
}

export const goalsForPlayer = (player, allGoals) =>
  player ? allGoals.filter(g => (player.goal_ids || []).includes(g.id)) : []
