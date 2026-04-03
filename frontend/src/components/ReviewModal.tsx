import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import StarRating from '@/components/StarRating'
import { getReviewsByItem, createReview, deleteReview } from '@/api/restaurantApi'
import { useAuthStore } from '@/store/authStore'
import type { MenuItemResponse, ReviewResponse } from '@/types/restaurant'

interface Props {
    item: MenuItemResponse
    restaurantName: string
    onClose: () => void
    onReviewAdded: (updated: { averageRating: number; reviewCount: number }) => void
}

export default function ReviewModal({ item, restaurantName, onClose, onReviewAdded }: Props) {
    const { user } = useAuthStore()
    const [reviews, setReviews] = useState<ReviewResponse[]>([])
    const [loading, setLoading] = useState(true)

    const [rating, setRating] = useState(0)
    const [comment, setComment] = useState('')
    const [image, setImage] = useState<File | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')

    const fileRef = useRef<HTMLInputElement>(null)

    const alreadyReviewed = user ? reviews.some(r => r.user.id === user.id) : false

    useEffect(() => {
        getReviewsByItem(item.id)
            .then(setReviews)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [item.id])

    const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : null

    const handleSubmit = async () => {
        if (rating === 0) { setSubmitError('Please select a star rating.'); return }
        if (!image) { setSubmitError('Please add a photo.'); return }
        setSubmitError('')
        setSubmitting(true)
        try {
            const created = await createReview(item.id, { rating, comment }, image ?? undefined)
            const next = [created, ...reviews]
            setReviews(next)
            setRating(0)
            setComment('')
            setImage(null)
            if (fileRef.current) fileRef.current.value = ''
            const newAvg = next.reduce((s, r) => s + r.rating, 0) / next.length
            onReviewAdded({ averageRating: newAvg, reviewCount: next.length })
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
            onReviewAdded({ averageRating: newAvg, reviewCount: next.length })
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            onClick={onClose}
        >
            <div
                className="bg-background rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 border-b border-border">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-base font-semibold leading-tight">{item.name}</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">{restaurantName}</p>
                            {item.description && (
                                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-sm font-semibold">€{item.price}</span>
                                {avgRating !== null && (
                                    <>
                                        <span className="text-muted-foreground/40">·</span>
                                        <StarRating value={avgRating} showValue />
                                        <span className="text-xs text-muted-foreground">({reviews.length})</span>
                                    </>
                                )}
                            </div>
                        </div>
                        {item.imageUrl && (
                            <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-20 h-20 object-cover rounded-lg shrink-0"
                            />
                        )}
                        <button
                            onClick={onClose}
                            className="text-muted-foreground hover:text-foreground text-lg leading-none shrink-0"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {/* Add review form */}
                    {user && !alreadyReviewed && (
                        <div className="space-y-3">
                            <p className="text-xs font-medium text-foreground uppercase tracking-wide">Your review</p>
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
                            {submitError && <p className="text-xs text-destructive">{submitError}</p>}
                            <Button size="sm" disabled={submitting || rating === 0 || !image} onClick={handleSubmit}>
                                {submitting ? 'Submitting...' : 'Submit review'}
                            </Button>
                            <Separator />
                        </div>
                    )}

                    {user && alreadyReviewed && (
                        <p className="text-xs text-muted-foreground">You have already reviewed this item.</p>
                    )}

                    {!user && (
                        <p className="text-xs text-muted-foreground">Log in to leave a review.</p>
                    )}

                    {/* Reviews list */}
                    {loading ? (
                        <p className="text-xs text-muted-foreground">Loading reviews...</p>
                    ) : reviews.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No reviews yet. Be the first!</p>
                    ) : (
                        <div className="space-y-4">
                            {reviews.map(review => (
                                <div key={review.id} className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium">
                                                {review.user.firstName} {review.user.lastName}
                                            </span>
                                            <StarRating value={review.rating} />
                                        </div>
                                        <div className="flex items-center gap-2">
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
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
