import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import ItemCard from '../../components/items/ItemCard'
import { createClaim, getItem, reportItem } from '../../services/itemService'

export default function ItemDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [item, setItem] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [claimMessage, setClaimMessage] = useState('')
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimSuccess, setClaimSuccess] = useState('')

  const [reportReason, setReportReason] = useState('')
  const [reportDetails, setReportDetails] = useState('')
  const [isReporting, setIsReporting] = useState(false)
  const [reportSuccess, setReportSuccess] = useState('')

  useEffect(() => {
    if (!id) {
      setError('Invalid item id')
      setLoading(false)
      return
    }

    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getItem(Number(id))
        if (!cancelled) {
          setItem(data)
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load item details')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [id])

  const isOwnItem = useMemo(() => {
    if (!item || !user) return false
    return item.owner === user.id
  }, [item, user])

  const canClaim = Boolean(item && item.status !== 'resolved' && !isOwnItem)

  const handleClaim = async () => {
    if (!item || !claimMessage.trim()) return

    setIsClaiming(true)
    setClaimSuccess('')
    setError('')

    try {
      await createClaim({ item: item.id, message: claimMessage.trim() })
      setClaimMessage('')
      setClaimSuccess('Claim submitted successfully.')
    } catch {
      setError('Unable to submit claim. You may have already claimed this item.')
    } finally {
      setIsClaiming(false)
    }
  }

  const handleReport = async () => {
    if (!item || !reportReason.trim()) return

    setIsReporting(true)
    setReportSuccess('')
    setError('')

    try {
      await reportItem({ item: item.id, reason: reportReason.trim(), details: reportDetails.trim() })
      setReportReason('')
      setReportDetails('')
      setReportSuccess('Report submitted. Admin review can take some time.')
    } catch {
      setError('Unable to submit report right now.')
    } finally {
      setIsReporting(false)
    }
  }

  if (loading) {
    return <div className="rounded-2xl bg-white/70 p-6 dark:bg-white/5">Loading item details...</div>
  }

  if (error && !item) {
    return (
      <div className="space-y-3 rounded-2xl bg-white/70 p-6 dark:bg-white/5">
        <div className="text-rust">{error}</div>
        <Link to="/dashboard" className="text-sm font-medium text-moss">
          Back to dashboard
        </Link>
      </div>
    )
  }

  if (!item) return null

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ink/45">Item detail</p>
        <h1 className="font-display text-4xl font-bold tracking-tight">Review and take action</h1>
      </header>

      <ItemCard
        id={item.id}
        itemType={item.item_type}
        title={item.title}
        description={item.description}
        category={item.category}
        location={item.location}
        date={item.date}
        status={item.status}
        imageUrl={item.image_url ?? item.image ?? undefined}
      />

      <section id="claim-item" className="grid gap-4 rounded-2xl border border-black/5 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5">
        <h2 className="font-display text-2xl font-bold">Claim this item</h2>
        <p className="text-sm text-ink/65 dark:text-paper/65">
          Send a message with identifying details (brand, color, content) so the owner can verify your claim.
        </p>

        {!canClaim ? (
          <div className="rounded-xl bg-black/5 p-3 text-sm dark:bg-white/5">You cannot claim this item.</div>
        ) : (
          <>
            <textarea
              value={claimMessage}
              onChange={(event) => setClaimMessage(event.target.value)}
              placeholder="Write your claim message"
              className="min-h-[110px] rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-moss focus:ring-2 focus:ring-moss/15 dark:border-white/10 dark:bg-surface-strong"
            />
            <button
              type="button"
              disabled={isClaiming || !claimMessage.trim()}
              onClick={() => void handleClaim()}
              className="w-fit rounded-full bg-moss px-5 py-2 text-sm font-medium text-paper transition hover:opacity-90 disabled:opacity-60"
            >
              {isClaiming ? 'Submitting claim...' : 'Submit claim'}
            </button>
          </>
        )}

        {claimSuccess ? <p className="text-sm text-moss">{claimSuccess}</p> : null}
      </section>

      <section className="grid gap-4 rounded-2xl border border-black/5 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5">
        <h2 className="font-display text-2xl font-bold">Report this post</h2>
        <p className="text-sm text-ink/65 dark:text-paper/65">Use this if the post looks fake, abusive, or unsafe.</p>

        <input
          value={reportReason}
          onChange={(event) => setReportReason(event.target.value)}
          placeholder="Reason (e.g. suspicious post, wrong category)"
          className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-rust focus:ring-2 focus:ring-rust/15 dark:border-white/10 dark:bg-surface-strong"
        />
        <textarea
          value={reportDetails}
          onChange={(event) => setReportDetails(event.target.value)}
          placeholder="Optional details"
          className="min-h-[90px] rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-rust focus:ring-2 focus:ring-rust/15 dark:border-white/10 dark:bg-surface-strong"
        />
        <button
          type="button"
          disabled={isReporting || !reportReason.trim()}
          onClick={() => void handleReport()}
          className="w-fit rounded-full bg-rust px-5 py-2 text-sm font-medium text-paper transition hover:opacity-90 disabled:opacity-60"
        >
          {isReporting ? 'Submitting report...' : 'Submit report'}
        </button>

        {reportSuccess ? <p className="text-sm text-moss">{reportSuccess}</p> : null}
        {error ? <p className="text-sm text-rust">{error}</p> : null}
      </section>
    </div>
  )
}
