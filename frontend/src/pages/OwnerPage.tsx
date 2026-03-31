import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import type { RestaurantResponse, MenuSectionResponse, MenuItemResponse } from '@/types/restaurant'

interface ItemDraft {
    name: string
    description: string
    price: string
    available: boolean
}

const emptyDraft = (): ItemDraft => ({ name: '', description: '', price: '', available: true })

function ItemRow({
                     item,
                     onUpdate,
                     onDelete,
                     onToggle,
                 }: {
    item: MenuItemResponse
    onUpdate: (id: number, draft: ItemDraft) => Promise<void>
    onDelete: (id: number) => Promise<void>
    onToggle: (id: number, available: boolean) => Promise<void>
}) {
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState<ItemDraft>({
        name: item.name,
        description: item.description ?? '',
        price: String(item.price),
        available: item.available,
    })
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const handleSave = async () => {
        setSaving(true)
        await onUpdate(item.id, draft)
        setSaving(false)
        setEditing(false)
    }

    const handleDelete = async () => {
        setDeleting(true)
        await onDelete(item.id)
        setDeleting(false)
    }

    if (editing) {
        return (
            <div className="flex flex-col gap-2 py-2 border-b border-border last:border-0">
                <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-4">
                        <Input
                            value={draft.name}
                            onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                            placeholder="Name"
                        />
                    </div>
                    <div className="col-span-5">
                        <Input
                            value={draft.description}
                            onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
                            placeholder="Description"
                        />
                    </div>
                    <div className="col-span-3">
                        <Input
                            value={draft.price}
                            onChange={e => setDraft(d => ({ ...d, price: e.target.value }))}
                            placeholder="Price"
                        />
                    </div>
                </div>
                <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                    <Button size="sm" disabled={saving} onClick={handleSave}>
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-between py-2 border-b border-border last:border-0 group">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                    <span className={`text-sm ${!item.available ? 'text-muted-foreground line-through' : ''}`}>
                        {item.name}
                    </span>
                    {item.description && (
                        <span className="text-xs text-muted-foreground ml-2">{item.description}</span>
                    )}
                </div>
                <span className="text-sm text-muted-foreground shrink-0">€{item.price}</span>
            </div>
            <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-7 px-2"
                    onClick={() => onToggle(item.id, !item.available)}
                >
                    {item.available ? 'Hide' : 'Show'}
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-7 px-2"
                    onClick={() => setEditing(true)}
                >
                    Edit
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-7 px-2 text-destructive hover:text-destructive"
                    disabled={deleting}
                    onClick={handleDelete}
                >
                    Delete
                </Button>
            </div>
        </div>
    )
}

function SectionBlock({
                          section,
                          onSectionUpdate,
                          onSectionDelete,
                          onItemUpdate,
                          onItemDelete,
                          onItemToggle,
                          onItemAdd,
                      }: {
    section: MenuSectionResponse
    onSectionUpdate: (id: number, name: string) => Promise<void>
    onSectionDelete: (id: number) => Promise<void>
    onItemUpdate: (sectionId: number, itemId: number, draft: ItemDraft) => Promise<void>
    onItemDelete: (sectionId: number, itemId: number) => Promise<void>
    onItemToggle: (sectionId: number, itemId: number, available: boolean) => Promise<void>
    onItemAdd: (sectionId: number, draft: ItemDraft) => Promise<void>
}) {
    const [editingName, setEditingName] = useState(false)
    const [sectionName, setSectionName] = useState(section.name)
    const [savingName, setSavingName] = useState(false)
    const [addingItem, setAddingItem] = useState(false)
    const [newItem, setNewItem] = useState<ItemDraft>(emptyDraft())
    const [savingItem, setSavingItem] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const handleSaveName = async () => {
        setSavingName(true)
        await onSectionUpdate(section.id, sectionName)
        setSavingName(false)
        setEditingName(false)
    }

    const handleDelete = async () => {
        setDeleting(true)
        await onSectionDelete(section.id)
        setDeleting(false)
    }

    const handleAddItem = async () => {
        setSavingItem(true)
        await onItemAdd(section.id, newItem)
        setNewItem(emptyDraft())
        setAddingItem(false)
        setSavingItem(false)
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    {editingName ? (
                        <div className="flex items-center gap-2 flex-1">
                            <Input
                                value={sectionName}
                                onChange={e => setSectionName(e.target.value)}
                                className="h-8 text-sm font-medium"
                            />
                            <Button size="sm" variant="ghost" onClick={() => setEditingName(false)}>Cancel</Button>
                            <Button size="sm" disabled={savingName} onClick={handleSaveName}>
                                {savingName ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    ) : (
                        <>
                            <CardTitle className="text-base">{section.name}</CardTitle>
                            <div className="flex gap-1">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs h-7 px-2"
                                    onClick={() => setEditingName(true)}
                                >
                                    Rename
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs h-7 px-2 text-destructive hover:text-destructive"
                                    disabled={deleting}
                                    onClick={handleDelete}
                                >
                                    Delete section
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                {section.items?.length === 0 && !addingItem && (
                    <p className="text-xs text-muted-foreground pb-3">No items in this section.</p>
                )}

                {section.items?.map(item => (
                    <ItemRow
                        key={item.id}
                        item={item}
                        onUpdate={(id, draft) => onItemUpdate(section.id, id, draft)}
                        onDelete={(id) => onItemDelete(section.id, id)}
                        onToggle={(id, available) => onItemToggle(section.id, id, available)}
                    />
                ))}

                {addingItem && (
                    <div className="mt-3 space-y-2 pt-3 border-t border-border">
                        <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-4 space-y-1">
                                <Label className="text-xs">Name *</Label>
                                <Input
                                    value={newItem.name}
                                    onChange={e => setNewItem(d => ({ ...d, name: e.target.value }))}
                                    placeholder="Dish name"
                                />
                            </div>
                            <div className="col-span-5 space-y-1">
                                <Label className="text-xs">Description</Label>
                                <Input
                                    value={newItem.description}
                                    onChange={e => setNewItem(d => ({ ...d, description: e.target.value }))}
                                    placeholder="Optional"
                                />
                            </div>
                            <div className="col-span-3 space-y-1">
                                <Label className="text-xs">Price *</Label>
                                <Input
                                    value={newItem.price}
                                    onChange={e => setNewItem(d => ({ ...d, price: e.target.value }))}
                                    placeholder="9.90"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="ghost" onClick={() => { setAddingItem(false); setNewItem(emptyDraft()) }}>
                                Cancel
                            </Button>
                            <Button size="sm" disabled={savingItem || !newItem.name || !newItem.price} onClick={handleAddItem}>
                                {savingItem ? 'Adding...' : 'Add item'}
                            </Button>
                        </div>
                    </div>
                )}

                {!addingItem && (
                    <Button
                        size="sm"
                        variant="ghost"
                        className="mt-2 text-xs text-muted-foreground"
                        onClick={() => setAddingItem(true)}
                    >
                        + Add item
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}

export default function OwnerPage() {
    const { user } = useAuthStore()
    const [restaurant, setRestaurant] = useState<RestaurantResponse | null>(null)
    const [sections, setSections] = useState<MenuSectionResponse[]>([])
    const [loadingRestaurant, setLoadingRestaurant] = useState(true)
    const [loadingSections, setLoadingSections] = useState(false)
    const [addingSection, setAddingSection] = useState(false)
    const [newSectionName, setNewSectionName] = useState('')
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
            .catch(() => {})
            .finally(() => { setLoadingRestaurant(false); setLoadingSections(false) })
    }, [user])

    const handleAddSection = async () => {
        if (!restaurant || !newSectionName.trim()) return
        setSavingSection(true)
        try {
            const created = await createMenuSection(restaurant.id, newSectionName.trim())
            setSections(prev => [...prev, { ...created, items: [] }])
            setNewSectionName('')
            setAddingSection(false)
        } catch {} finally {
            setSavingSection(false)
        }
    }

    const handleSectionUpdate = async (id: number, name: string) => {
        try {
            await updateMenuSection(id, name)
            setSections(prev => prev.map(s => s.id === id ? { ...s, name } : s))
        } catch {}
    }

    const handleSectionDelete = async (id: number) => {
        try {
            await deleteMenuSection(id)
            setSections(prev => prev.filter(s => s.id !== id))
        } catch {}
    }

    const handleItemAdd = async (sectionId: number, draft: ItemDraft) => {
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
        } catch {}
    }

    const handleItemUpdate = async (sectionId: number, itemId: number, draft: ItemDraft) => {
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
                                ? { ...i, name: draft.name, description: draft.description, price: Number(draft.price) }
                                : i
                        )
                    }
                    : s
            ))
        } catch {}
    }

    const handleItemDelete = async (sectionId: number, itemId: number) => {
        try {
            await deleteMenuItem(itemId)
            setSections(prev => prev.map(s =>
                s.id === sectionId
                    ? { ...s, items: s.items.filter(i => i.id !== itemId) }
                    : s
            ))
        } catch {}
    }

    const handleItemToggle = async (sectionId: number, itemId: number, available: boolean) => {
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
        } catch {}
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <main className="max-w-5xl mx-auto px-6 pt-24 pb-12">
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
                                    <div className="space-y-1">
                                        <Label>Section name</Label>
                                        <Input
                                            value={newSectionName}
                                            onChange={e => setNewSectionName(e.target.value)}
                                            placeholder="e.g. Starters"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <Button size="sm" variant="ghost" onClick={() => { setAddingSection(false); setNewSectionName('') }}>
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
                                    <SectionBlock
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
