import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const ROLE_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    ADMIN: 'destructive',
    OWNER: 'default',
    USER: 'secondary',
}

export default function Navbar() {
    const { user, logout } = useAuthStore()
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-background/80 backdrop-blur border-b border-border flex items-center justify-between px-4 sm:px-6">
                {/* left — avatar + name */}
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                        {user?.firstName?.[0] ?? user?.email?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <span className="text-sm font-medium text-foreground truncate max-w-[180px] sm:max-w-none">
                        {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email}
                    </span>
                </div>

                {/* desktop right */}
                <div className="hidden sm:flex items-center gap-4">
                    {user?.role === 'USER' && (
                        <>
                            <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
                            <Link to="/history" className="text-sm text-muted-foreground hover:text-foreground transition-colors">History</Link>
                            <Link to="/register-restaurant" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Register as restaurant</Link>
                        </>
                    )}
                    <Badge variant={ROLE_VARIANT[user?.role ?? ''] ?? 'outline'}>{user?.role}</Badge>
                    <Button variant="outline" size="sm" onClick={handleLogout}>Logout</Button>
                </div>

                {/* mobile hamburger */}
                <button
                    className="sm:hidden flex flex-col gap-1.5 p-2 -mr-2"
                    onClick={() => setOpen(o => !o)}
                    aria-label="Menu"
                >
                    <span className={`block w-5 h-0.5 bg-foreground transition-transform origin-center ${open ? 'rotate-45 translate-y-2' : ''}`} />
                    <span className={`block w-5 h-0.5 bg-foreground transition-opacity ${open ? 'opacity-0' : ''}`} />
                    <span className={`block w-5 h-0.5 bg-foreground transition-transform origin-center ${open ? '-rotate-45 -translate-y-2' : ''}`} />
                </button>
            </nav>

            {/* mobile drawer */}
            {open && (
                <div
                    className="sm:hidden fixed inset-0 z-40 bg-black/40"
                    onClick={() => setOpen(false)}
                >
                    <div
                        className="absolute top-14 left-0 right-0 bg-background border-b border-border px-4 py-4 space-y-3"
                        onClick={e => e.stopPropagation()}
                    >
                        {user?.role === 'USER' && (
                            <>
                                <Link to="/dashboard" className="block text-sm py-2 text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>Dashboard</Link>
                                <Link to="/history" className="block text-sm py-2 text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>History</Link>
                                <Link to="/register-restaurant" className="block text-sm py-2 text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>Register as restaurant</Link>
                            </>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                            <Badge variant={ROLE_VARIANT[user?.role ?? ''] ?? 'outline'}>{user?.role}</Badge>
                            <Button variant="outline" size="sm" onClick={handleLogout}>Logout</Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
