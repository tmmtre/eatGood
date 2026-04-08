import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import BottomNav from '@/components/BottomNav'
import StarRating from '@/components/StarRating'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { getMenuItem, getReviewsByItem, createReview, deleteReview, voteReview } from '@/api/restaurantApi'
import ImageLightbox from '@/components/ImageLightbox'
import { useAuthStore } from '@/store/authStore'
import type { MealTime, MenuItemResponse, ReviewResponse } from '@/types/restaurant'
import { MEAL_TIMES, MEAL_TIME_LABELS } from '@/types/restaurant'

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

export default function ItemPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const location = useLocation()
    const { user } = useAuthStore()

    const stateRestaurantName: string | undefined = (location.state as { restaurantName?: string } | null)?.restaurantName

    const [item, setItem] = useState<MenuItemResponse | null>(
        (location.state as { item?: MenuItemResponse } | null)?.item ?? null
    )
    const [restaurantName] = useState<string>(stateRestaurantName ?? '')
    const [itemLoading, setItemLoading] = useState(!item)
    const [itemError, setItemError] = useState(false)

    const [reviews, setReviews] = useState<ReviewResponse[]>([])
    const [reviewsLoading, setReviewsLoading] = useState(true)
    const [reviewSort, setReviewSort] = useState<'recent' | 'liked' | 'agreed'>('recent')

    const [rating, setRating] = useState(0)
    const [mealTime, setMealTime] = useState<MealTime | null>(null)
    const [anonymous, setAnonymous] = useState(false)
    const [comment, setComment] = useState('')
    const [image, setImage] = useState<File | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
    const fileRef = useRef<HTMLInputElement>(null)

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

    const alreadyReviewed = user ? reviews.some(r => r.user.id === user.id) : false

    const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : null

    const handleSubmit = async () => {
        if (rating === 0) { setSubmitError('Please select a star rating.'); return }
        if (!image) { setSubmitError('Please add a photo.'); return }
        setSubmitError('')
        setSubmitting(true)
        try {
            const created = await createReview(Number(id), { rating, comment, mealTime, anonymous, publicReview: true }, image ?? undefined)
            const next = [created, ...reviews]
            setReviews(next)
            setRating(0)
            setMealTime(null)
            setAnonymous(false)
            setComment('')
            setImage(null)
            if (fileRef.current) fileRef.current.value = ''
            const newAvg = next.reduce((s, r) => s + r.rating, 0) / next.length
            setItem(prev => prev ? { ...prev, averageRating: newAvg, reviewCount: next.length } : prev)
        } catch {
            setSubmitError('Failed to submit review. Try again.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (reviewId: number) => {
        try {
            await deleteReview(reviewId)
            const next = reviews.filter(r => r.id !== reviewId)
            setReviews(next)
            const newAvg = next.length > 0 ? next.reduce((s, r) => s + r.rating, 0) / next.length : 0
            setItem(prev => prev ? { ...prev, averageRating: newAvg, reviewCount: next.length } : prev)
        } catch (e) {
            console.error(e)
        }
    }

    const handleVote = async (reviewId: number, trusted: boolean) => {
        if (!user) return
        try {
            const updated = await voteReview(reviewId, trusted)
            setReviews(prev => prev.map(r => r.id === reviewId ? updated : r))
        } catch (e) {
            console.error(e)
        }
    }

    if (itemLoading) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Navbar />
                <BottomNav />
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
                <BottomNav />
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
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <BottomNav />

            <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-24 space-y-8">
                {/* Back */}
                <button
                    onClick={() => navigate(-1)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    ← Back
                </button>

                {/* Item header */}
                <div className="flex gap-6 items-start">
                    <div className="flex-1 space-y-2">
                        {item.restaurantId ? (
                            <button
                                onClick={() => navigate(`/restaurant/${item.restaurantId}`)}
                                className="text-xs font-mono text-green-500 uppercase tracking-widest hover:underline"
                            >
                                {restaurantName || 'Restaurant'}
                            </button>
                        ) : (
                            <p className="text-xs font-mono text-green-500 uppercase tracking-widest">
                                {restaurantName || 'Menu item'}
                            </p>
                        )}
                        <h1 className="text-2xl font-semibold tracking-tight">{item.name}</h1>
                        {item.description && (
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                        <div className="flex items-center gap-3 pt-1">
                            <span className="text-lg font-semibold">€{item.price}</span>
                            {avgRating !== null && (
                                <>
                                    <span className="text-muted-foreground/40">·</span>
                                    <StarRating value={avgRating} />
                                    <span className="text-xs text-muted-foreground">({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
                                </>
                            )}
                            {!item.available && (
                                <span className="text-xs text-destructive font-medium">Unavailable</span>
                            )}
                        </div>
                    </div>
                    {item.imageUrl && (
                        <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-36 h-36 object-cover rounded-xl shrink-0"
                        />
                    )}
                </div>

                <Separator />

                {/* Form or user's review */}
                <section className="space-y-4">
                    {user && !alreadyReviewed && (
                        <div className="space-y-3 p-4 rounded-xl border border-border">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Leave a review</p>

                            <div className="space-y-1.5">
                                <label className="block w-24 h-24 rounded-xl border border-dashed border-input cursor-pointer overflow-hidden hover:border-foreground transition-colors">
                                    <input ref={fileRef} type="file" accept="image/*" className="hidden"
                                        onChange={e => setImage(e.target.files?.[0] ?? null)} />
                                    {image ? (
                                        <img src={URL.createObjectURL(image)} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">+ Add photo</div>
                                    )}
                                </label>
                                {image && (
                                    <button type="button" className="text-xs text-muted-foreground hover:text-destructive"
                                        onClick={() => { setImage(null); if (fileRef.current) fileRef.current.value = '' }}>
                                        Remove
                                    </button>
                                )}
                            </div>

                            <div className="flex gap-2">
                                {MEAL_TIMES.map(mt => (
                                    <button key={mt} type="button" onClick={() => setMealTime(mt)}
                                        className={`px-3 py-1 rounded-full text-xs border transition-colors ${mealTime === mt ? 'bg-primary text-primary-foreground border-primary' : 'border-input text-muted-foreground hover:border-foreground'}`}>
                                        {MEAL_TIME_LABELS[mt]}
                                    </button>
                                ))}
                            </div>
                            <StarRating value={rating} interactive onChange={setRating} size="md" />
                            <textarea value={comment} onChange={e => setComment(e.target.value)}
                                placeholder="Comment (optional)" rows={3}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
                            <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                                <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} className="rounded border-input" />
                                <span className="text-xs text-muted-foreground">Post anonymously</span>
                            </label>
                            {submitError && <p className="text-xs text-destructive">{submitError}</p>}
                            <Button size="sm" disabled={submitting || rating === 0 || !image} onClick={handleSubmit}>
                                {submitting ? 'Submitting...' : 'Submit review'}
                            </Button>
                        </div>
                    )}

                    {user && alreadyReviewed && (() => {
                        const mine = reviews.find(r => r.user.id === user.id)
                        if (!mine) return null
                        return (
                            <div className="space-y-1.5 p-4 rounded-xl border border-border">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Your review</p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <StarRating value={mine.rating} />
                                        {mine.mealTime && <span className="text-xs text-muted-foreground">{MEAL_TIME_LABELS[mine.mealTime]}</span>}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-muted-foreground">{timeAgo(mine.createdAt)}</span>
                                        <button className="text-xs text-muted-foreground hover:text-destructive"
                                            onClick={() => setConfirmDeleteId(mine.id)}>Delete</button>
                                    </div>
                                </div>
                                {mine.comment && <p className="text-sm text-muted-foreground">{mine.comment}</p>}
                                {mine.imageUrl && <ImageLightbox src={mine.imageUrl} alt="Your review" className="rounded-lg max-h-48 object-cover" />}
                            </div>
                        )
                    })()}

                    {!user && <p className="text-xs text-muted-foreground">Log in to leave a review.</p>}
                </section>

                {/* Reviews list */}
                <section className="space-y-4">
                    <h2 className="text-base font-semibold tracking-tight">Reviews</h2>

                    {reviewsLoading ? (
                        <p className="text-xs text-muted-foreground">Loading reviews...</p>
                    ) : (() => {
                        const others = user ? reviews.filter(r => r.user.id !== user.id) : reviews
                        if (others.length === 0) return <p className="text-xs text-muted-foreground">No reviews yet. Be the first!</p>
                        const sorted = [...others].sort((a, b) => {
                            if (reviewSort === 'recent') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                            if (reviewSort === 'liked') return b.trustCount - a.trustCount
                            const rA = (a.trustCount + a.untrustCount) > 0 ? a.trustCount / (a.trustCount + a.untrustCount) : 0
                            const rB = (b.trustCount + b.untrustCount) > 0 ? b.trustCount / (b.trustCount + b.untrustCount) : 0
                            return rB - rA
                        })
                        return (
                            <div className="space-y-5">
                                <div className="flex gap-2">
                                    {(['recent', 'liked', 'agreed'] as const).map(opt => (
                                        <button key={opt} onClick={() => setReviewSort(opt)}
                                            className={`px-3 py-1 rounded-full text-xs border transition-colors ${reviewSort === opt ? 'bg-primary text-primary-foreground border-primary' : 'border-input text-muted-foreground hover:border-foreground'}`}>
                                            {opt === 'recent' ? 'Most recent' : opt === 'liked' ? 'Most liked' : 'Most agreed'}
                                        </button>
                                    ))}
                                </div>
                                {sorted.map(review => (
                                    <div key={review.id} className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">{review.user.firstName} {review.user.lastName}</span>
                                                <StarRating value={review.rating} />
                                                {item.sourceReviewId === review.id && (
                                                    <span className="text-xs font-semibold text-amber-400">Image used by owner</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-muted-foreground">{timeAgo(review.createdAt)}</span>
                                                {user && user.role === 'ADMIN' && (
                                                    <button className="text-xs text-muted-foreground hover:text-destructive"
                                                        onClick={() => setConfirmDeleteId(review.id)}>Delete</button>
                                                )}
                                            </div>
                                        </div>
                                        {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                                        {review.imageUrl && <ImageLightbox src={review.imageUrl} alt="Review" className="rounded-lg max-h-48 object-cover" />}
                                        <div className="space-y-2">
                                            {!review.currentUserVote && (
                                                <div className="flex gap-2 w-full">
                                                    <button onClick={() => handleVote(review.id, true)} disabled={!user}
                                                        className="flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors border-input text-muted-foreground hover:border-green-500 hover:text-green-600 disabled:cursor-default disabled:hover:border-input disabled:hover:text-muted-foreground">
                                                        ✓ Agree
                                                    </button>
                                                    <button onClick={() => handleVote(review.id, false)} disabled={!user}
                                                        className="flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors border-input text-muted-foreground hover:border-red-500 hover:text-red-600 disabled:cursor-default disabled:hover:border-input disabled:hover:text-muted-foreground">
                                                        ✗ Disagree
                                                    </button>
                                                </div>
                                            )}
                                            {review.currentUserVote && (review.trustCount + review.untrustCount) > 0 && (() => {
                                                const total = review.trustCount + review.untrustCount
                                                const trustPct = Math.round((review.trustCount / total) * 100)
                                                const untrustPct = 100 - trustPct
                                                const votedTrust = review.currentUserVote === 'TRUST'
                                                const votedUntrust = review.currentUserVote === 'UNTRUST'
                                                return (
                                                    <div className="space-y-1">
                                                        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                                                            <div className={`transition-all ${votedTrust ? 'bg-green-400' : 'bg-green-500/30'}`} style={{ width: `${trustPct}%` }} />
                                                            <div className={`transition-all ${votedUntrust ? 'bg-red-400' : 'bg-red-400/30'}`} style={{ width: `${untrustPct}%` }} />
                                                        </div>
                                                        <div className="flex justify-between text-xs">
                                                            <span className={votedTrust ? 'text-green-400 font-semibold' : 'text-muted-foreground'}>{trustPct}% agree</span>
                                                            <span className={votedUntrust ? 'text-red-400 font-semibold' : 'text-muted-foreground'}>{untrustPct}% disagree</span>
                                                        </div>
                                                    </div>
                                                )
                                            })()}
                                        </div>
                                        <Separator />
                                    </div>
                                ))}
                            </div>
                        )
                    })()}
                </section>
            </main>

            {confirmDeleteId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setConfirmDeleteId(null)}>
                    <div className="bg-background rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
                        <h2 className="text-sm font-semibold">Delete this review?</h2>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            This will permanently delete the review and remove it from history.
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
            )}
        </div>
    )
}
