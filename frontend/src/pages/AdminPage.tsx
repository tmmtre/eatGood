import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getPendingRestaurants, approveRestaurant, rejectRestaurant, getSectionsByRestaurant } from '@/api/restaurantApi'
import type { RestaurantResponse, MenuSectionResponse } from '@/types/restaurant'

export default function AdminPage() {
    const [pending, setPending] = useState<RestaurantResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [actionId, setActionId] = useState<number | null>(null)
    const [expandedId, setExpandedId] = useState<number | null>(null)
    const [sections, setSections] = useState<Record<number, MenuSectionResponse[]>>({})
    const [sectionsLoading, setSectionsLoading] = useState<Record<number, boolean>>({})

    useEffect(() => {
        getPendingRestaurants()
            .then(setPending)
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    const handleToggle = async (id: number) => {
        if (expandedId === id) {
            setExpandedId(null)
            return
        }

        setExpandedId(id)

        if (sections[id]) return

        setSectionsLoading(prev => ({ ...prev, [id]: true }))
        try {
            const data = await getSectionsByRestaurant(id)
            setSections(prev => ({ ...prev, [id]: data }))
        } catch {
        } finally {
            setSectionsLoading(prev => ({ ...prev, [id]: false }))
        }
    }

    const handleApprove = async (id: number) => {
        setActionId(id)
        try {
            await approveRestaurant(id)
            setPending(prev => prev.filter(r => r.id !== id))
            if (expandedId === id) setExpandedId(null)
        } catch {
        } finally {
            setActionId(null)
        }
    }

    const handleReject = async (id: number) => {
        setActionId(id)
        try {
            await rejectRestaurant(id)
            setPending(prev => prev.filter(r => r.id !== id))
            if (expandedId === id) setExpandedId(null)
        } catch {
        } finally {
            setActionId(null)
        }
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <main className="max-w-5xl mx-auto px-6 pt-24 pb-12">
                <div className="mb-8">
                    <p className="text-xs font-mono text-destructive uppercase tracking-widest mb-2">Admin Panel</p>
                    <h1 className="text-3xl font-semibold tracking-tight">System Control</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Full access to platform configuration and user management.</p>
                </div>

                <Separator className="mb-8" />

                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <h2 className="text-base font-semibold">Pending restaurant requests</h2>
                        {!loading && pending.length > 0 && (
                            <Badge variant="destructive">{pending.length}</Badge>
                        )}
                    </div>

                    {loading ? (
                        <Card>
                            <CardContent className="py-8 text-center text-sm text-muted-foreground">
                                Loading...
                            </CardContent>
                        </Card>
                    ) : pending.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center text-sm text-muted-foreground">
                                No pending requests.
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {pending.map(r => (
                                <Card
                                    key={r.id}
                                    className="cursor-pointer transition-colors hover:bg-muted/30"
                                    onClick={() => handleToggle(r.id)}
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="text-base">{r.name}</CardTitle>
                                                <CardDescription>{r.address}, {r.city}</CardDescription>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary">PENDING</Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {expandedId === r.id ? '▲' : '▼'}
                                                </span>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="pt-0 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs text-muted-foreground">
                                                <span className="text-foreground font-medium">{r.user?.email}</span>
                                                {' · '}
                                                Requested by {r.user?.firstName} {r.user?.lastName}
                                                {' · '}
                                                {new Date(r.createdAt).toLocaleDateString()}
                                            </div>
                                            <div
                                                className="flex gap-2"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-destructive border-destructive/40 hover:bg-destructive/10"
                                                    disabled={actionId === r.id}
                                                    onClick={() => handleReject(r.id)}
                                                >
                                                    Reject
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    disabled={actionId === r.id}
                                                    onClick={() => handleApprove(r.id)}
                                                >
                                                    Approve
                                                </Button>
                                            </div>
                                        </div>

                                        {expandedId === r.id && (
                                            <div onClick={e => e.stopPropagation()}>
                                                <Separator className="mb-4" />

                                                {sectionsLoading[r.id] ? (
                                                    <p className="text-xs text-muted-foreground">Loading menu...</p>
                                                ) : sections[r.id]?.length === 0 ? (
                                                    <p className="text-xs text-muted-foreground">No menu sections found.</p>
                                                ) : (
                                                    <div className="space-y-4">
                                                        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Menu</p>
                                                        {sections[r.id]?.map(section => (
                                                            <div key={section.id}>
                                                                <p className="text-sm font-medium mb-2">{section.name}</p>
                                                                <div className="pl-3 border-l border-border space-y-1">
                                                                    {section.items?.map(item => (
                                                                        <div key={item.id} className="flex justify-between text-sm">
                                                                            <div>
                                                                                <span>{item.name}</span>
                                                                                {item.description && (
                                                                                    <span className="text-muted-foreground ml-2 text-xs">
                                                                                        {item.description}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <span className="text-muted-foreground">€{item.price}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
