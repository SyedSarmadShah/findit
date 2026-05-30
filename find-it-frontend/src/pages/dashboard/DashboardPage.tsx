import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ItemGrid from '../../components/items/ItemGrid'
import MatchCard from '../../components/items/MatchCard'
import CompareMatchModal from '../../components/items/CompareMatchModal'
import {
  approveClaim,
  confirmMatch,
  listClaimHistory,
  listClaimReviewQueue,
  listItems,
  listMatches,
  listNotifications,
  rejectClaim,
  rejectMatch,
} from '../../services/itemService'
import { useToast } from '../../components/ui/ToastProvider'

function claimStatusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export default function DashboardPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [claimHistory, setClaimHistory] = useState<any[]>([])
  const [reviewQueue, setReviewQueue] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null)
  const [reviewLoadingId, setReviewLoadingId] = useState<number | null>(null)
  const [matchLoadingId, setMatchLoadingId] = useState<number | null>(null)
  const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({})
  const { showToast } = useToast()

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const [itemData, historyData, reviewData, notificationData, matchData] = await Promise.all([
          listItems({}),
          listClaimHistory(),
          listClaimReviewQueue(),
          listNotifications(),
          listMatches(),
        ])
        if (!cancelled) {
          setItems(itemData.slice(0, 4))
          setClaimHistory(historyData.slice(0, 4))
          setReviewQueue(reviewData.slice(0, 4))
          setNotifications(notificationData.slice(0, 4))
          setMatches(matchData.slice(0, 4))
          setReviewNotes(
            reviewData.slice(0, 4).reduce<Record<number, string>>((accumulator, claim) => {
              accumulator[claim.id] = claim.verification_notes || ''
              return accumulator
            }, {}),
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const handleReview = async (claimId: number, action: 'approve' | 'reject') => {
    setReviewLoadingId(claimId)
    try {
      const notes = reviewNotes[claimId]?.trim()
      if (action === 'approve') {
        await approveClaim(claimId, notes ? { verification_notes: notes } : undefined)
        showToast('Claim approved and item status updated.', 'success')
      } else {
        await rejectClaim(claimId, notes ? { verification_notes: notes } : undefined)
        showToast('Claim rejected and claimant notified.', 'info')
      }
      const [historyData, reviewData, notificationData] = await Promise.all([
        listClaimHistory(),
        listClaimReviewQueue(),
        listNotifications(),
      ])
      setClaimHistory(historyData.slice(0, 4))
      setReviewQueue(reviewData.slice(0, 4))
      setNotifications(notificationData.slice(0, 4))
      setReviewNotes(
        reviewData.slice(0, 4).reduce<Record<number, string>>((accumulator, claim) => {
          accumulator[claim.id] = claim.verification_notes || ''
          return accumulator
        }, {}),
      )
    } catch {
      showToast('Unable to update claim status right now.', 'error')
    } finally {
      setReviewLoadingId(null)
    }
  }

  const refreshMatches = async () => {
    const [matchData, notificationData] = await Promise.all([listMatches(), listNotifications()])
    setMatches(matchData.slice(0, 4))
    setNotifications(notificationData.slice(0, 4))
  }

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
      await refreshMatches()
      setSelectedMatch(null)
    } catch {
      showToast('Unable to update match right now.', 'error')
    } finally {
      setMatchLoadingId(null)
    }
  }

  return (
    <div className="space-y-8 pb-10">
      <section className="grid gap-6 rounded-[2rem] border border-black/5 bg-white/70 p-4 shadow-glow backdrop-blur dark:border-white/10 dark:bg-white/5 sm:p-6 lg:grid-cols-[1.5fr_1fr] lg:p-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rust dark:text-paper/60">Dashboard</p>
          <h1 className="mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight text-ink dark:text-paper sm:text-5xl">
            A modern campus portal for lost and found items.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink/70 dark:text-paper/70">
            Post reports, search recovered items, and switch between light and dark mode for a cleaner campus workflow.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-full bg-black/5 px-4 py-2 text-sm text-ink/70 dark:bg-white/5 dark:text-paper/75">Responsive nav</span>
            <span className="rounded-full bg-black/5 px-4 py-2 text-sm text-ink/70 dark:bg-white/5 dark:text-paper/75">Search filters</span>
            <span className="rounded-full bg-black/5 px-4 py-2 text-sm text-ink/70 dark:bg-white/5 dark:text-paper/75">Dark mode</span>
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

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-[2rem] border border-black/5 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5 sm:p-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-moss dark:text-paper/45">Claim history</p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-ink dark:text-paper">Your submitted claims</h2>
          </div>
          {claimHistory.length ? (
            <div className="grid gap-3">
              {claimHistory.map((claim) => (
                <article key={claim.id} className="rounded-2xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink dark:text-paper">{claim.item_title || `Item #${claim.item}`}</p>
                      <p className="text-sm text-ink/60 dark:text-paper/60">Submitted {new Date(claim.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-ink/70 dark:bg-white/10 dark:text-paper/75">
                      {claimStatusLabel(claim.status)}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-ink/65 dark:text-paper/65">
                    <p><span className="font-semibold text-ink dark:text-paper">Brand:</span> {claim.answers?.brand}</p>
                    <p><span className="font-semibold text-ink dark:text-paper">Marks:</span> {claim.answers?.unique_marks}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink/60 dark:text-paper/60">No claims submitted yet.</p>
          )}
        </div>

        <div className="space-y-4 rounded-[2rem] border border-black/5 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5 sm:p-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rust dark:text-paper/45">Finder inbox</p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-ink dark:text-paper">Review claim requests</h2>
          </div>
          {reviewQueue.length ? (
            <div className="grid gap-3">
              {reviewQueue.map((claim) => (
                <article key={claim.id} className="rounded-2xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink dark:text-paper">{claim.item_title || `Item #${claim.item}`}</p>
                      <p className="text-sm text-ink/60 dark:text-paper/60">Claimant {claim.claimant_email}</p>
                    </div>
                    <span className="rounded-full bg-moss/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-moss dark:bg-moss/20 dark:text-paper">
                      {claimStatusLabel(claim.status)}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-ink/65 dark:text-paper/65">
                    <p><span className="font-semibold text-ink dark:text-paper">Brand:</span> {claim.answers?.brand}</p>
                    <p><span className="font-semibold text-ink dark:text-paper">Marks:</span> {claim.answers?.unique_marks}</p>
                    <p><span className="font-semibold text-ink dark:text-paper">Contents:</span> {claim.answers?.item_contents}</p>
                    <p><span className="font-semibold text-ink dark:text-paper">Proof:</span> {claim.answers?.additional_details}</p>
                  </div>
                  <label className="mt-4 grid gap-2 text-sm font-medium text-ink dark:text-paper">
                    Verification notes
                    <textarea
                      value={reviewNotes[claim.id] ?? claim.verification_notes ?? ''}
                      onChange={(event) => setReviewNotes((current) => ({ ...current, [claim.id]: event.target.value }))}
                      className="min-h-[92px] rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-ink/35 focus:border-moss focus:ring-2 focus:ring-moss/15 dark:border-white/10 dark:bg-surface-strong dark:text-paper dark:placeholder:text-paper/35"
                      placeholder="Optional finder/admin notes"
                    />
                  </label>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={reviewLoadingId === claim.id}
                      onClick={() => void handleReview(claim.id, 'approve')}
                      className="rounded-full bg-moss px-4 py-2 text-sm font-semibold text-paper transition hover:opacity-90 disabled:opacity-60"
                    >
                      {reviewLoadingId === claim.id ? 'Updating...' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      disabled={reviewLoadingId === claim.id}
                      onClick={() => void handleReview(claim.id, 'reject')}
                      className="rounded-full bg-rust px-4 py-2 text-sm font-semibold text-paper transition hover:opacity-90 disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink/60 dark:text-paper/60">No claim requests are waiting for review.</p>
          )}
        </div>
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

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-[2rem] border border-black/5 bg-white/70 p-6 dark:border-white/10 dark:bg-white/5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-navy dark:text-paper/45">Notifications</p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-ink dark:text-paper">Claim updates</h2>
          </div>
          {notifications.length ? (
            <div className="grid gap-3">
              {notifications.map((notification) => (
                <article key={notification.id} className="rounded-2xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink dark:text-paper">{notification.title}</p>
                      <p className="mt-1 text-sm text-ink/65 dark:text-paper/65">{notification.message}</p>
                    </div>
                    <span className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/60 dark:bg-white/10 dark:text-paper/70">
                      {notification.type.replaceAll('_', ' ')}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink/60 dark:text-paper/60">No notifications yet.</p>
          )}
        </div>

        <div className="space-y-4 rounded-[2rem] border border-black/5 bg-white/70 p-6 dark:border-white/10 dark:bg-white/5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-moss dark:text-paper/45">Claim workflow</p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-ink dark:text-paper">Secure recovery</h2>
          </div>
          <div className="grid gap-3 text-sm leading-6 text-ink/70 dark:text-paper/70">
            <div className="rounded-2xl bg-black/5 p-4 dark:bg-white/5">Authenticated users submit a claim with brand, marks, contents, and proof details.</div>
            <div className="rounded-2xl bg-black/5 p-4 dark:bg-white/5">The finder reviews the answer set, then approves or rejects the request.</div>
            <div className="rounded-2xl bg-black/5 p-4 dark:bg-white/5">Claim history, notifications, and item status changes stay synced automatically.</div>
          </div>
        </div>
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
