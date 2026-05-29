import { useState } from 'react'
import type { FormEvent } from 'react'
import ImageUploader from '../../components/ui/ImageUploader'

type ItemFormProps = {
  initial?: any
  onSubmit: (formData: FormData) => Promise<void>
}

export default function ItemForm({ initial = {}, onSubmit }: ItemFormProps) {
  const [form, setForm] = useState({
    item_type: initial.item_type || 'lost',
    title: initial.title || '',
    description: initial.description || '',
    category: initial.category || '',
    location: initial.location || '',
    status: initial.status || 'open',
    date: initial.date || new Date().toISOString().slice(0, 10),
    is_anonymous: initial.is_anonymous || false,
  })
  const [image, setImage] = useState<File | null>(null)
  const existingImageUrl = initial.image_url || initial.image || null
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('item_type', form.item_type)
      fd.append('title', form.title)
      fd.append('description', form.description)
      fd.append('category', form.category)
      fd.append('location', form.location)
      fd.append('status', form.status)
      fd.append('date', form.date)
      fd.append('is_anonymous', String(form.is_anonymous))
      if (image) fd.append('image', image)
      await onSubmit(fd)
    } catch (err) {
      setError('Failed to save item')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 rounded-[2rem] border border-black/5 bg-white/80 p-5 shadow-[0_18px_50px_rgba(11,23,39,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5 sm:p-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          value={form.item_type}
          onChange={(e) => setForm({ ...form, item_type: e.target.value })}
          className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss focus:ring-2 focus:ring-moss/15 dark:border-white/10 dark:bg-surface-strong dark:text-paper"
        >
          <option value="lost">Lost</option>
          <option value="found">Found</option>
        </select>
        <input
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-ink/35 focus:border-moss focus:ring-2 focus:ring-moss/15 dark:border-white/10 dark:bg-surface-strong dark:text-paper dark:placeholder:text-paper/35"
        />
      </div>

      <textarea
        placeholder="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="min-h-[140px] rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-ink/35 focus:border-moss focus:ring-2 focus:ring-moss/15 dark:border-white/10 dark:bg-surface-strong dark:text-paper dark:placeholder:text-paper/35"
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <input
          placeholder="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-ink/35 focus:border-moss focus:ring-2 focus:ring-moss/15 dark:border-white/10 dark:bg-surface-strong dark:text-paper dark:placeholder:text-paper/35"
        />
        <input
          placeholder="Location"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-ink/35 focus:border-moss focus:ring-2 focus:ring-moss/15 dark:border-white/10 dark:bg-surface-strong dark:text-paper dark:placeholder:text-paper/35"
        />
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss focus:ring-2 focus:ring-moss/15 dark:border-white/10 dark:bg-surface-strong dark:text-paper"
        />
      </div>

      <ImageUploader value={image} onChange={setImage} previewUrl={existingImageUrl} />

      <div className="flex items-center gap-4 rounded-[1.25rem] bg-black/5 px-4 py-3 dark:bg-white/5">
        <label className="flex items-center gap-2 text-sm text-ink/65 dark:text-paper/70">
          <input
            type="checkbox"
            checked={form.is_anonymous}
            onChange={(e) => setForm({ ...form, is_anonymous: e.target.checked })}
            className="h-4 w-4 rounded border-black/20 text-moss focus:ring-moss"
          />
          Post anonymously
        </label>
      </div>

      {error ? <div className="text-sm text-rust">{error}</div> : null}
      <div className="flex items-center gap-3">
        <button
          disabled={saving}
          className="rounded-full bg-navy px-5 py-3 text-sm font-semibold text-paper transition hover:-translate-y-0.5 hover:bg-navy/95 disabled:translate-y-0 disabled:opacity-60"
          type="submit"
        >
          {saving ? 'Saving...' : 'Save Item'}
        </button>
      </div>
    </form>
  )
}
