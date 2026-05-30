import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import StatCard from '../../components/dashboard/StatCard'
import ItemGrid from '../../components/items/ItemGrid'
import MatchCard from '../../components/items/MatchCard'
import CompareMatchModal from '../../components/items/CompareMatchModal'
import {
  confirmMatch,
  getDashboardAnalytics,
  type DashboardAnalytics,
  listItems,
  listMatches,
  rejectMatch,
} from '../../services/itemService'
import { useToast } from '../../components/ui/ToastProvider'

const CHART_COLORS = ['#315b4f', '#c45b2a', '#2d4f80', '#b58f2a', '#7a3d2c', '#2f6f69']

function StatIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

export default function DashboardPage() {
  const [items, setItems] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null)
  const [matchLoadingId, setMatchLoadingId] = useState<number | null>(null)
  const hasShownAnalyticsError = useRef(false)
  const { showToast } = useToast()

  const loadDashboard = async (options?: { silent?: boolean; showError?: boolean }) => {
    const silent = options?.silent ?? false
    const showError = options?.showError ?? true

    if (!silent) {
      setLoading(true)
    }
    try {
      const [analyticsData, itemData, matchData] = await Promise.all([getDashboardAnalytics(), listItems({}), listMatches()])
      setAnalytics(analyticsData)
      setItems(itemData.slice(0, 4))
      setMatches(matchData.slice(0, 4))
    } catch (error) {
      if (showError && !hasShownAnalyticsError.current) {
        hasShownAnalyticsError.current = true
        showToast('Unable to load dashboard analytics right now.', 'error')
      }
      if (import.meta.env.DEV) {
        console.error('Dashboard analytics refresh failed', error)
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    void loadDashboard({ silent: false, showError: true })

    const intervalId = window.setInterval(() => {
      void loadDashboard({ silent: true, showError: false })
    }, 30000)

    const onFocus = () => {
      if (document.visibilityState === 'visible') {
        void loadDashboard({ silent: true, showError: false })
      }
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [])

  const handleMatchReview = async (matchId: number, action: 'confirm' | 'reject') => {
    setMatchLoadingId(matchId)
    try {
      if (action === 'confirm') {
        await confirmMatch(matchId)
        showToast('Match confirmed.', 'success')
      } else {
        await rejectMatch(matchId)
        showToast('Match rejected.', 'info')
      }
      await loadDashboard({ silent: true, showError: false })
      setSelectedMatch(null)
    } catch {
      showToast('Unable to update match right now.', 'error')
    } finally {
      setMatchLoadingId(null)
    }
  }

  const summary = analytics?.summary
  const trends = analytics?.trends
  const monthlyTrend = analytics?.charts.monthly_recovery_trend ?? []
  const recoveryDelta = useMemo(() => {
    if (monthlyTrend.length < 2) {
      return 0
    }

    const current = monthlyTrend[monthlyTrend.length - 1]?.returned ?? 0
    const previous = monthlyTrend[monthlyTrend.length - 2]?.returned ?? 0
    if (!previous) {
      return current > 0 ? 100 : 0
    }
    return Number((((current - previous) / previous) * 100).toFixed(2))
  }, [monthlyTrend])

  const statCards = summary
    ? [
        {
          title: 'Total Lost Items',
          value: summary.total_lost_items.toLocaleString(),
          trend: undefined,
          icon: <StatIcon path="M12 3l8 4v5c0 5-3.4 8.6-8 9-4.6-.4-8-4-8-9V7l8-4z" />,
          accentClass: 'from-rust/20 to-transparent',
        },
        {
          title: 'Total Found Items',
          value: summary.total_found_items.toLocaleString(),
          trend: undefined,
          icon: <StatIcon path="M3 12h18M12 3v18" />,
          accentClass: 'from-moss/20 to-transparent',
        },
      ]
    : []

  return (
    <div className="space-y-8 pb-10">
      <section className="grid gap-6 rounded-[2rem] border border-black/5 bg-white/70 p-4 shadow-glow backdrop-blur dark:border-white/10 dark:bg-white/5 sm:p-6 lg:grid-cols-[1.5fr_1fr] lg:p-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rust dark:text-paper/60">Dashboard</p>
          <h1 className="mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight text-ink dark:text-paper sm:text-5xl">
            A modern campus portal for lost and found items.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink/70 dark:text-paper/70">
            Live analytics for your campus recovery platform, with instant visibility into claims, returns, and match quality.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-full bg-black/5 px-4 py-2 text-sm text-ink/70 dark:bg-white/5 dark:text-paper/75">Real-time metrics</span>
            <span className="rounded-full bg-black/5 px-4 py-2 text-sm text-ink/70 dark:bg-white/5 dark:text-paper/75">Recovery trend charts</span>
            <span className="rounded-full bg-black/5 px-4 py-2 text-sm text-ink/70 dark:bg-white/5 dark:text-paper/75">Category insights</span>
          </div>
        </div>

        <div className="grid gap-4 rounded-[1.75rem] bg-ink p-5 text-paper dark:bg-paper dark:text-ink sm:p-6">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-paper/55 dark:text-ink/55">Quick actions</p>
            <h2 className="mt-2 font-display text-2xl font-bold">Start here</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link to="/items/new" className="rounded-2xl bg-white/10 p-4 dark:bg-ink/5 hover:opacity-95">
              <p className="text-sm font-medium">Lost item</p>
              <p className="mt-1 text-sm text-paper/70 dark:text-ink/60">Post a missing item report.</p>
            </Link>
            <Link to="/items/new" className="rounded-2xl bg-white/10 p-4 dark:bg-ink/5 hover:opacity-95">
              <p className="text-sm font-medium">Found item</p>
              <p className="mt-1 text-sm text-paper/70 dark:text-ink/60">Log an item someone may claim.</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-moss dark:text-paper/45">Platform statistics</p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink dark:text-paper">Recovery metrics at a glance</h2>
        </div>
        {loading || !analytics ? (
          <div className="h-20 w-full animate-pulse rounded-2xl bg-black/5 dark:bg-white/5" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
            {statCards.map((card) => (
              <StatCard
                key={card.title}
                title={card.title}
                value={card.value}
                trend={card.trend}
                icon={card.icon}
                accentClass={card.accentClass}
              />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-black/5 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-ink/50 dark:text-paper/55">Lost Items This Month</p>
          <p className="mt-2 font-display text-3xl font-bold text-ink dark:text-paper">{summary?.lost_items_this_month ?? 0}</p>
        </article>
        <article className="rounded-3xl border border-black/5 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-ink/50 dark:text-paper/55">Found Items This Month</p>
          <p className="mt-2 font-display text-3xl font-bold text-ink dark:text-paper">{summary?.found_items_this_month ?? 0}</p>
        </article>
        <article className="rounded-3xl border border-black/5 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-ink/50 dark:text-paper/55">Recovery Trends</p>
          <p className="mt-2 font-display text-3xl font-bold text-ink dark:text-paper">{recoveryDelta > 0 ? '+' : ''}{recoveryDelta.toFixed(1)}%</p>
        </article>
      </section>

      {/* Charts removed - dashboard simplified to only Lost and Found metrics per user request */}

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ink/45 dark:text-paper/45">Recent items</p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-ink dark:text-paper">Active feed</h2>
          </div>
        </div>

        <ItemGrid
          loading={loading}
          items={items}
          skeletonCount={2}
          emptyTitle="No recent items yet"
          emptyDescription="New lost and found posts will appear here once the campus feed is active."
        />
      </section>

      <section className="space-y-4 rounded-[2rem] border border-black/5 bg-white/70 p-6 dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-moss dark:text-paper/45">Potential matches</p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-ink dark:text-paper">Suggested lost and found pairs</h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-ink/60 dark:text-paper/60">Matches are scored automatically from category, keywords, location, and date proximity.</p>
        </div>

        {matches.length ? (
          <div className="grid gap-5">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} onCompare={setSelectedMatch} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink/60 dark:text-paper/60">No potential matches have been suggested yet.</p>
        )}
      </section>

      <CompareMatchModal
        open={Boolean(selectedMatch)}
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
        onConfirm={selectedMatch?.can_review ? () => handleMatchReview(selectedMatch.id, 'confirm') : undefined}
        onReject={selectedMatch?.can_review ? () => handleMatchReview(selectedMatch.id, 'reject') : undefined}
        busy={matchLoadingId === selectedMatch?.id}
      />
    </div>
  )
}
