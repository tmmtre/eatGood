import Navbar from '@/components/Navbar'
import { useAuthStore } from '@/store/authStore'

export default function DashboardPage() {
    const { user } = useAuthStore()

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <main className="max-w-5xl mx-auto px-6 pt-24 pb-12">
                <div className="mb-8">
                    <p className="text-xs font-mono text-green-500 uppercase tracking-widest mb-2">Dashboard</p>
                    <h1 className="text-3xl font-semibold tracking-tight">
                        Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">Here's what's happening with your account.</p>
                </div>
            </main>
        </div>
    )
}
