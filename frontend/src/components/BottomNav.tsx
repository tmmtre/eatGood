import { NavLink } from 'react-router-dom'
import { LayoutGrid, Clock, Store } from 'lucide-react'

const TABS = [
    { to: '/dashboard', icon: LayoutGrid, label: 'Dashboard' },
    { to: '/history',   icon: Clock,       label: 'History' },
    { to: '/register-restaurant', icon: Store, label: 'Restaurant' },
]

export default function BottomNav() {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-background/90 backdrop-blur border-t border-border flex items-center justify-around px-2">
            {TABS.map(({ to, icon: Icon, label }) => (
                <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                        `flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors ${
                            isActive
                                ? 'text-primary'
                                : 'text-muted-foreground hover:text-foreground'
                        }`
                    }
                >
                    <Icon size={20} strokeWidth={1.75} />
                    <span className="text-[10px] font-medium">{label}</span>
                </NavLink>
            ))}
        </nav>
    )
}
