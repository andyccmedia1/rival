import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Create from './pages/Create'
import Join from './pages/Join'
import Dashboard from './pages/Dashboard'
import Results from './pages/Results'
import Login from './pages/Login'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/create" element={<Create />} />
      <Route path="/join/:inviteCode" element={<Join />} />
      <Route path="/challenge/:id" element={<Dashboard />} />
      <Route path="/challenge/:id/results" element={<Results />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
