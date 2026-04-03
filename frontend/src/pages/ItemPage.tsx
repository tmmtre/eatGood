import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import BottomNav from '@/components/BottomNav'
import StarRating from '@/components/StarRating'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { getMenuItem, getReviewsByItem, createReview, deleteReview, toggleReviewLike } from '@/api/restaurantApi'
import { useAuthStore } from '@/store/authStore'
import type { MealTime, MenuItemResponse, ReviewResponse } from '@/types/restaurant'
import { MEAL_TIMES, MEAL_TIME_LABELS } from '@/types/restaurant'

const SELECT_CLS = 'h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring'

export default function ItemPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const location = useLocation()
    const { user } = useAuthStore()

    const stateRestaurantName: string | undefined = (location.state as { restaurantName?: string } | null)?.restaurantName

    const [item, setItem] = useState<MenuItemResponse | null>(
        (location.state as { item?: MenuItemResponse } | null)?.item ?? null
    )
    const [restaurantName, setRestaurantName] = useState<string>(stateRestaurantName ?? '')
    const [itemLoading, setItemLoading] = useState(!item)
    const [itemError, setItemError] = useState(false)

    const [reviews, setReviews] = useState<ReviewResponse[]>([])
    const [reviewsLoading, setReviewsLoading] = useState(true)

    const [rating, setRating] = useState(0)
    const [mealTime, setMealTime] = useState<MealTime | null>(null)
    const [anonymous, setAnonymous] = useState(false)
    const [comment, setComment] = useState('')
    const [image, setImage] = useState<File | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')
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
            const created = await createReview(Number(id), { rating, comment, mealTime, anonymous }, image ?? undefined)
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

    const handleLike = async (reviewId: number) => {
        if (!user) return
        try {
            const updated = await toggleReviewLike(reviewId)
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
                        <p className="text-xs font-mono text-green-500 uppercase tracking-widest">
                            {restaurantName || 'Menu item'}
                        </p>
                        <h1 className="text-2xl font-semibold tracking-tight">{item.name}</h1>
                        {item.description && (
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                        <div className="flex items-center gap-3 pt-1">
                            <span className="text-lg font-semibold">€{item.price}</span>
                            {avgRating !== null && (
                                <>
                                    <span className="text-muted-foreground/40">·</span>
                                    <StarRating value={avgRating} showValue />
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

                {/* Review form */}
                <section className="space-y-4">
                    <h2 className="text-base font-semibold tracking-tight">Reviews</h2>

                    {user && !alreadyReviewed && (
                        <div className="space-y-3 p-4 rounded-xl border border-border">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Leave a review</p>
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
                            <StarRating value={rating} interactive onChange={setRating} size="md" />
                            <textarea
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                placeholder="Comment (optional)"
                                rows={3}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                            />
                            <div className="space-y-2">
                                {image && (
                                    <img
                                        src={URL.createObjectURL(image)}
                                        alt="Preview"
                                        className="w-full max-h-48 object-cover rounded-lg"
                                    />
                                )}
                                <div className="flex items-center gap-3">
                                    <label className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                                        <input
                                            ref={fileRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={e => setImage(e.target.files?.[0] ?? null)}
                                        />
                                        {image ? 'Change photo' : '+ Add photo (required)'}
                                    </label>
                                    {image && (
                                        <button
                                            type="button"
                                            className="text-xs text-muted-foreground hover:text-destructive"
                                            onClick={() => { setImage(null); if (fileRef.current) fileRef.current.value = '' }}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                                <input
                                    type="checkbox"
                                    checked={anonymous}
                                    onChange={e => setAnonymous(e.target.checked)}
                                    className="rounded border-input"
                                />
                                <span className="text-xs text-muted-foreground">Post anonymously</span>
                            </label>
                            {submitError && <p className="text-xs text-destructive">{submitError}</p>}
                            <Button size="sm" disabled={submitting || rating === 0 || !image} onClick={handleSubmit}>
                                {submitting ? 'Submitting...' : 'Submit review'}
                            </Button>
                        </div>
                    )}

                    {user && alreadyReviewed && (
                        <p className="text-xs text-muted-foreground">You have already reviewed this item.</p>
                    )}

                    {!user && (
                        <p className="text-xs text-muted-foreground">Log in to leave a review.</p>
                    )}

                    {/* Reviews list */}
                    {reviewsLoading ? (
                        <p className="text-xs text-muted-foreground">Loading reviews...</p>
                    ) : reviews.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No reviews yet. Be the first!</p>
                    ) : (
                        <div className="space-y-5">
                            {reviews.map(review => (
                                <div key={review.id} className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">
                                                {review.user.firstName} {review.user.lastName}
                                            </span>
                                            <StarRating value={review.rating} />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(review.createdAt).toLocaleDateString()}
                                            </span>
                                            {user && (user.id === review.user.id || user.role === 'ADMIN') && (
                                                <button
                                                    className="text-xs text-muted-foreground hover:text-destructive"
                                                    onClick={() => handleDelete(review.id)}
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {review.comment && (
                                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                                    )}
                                    {review.imageUrl && (
                                        <img
                                            src={review.imageUrl}
                                            alt="Review"
                                            className="rounded-lg max-h-48 object-cover"
                                        />
                                    )}
                                    <button
                                        onClick={() => handleLike(review.id)}
                                        disabled={!user}
                                        className={`flex items-center gap-1.5 text-xs transition-colors ${
                                            review.likedByCurrentUser
                                                ? 'text-red-500'
                                                : 'text-muted-foreground hover:text-red-500'
                                        } disabled:cursor-default disabled:hover:text-muted-foreground`}
                                    >
                                        <span>{review.likedByCurrentUser ? '♥' : '♡'}</span>
                                        <span>{review.likeCount > 0 ? review.likeCount : ''}</span>
                                    </button>
                                    <Separator />
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    )
}
