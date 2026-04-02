import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import OwnerSectionBlock from '@/components/OwnerSectionBlock'
import {
    getMyRestaurants,
    getSectionsByRestaurant,
    createMenuSection,
    updateMenuSection,
    deleteMenuSection,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
} from '@/api/restaurantApi'
import type { RestaurantResponse, MenuSectionResponse, ItemDraft, SectionCategory } from '@/types/restaurant'
import { SECTION_CATEGORIES, CATEGORY_LABELS } from '@/types/restaurant'

const SELECT_CLS = 'h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring'

export default function OwnerPage() {
    const { user } = useAuthStore()
    const [restaurant, setRestaurant] = useState<RestaurantResponse | null>(null)
    const [sections, setSections] = useState<MenuSectionResponse[]>([])
    const [loadingRestaurant, setLoadingRestaurant] = useState(true)
    const [loadingSections, setLoadingSections] = useState(false)
    const [addingSection, setAddingSection] = useState(false)
    const [newSectionName, setNewSectionName] = useState('')
    const [newSectionCategory, setNewSectionCategory] = useState<SectionCategory>('OTHER')
    const [savingSection, setSavingSection] = useState(false)

    useEffect(() => {
        if (!user) return
        getMyRestaurants(user.id)
            .then(data => {
                if (data.length > 0) {
                    setRestaurant(data[0])
                    setLoadingSections(true)
                    return getSectionsByRestaurant(data[0].id)
                }
                return []
            })
            .then(setSections)
            .catch(console.error)
            .finally(() => { setLoadingRestaurant(false); setLoadingSections(false) })
    }, [user])

    const handleAddSection = async () => {
        if (!restaurant || !newSectionName.trim()) return
        setSavingSection(true)
        try {
            const created = await createMenuSection(restaurant.id, newSectionName.trim(), newSectionCategory)
            setSections(prev => [...prev, { ...created, items: [] }])
            setNewSectionName('')
            setNewSectionCategory('OTHER')
            setAddingSection(false)
        } catch (e) {
            console.error(e)
        } finally {
            setSavingSection(false)
        }
    }

    const handleSectionUpdate = useCallback(async (id: number, name: string, category: SectionCategory) => {
        try {
            await updateMenuSection(id, name, category)
            setSections(prev => prev.map(s => s.id === id ? { ...s, name, category } : s))
        } catch (e) {
            console.error(e)
        }
    }, [])

    const handleSectionDelete = useCallback(async (id: number) => {
        try {
            await deleteMenuSection(id)
            setSections(prev => prev.filter(s => s.id !== id))
        } catch (e) {
            console.error(e)
        }
    }, [])

    const handleItemAdd = useCallback(async (sectionId: number, draft: ItemDraft) => {
        try {
            await createMenuItem(sectionId, {
                name: draft.name,
                description: draft.description,
                price: Number(draft.price),
                available: true,
            })
            if (restaurant) {
                const updated = await getSectionsByRestaurant(restaurant.id)
                setSections(updated)
            }
        } catch (e) {
            console.error(e)
        }
    }, [restaurant])

    const handleItemUpdate = useCallback(async (sectionId: number, itemId: number, draft: ItemDraft) => {
        try {
            await updateMenuItem(itemId, {
                name: draft.name,
                description: draft.description,
                price: Number(draft.price),
                available: draft.available,
            })
            setSections(prev => prev.map(s =>
                s.id === sectionId
                    ? {
                        ...s, items: s.items.map(i =>
                            i.id === itemId
                                ? { ...i, name: draft.name, description: draft.description, price: Number(draft.price), available: draft.available }
                                : i
                        )
                    }
                    : s
            ))
        } catch (e) {
            console.error(e)
        }
    }, [])

    const handleItemDelete = useCallback(async (sectionId: number, itemId: number) => {
        try {
            await deleteMenuItem(itemId)
            setSections(prev => prev.map(s =>
                s.id === sectionId
                    ? { ...s, items: s.items.filter(i => i.id !== itemId) }
                    : s
            ))
        } catch (e) {
            console.error(e)
        }
    }, [])

    const handleItemToggle = useCallback(async (sectionId: number, itemId: number, available: boolean) => {
        const section = sections.find(s => s.id === sectionId)
        const item = section?.items.find(i => i.id === itemId)
        if (!item) return
        try {
            await updateMenuItem(itemId, {
                name: item.name,
                description: item.description,
                price: item.price,
                available,
            })
            setSections(prev => prev.map(s =>
                s.id === sectionId
                    ? { ...s, items: s.items.map(i => i.id === itemId ? { ...i, available } : i) }
                    : s
            ))
        } catch (e) {
            console.error(e)
        }
    }, [sections])

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-12">
                <div className="mb-8">
                    <p className="text-xs font-mono text-primary uppercase tracking-widest mb-2">Owner Panel</p>
                    <h1 className="text-3xl font-semibold tracking-tight">Your Workspace</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Manage your restaurant and menu.</p>
                </div>

                <Separator className="mb-8" />

                {loadingRestaurant ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                ) : !restaurant ? (
                    <Card>
                        <CardContent className="py-8 text-center text-sm text-muted-foreground">
                            No restaurant found.
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <Card className="mb-8">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle>{restaurant.name}</CardTitle>
                                        <CardDescription>{restaurant.address}, {restaurant.city}</CardDescription>
                                        {restaurant.description && (
                                            <p className="text-sm text-muted-foreground mt-1">{restaurant.description}</p>
                                        )}
                                    </div>
                                    <Badge variant={
                                        restaurant.status === 'APPROVED' ? 'default' :
                                            restaurant.status === 'REJECTED' ? 'destructive' : 'secondary'
                                    }>
                                        {restaurant.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                        </Card>

                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-semibold">Menu</h2>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setAddingSection(true)}
                            >
                                + Add section
                            </Button>
                        </div>

                        {addingSection && (
                            <Card className="mb-4">
                                <CardContent className="pt-5 space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label>Section name</Label>
                                            <Input
                                                value={newSectionName}
                                                onChange={e => setNewSectionName(e.target.value)}
                                                placeholder="e.g. Grilled dishes"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Category</Label>
                                            <select
                                                value={newSectionCategory}
                                                onChange={e => setNewSectionCategory(e.target.value as SectionCategory)}
                                                className={SELECT_CLS}
                                            >
                                                {SECTION_CATEGORIES.map(c => (
                                                    <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <Button size="sm" variant="ghost" onClick={() => { setAddingSection(false); setNewSectionName(''); setNewSectionCategory('OTHER') }}>
                                            Cancel
                                        </Button>
                                        <Button size="sm" disabled={savingSection || !newSectionName.trim()} onClick={handleAddSection}>
                                            {savingSection ? 'Adding...' : 'Add section'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {loadingSections ? (
                            <p className="text-sm text-muted-foreground">Loading menu...</p>
                        ) : sections.length === 0 ? (
                            <Card>
                                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                                    No menu sections yet. Add one above.
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {sections.map(section => (
                                    <OwnerSectionBlock
                                        key={section.id}
                                        section={section}
                                        onSectionUpdate={handleSectionUpdate}
                                        onSectionDelete={handleSectionDelete}
                                        onItemUpdate={handleItemUpdate}
                                        onItemDelete={handleItemDelete}
                                        onItemToggle={handleItemToggle}
                                        onItemAdd={handleItemAdd}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}