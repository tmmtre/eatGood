import { useEffect, useMemo, useRef, useState } from 'react'
import Navbar from '@/components/Navbar'
import BottomNav from '@/components/BottomNav'
import StarRating from '@/components/StarRating'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import {
    getAllApprovedRestaurantsWithMenu,
    getMyReviews,
    createReview,
    deleteReview,
    publishReview,
} from '@/api/restaurantApi'
import type {
    MealTime,
    MenuItemResponse,
    RestaurantWithMenu,
    ReviewResponse,
    SectionCategory,
} from '@/types/restaurant'
import {
    CATEGORY_LABELS,
    MEAL_TIME_LABELS,
    MEAL_TIMES,
    SECTION_CATEGORIES,
} from '@/types/restaurant'

const SELECT_CLS = 'h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring'

// ── helpers ────────────────────────────────────────────────────────────────

function formatDay(dateStr: string): string {
    const d = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const MEAL_ORDER: MealTime[] = ['MORNING', 'LUNCH', 'DINNER']

// ── add-eaten modal ────────────────────────────────────────────────────────

interface AddModalProps {
    onClose: () => void
    onAdded: (review: ReviewResponse) => void
}

function AddModal({ onClose, onAdded }: AddModalProps) {
    const [restaurants, setRestaurants] = useState<RestaurantWithMenu[]>([])
    const [search, setSearch] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<SectionCategory | 'all'>('all')
    const [selectedItem, setSelectedItem] = useState<{ item: MenuItemResponse; restaurantName: string; itemId: number } | null>(null)

    const [mealTime, setMealTime] = useState<MealTime | null>(null)
    const [rating, setRating] = useState(0)
    const [anonymous, setAnonymous] = useState(false)
    const [comment, setComment] = useState('')
    const [image, setImage] = useState<File | null>(null)
    const [publicShare, setPublicShare] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')
    const fileRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        getAllApprovedRestaurantsWithMenu().then(setRestaurants).catch(console.error)
    }, [])

    const filteredItems = useMemo(() => {
        const q = search.toLowerCase().trim()
        return restaurants.flatMap(r =>
            (r.sections ?? [])
                .filter(s => selectedCategory === 'all' || s.category === selectedCategory)
                .flatMap(s => (s.items ?? []).map(item => ({
                    item,
                    itemId: item.id,
                    restaurantName: r.name,
                    restaurantId: r.id,
                })))
        ).filter(({ item, restaurantName }) =>
            !q ||
            item.name.toLowerCase().includes(q) ||
            restaurantName.toLowerCase().includes(q)
        )
    }, [restaurants, search, selectedCategory])

    const handleSubmit = async () => {
        if (!selectedItem) return
        if (rating === 0) { setSubmitError('Please select a star rating.'); return }
        if (!mealTime) { setSubmitError('Please select morning, lunch or dinner.'); return }
        if (!image) { setSubmitError('Please add a photo.'); return }
        setSubmitError('')
        setSubmitting(true)
        try {
            const created = await createReview(selectedItem.itemId, { rating, comment, mealTime, anonymous, publicReview: publicShare }, image ?? undefined)
            onAdded(created)
        } catch {
            setSubmitError('Failed to save. Try again.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
            <div
                className="bg-background rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-5 border-b border-border flex items-center justify-between">
                    <h2 className="text-sm font-semibold">
                        {selectedItem ? `Review — ${selectedItem.item.name}` : 'What did you eat?'}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {!selectedItem ? (
                        <>
                            {/* search + category */}
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Search dish or restaurant..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="flex-1"
                                />
                                <select
                                    value={selectedCategory}
                                    onChange={e => setSelectedCategory(e.target.value as SectionCategory | 'all')}
                                    className={SELECT_CLS}
                                >
                                    <option value="all">All categories</option>
                                    {SECTION_CATEGORIES.map(c => (
                                        <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                                    ))}
                                </select>
                            </div>

                            {/* item list */}
                            {filteredItems.length === 0 ? (
                                <p className="text-xs text-muted-foreground">No items found.</p>
                            ) : (
                                <div className="space-y-1">
                                    {filteredItems.map(({ item, restaurantName, itemId }) => (
                                        <button
                                            key={itemId}
                                            onClick={() => setSelectedItem({ item, restaurantName, itemId })}
                                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                                        >
                                            <p className="text-sm font-medium">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">{restaurantName} · €{item.price}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="space-y-4">
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                                ← Change item
                            </button>

                            <div className="flex items-center gap-3">
                                {selectedItem.item.imageUrl && (
                                    <img src={selectedItem.item.imageUrl} alt={selectedItem.item.name} className="w-14 h-14 object-cover rounded-lg shrink-0" />
                                )}
                                <div>
                                    <p className="text-sm font-medium">{selectedItem.item.name}</p>
                                    <p className="text-xs text-muted-foreground">{selectedItem.restaurantName} · €{selectedItem.item.price}</p>
                                </div>
                            </div>

                            <Separator />

                            {/* photo */}
                            <div className="space-y-1.5">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Photo</p>
                                <label className="block w-24 h-24 rounded-xl border border-dashed border-input cursor-pointer overflow-hidden hover:border-foreground transition-colors">
                                    <input ref={fileRef} type="file" accept="image/*" className="hidden"
                                        onChange={e => setImage(e.target.files?.[0] ?? null)} />
                                    {image ? (
                                        <img
                                            src={URL.createObjectURL(image)}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                                            + Add photo
                                        </div>
                                    )}
                                </label>
                                {image && (
                                    <button type="button" className="text-xs text-muted-foreground hover:text-destructive"
                                        onClick={() => { setImage(null); if (fileRef.current) fileRef.current.value = '' }}>
                                        Remove
                                    </button>
                                )}
                            </div>

                            {/* meal time */}
                            <div className="space-y-1.5">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">When?</p>
                                <div className="flex gap-2">
                                    {MEAL_TIMES.map(mt => (
                                        <button
                                            key={mt}
                                            type="button"
                                            onClick={() => setMealTime(mt)}
                                            className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                                                mealTime === mt
                                                    ? 'bg-primary text-primary-foreground border-primary'
                                                    : 'border-input text-muted-foreground hover:border-foreground'
                                            }`}
                                        >
                                            {MEAL_TIME_LABELS[mt]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* rating */}
                            <div className="space-y-1.5">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Rating</p>
                                <StarRating value={rating} interactive onChange={setRating} size="md" />
                            </div>

                            {/* comment */}
                            <textarea
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                placeholder="Comment (optional)"
                                rows={3}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                            />

                            {/* share as online review toggle */}
                            <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                                <input
                                    type="checkbox"
                                    checked={publicShare}
                                    onChange={e => setPublicShare(e.target.checked)}
                                    className="rounded border-input"
                                />
                                <span className="text-xs text-muted-foreground">Share as online review</span>
                            </label>

                            <label className={`flex items-center gap-2 select-none w-fit ${publicShare ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}`}>
                                <input
                                    type="checkbox"
                                    checked={anonymous}
                                    disabled={!publicShare}
                                    onChange={e => setAnonymous(e.target.checked)}
                                    className="rounded border-input disabled:cursor-not-allowed"
                                />
                                <span className="text-xs text-muted-foreground">Post anonymously</span>
                            </label>

                            {submitError && <p className="text-xs text-destructive">{submitError}</p>}

                            <Button size="sm" disabled={submitting || rating === 0 || !mealTime || !image} onClick={handleSubmit}>
                                {submitting ? 'Saving...' : publicShare ? 'Save & share review' : 'Save to history'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── main page ──────────────────────────────────────────────────────────────

export default function HistoryPage() {
    const [reviews, setReviews] = useState<ReviewResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [showAdd, setShowAdd] = useState(false)
    const [confirmPublishId, setConfirmPublishId] = useState<number | null>(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

    useEffect(() => {
        getMyReviews()
            .then(setReviews)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const grouped = useMemo(() => {
        // group by day string
        const byDay = new Map<string, ReviewResponse[]>()
        reviews.forEach(r => {
            const day = new Date(r.createdAt).toDateString()
            if (!byDay.has(day)) byDay.set(day, [])
            byDay.get(day)!.push(r)
        })

        return Array.from(byDay.entries()).map(([day, items]) => {
            const byMeal = new Map<MealTime | null, ReviewResponse[]>()
            items.forEach(r => {
                const key = r.mealTime
                if (!byMeal.has(key)) byMeal.set(key, [])
                byMeal.get(key)!.push(r)
            })

            // sort meal slots: MORNING → LUNCH → DINNER → null
            const mealSlots = [
                ...MEAL_ORDER.flatMap(mt => {
                    const slot = byMeal.get(mt)
                    return slot ? [{ mealTime: mt as MealTime | null, items: slot }] : []
                }),
                ...(byMeal.has(null) ? [{ mealTime: null, items: byMeal.get(null)! }] : []),
            ]

            return { day, label: formatDay(items[0].createdAt), mealSlots }
        })
    }, [reviews])

    const handleAdded = (review: ReviewResponse) => {
        setReviews(prev => [review, ...prev])
        setShowAdd(false)
    }

    const handleDelete = async (reviewId: number) => {
        try {
            await deleteReview(reviewId)
            setReviews(prev => prev.filter(r => r.id !== reviewId))
        } catch (e) {
            console.error(e)
        }
    }

    const handlePublish = async (reviewId: number) => {
        try {
            const updated = await publishReview(reviewId)
            setReviews(prev => prev.map(r => r.id === reviewId ? updated : r))
        } catch (e) {
            console.error(e)
        }
    }

    const isToday = (dateStr: string) =>
        new Date(dateStr).toDateString() === new Date().toDateString()

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <BottomNav />

            <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-24 space-y-8">
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-xs font-mono text-green-500 uppercase tracking-widest mb-2">History</p>
                        <h1 className="text-3xl font-semibold tracking-tight">What you ate</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Your personal food diary, one meal at a time.</p>
                    </div>
                    <Button size="sm" onClick={() => setShowAdd(true)}>+ Add</Button>
                </div>

                <Separator />

                {loading ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                ) : grouped.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-sm text-muted-foreground">
                            No history yet. Start by adding what you ate!
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-10">
                        {grouped.map(({ day, label, mealSlots }) => (
                            <section key={day}>
                                <h2 className="text-sm font-semibold tracking-tight mb-4">{label}</h2>
                                <div className="space-y-6">
                                    {mealSlots.map(({ mealTime, items }) => (
                                        <div key={mealTime ?? 'none'}>
                                            {mealTime && (
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                        {MEAL_TIME_LABELS[mealTime]}
                                                    </span>
                                                    <Separator className="flex-1" />
                                                </div>
                                            )}
                                            <div className="space-y-3">
                                                {items.map(review => (
                                                    <div key={review.id} className="flex gap-3 items-start">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium">{review.itemName}</p>
                                                            <p className="text-xs text-muted-foreground">{review.restaurantName}</p>
                                                            {review.comment && (
                                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{review.comment}</p>
                                                            )}
                                                            <div className="flex items-center gap-3 mt-1">
                                                                {(review.trustCount + review.untrustCount) > 0 && (
                                                                    <span className="text-xs text-muted-foreground">{Math.round(review.trustCount / (review.trustCount + review.untrustCount) * 100)}% agree</span>
                                                                )}
                                                                {review.anonymous && (
                                                                    <span className="text-xs text-muted-foreground italic">Anonymous</span>
                                                                )}
                                                                {!review.publicReview && (
                                                                    <button
                                                                        onClick={() => isToday(review.createdAt) ? setConfirmPublishId(review.id) : undefined}
                                                                        disabled={!isToday(review.createdAt)}
                                                                        className={`text-xs transition-colors ${isToday(review.createdAt) ? 'text-muted-foreground hover:text-green-500 cursor-pointer' : 'text-muted-foreground/30 cursor-not-allowed'}`}
                                                                    >
                                                                        Share online
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => setConfirmDeleteId(review.id)}
                                                                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="shrink-0 flex flex-col items-end gap-1">
                                                            <StarRating value={review.rating} />
                                                            {review.imageUrl && (
                                                                <img src={review.imageUrl} alt={review.itemName}
                                                                    className="w-12 h-12 object-cover rounded-lg mt-1" />
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Separator className="mt-6" />
                            </section>
                        ))}
                    </div>
                )}
            </main>

            {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdded={handleAdded} />}

            {confirmDeleteId !== null && (() => {
                const isPublic = reviews.find(r => r.id === confirmDeleteId)?.publicReview ?? false
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setConfirmDeleteId(null)}>
                        <div className="bg-background rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
                            <h2 className="text-sm font-semibold">Delete this entry?</h2>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                This will permanently delete this entry from your history.
                                {isPublic && (
                                    <> It will also be <span className="text-foreground font-medium">removed from the online reviews</span> of this item.</>
                                )}
                            </p>
                            <div className="flex gap-2 pt-1">
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={() => { void handleDelete(confirmDeleteId); setConfirmDeleteId(null) }}
                                >
                                    Delete permanently
                                </Button>
                                <Button size="sm" variant="outline" className="flex-1" onClick={() => setConfirmDeleteId(null)}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            })()}

            {confirmPublishId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setConfirmPublishId(null)}>
                    <div className="bg-background rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
                        <h2 className="text-sm font-semibold">Share this review online?</h2>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            This will make your review visible to everyone. <span className="text-foreground font-medium">This cannot be undone</span> — once shared, you will be only able to delete it.
                        </p>
                        <div className="flex gap-2 pt-1">
                            <Button
                                size="sm"
                                onClick={() => { void handlePublish(confirmPublishId); setConfirmPublishId(null) }}
                                className="flex-1"
                            >
                                Share permanently
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setConfirmPublishId(null)} className="flex-1">
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
