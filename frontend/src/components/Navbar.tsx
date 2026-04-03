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

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-background/80 backdrop-blur border-b border-border flex items-center justify-between px-4 sm:px-6">
            {/* left — avatar + name */}
            <Link to="/profile" className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity">
                <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0 overflow-hidden">
                    {user?.profileImageId ? (
                        <img
                            src={`${import.meta.env.VITE_API_URL}/users/${user.id}/profile-image`}
                            alt="avatar"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        user?.firstName?.[0] ?? user?.email?.[0]?.toUpperCase() ?? '?'
                    )}
                </div>
                <span className="text-sm font-medium text-foreground truncate max-w-[180px] sm:max-w-none">
                    {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email}
                </span>
            </Link>

            {/* right — role badge + logout */}
            <div className="flex items-center gap-3">
                <Badge variant={ROLE_VARIANT[user?.role ?? ''] ?? 'outline'}>{user?.role}</Badge>
                <Button variant="outline" size="sm" onClick={handleLogout}>Logout</Button>
            </div>
        </nav>
    )
}
