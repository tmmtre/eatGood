import { useEffect, useState, useMemo } from 'react'
import Navbar from '@/components/Navbar'
import ItemCard from '@/components/ItemCard'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { getAllApprovedRestaurantsWithMenu } from '@/api/restaurantApi'
import type { RestaurantWithMenu, SectionCategory } from '@/types/restaurant'
import { CATEGORY_LABELS } from '@/types/restaurant'

const CATEGORY_ORDER: SectionCategory[] = [
    'STARTER', 'FIRST_COURSE', 'MAIN_COURSE', 'SIDE_DISH', 'DESSERT', 'DRINK', 'OTHER',
]

const SELECT_CLS = 'h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring'

type FlatItem = {
    item: { id: number; name: string; description: string; price: number; available: boolean; imageUrl?: string | null; averageRating?: number | null; reviewCount?: number }
    restaurantName: string
    restaurantId: number
    sectionName: string
    sectionId: number
    sectionCategory: SectionCategory | null
}

function SkeletonGrid() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                    <div className="p-4 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-full" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                </Card>
            ))}
        </div>
    )
}

function ItemGrid({ items }: { items: FlatItem[] }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(({ item, restaurantName }) => (
                <ItemCard key={item.id} item={item} restaurantName={restaurantName} />
            ))}
        </div>
    )
}

const MOST_RATED_COUNT = 6

function GroupedItemGrid({ items }: { items: FlatItem[] }) {
    const mostRated = useMemo(() =>
        [...items]
            .filter(f => (f.item.averageRating ?? 0) > 0)
            .sort((a, b) => (b.item.averageRating ?? 0) - (a.item.averageRating ?? 0))
            .slice(0, MOST_RATED_COUNT),
        [items]
    )

    const groups = useMemo(() => {
        const map = new Map<SectionCategory, FlatItem[]>(CATEGORY_ORDER.map(c => [c, []]))
        items.forEach(flat => {
            const key: SectionCategory = flat.sectionCategory ?? 'OTHER'
            map.get(key)!.push(flat)
        })
        return CATEGORY_ORDER
            .map(c => ({ label: CATEGORY_LABELS[c], items: map.get(c)! }))
            .filter(g => g.items.length > 0)
    }, [items])

    return (
        <div className="space-y-10">
            {mostRated.length > 0 && (
                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <h2 className="text-base font-semibold tracking-tight">Most Rated</h2>
                        <Separator className="flex-1" />
                    </div>
                    <ItemGrid items={mostRated} />
                </section>
            )}

            {groups.map(({ label, items }) => (
                <section key={label}>
                    <div className="flex items-center gap-3 mb-4">
                        <h2 className="text-base font-semibold tracking-tight">{label}</h2>
                        <span className="text-xs text-muted-foreground">({items.length})</span>
                        <Separator className="flex-1" />
                    </div>
                    <ItemGrid items={items} />
                </section>
            ))}
        </div>
    )
}

export default function DashboardPage() {
    const [data, setData] = useState<RestaurantWithMenu[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    const [search, setSearch] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [priceMax, setPriceMax] = useState<string>('')

    useEffect(() => {
        getAllApprovedRestaurantsWithMenu()
            .then(setData)
            .catch(() => setError(true))
            .finally(() => setLoading(false))
    }, [])

    const allItems = useMemo<FlatItem[]>(() => {
        return data.flatMap(restaurant =>
            (restaurant.sections ?? []).flatMap(section =>
                (section.items ?? []).map(item => ({
                    item,
                    restaurantName: restaurant.name,
                    restaurantId: restaurant.id,
                    sectionName: section.name,
                    sectionId: section.id,
                    sectionCategory: section.category,
                }))
            )
        )
    }, [data])

    const isFiltering = search.trim() !== '' || selectedCategory !== 'all' || priceMax !== ''

    const filtered = useMemo<FlatItem[]>(() => {
        if (!isFiltering) return allItems

        const q = search.toLowerCase().trim()
        const max = priceMax !== '' ? Number(priceMax) : null

        return allItems.filter(({ item, restaurantName, sectionName, sectionCategory }) => {
            if (q && !item.name.toLowerCase().includes(q) &&
                !item.description?.toLowerCase().includes(q) &&
                !restaurantName.toLowerCase().includes(q) &&
                !sectionName.toLowerCase().includes(q)) return false
            if (selectedCategory !== 'all' && sectionCategory !== selectedCategory) return false
            return !(max !== null && item.price > max)
        })
    }, [allItems, isFiltering, search, selectedCategory, priceMax])

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-12">
                <div className="mb-8">
                    <p className="text-xs font-mono text-green-500 uppercase tracking-widest mb-2">Dashboard</p>
                    <h1 className="text-3xl font-semibold tracking-tight">Browse menu</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Search dishes across all restaurants.</p>
                </div>

                <Separator className="mb-6" />

                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <Input
                        placeholder="Search dishes, descriptions, restaurants..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="flex-1"
                    />

                    <select
                        value={selectedCategory}
                        onChange={e => setSelectedCategory(e.target.value)}
                        className={SELECT_CLS}
                    >
                        <option value="all">All categories</option>
                        {CATEGORY_ORDER.map(cat => (
                            <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                        ))}
                    </select>

                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                        <Input
                            placeholder="Max price"
                            value={priceMax}
                            onChange={e => setPriceMax(e.target.value)}
                            className="pl-6 w-32"
                            type="number"
                            min={0}
                        />
                    </div>
                </div>

                {!loading && (
                    <p className="text-xs text-muted-foreground mb-4">
                        {isFiltering
                            ? `${filtered.length} ${filtered.length === 1 ? 'item' : 'items'} found`
                            : `${allItems.length} ${allItems.length === 1 ? 'item' : 'items'} total`
                        }
                    </p>
                )}

                {error ? (
                    <Card>
                        <CardContent className="py-12 text-center text-sm text-destructive">
                            Failed to load restaurants. Please try again.
                        </CardContent>
                    </Card>
                ) : loading ? (
                    <SkeletonGrid />
                ) : allItems.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-sm text-muted-foreground">
                            No restaurants available yet.
                        </CardContent>
                    </Card>
                ) : isFiltering && filtered.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-sm text-muted-foreground">
                            No items match your search.
                        </CardContent>
                    </Card>
                ) : isFiltering ? (
                    <ItemGrid items={filtered} />
                ) : (
                    <GroupedItemGrid items={allItems} />
                )}
            </main>
        </div>
    )
}
