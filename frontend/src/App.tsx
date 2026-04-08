import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import ProtectedRoute from './components/ProtectedRoute'
import { getRoleBasedPath } from './lib/auth'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminPage from './pages/AdminPage'
import OwnerPage from './pages/OwnerPage'
import OwnerItemPage from './pages/OwnerItemPage'
import DashboardPage from './pages/DashboardPage'
import RegisterRestaurantPage from './pages/RegisterRestaurantPage'
import ItemPage from './pages/ItemPage'
import HistoryPage from './pages/HistoryPage'
import ProfilePage from './pages/ProfilePage'
import RestaurantPage from './pages/RestaurantPage'

function RootRedirect() {
    const { isAuthenticated, user, _hasHydrated } = useAuthStore()
    if (!_hasHydrated) return null
    if (!isAuthenticated()) return <Navigate to="/login" replace />
    return <Navigate to={getRoleBasedPath(user?.role ?? '')} replace />
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
                    <Route path="/owner/item/:id" element={<OwnerItemPage />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={['USER']} />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/register-restaurant" element={<RegisterRestaurantPage />} />
                    <Route path="/item/:id" element={<ItemPage />} />
                    <Route path="/restaurant/:id" element={<RestaurantPage />} />
                    <Route path="/history" element={<HistoryPage />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'USER']} />}>
                    <Route path="/profile" element={<ProfilePage />} />
                </Route>

                <Route path="/" element={<RootRedirect />} />
            </Routes>
        </BrowserRouter>
    )
}
