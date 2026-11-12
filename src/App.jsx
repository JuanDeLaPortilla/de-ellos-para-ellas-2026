import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Invitation from './pages/Invitation.jsx'
import PhotoWall from './pages/PhotoWall.jsx'
import Admin from './pages/Admin.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Invitation />} />
        <Route path="mural" element={<PhotoWall />} />
        <Route path="admin" element={<Admin />} />
        <Route path="*" element={<Invitation />} />
      </Route>
    </Routes>
  )
}
