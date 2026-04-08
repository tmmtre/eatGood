import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import StarRating from '@/components/StarRating'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { getMenuItem, getReviewsByItem, updateMenuItem, deleteMenuItem, setItemImageFromReview } from '@/api/restaurantApi'
import ImageLightbox from '@/components/ImageLightbox'
import { useAuthStore } from '@/store/authStore'
import type { MenuItemResponse, ReviewResponse } from '@/types/restaurant'

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    const d = Math.floor(h / 24)
    if (d < 7) return `${d}d ago`
    const w = Math.floor(d / 7)
    if (w < 5) return `${w}w ago`
    const mo = Math.floor(d / 30)
    if (mo < 12) return `${mo}mo ago`
    return `${Math.floor(d / 365)}y ago`
}

function ImageDropZone({
    file,
    existingUrl,
    fileRef,
    onChange,
}: {
    file: File | null
    existingUrl: string | null
    fileRef: RefObject<HTMLInputElement | null>
    onChange: (f: File | null) => void
}) {
    const [dragging, setDragging] = useState(false)
    const preview = file ? URL.createObjectURL(file) : existingUrl

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragging(false)
        const dropped = e.dataTransfer.files[0]
        if (dropped?.type.startsWith('image/')) onChange(dropped)
    }

    return (
        <div
            className={`relative rounded-xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden aspect-square w-48
                ${dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
        >
            <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => onChange(e.target.files?.[0] ?? null)}
            />
            {preview ? (
                <>
                    <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm font-medium">Click or drop to replace</span>
                    </div>
                </>
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground select-none p-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4-4a3 3 0 014.24 0L16 16m-2-2l1.586-1.586a3 3 0 014.243 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs text-center">Drop an image or click to upload</span>
                </div>
            )}
        </div>
    )
}

function ConfirmDeleteDialog({
    itemName,
    onConfirm,
    onCancel,
    loading,
}: {
    itemName: string
    onConfirm: () => void
    onCancel: () => void
    loading: boolean
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
            {/* Dialog */}
            <div className="relative z-10 w-full max-w-sm mx-4 bg-background border border-border rounded-2xl shadow-xl p-6 space-y-4">
                <div className="space-y-1">
                    <h2 className="text-base font-semibold">Delete item</h2>
                    <p className="text-sm text-muted-foreground">
                        Are you sure you want to delete <span className="font-medium text-foreground">"{itemName}"</span>?
                        This will also remove all its reviews and cannot be undone.
                    </p>
                </div>
                <div className="flex gap-2 justify-end pt-1">
                    <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="destructive" size="sm" onClick={onConfirm} disabled={loading}>
                        {loading ? 'Deleting...' : 'Delete'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default function OwnerItemPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const location = useLocation()

    const [item, setItem] = useState<MenuItemResponse | null>(
        (location.state as { item?: MenuItemResponse } | null)?.item ?? null
    )
    const [itemLoading, setItemLoading] = useState(!item)
    const [itemError, setItemError] = useState(false)

    const [reviews, setReviews] = useState<ReviewResponse[]>([])
    const [reviewsLoading, setReviewsLoading] = useState(true)

    // Edit state
    const [editing, setEditing] = useState(false)
    const [editName, setEditName] = useState('')
    const [editDescription, setEditDescription] = useState('')
    const [editPrice, setEditPrice] = useState('')
    const [editImage, setEditImage] = useState<File | null>(null)
    const [saving, setSaving] = useState(false)
    const fileRef = useRef<HTMLInputElement>(null)

    const [toggling, setToggling] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [settingImageFromReview, setSettingImageFromReview] = useState<number | null>(null)

    useEffect(() => {
        if (!item && id) {
            getMenuItem(Number(id))
                .then(setItem)
                .catch(() => setItemError(true))
                .finally(() => setItemLoading(false))
        }
    }, [id, item])

    useEffect(() => {
        if (!id) return
        getReviewsByItem(Number(id))
            .then(setReviews)
            .catch(console.error)
            .finally(() => setReviewsLoading(false))
    }, [id])

    const startEditing = () => {
        if (!item) return
        setEditName(item.name)
        setEditDescription(item.description ?? '')
        setEditPrice(String(item.price))
        setEditImage(null)
        setEditing(true)
    }

    const handleSave = async () => {
        if (!item) return
        setSaving(true)
        try {
            await updateMenuItem(item.id, {
                name: editName,
                description: editDescription,
                price: Number(editPrice),
                available: item.available,
            }, editImage ?? undefined)
            const refreshed = await getMenuItem(item.id)
            setItem(refreshed)
            setEditing(false)
        } catch (e) {
            console.error(e)
        } finally {
            setSaving(false)
        }
    }

    const handleToggle = async () => {
        if (!item) return
        setToggling(true)
        try {
            await updateMenuItem(item.id, {
                name: item.name,
                description: item.description,
                price: item.price,
                available: !item.available,
            })
            setItem(prev => prev ? { ...prev, available: !prev.available } : prev)
        } catch (e) {
            console.error(e)
        } finally {
            setToggling(false)
        }
    }

    const handleDelete = async () => {
        if (!item) return
        setDeleting(true)
        try {
            await deleteMenuItem(item.id)
            navigate('/owner')
        } catch (e) {
            console.error(e)
            setDeleting(false)
            setConfirmDelete(false)
        }
    }

    const handleSetImageFromReview = async (reviewId: number) => {
        if (!item) return
        setSettingImageFromReview(reviewId)
        try {
            await setItemImageFromReview(item.id, reviewId)
            const refreshed = await getMenuItem(item.id)
            setItem(refreshed)
        } catch (e) {
            console.error(e)
        } finally {
            setSettingImageFromReview(null)
        }
    }

    const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : null

    if (itemLoading) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Navbar />
                <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-24">
                    <div className="animate-pulse space-y-4">
                        <div className="h-6 bg-muted rounded w-1/2" />
                        <div className="h-4 bg-muted rounded w-1/4" />
                        <div className="h-48 bg-muted rounded" />
                    </div>
                </main>
            </div>
        )
    }

    if (itemError || !item) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Navbar />
                <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-24">
                    <Card>
                        <CardContent className="py-12 text-center text-sm text-destructive">
                            Item not found.
                        </CardContent>
                    </Card>
                </main>
            </div>
        )
    }

    return (
        <>
        {confirmDelete && (
            <ConfirmDeleteDialog
                itemName={item.name}
                onConfirm={handleDelete}
                onCancel={() => setConfirmDelete(false)}
                loading={deleting}
            />
        )}
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-24 space-y-8">
                {/* Back */}
                <button
                    onClick={() => navigate('/owner')}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    ← Back to menu
                </button>

                {/* Item header */}
                <div>
                    <div className="min-w-0">
                        <p className="text-xs font-mono text-primary uppercase tracking-widest mb-2">Your menu item</p>

                        {/* Title row — buttons only shown when not editing */}
                        <div className="flex items-start justify-between gap-4">
                            {editing ? (
                                <input
                                    autoFocus
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="flex-1 min-w-0 text-2xl font-semibold tracking-tight bg-transparent border-b border-border focus:border-primary focus:outline-none pb-0.5"
                                    placeholder="Item name"
                                />
                            ) : (
                                <h1 className="text-2xl font-semibold tracking-tight">{item.name}</h1>
                            )}
                            {!editing && (
                                <div className="flex items-center gap-2 shrink-0 pt-1">
                                    <Badge variant={item.available ? 'default' : 'secondary'}>
                                        {item.available ? 'Visible' : 'Hidden'}
                                    </Badge>
                                    <Button size="sm" variant="outline" onClick={startEditing}>Edit</Button>
                                    <Button size="sm" variant="outline" disabled={toggling} onClick={handleToggle}>
                                        {toggling ? '...' : item.available ? 'Hide' : 'Show'}
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => setConfirmDelete(true)}>
                                        Delete
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        {editing ? (
                            <textarea
                                value={editDescription}
                                onChange={e => setEditDescription(e.target.value)}
                                rows={1}
                                className="w-full mt-3 text-sm text-muted-foreground bg-transparent border-b border-border focus:border-primary focus:outline-none resize-none leading-tight placeholder:text-muted-foreground/50"
                                placeholder="Description (optional)"
                            />
                        ) : (
                            item.description && (
                                <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
                            )
                        )}

                        {/* Price + meta */}
                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                            {editing ? (
                                <div className="flex items-center gap-1">
                                    <span className="text-lg font-semibold">€</span>
                                    <input
                                        value={editPrice}
                                        onChange={e => setEditPrice(e.target.value)}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="w-24 text-lg font-semibold bg-transparent border-b border-border focus:border-primary focus:outline-none pb-0.5"
                                        placeholder="0.00"
                                    />
                                </div>
                            ) : (
                                <span className="text-lg font-semibold">€{item.price}</span>
                            )}
                            {avgRating !== null && (
                                <>
                                    <span className="text-muted-foreground/40">·</span>
                                    <StarRating value={avgRating} />
                                    <span className="text-xs text-muted-foreground">
                                        ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Image — view mode */}
                        {!editing && item.imageUrl && (
                            <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="mt-4 w-48 aspect-square object-cover rounded-xl"
                            />
                        )}

                        {/* Image drop zone + Cancel/Save — only in edit mode */}
                        {editing && (
                            <div className="mt-4 space-y-3">
                                <ImageDropZone
                                    file={editImage}
                                    existingUrl={item.imageUrl ?? null}
                                    fileRef={fileRef}
                                    onChange={setEditImage}
                                />
                                <div className="flex gap-2 justify-end">
                                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                                    <Button size="sm" disabled={saving || !editName || !editPrice} onClick={handleSave}>
                                        {saving ? 'Saving...' : 'Save changes'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                <Separator />

                {/* Reviews */}
                <section className="space-y-4">
                    <h2 className="text-base font-semibold tracking-tight">Reviews</h2>

                    {reviewsLoading ? (
                        <p className="text-xs text-muted-foreground">Loading reviews...</p>
                    ) : reviews.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No reviews yet.</p>
                    ) : (
                        <div className="space-y-5">
                            {reviews.map(review => (
                                <div key={review.id} className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-medium">
                                                {review.anonymous ? 'Anonymous' : `${review.user.firstName} ${review.user.lastName}`}
                                            </span>
                                            <StarRating value={review.rating} />
                                            {review.mealTime && (
                                                <span className="text-xs text-muted-foreground capitalize">
                                                    {review.mealTime.toLowerCase()}
                                                </span>
                                            )}
                                            {item.sourceReviewId === review.id && (
                                                <span className="text-xs font-semibold text-amber-400">Image used by you</span>
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground shrink-0">
                                            {timeAgo(review.createdAt)}
                                        </span>
                                    </div>
                                    {review.comment && (
                                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                                    )}
                                    {review.imageUrl && (
                                        <div className="space-y-1.5">
                                            <ImageLightbox
                                                src={review.imageUrl}
                                                alt="Review"
                                                className="rounded-lg max-h-48 object-cover"
                                            />
                                            <button
                                                onClick={() => handleSetImageFromReview(review.id)}
                                                disabled={settingImageFromReview === review.id}
                                                className="text-xs text-primary hover:underline disabled:opacity-50"
                                            >
                                                {settingImageFromReview === review.id ? 'Applying...' : 'Use as item image'}
                                            </button>
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        {(review.trustCount + review.untrustCount) > 0 && (() => {
                                            const total = review.trustCount + review.untrustCount
                                            const trustPct = Math.round((review.trustCount / total) * 100)
                                            const untrustPct = 100 - trustPct
                                            return (
                                                <div className="space-y-1">
                                                    <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                                                        <div className="bg-green-500 transition-all" style={{ width: `${trustPct}%` }} />
                                                        <div className="bg-red-400 transition-all" style={{ width: `${untrustPct}%` }} />
                                                    </div>
                                                    <div className="flex justify-between text-xs text-muted-foreground">
                                                        <span className="text-green-600">{trustPct}% agree</span>
                                                        <span className="text-red-500">{untrustPct}% disagree</span>
                                                    </div>
                                                </div>
                                            )
                                        })()}
                                    </div>
                                    <Separator />
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
        </>
    )
}
