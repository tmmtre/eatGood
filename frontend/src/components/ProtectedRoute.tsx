import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import type { User } from '../types/auth'
import {useEffect} from "react";

interface Props {
    allowedRoles?: User['role'][]
}

export default function ProtectedRoute({ allowedRoles }: Props) {
    const { isAuthenticated, user, _hasHydrated, initFromToken } = useAuthStore()

    useEffect(() => {
        initFromToken()
    }, [])

    if (!_hasHydrated) return null

    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
        if (user.role === 'OWNER') return <Navigate to="/owner" replace />
        return <Navigate to="/dashboard" replace />
    }

    return <Outlet />
}