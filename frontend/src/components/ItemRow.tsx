import { memo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { MenuItemResponse, ItemDraft } from '@/types/restaurant'

const ItemRow = memo(function ItemRow({
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
                <div className="flex flex-col sm:grid sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-4">
                        <Input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="Name" />
                    </div>
                    <div className="sm:col-span-5">
                        <Input value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} placeholder="Description" />
                    </div>
                    <div className="sm:col-span-3">
                        <Input value={draft.price} onChange={e => setDraft(d => ({ ...d, price: e.target.value }))} placeholder="Price" />
                    </div>
                </div>
                <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                    <Button size="sm" disabled={saving} onClick={handleSave}>{saving ? 'Saving...' : 'Save'}</Button>
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
                        <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">{item.description}</span>
                    )}
                </div>
                <span className="text-sm text-muted-foreground shrink-0">€{item.price}</span>
            </div>
            {/* always visible on touch, hover-only on desktop */}
            <div className="flex items-center gap-1 ml-2 sm:ml-4 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="ghost" className="text-xs h-7 px-2" onClick={() => onToggle(item.id, !item.available)}>
                    {item.available ? 'Hide' : 'Show'}
                </Button>
                <Button size="sm" variant="ghost" className="text-xs h-7 px-2" onClick={() => setEditing(true)}>Edit</Button>
                <Button size="sm" variant="ghost" className="text-xs h-7 px-2 text-destructive hover:text-destructive" disabled={deleting} onClick={handleDelete}>
                    Delete
                </Button>
            </div>
        </div>
    )
})

export default ItemRow
