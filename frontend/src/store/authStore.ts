import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { decodeJwt, isTokenExpired } from '../lib/jwt'
import type { User } from '../types/auth'

interface AuthState {
    user: User | null
    token: string | null
    setAuth: (user: User, token: string) => void
    updateUser: (partial: Partial<User>) => void
    _hasHydrated: boolean
    setHasHydrated: (v: boolean) => void
    logout: () => void
    isAuthenticated: () => boolean
    initFromToken: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            _hasHydrated: false,
            setHasHydrated: (v) => set({ _hasHydrated: v }),

            setAuth: (user, token) => {
                set({ user, token })
            },

            updateUser: (partial) => {
                const { user } = get()
                if (user) set({ user: { ...user, ...partial } })
            },

            logout: () => {
                set({ user: null, token: null })
            },

            initFromToken: () => {
                const { token, user } = get()
                if (!token || user) return
                if (isTokenExpired(token)) {
                    set({ user: null, token: null })
                    return
                }
                const payload = decodeJwt(token)
                if (!payload) return
                set({
                    user: {
                        id: payload.id,
                        email: payload.sub,
                        role: payload.role,
                        firstName: '',
                        lastName: '',
                    },
                })
            },

            isAuthenticated: () => {
                const { token } = get()
                if (!token) return false
                return !isTokenExpired(token)
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ token: state.token, user: state.user }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true)
            },
        }
    )
)