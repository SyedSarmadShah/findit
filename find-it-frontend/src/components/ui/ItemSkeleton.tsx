export default function ItemSkeleton() {
  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-black/5 bg-white/70 shadow-glow backdrop-blur dark:border-white/10 dark:bg-white/5">
      <div className="grid gap-4 p-4 sm:grid-cols-[190px_1fr] sm:p-5">
        <div className="h-44 animate-pulse rounded-2xl bg-black/10 dark:bg-white/10" />
        <div className="flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="h-3 w-36 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
            <div className="h-7 w-4/5 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
            <div className="h-4 w-full animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
            <div className="h-4 w-5/6 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="h-8 w-32 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
            <div className="h-8 w-24 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
          </div>
        </div>
      </div>
    </article>
  )
}
