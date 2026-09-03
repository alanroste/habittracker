import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { api } from './api'
import { clearToken, getToken, setToken, tokenFromPath } from './session'
import type { Me } from '../types'

interface Session {
  me: Me | null
  token: string | null
  loading: boolean
  error: string | null
  /** True when the token came from the URL this load rather than from storage. */
  fromLink: boolean
  refresh: () => Promise<unknown>
  logout: () => void
}

const Ctx = createContext<Session>({
  me: null, token: null, loading: true, error: null, fromLink: false,
  refresh: async () => {}, logout: () => {},
})

export function SessionProvider({ children }: { children: ReactNode }) {
  const loc = useLocation()
  const qc = useQueryClient()

  // A token in the URL wins outright. That makes /u/<token> self-sufficient:
  // it works on the first load even if the browser refuses to persist anything,
  // and re-establishes the session on every later visit to that link.
  const urlToken = tokenFromPath(loc.pathname)
  const token = urlToken ?? getToken()

  useEffect(() => {
    if (urlToken) setToken(urlToken)
  }, [urlToken])

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
    fromLink: !!urlToken,
    refresh: () => qc.invalidateQueries({ queryKey: ['me'] }),
    logout: () => { clearToken(); qc.clear(); window.location.href = '/' },
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useSession = () => useContext(Ctx)
