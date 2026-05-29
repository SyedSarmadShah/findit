import api from '../lib/api'

export type Item = {
  id: number
  owner: number
  owner_email: string
  item_type: 'lost' | 'found'
  title: string
  description: string
  image?: string | null
  category: string
  location: string
  status: 'open' | 'matched' | 'resolved'
  date: string
  is_anonymous: boolean
  created_at: string
  updated_at: string
}

export type ItemClaim = {
  id: number
  item: number
  claimant: number
  claimant_email: string
  message: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export type ItemReport = {
  id: number
  item: number
  reporter: number
  reporter_email: string
  reason: string
  details: string
  created_at: string
}

export type ItemFilters = {
  item_type?: 'lost' | 'found'
  status?: string
  category?: string
  date?: string
  search?: string
}

export async function listItems(filters: ItemFilters = {}) {
  const { data } = await api.get<Item[]>('/items/', { params: filters })
  return data
}

export async function getItem(id: number) {
  const { data } = await api.get<Item>(`/items/${id}/`)
  return data
}

export async function createItem(payload: FormData) {
  const { data } = await api.post('/items/', payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function updateItem(id: number, payload: FormData) {
  const { data } = await api.patch(`/items/${id}/`, payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function deleteItem(id: number) {
  const { data } = await api.delete(`/items/${id}/`)
  return data
}

export async function createClaim(payload: { item: number; message: string }) {
  const { data } = await api.post<ItemClaim>('/items/claims/', payload)
  return data
}

export async function reportItem(payload: { item: number; reason: string; details: string }) {
  const { data } = await api.post<ItemReport>('/items/reports/', payload)
  return data
}
