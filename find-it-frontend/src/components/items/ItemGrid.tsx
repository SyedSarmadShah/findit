import ItemCard from './ItemCard'
import ItemSkeleton from '../ui/ItemSkeleton'

type ItemGridItem = {
  id: number
  item_type?: 'lost' | 'found'
  title: string
  description: string
  category: string
  location: string
  date: string
  status: string
  image_url?: string | null
  image?: string | null
}

type ItemGridProps = {
  items?: ItemGridItem[]
  loading?: boolean
  skeletonCount?: number
  emptyTitle: string
  emptyDescription: string
}

export default function ItemGrid({ items = [], loading = false, skeletonCount = 6, emptyTitle, emptyDescription }: ItemGridProps) {
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <ItemSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-black/10 bg-white/60 p-8 text-center text-sm text-ink/60 dark:border-white/10 dark:bg-white/5 dark:text-paper/60">
        <p className="font-semibold text-ink dark:text-paper">{emptyTitle}</p>
        <p className="mt-2">{emptyDescription}</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          id={item.id}
          itemType={item.item_type}
          title={item.title}
          description={item.description}
          category={item.category}
          location={item.location}
          date={item.date}
          status={item.status}
          imageUrl={item.image_url ?? item.image ?? null}
        />
      ))}
    </div>
  )
}