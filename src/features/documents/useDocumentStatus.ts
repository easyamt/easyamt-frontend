import { useQuery } from '@tanstack/react-query'
import { getDocumentStatus } from './api'

export function pollingInterval(createdAt: string, status: string): number | false {
  if (status === 'completed' || status === 'failed') return false
  const elapsed = Date.now() - new Date(createdAt).getTime()
  if (!Number.isFinite(elapsed) || elapsed < 10_000) return 1000
  if (elapsed < 30_000) return 2000
  return 3000
}

export function useDocumentStatus(token: string | null, id: string | null) {
  return useQuery({
    queryKey: ['document-status', id],
    queryFn: () => getDocumentStatus(token!, id!),
    enabled: Boolean(token && id),
    refetchInterval: (query) => query.state.data ? pollingInterval(query.state.data.created_at, query.state.data.status) : 1000,
  })
}
