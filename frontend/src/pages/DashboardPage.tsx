import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/authStore'
import { getMyRestaurants } from '@/api/restaurantApi'
import type { RestaurantResponse } from '@/types/restaurant'

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    APPROVED: 'default',
    PENDING: 'secondary',
    REJECTED: 'destructive',
}

export default function DashboardPage() {
    const { user } = useAuthStore()
    const [searchParams] = useSearchParams()
    const [restaurants, setRestaurants] = useState<RestaurantResponse[]>([])
    const [loading, setLoading] = useState(true)
    const justRegistered = searchParams.get('registered') === 'true'

    useEffect(() => {
        if (!user) return
        getMyRestaurants(user.id)
            .then(setRestaurants)
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [user])

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

                <Separator className="mb-8" />

                {/* Success banner */}
                {justRegistered && (
                    <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-600 dark:text-green-400">
                        🎉 Your restaurant request has been submitted and is awaiting admin approval.
                    </div>
                )}

                {/* My restaurants */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold">My restaurants</h2>
                        <a
                            href="/register-restaurant"
                            className="text-sm text-primary underline-offset-4 hover:underline"
                        >
                            + Register a restaurant
                        </a>
                    </div>

                    {loading ? (
                        <Card>
                            <CardContent className="py-8 text-center text-sm text-muted-foreground">Loading...</CardContent>
                        </Card>
                    ) : restaurants.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center">
                                <p className="text-sm text-muted-foreground mb-3">You haven't registered a restaurant yet.</p>
                                <a
                                    href="/register-restaurant"
                                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                                >
                                    Register your restaurant →
                                </a>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {restaurants.map(r => (
                                <Card key={r.id}>
                                    <CardHeader className="pb-2 flex flex-row items-start justify-between">
                                        <div>
                                            <p className="font-semibold">{r.name}</p>
                                            <CardDescription>{r.address}, {r.city}</CardDescription>
                                        </div>
                                        <Badge variant={STATUS_VARIANT[r.status] ?? 'outline'}>
                                            {r.status}
                                        </Badge>
                                    </CardHeader>
                                    {r.status === 'PENDING' && (
                                        <CardContent>
                                            <p className="text-xs text-muted-foreground">
                                                Your request is under review. You'll become an Owner once approved.
                                            </p>
                                        </CardContent>
                                    )}
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
