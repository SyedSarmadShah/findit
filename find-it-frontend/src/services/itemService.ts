import api from '../lib/api'

export type Item = {
  id: number
  owner: number
  owner_email: string
  item_type: 'lost' | 'found'
  title: string
  description: string
  image?: string | null
  image_url?: string | null
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
  item_title?: string
  item_owner?: number
  claimant: number
  claimant_email: string
  finder: number
  finder_email: string
  answers: {
    brand: string
    unique_marks: string
    item_contents: string
    additional_details: string
  }
  verification_notes?: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  created_at: string
  updated_at: string
  can_review?: boolean
}

export type Notification = {
  id: number
  recipient: number
  kind: 'claim_submitted' | 'claim_approved' | 'claim_rejected' | 'match_suggested'
  title: string
  body: string
  claim?: number | null
  match?: number | null
  is_read: boolean
  created_at: string
}

export type ItemMatch = {
  id: number
  lost_item: Item
  found_item: Item
  other_item?: Item
  score: number
  score_percentage: number
  status: 'suggested' | 'viewed' | 'confirmed' | 'rejected'
  match_reason: string
  created_at: string
  can_review?: boolean
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

export async function createClaim(payload: {
  item: number
  answers: {
    brand: string
    unique_marks: string
    item_contents: string
    additional_details: string
  }
}) {
  const { data } = await api.post<ItemClaim>('/items/claims/', payload)
  return data
}

export async function listClaimHistory() {
  const { data } = await api.get<ItemClaim[]>('/items/claims/history/')
  return data
}

export async function listClaimReviewQueue() {
  const { data } = await api.get<ItemClaim[]>('/items/claims/review-queue/')
  return data
}

export async function approveClaim(id: number, payload?: { verification_notes?: string }) {
  const { data } = await api.post<ItemClaim>(`/items/claims/${id}/approve/`, payload ?? {})
  return data
}

export async function rejectClaim(id: number, payload?: { verification_notes?: string }) {
  const { data } = await api.post<ItemClaim>(`/items/claims/${id}/reject/`, payload ?? {})
  return data
}

export async function reportItem(payload: { item: number; reason: string; details: string }) {
  const { data } = await api.post<ItemReport>('/items/reports/', payload)
  return data
}

export async function listNotifications() {
  const { data } = await api.get<Notification[]>('/messaging/notifications/')
  return data
}

export type MatchFilters = {
  item?: number
  status?: ItemMatch['status']
}

export async function listMatches(filters: MatchFilters = {}) {
  const { data } = await api.get<ItemMatch[]>('/items/matches/', { params: filters })
  return data
}

export async function confirmMatch(id: number) {
  const { data } = await api.post<ItemMatch>(`/items/matches/${id}/confirm/`)
  return data
}

export async function rejectMatch(id: number) {
  const { data } = await api.post<ItemMatch>(`/items/matches/${id}/reject/`)
  return data
}
