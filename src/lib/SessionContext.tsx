import { createContext, useContext, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import { clearToken, getToken } from './session'
import type { Me } from '../types'

interface Session {
  me: Me | null
  token: string | null
  loading: boolean
  error: string | null
  refresh: () => Promise<unknown>
  logout: () => void
}

const Ctx = createContext<Session>({ me: null, token: null, loading: true, error: null, refresh: async () => {}, logout: () => {} })

export function SessionProvider({ children }: { children: ReactNode }) {
  const token = getToken()
  const qc = useQueryClient()
  const q = useQuery({
    queryKey: ['me', token],
    queryFn: () => api.me(token!),
    enabled: !!token,
    staleTime: 60_000,
    retry: (n, err) => !/not valid/.test(String(err)) && n < 2,
  })
  const value: Session = {
    me: q.data ?? null,
    token,
    loading: !!token && q.isLoading,
    error: q.error ? String((q.error as Error).message) : null,
    refresh: () => qc.invalidateQueries({ queryKey: ['me'] }),
    logout: () => { clearToken(); qc.clear(); window.location.href = '/' },
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useSession = () => useContext(Ctx)
