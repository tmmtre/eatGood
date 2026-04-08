import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import BottomNav from '@/components/BottomNav'
import StarRating from '@/components/StarRating'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getRestaurant, getSectionsByRestaurant } from '@/api/restaurantApi'
import type { RestaurantResponse, MenuSectionResponse, SectionCategory } from '@/types/restaurant'
import { CATEGORY_LABELS } from '@/types/restaurant'

const CATEGORY_ORDER: SectionCategory[] = [
    'STARTER', 'FIRST_COURSE', 'MAIN_COURSE', 'SIDE_DISH', 'DESSERT', 'DRINK', 'OTHER',
]

export default function RestaurantPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    const [restaurant, setRestaurant] = useState<RestaurantResponse | null>(null)
    const [sections, setSections] = useState<MenuSectionResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        if (!id) return
        const restaurantId = Number(id)
        Promise.all([
            getRestaurant(restaurantId),
            getSectionsByRestaurant(restaurantId),
        ])
            .then(([r, s]) => {
                setRestaurant(r)
                setSections(s)
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false))
    }, [id])

    const overallRating = useMemo(() => {
        const allItems = sections.flatMap(s => s.items ?? [])
        let weightedSum = 0
        let totalReviews = 0
        for (const item of allItems) {
            if (item.averageRating != null && item.reviewCount != null && item.reviewCount > 0) {
                weightedSum += item.averageRating * item.reviewCount
                totalReviews += item.reviewCount
            }
        }
        return totalReviews > 0 ? { rating: weightedSum / totalReviews, count: totalReviews } : null
    }, [sections])

    const orderedSections = CATEGORY_ORDER
        .map(cat => sections.filter(s => (s.category ?? 'OTHER') === cat))
        .flat()
        .concat(sections.filter(s => !CATEGORY_ORDER.includes((s.category ?? 'OTHER') as SectionCategory)))

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Navbar />
                <BottomNav />
                <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-24">
                    <div className="animate-pulse space-y-4">
                        <div className="h-6 bg-muted rounded w-1/2" />
                        <div className="h-4 bg-muted rounded w-1/3" />
                        <div className="h-48 bg-muted rounded" />
                    </div>
                </main>
            </div>
        )
    }

    if (error || !restaurant) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Navbar />
                <BottomNav />
                <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-24">
                    <Card>
                        <CardContent className="py-12 text-center text-sm text-destructive">
                            Restaurant not found.
                        </CardContent>
                    </Card>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <BottomNav />

            <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-24 space-y-8">
                <button
                    onClick={() => navigate(-1)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    ← Back
                </button>

                {/* Restaurant header */}
                <div className="space-y-1">
                    <p className="text-xs font-mono text-green-500 uppercase tracking-widest">Restaurant</p>
                    <h1 className="text-3xl font-semibold tracking-tight">{restaurant.name}</h1>
                    <p className="text-sm text-muted-foreground">{restaurant.address}, {restaurant.city}</p>
                    {restaurant.description && (
                        <p className="text-sm text-muted-foreground mt-1">{restaurant.description}</p>
                    )}
                    {overallRating && (
                        <div className="flex items-center gap-2 pt-1">
                            <StarRating value={overallRating.rating} size="md" />
                            <span className="text-xs text-muted-foreground">
                                ({overallRating.count})
                            </span>
                        </div>
                    )}
                </div>

                <Separator />

                {/* Menu */}
                {sections.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No menu available yet.</p>
                ) : (
                    <div className="space-y-10">
                        {orderedSections.map(section => (
                            section.items?.length > 0 && (
                                <section key={section.id}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <h2 className="text-sm font-semibold tracking-tight">{section.name}</h2>
                                        {section.category && (
                                            <span className="text-xs text-muted-foreground">
                                                {CATEGORY_LABELS[section.category]}
                                            </span>
                                        )}
                                        <Separator className="flex-1" />
                                    </div>
                                    <div className="space-y-2">
                                        {section.items.map(item => (
                                            <button
                                                key={item.id}
                                                onClick={() => navigate(`/item/${item.id}`, {
                                                    state: { item, restaurantName: restaurant.name },
                                                })}
                                                className="w-full text-left"
                                            >
                                                <div className={`flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors ${!item.available ? 'opacity-50' : ''}`}>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-sm font-medium ${!item.available ? 'line-through text-muted-foreground' : ''}`}>
                                                                {item.name}
                                                            </span>
                                                            {!item.available && (
                                                                <span className="text-xs text-destructive">Unavailable</span>
                                                            )}
                                                        </div>
                                                        {item.description && (
                                                            <p className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</p>
                                                        )}
                                                        {item.averageRating != null && item.reviewCount != null && item.reviewCount > 0 && (
                                                            <div className="flex items-center gap-1 mt-1">
                                                                <StarRating value={item.averageRating} />
                                                                <span className="text-xs text-muted-foreground">({item.reviewCount})</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 shrink-0 ml-4">
                                                        {item.imageUrl && (
                                                            <img
                                                                src={item.imageUrl}
                                                                alt={item.name}
                                                                className="w-12 h-12 object-cover rounded-lg"
                                                            />
                                                        )}
                                                        <span className="text-sm font-semibold">€{item.price}</span>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            )
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
