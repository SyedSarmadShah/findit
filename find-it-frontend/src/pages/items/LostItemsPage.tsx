import { useEffect, useMemo, useState } from 'react'
import ItemCard from '../../components/items/ItemCard'
import ItemSkeleton from '../../components/ui/ItemSkeleton'
import SearchFilters from '../../components/ui/SearchFilters'
import { listItems } from '../../services/itemService'

export default function LostItemsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')

  const filters = useMemo(
    () => ({
      item_type: 'lost' as const,
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

  return (
    <div className="space-y-6 pb-4">
      <header className="grid gap-6 rounded-[2rem] border border-black/5 bg-white/70 p-6 shadow-glow backdrop-blur dark:border-white/10 dark:bg-white/5 lg:grid-cols-[1.4fr_1fr] lg:p-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rust dark:text-paper/60">Lost items</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink dark:text-paper sm:text-5xl">Browse missing item reports</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/65 dark:text-paper/65">
            Search by item name, location, or category to quickly narrow down what the campus community has reported.
          </p>
        </div>
        <div className="grid gap-3 rounded-[1.5rem] bg-ink p-5 text-paper dark:bg-paper dark:text-ink">
          <div className="text-sm uppercase tracking-[0.18em] text-paper/60 dark:text-ink/55">Quick stats</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 p-4 dark:bg-ink/5">
              <p className="text-2xl font-bold">Campus</p>
              <p className="mt-1 text-sm text-paper/70 dark:text-ink/60">Filtered reports</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 dark:bg-ink/5">
              <p className="text-2xl font-bold">Fast</p>
              <p className="mt-1 text-sm text-paper/70 dark:text-ink/60">Search + filters</p>
            </div>
          </div>
        </div>
      </header>

      <SearchFilters
        title="Refine lost item reports"
        subtitle="Use filters to narrow results without leaving the page."
        query={query}
        category={category}
        status={status}
        onQueryChange={setQuery}
        onCategoryChange={setCategory}
        onStatusChange={setStatus}
        onReset={resetFilters}
      />

      <div className="grid gap-5">
        {loading
          ? Array.from({ length: 3 }).map((_, index) => <ItemSkeleton key={index} />)
          : items.length > 0
            ? items.map((item) => (
                <ItemCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  description={item.description}
                  category={item.category}
                  location={item.location}
                  date={item.date}
                  status={item.status}
                  imageUrl={item.image}
                />
              ))
            : <div className="rounded-[1.5rem] border border-dashed border-black/10 bg-white/60 p-8 text-center text-sm text-ink/60 dark:border-white/10 dark:bg-white/5 dark:text-paper/60">No lost items match your filters.</div>}
      </div>
    </div>
  )
}
