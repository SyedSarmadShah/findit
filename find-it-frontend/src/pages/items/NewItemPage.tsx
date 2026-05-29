import { useNavigate } from 'react-router-dom'
import ItemForm from './ItemForm'
import { createItem } from '../../services/itemService'

export default function NewItemPage() {
  const navigate = useNavigate()

  const handleSubmit = async (fd: FormData) => {
    await createItem(fd)
    navigate('/dashboard')
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ink/45">New item</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Create a lost/found post</h1>
      </header>
      <ItemForm onSubmit={handleSubmit} />
    </div>
  )
}
