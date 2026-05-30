import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import ItemCard from '../../components/items/ItemCard'
import ClaimRequestModal from '../../components/items/ClaimRequestModal'
import { createClaim, getItem, reportItem } from '../../services/itemService'
import { useToast } from '../../components/ui/ToastProvider'

export default function ItemDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [item, setItem] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [claimOpen, setClaimOpen] = useState(false)

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

  const canClaim = Boolean(item && item.item_type === 'found' && item.status !== 'resolved' && !isOwnItem)

  const handleClaim = async (answers: {
    brand: string
    unique_marks: string
    item_contents: string
    additional_details: string
  }) => {
    if (!item) return

    try {
      await createClaim({ item: item.id, answers })
      setClaimOpen(false)
      showToast('Claim submitted. The finder will review it shortly.', 'success')
    } catch {
      showToast('Unable to submit claim. You may have already claimed this item.', 'error')
      throw new Error('claim failed')
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
      showToast('Report submitted. Admin review can take some time.', 'success')
    } catch {
      setError('Unable to submit report right now.')
      showToast('Unable to submit report right now.', 'error')
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
        <p className="max-w-3xl text-sm leading-6 text-ink/65 dark:text-paper/65">
          The card below is just a preview. To claim a found item, use the Claim button in the section below to open the form and submit your proof.
        </p>
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
        onClaim={canClaim ? () => setClaimOpen(true) : undefined}
        showActions={false}
      />

      <section id="claim-item" className="grid gap-4 rounded-2xl border border-black/5 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5">
        <h2 className="font-display text-2xl font-bold">Claim this item</h2>
        <p className="text-sm text-ink/65 dark:text-paper/65">
          Share proof points such as the brand, unique marks, and contents so the finder can verify ownership.
        </p>

        {!canClaim ? (
          <div className="rounded-xl bg-black/5 p-3 text-sm leading-6 dark:bg-white/5">
            This item cannot be claimed from this account. If you want to test the claim flow, open a found item while signed in as a different user.
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setClaimOpen(true)}
              className="w-fit rounded-full bg-moss px-5 py-2 text-sm font-semibold text-paper shadow-[0_12px_24px_rgba(31,86,74,0.16)] transition hover:-translate-y-0.5 hover:opacity-95"
            >
              Claim Item
            </button>
            <span className="self-center text-sm text-ink/55 dark:text-paper/55">This opens the claim form with brand, marks, contents, and proof details.</span>
          </div>
        )}

        <p className="text-sm text-ink/55 dark:text-paper/55">The request will be stored in your claim history and sent to the finder for review.</p>
      </section>

      <ClaimRequestModal
        open={claimOpen}
        itemTitle={item.title}
        onClose={() => setClaimOpen(false)}
        onSubmit={handleClaim}
      />

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
