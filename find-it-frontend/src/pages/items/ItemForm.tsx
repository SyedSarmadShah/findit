import { useState } from 'react'
import type { FormEvent } from 'react'

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
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl bg-white/80 p-6">
      <div className="grid gap-2 sm:grid-cols-2">
        <select value={form.item_type} onChange={(e) => setForm({ ...form, item_type: e.target.value })} className="rounded-2xl border px-3 py-2">
          <option value="lost">Lost</option>
          <option value="found">Found</option>
        </select>
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-2xl border px-3 py-2" />
      </div>

      <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="min-h-[120px] rounded-2xl border px-3 py-2" />

      <div className="grid gap-2 sm:grid-cols-3">
        <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-2xl border px-3 py-2" />
        <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="rounded-2xl border px-3 py-2" />
        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="rounded-2xl border px-3 py-2" />
      </div>

      <div className="flex items-center gap-4">
        <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
        <label className="flex items-center gap-2 text-sm text-ink/65">
          <input type="checkbox" checked={form.is_anonymous} onChange={(e) => setForm({ ...form, is_anonymous: e.target.checked })} />
          Post anonymously
        </label>
      </div>

      {error ? <div className="text-sm text-rust">{error}</div> : null}
      <div className="flex items-center gap-3">
        <button disabled={saving} className="rounded-2xl bg-ink px-4 py-2 text-white" type="submit">
          {saving ? 'Saving...' : 'Save Item'}
        </button>
      </div>
    </form>
  )
}
