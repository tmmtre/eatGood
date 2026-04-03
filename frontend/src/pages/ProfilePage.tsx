import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import Navbar from '@/components/Navbar'
import BottomNav from '@/components/BottomNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/store/authStore'
import {
    getUser,
    updateUser as apiUpdateUser,
    uploadProfileImage,
    changePassword as apiChangePassword,
} from '@/api/userApi'

// ── crop helper ────────────────────────────────────────────────────────────

async function getCroppedBlob(imageSrc: string, croppedArea: Area): Promise<Blob> {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.addEventListener('load', () => resolve(img))
        img.addEventListener('error', reject)
        img.src = imageSrc
    })
    const canvas = document.createElement('canvas')
    canvas.width = croppedArea.width
    canvas.height = croppedArea.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(
        image,
        croppedArea.x, croppedArea.y,
        croppedArea.width, croppedArea.height,
        0, 0,
        croppedArea.width, croppedArea.height,
    )
    return new Promise((resolve, reject) =>
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Canvas empty')), 'image/jpeg', 0.92)
    )
}

// ── schemas ────────────────────────────────────────────────────────────────

const infoSchema = z.object({
    firstName: z.string().min(1, 'Required'),
    lastName: z.string().min(1, 'Required'),
    email: z.string().email('Invalid email'),
})

const passwordSchema = z
    .object({
        currentPassword: z.string().min(1, 'Required'),
        newPassword: z.string().min(8, 'Min 8 characters'),
        confirmPassword: z.string().min(1, 'Required'),
    })
    .refine(d => d.newPassword === d.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    })

type InfoForm = z.infer<typeof infoSchema>
type PasswordForm = z.infer<typeof passwordSchema>

// ── crop modal ─────────────────────────────────────────────────────────────

interface CropModalProps {
    src: string
    onCancel: () => void
    onConfirm: (blob: Blob) => void
}

function CropModal({ src, onCancel, onConfirm }: CropModalProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

    const onCropComplete = useCallback((_: Area, pixels: Area) => {
        setCroppedAreaPixels(pixels)
    }, [])

    const handleConfirm = async () => {
        if (!croppedAreaPixels) return
        const blob = await getCroppedBlob(src, croppedAreaPixels)
        onConfirm(blob)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="bg-background rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <h2 className="text-sm font-semibold">Crop photo</h2>
                    <button onClick={onCancel} className="text-muted-foreground hover:text-foreground text-lg leading-none">✕</button>
                </div>

                <div className="relative w-full" style={{ height: 300 }}>
                    <Cropper
                        image={src}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                    />
                </div>

                <div className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-10">Zoom</span>
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.05}
                            value={zoom}
                            onChange={e => setZoom(Number(e.target.value))}
                            className="flex-1 accent-primary"
                        />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
                        <Button size="sm" onClick={handleConfirm}>Save photo</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── main component ─────────────────────────────────────────────────────────

export default function ProfilePage() {
    const { user, updateUser } = useAuthStore()
    const [hasImage, setHasImage] = useState(false)
    const [totalLikes, setTotalLikes] = useState<number | null>(null)
    const [photoUploading, setPhotoUploading] = useState(false)
    const [photoError, setPhotoError] = useState('')
    const [cropSrc, setCropSrc] = useState<string | null>(null)
    const fileRef = useRef<HTMLInputElement>(null)

    const [infoSuccess, setInfoSuccess] = useState('')
    const [infoError, setInfoError] = useState('')
    const [pwSuccess, setPwSuccess] = useState('')
    const [pwError, setPwError] = useState('')

    const infoForm = useForm<InfoForm>({
        resolver: zodResolver(infoSchema),
        defaultValues: { firstName: '', lastName: '', email: '' },
    })

    const pwForm = useForm<PasswordForm>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    })

    useEffect(() => {
        if (!user) return
        getUser(user.id)
            .then(data => {
                setHasImage(!!data.profileImageId)
                setTotalLikes(data.totalLikesReceived)
                updateUser({ profileImageId: data.profileImageId })
                infoForm.reset({
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                })
            })
            .catch(console.error)
    }, [user?.id])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const url = URL.createObjectURL(file)
        setCropSrc(url)
        if (fileRef.current) fileRef.current.value = ''
    }

    const handleCropCancel = () => {
        if (cropSrc) URL.revokeObjectURL(cropSrc)
        setCropSrc(null)
    }

    const handleCropConfirm = async (blob: Blob) => {
        if (!user) return
        if (cropSrc) URL.revokeObjectURL(cropSrc)
        setCropSrc(null)
        setPhotoUploading(true)
        setPhotoError('')
        try {
            const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' })
            await uploadProfileImage(user.id, file)
            const updated = await getUser(user.id)
            setHasImage(!!updated.profileImageId)
            updateUser({ profileImageId: updated.profileImageId })
        } catch {
            setPhotoError('Failed to upload photo.')
        } finally {
            setPhotoUploading(false)
        }
    }

    const onInfoSubmit = async (data: InfoForm) => {
        if (!user) return
        setInfoSuccess('')
        setInfoError('')
        try {
            const updated = await apiUpdateUser(user.id, data)
            updateUser({ firstName: updated.firstName, lastName: updated.lastName, email: updated.email })
            setInfoSuccess('Profile updated.')
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: string } })?.response?.data
            setInfoError(typeof msg === 'string' ? msg : 'Failed to update profile.')
        }
    }

    const onPasswordSubmit = async (data: PasswordForm) => {
        if (!user) return
        setPwSuccess('')
        setPwError('')
        try {
            await apiChangePassword(user.id, {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            })
            setPwSuccess('Password changed.')
            pwForm.reset()
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: string } })?.response?.data
            setPwError(typeof msg === 'string' ? msg : 'Failed to change password.')
        }
    }

    const initials = user?.firstName?.[0] ?? user?.email?.[0]?.toUpperCase() ?? '?'
    const imageUrl = hasImage && user
        ? `${import.meta.env.VITE_API_URL}/users/${user.id}/profile-image`
        : null

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            {user?.role === 'USER' && <BottomNav />}

            <main className="max-w-xl mx-auto px-4 sm:px-6 pt-24 pb-24 space-y-8">
                <div>
                    <p className="text-xs font-mono text-green-500 uppercase tracking-widest mb-2">Account</p>
                    <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
                </div>

                <Separator />

                {/* ── photo ── */}
                <Card>
                    <CardContent className="pt-6 flex flex-col items-center gap-3">
                        <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            className="relative group focus:outline-none"
                            disabled={photoUploading}
                            aria-label="Change profile photo"
                        >
                            <div className="w-20 h-20 rounded-full overflow-hidden bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold shrink-0">
                                {imageUrl ? (
                                    <img src={imageUrl} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    initials
                                )}
                            </div>
                            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-xs font-medium">
                                    {photoUploading ? '...' : 'Edit'}
                                </span>
                            </div>
                        </button>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                        <p className="text-xs text-muted-foreground">Click to change photo</p>
                        {totalLikes !== null && (
                            <p className="text-sm text-muted-foreground">
                                ♥ <span className="font-semibold text-foreground">{totalLikes}</span> {totalLikes === 1 ? 'like' : 'likes'} received
                            </p>
                        )}
                        {photoError && <p className="text-xs text-destructive">{photoError}</p>}
                    </CardContent>
                </Card>

                {/* ── info ── */}
                <Card>
                    <CardContent className="pt-6">
                        <h2 className="text-sm font-semibold mb-4">Personal info</h2>
                        <form onSubmit={infoForm.handleSubmit(onInfoSubmit)} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">First name</label>
                                    <Input {...infoForm.register('firstName')} />
                                    {infoForm.formState.errors.firstName && (
                                        <p className="text-xs text-destructive">{infoForm.formState.errors.firstName.message}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Last name</label>
                                    <Input {...infoForm.register('lastName')} />
                                    {infoForm.formState.errors.lastName && (
                                        <p className="text-xs text-destructive">{infoForm.formState.errors.lastName.message}</p>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Email</label>
                                <Input type="email" {...infoForm.register('email')} />
                                {infoForm.formState.errors.email && (
                                    <p className="text-xs text-destructive">{infoForm.formState.errors.email.message}</p>
                                )}
                            </div>
                            {infoError && <p className="text-xs text-destructive">{infoError}</p>}
                            {infoSuccess && <p className="text-xs text-green-500">{infoSuccess}</p>}
                            <Button type="submit" size="sm" disabled={infoForm.formState.isSubmitting}>
                                {infoForm.formState.isSubmitting ? 'Saving...' : 'Save changes'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* ── password ── */}
                <Card>
                    <CardContent className="pt-6">
                        <h2 className="text-sm font-semibold mb-4">Change password</h2>
                        <form onSubmit={pwForm.handleSubmit(onPasswordSubmit)} className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Current password</label>
                                <Input type="password" {...pwForm.register('currentPassword')} />
                                {pwForm.formState.errors.currentPassword && (
                                    <p className="text-xs text-destructive">{pwForm.formState.errors.currentPassword.message}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">New password</label>
                                <Input type="password" {...pwForm.register('newPassword')} />
                                {pwForm.formState.errors.newPassword && (
                                    <p className="text-xs text-destructive">{pwForm.formState.errors.newPassword.message}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Confirm new password</label>
                                <Input type="password" {...pwForm.register('confirmPassword')} />
                                {pwForm.formState.errors.confirmPassword && (
                                    <p className="text-xs text-destructive">{pwForm.formState.errors.confirmPassword.message}</p>
                                )}
                            </div>
                            {pwError && <p className="text-xs text-destructive">{pwError}</p>}
                            {pwSuccess && <p className="text-xs text-green-500">{pwSuccess}</p>}
                            <Button type="submit" size="sm" disabled={pwForm.formState.isSubmitting}>
                                {pwForm.formState.isSubmitting ? 'Saving...' : 'Change password'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </main>

            {cropSrc && (
                <CropModal
                    src={cropSrc}
                    onCancel={handleCropCancel}
                    onConfirm={handleCropConfirm}
                />
            )}
        </div>
    )
}
