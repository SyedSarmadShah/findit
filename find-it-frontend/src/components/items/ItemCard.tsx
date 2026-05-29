import { Link } from 'react-router-dom'

type ItemCardProps = {
  id?: number
  title: string
  description: string
  category: string
  location: string
  date: string
  status: string
  imageUrl?: string
}

export default function ItemCard({ id, title, description, category, location, date, status, imageUrl }: ItemCardProps) {
  const statusTone =
    status === 'resolved'
      ? 'bg-moss/15 text-moss dark:bg-moss/25 dark:text-paper'
      : status === 'matched'
        ? 'bg-rust/15 text-rust dark:bg-rust/25 dark:text-paper'
        : 'bg-ink/10 text-ink dark:bg-white/10 dark:text-paper'

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-black/5 bg-white/75 shadow-glow backdrop-blur transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(7,17,31,0.18)] dark:border-white/10 dark:bg-white/5">
      <div className="grid gap-4 p-4 sm:grid-cols-[200px_1fr] sm:p-5">
        <div className="relative h-44 overflow-hidden rounded-2xl bg-sand dark:bg-white/5">
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
          ) : (
            <div className="flex h-full w-full items-end bg-[linear-gradient(135deg,rgba(49,91,79,0.16),rgba(196,91,42,0.18))] p-4 text-sm font-medium text-ink/55 dark:text-paper/55">
              No image uploaded
            </div>
          )}
          <div className="absolute left-3 top-3 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink shadow-sm backdrop-blur dark:bg-ink/70 dark:text-paper">
            {category || 'General'}
          </div>
        </div>
        <div className="flex flex-col justify-between gap-4">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink/45 dark:text-paper/45">
              <span className={`rounded-full px-3 py-1 ${statusTone}`}>{status}</span>
              <span className="rounded-full bg-black/5 px-3 py-1 dark:bg-white/5">{location || 'Campus location'}</span>
            </div>
            <h3 className="font-display text-2xl font-bold tracking-tight text-ink dark:text-paper">{title}</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/70 dark:text-paper/70">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-ink/60 dark:text-paper/60">
            <span className="rounded-full bg-black/5 px-3 py-1 dark:bg-white/5">{date}</span>
            {id ? (
              <Link to={`/items/${id}`} className="rounded-full bg-moss px-3 py-1 font-medium text-paper transition hover:opacity-90 dark:bg-paper dark:text-ink">
                View details
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}
