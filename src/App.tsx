import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useSession } from './lib/SessionContext'
import NoToken from './pages/NoToken'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Todo from './pages/Todo'
import StatsPage from './pages/StatsPage'
import Friends from './pages/Friends'
import FriendDetail from './pages/FriendDetail'
import Settings from './pages/Settings'
import Layout from './components/Layout'
import { Spinner } from './components/ui'

export default function App() {
  const { me, token, loading, error } = useSession()
  const loc = useLocation()

  if (!token || error) return <NoToken error={error} />
  if (loading || !me) return <div className="min-h-dvh grid place-items-center"><Spinner /></div>
  if (!me.onboarded && loc.pathname !== '/onboarding') return <Navigate to="/onboarding" replace />

  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Todo />} />
        <Route path="/u/:token" element={<Todo />} />
        <Route path="/me" element={<Dashboard />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/friends/:id" element={<FriendDetail />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
