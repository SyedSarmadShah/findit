import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ItemCard from '../../components/items/ItemCard'
import ItemSkeleton from '../../components/ui/ItemSkeleton'
import { listItems } from '../../services/itemService'

export default function DashboardPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const data = await listItems({})
        if (!cancelled) setItems(data.slice(0, 4))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-8 pb-10">
      <section className="grid gap-6 rounded-[2rem] border border-black/5 bg-white/70 p-6 shadow-glow backdrop-blur dark:border-white/10 dark:bg-white/5 lg:grid-cols-[1.5fr_1fr] lg:p-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rust dark:text-paper/60">Dashboard</p>
          <h1 className="mt-3 max-w-2xl font-display text-5xl font-bold tracking-tight text-ink dark:text-paper sm:text-6xl">
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

        <div className="grid gap-4 rounded-[1.75rem] bg-ink p-6 text-paper dark:bg-paper dark:text-ink">
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

        <div className="grid gap-5">
          {loading
            ? Array.from({ length: 2 }).map((_, index) => <ItemSkeleton key={index} />)
            : items.map((item) => (
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
              ))}
        </div>
      </section>
    </div>
  )
}
