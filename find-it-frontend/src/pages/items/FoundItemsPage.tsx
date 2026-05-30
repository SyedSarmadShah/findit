import { useEffect, useMemo, useState } from 'react'
import ItemGrid from '../../components/items/ItemGrid'
import ClaimRequestModal from '../../components/items/ClaimRequestModal'
import SearchFilters from '../../components/ui/SearchFilters'
import { createClaim, listItems } from '../../services/itemService'
import { useToast } from '../../components/ui/ToastProvider'

export default function FoundItemsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const { showToast } = useToast()

  const filters = useMemo(
    () => ({
      item_type: 'found' as const,
      search: query || undefined,
      category: category || undefined,
      status: status || undefined,
    }),
    [query, category, status],
  )

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const data = await listItems(filters)
        if (!cancelled) setItems(data)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [filters])

  const resetFilters = () => {
    setQuery('')
    setCategory('')
    setStatus('')
  }

  const handleClaimSubmit = async (answers: {
    brand: string
    unique_marks: string
    item_contents: string
    additional_details: string
  }) => {
    if (!selectedItem) return
    await createClaim({ item: selectedItem.id, answers })
    setSelectedItem(null)
    showToast('Claim submitted. The finder has been notified.', 'success')
  }

  return (
    <div className="space-y-6 pb-4">
      <header className="grid gap-6 rounded-[2rem] border border-black/5 bg-white/70 p-6 shadow-glow backdrop-blur dark:border-white/10 dark:bg-white/5 lg:grid-cols-[1.4fr_1fr] lg:p-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-moss dark:text-paper/60">Found items</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink dark:text-paper sm:text-5xl">Browse recovered items</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/65 dark:text-paper/65">
            See what has been recovered, then filter by keyword, category, or status to find a likely match faster.
          </p>
        </div>
        <div className="grid gap-3 rounded-[1.5rem] bg-moss p-5 text-paper dark:bg-paper dark:text-ink">
          <div className="text-sm uppercase tracking-[0.18em] text-paper/60 dark:text-ink/55">Quick stats</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 p-4 dark:bg-ink/5">
              <p className="text-2xl font-bold">Shared</p>
              <p className="mt-1 text-sm text-paper/70 dark:text-ink/60">Community recovery</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 dark:bg-ink/5">
              <p className="text-2xl font-bold">Open</p>
              <p className="mt-1 text-sm text-paper/70 dark:text-ink/60">Ready to claim</p>
            </div>
          </div>
        </div>
      </header>

      <SearchFilters
        title="Refine found item reports"
        subtitle="Filter recovered items by keyword, category, or status."
        query={query}
        category={category}
        status={status}
        onQueryChange={setQuery}
        onCategoryChange={setCategory}
        onStatusChange={setStatus}
        onReset={resetFilters}
      />

      <ItemGrid
        loading={loading}
        items={items}
        emptyTitle="No found items found"
        emptyDescription="Try adjusting your search, category, or status filters."
        onClaimItem={(item) => setSelectedItem(item)}
      />

      <ClaimRequestModal
        open={Boolean(selectedItem)}
        itemTitle={selectedItem?.title ?? ''}
        onClose={() => setSelectedItem(null)}
        onSubmit={handleClaimSubmit}
      />
    </div>
  )
}
