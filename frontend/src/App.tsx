import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminPage from './pages/AdminPage'
import OwnerPage from './pages/OwnerPage'
import DashboardPage from './pages/DashboardPage'
import RegisterRestaurantPage from './pages/RegisterRestaurantPage'

function RootRedirect() {
    const { isAuthenticated, user, _hasHydrated } = useAuthStore()
    if (!_hasHydrated) return null
    if (!isAuthenticated()) return <Navigate to="/login" replace />
    if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />
    if (user?.role === 'OWNER') return <Navigate to="/owner" replace />
    return <Navigate to="/dashboard" replace />
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                    <Route path="/admin" element={<AdminPage />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={['OWNER']} />}>
                    <Route path="/owner" element={<OwnerPage />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={['USER']} />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/register-restaurant" element={<RegisterRestaurantPage />} />
                </Route>

                <Route path="/" element={<RootRedirect />} />
            </Routes>
        </BrowserRouter>
    )
}
