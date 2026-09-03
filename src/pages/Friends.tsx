import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { Card, ErrorNote, Pct, Spinner } from '../components/ui'
import { artUrl, characterStateFrom } from '../lib/character'
import GroupStatsView from '../components/GroupStats'
import ImABum from '../components/ImABum'

type Tab = 'leaderboard' | 'group' | 'bum'
const TABS: { key: Tab; label: string }[] = [
  { key: 'leaderboard', label: 'Leaderboard' },
  { key: 'group', label: 'Group' },
  { key: 'bum', label: "I'm a Bum" },
]

export default function Friends() {
  const [tab, setTab] = useState<Tab>('leaderboard')
  const friends = useQuery({ queryKey: ['friends'], queryFn: api.friends, enabled: tab === 'leaderboard' })
  const group = useQuery({ queryKey: ['groupStats'], queryFn: api.groupStats, enabled: tab === 'group' })
  const reasons = useQuery({ queryKey: ['groupReasons'], queryFn: api.groupReasons, enabled: tab === 'bum' })

  return (
    <div>
      <h1 className="mb-3 text-xl font-bold">Friends</h1>

      <div className="mb-4 flex gap-1 rounded-2xl border border-border bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-xl px-2 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-surface-2 text-ink shadow-sm ring-1 ring-inset ring-border' : 'text-ink-3 hover:text-ink-2'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'leaderboard' && (
        <>
          {friends.isLoading && <div className="grid place-items-center py-10"><Spinner /></div>}
          {friends.error && <ErrorNote msg={(friends.error as Error).message} />}
          {friends.data && (
            <div className="space-y-2">
              {friends.data.map((f, i) => {
                const st = characterStateFrom(f.character_set, f.streak?.current ?? 0, f.missed_run ?? 0)
                const down = st.mode === 'depleted'
                return (
                  <Link key={f.id} to={f.onboarded ? `/friends/${f.id}` : '#'} className={!f.onboarded ? 'pointer-events-none' : ''}>
                    <Card className="flex items-stretch gap-3 overflow-hidden p-0">
                      {f.onboarded ? (
                        <img
                          src={artUrl(st.set.key, st.tier.key)}
                          alt={st.tier.name}
                          loading="lazy"
                          className="h-24 w-20 shrink-0 object-cover"
                        />
                      ) : (
                        <div className="grid h-24 w-20 shrink-0 place-items-center bg-surface-2 text-ink-3">–</div>
                      )}
                      <div className="flex min-w-0 flex-1 items-center gap-3 py-3 pr-4">
                        <div className="w-4 text-center text-sm font-bold text-ink-3">{f.onboarded ? i + 1 : ''}</div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold">{f.name}</div>
                          {f.onboarded ? (
                            <>
                              <div className={`truncate text-xs font-medium ${down ? 'text-bad' : 'text-good'}`}>
                                {down ? `${st.daysMissed}d missed · ${st.tier.name}` : `${st.streak}d streak · ${st.tier.name}`}
                              </div>
                              <div className="truncate text-xs text-ink-3">
                                Day {f.day_number} · {f.hits} hit, {f.misses} missed{f.unlogged ? `, ${f.unlogged} unlogged` : ''}
                              </div>
                            </>
                          ) : (
                            <div className="text-xs text-ink-3">Has not started yet</div>
                          )}
                        </div>
                        {f.onboarded ? <Pct value={f.pct} /> : <span className="text-ink-3">—</span>}
                      </div>
                    </Card>
                  </Link>
                )
              })}
              {friends.data.length === 0 && <p className="text-center text-sm text-ink-3">Nobody else here yet.</p>}
            </div>
          )}
        </>
      )}

      {tab === 'group' && (
        <>
          {group.isLoading && <div className="grid place-items-center py-10"><Spinner /></div>}
          {group.error && <ErrorNote msg={(group.error as Error).message} />}
          {group.data && <GroupStatsView data={group.data} />}
        </>
      )}

      {tab === 'bum' && (
        <>
          {reasons.isLoading && <div className="grid place-items-center py-10"><Spinner /></div>}
          {reasons.error && <ErrorNote msg={(reasons.error as Error).message} />}
          {reasons.data && <ImABum excuses={reasons.data} />}
        </>
      )}
    </div>
  )
}
