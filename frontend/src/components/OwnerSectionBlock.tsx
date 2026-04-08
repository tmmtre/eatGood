import { memo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import ItemRow from '@/components/ItemRow'
import type { MenuSectionResponse, ItemDraft, SectionCategory } from '@/types/restaurant'
import { SECTION_CATEGORIES, CATEGORY_LABELS } from '@/types/restaurant'

const SELECT_CLS = 'h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-full'

const emptyDraft = (): ItemDraft => ({ name: '', description: '', price: '', available: true })

const OwnerSectionBlock = memo(function OwnerSectionBlock({
    section,
    onSectionUpdate,
    onSectionDelete,
    onItemAdd,
}: {
    section: MenuSectionResponse
    onSectionUpdate: (id: number, name: string, category: SectionCategory) => Promise<void>
    onSectionDelete: (id: number) => Promise<void>
    onItemAdd: (sectionId: number, draft: ItemDraft) => Promise<void>
}) {
    const [editingName, setEditingName] = useState(false)
    const [sectionName, setSectionName] = useState(section.name)
    const [sectionCategory, setSectionCategory] = useState<SectionCategory>(section.category ?? 'OTHER')
    const [savingName, setSavingName] = useState(false)
    const [addingItem, setAddingItem] = useState(false)
    const [newItem, setNewItem] = useState<ItemDraft>(emptyDraft())
    const [savingItem, setSavingItem] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const handleSaveName = async () => {
        setSavingName(true)
        await onSectionUpdate(section.id, sectionName, sectionCategory)
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
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1">
                            <Input
                                value={sectionName}
                                onChange={e => setSectionName(e.target.value)}
                                className="h-8 text-sm font-medium w-full sm:w-auto sm:flex-1"
                            />
                            <select
                                value={sectionCategory}
                                onChange={e => setSectionCategory(e.target.value as SectionCategory)}
                                className={SELECT_CLS + ' sm:w-auto'}
                            >
                                {SECTION_CATEGORIES.map(c => (
                                    <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                                ))}
                            </select>
                            <div className="flex gap-2 self-end sm:self-auto">
                                <Button size="sm" variant="ghost" onClick={() => setEditingName(false)}>Cancel</Button>
                                <Button size="sm" disabled={savingName} onClick={handleSaveName}>
                                    {savingName ? 'Saving...' : 'Save'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-2 min-w-0">
                                <CardTitle className="text-base truncate">{section.name}</CardTitle>
                                <span className="text-xs text-muted-foreground shrink-0">
                                    {CATEGORY_LABELS[section.category ?? 'OTHER']}
                                </span>
                            </div>
                            <div className="flex gap-1 shrink-0 ml-2">
                                <Button size="sm" variant="ghost" className="text-xs h-7 px-2" onClick={() => setEditingName(true)}>
                                    Edit
                                </Button>
                                <Button size="sm" variant="ghost" className="text-xs h-7 px-2 text-destructive hover:text-destructive" disabled={deleting} onClick={handleDelete}>
                                    Delete
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
                    <ItemRow key={item.id} item={item} />
                ))}

                {addingItem && (
                    <div className="mt-3 space-y-2 pt-3 border-t border-border">
                        <div className="flex flex-col sm:grid sm:grid-cols-12 gap-2">
                            <div className="sm:col-span-4 space-y-1">
                                <Label className="text-xs">Name *</Label>
                                <Input value={newItem.name} onChange={e => setNewItem(d => ({ ...d, name: e.target.value }))} placeholder="Dish name" />
                            </div>
                            <div className="sm:col-span-5 space-y-1">
                                <Label className="text-xs">Description</Label>
                                <Input value={newItem.description} onChange={e => setNewItem(d => ({ ...d, description: e.target.value }))} placeholder="Optional" />
                            </div>
                            <div className="sm:col-span-3 space-y-1">
                                <Label className="text-xs">Price *</Label>
                                <Input value={newItem.price} onChange={e => setNewItem(d => ({ ...d, price: e.target.value }))} placeholder="9.90" />
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="ghost" onClick={() => { setAddingItem(false); setNewItem(emptyDraft()) }}>Cancel</Button>
                            <Button size="sm" disabled={savingItem || !newItem.name || !newItem.price} onClick={handleAddItem}>
                                {savingItem ? 'Adding...' : 'Add item'}
                            </Button>
                        </div>
                    </div>
                )}

                {!addingItem && (
                    <Button size="sm" variant="ghost" className="mt-2 text-xs text-muted-foreground" onClick={() => setAddingItem(true)}>
                        + Add item
                    </Button>
                )}
            </CardContent>
        </Card>
    )
})

export default OwnerSectionBlock
