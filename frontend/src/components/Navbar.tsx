import {Link, useNavigate} from 'react-router-dom'
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
        <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-background/80 backdrop-blur border-b border-border flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                    {user?.firstName?.[0] ?? user?.email?.[0]?.toUpperCase() ?? '?'}
                </div>
                <span className="text-sm font-medium text-foreground">
                    {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email}
                </span>
            </div>

            <div className="flex items-center gap-4">
                {user?.role === 'USER' && (
                    <Link
                        to="/register-restaurant"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Register as restaurant
                    </Link>
                )}

                <Badge variant={ROLE_VARIANT[user?.role ?? ''] ?? 'outline'}>
                    {user?.role}
                </Badge>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                    Logout
                </Button>
            </div>
        </nav>
    )
}
