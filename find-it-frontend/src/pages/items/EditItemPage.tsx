import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ItemForm from './ItemForm'
import { getItem, updateItem } from '../../services/itemService'

export default function EditItemPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [initial, setInitial] = useState<any | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    const load = async () => {
      const data = await getItem(Number(id))
      if (!cancelled) setInitial(data)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [id])

  const handleSubmit = async (fd: FormData) => {
    if (!id) return
    await updateItem(Number(id), fd)
    navigate('/dashboard')
  }

  if (!initial) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ink/45">Edit item</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Update your post</h1>
      </header>
      <ItemForm initial={initial} onSubmit={handleSubmit} />
    </div>
  )
}
