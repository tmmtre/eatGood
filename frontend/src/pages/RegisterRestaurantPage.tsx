import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/authStore'
import { createRestaurant, createMenuSection, createMenuItem, getMyRestaurants } from '@/api/restaurantApi'
import type { RestaurantResponse, SectionCategory } from '@/types/restaurant'
import { SECTION_CATEGORIES, CATEGORY_LABELS } from '@/types/restaurant'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import Navbar from '@/components/Navbar'
import type { Control, UseFormRegister, FieldErrors } from 'react-hook-form'

const SELECT_CLS = 'h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-full'

const menuItemSchema = z.object({
    name: z.string().min(1, 'Required'),
    description: z.string().optional(),
    price: z
        .string()
        .min(1, 'Required')
        .refine(v => !isNaN(Number(v)) && Number(v) > 0, 'Must be a valid price'),
})

const SECTION_CATEGORY_VALUES = SECTION_CATEGORIES as [SectionCategory, ...SectionCategory[]]

const menuSectionSchema = z.object({
    name: z.string().min(1, 'Section name required'),
    category: z.enum(SECTION_CATEGORY_VALUES),
    items: z.array(menuItemSchema).min(1, 'Add at least one item'),
})

const schema = z.object({
    name: z.string().min(2, 'Restaurant name required'),
    description: z.string().optional(),
    address: z.string().min(3, 'Address required'),
    city: z.string().min(2, 'City required'),
    sections: z.array(menuSectionSchema).min(1, 'Add at least one menu section'),
})

type FormData = z.infer<typeof schema>

const STEPS = ['Restaurant info', 'Menu', 'Review']

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    APPROVED: 'default',
    PENDING: 'secondary',
    REJECTED: 'destructive',
}

const STATUS_MESSAGE: Record<string, { title: string; description: string }> = {
    PENDING: {
        title: 'Request under review',
        description: "Your restaurant registration is being reviewed by an admin. You'll be notified once it's approved.",
    },
    APPROVED: {
        title: 'Restaurant approved',
        description: 'Your restaurant has been approved. You can manage it from your owner dashboard.',
    },
    REJECTED: {
        title: 'Request rejected',
        description: 'Your restaurant request was rejected by an admin. Contact support for more information.',
    },
}

function SectionBlock({
    sectionIndex: si,
    control,
    register,
    errors,
    removable,
    onRemove,
}: {
    sectionIndex: number
    control: Control<FormData>
    register: UseFormRegister<FormData>
    errors: FieldErrors<FormData>
    removable: boolean
    onRemove: () => void
}) {
    const { fields: itemFields, append: addItem, remove: removeItem } = useFieldArray({
        control,
        name: `sections.${si}.items`,
    })

    return (
        <Card>
            <CardContent className="pt-5 space-y-4">
                <div className="flex flex-col sm:flex-row items-start gap-3">
                    <div className="flex-1 space-y-1 w-full sm:w-auto">
                        <Label>Section name *</Label>
                        <Input placeholder="e.g. Grilled dishes" {...register(`sections.${si}.name`)} />
                        {errors.sections?.[si]?.name && (
                            <p className="text-xs text-destructive">{errors.sections[si]?.name?.message}</p>
                        )}
                    </div>
                    <div className="space-y-1 w-full sm:w-auto">
                        <Label>Category</Label>
                        <select className={SELECT_CLS} {...register(`sections.${si}.category`)}>
                            {SECTION_CATEGORIES.map(c => (
                                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                            ))}
                        </select>
                    </div>
                    {removable && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="sm:mt-5 text-destructive hover:text-destructive self-end sm:self-auto"
                            onClick={onRemove}
                        >
                            Remove
                        </Button>
                    )}
                </div>

                <Separator />

                <div className="space-y-3">
                    {itemFields.map((item, ii) => (
                        <div key={item.id} className="flex flex-col sm:grid sm:grid-cols-12 gap-2 items-start">
                            <div className="w-full sm:col-span-4 space-y-1">
                                <Label className="text-xs">Name *</Label>
                                <Input placeholder="Dish name" {...register(`sections.${si}.items.${ii}.name`)} />
                                {errors.sections?.[si]?.items?.[ii]?.name && (
                                    <p className="text-xs text-destructive">
                                        {errors.sections[si]?.items?.[ii]?.name?.message}
                                    </p>
                                )}
                            </div>

                            <div className="w-full sm:col-span-5 space-y-1">
                                <Label className="text-xs">Description</Label>
                                <Input placeholder="Optional" {...register(`sections.${si}.items.${ii}.description`)} />
                            </div>

                            <div className="w-full sm:col-span-2 space-y-1">
                                <Label className="text-xs">Price *</Label>
                                <Input placeholder="9.90" {...register(`sections.${si}.items.${ii}.price`)} />
                                {errors.sections?.[si]?.items?.[ii]?.price && (
                                    <p className="text-xs text-destructive">
                                        {errors.sections[si]?.items?.[ii]?.price?.message}
                                    </p>
                                )}
                            </div>

                            <div className="sm:col-span-1 self-end">
                                {itemFields.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-muted-foreground hover:text-destructive px-2"
                                        onClick={() => removeItem(ii)}
                                    >
                                        ✕
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => addItem({ name: '', description: '', price: '' })}
                >
                    + Add item
                </Button>
            </CardContent>
        </Card>
    )
}

function ExistingRequestScreen({ restaurant }: { restaurant: RestaurantResponse }) {
    const navigate = useNavigate()
    const msg = STATUS_MESSAGE[restaurant.status]

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="max-w-lg mx-auto px-4 sm:px-6 pt-24 pb-16">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between mb-1">
                            <CardTitle className="text-base">{msg.title}</CardTitle>
                            <Badge variant={STATUS_VARIANT[restaurant.status]}>
                                {restaurant.status}
                            </Badge>
                        </div>
                        <CardDescription>{msg.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-1 text-sm">
                            <p className="font-medium">{restaurant.name}</p>
                            <p className="text-muted-foreground">{restaurant.address}, {restaurant.city}</p>
                            {restaurant.description && (
                                <p className="text-muted-foreground">{restaurant.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground pt-1">
                                Submitted on {new Date(restaurant.createdAt).toLocaleDateString()}
                            </p>
                        </div>

                        {restaurant.status === 'REJECTED' && (
                            <p className="text-xs text-muted-foreground">
                                You cannot submit a new request while a previous one exists. Please contact an admin.
                            </p>
                        )}

                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => navigate('/dashboard')}
                        >
                            Back to dashboard
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}

export default function RegisterRestaurantPage() {
    const { user } = useAuthStore()
    const navigate = useNavigate()
    const [step, setStep] = useState(0)
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')
    const [existingRestaurant, setExistingRestaurant] = useState<RestaurantResponse | null>(null)
    const [checking, setChecking] = useState(true)

    useEffect(() => {
        if (!user) return
        getMyRestaurants(user.id)
            .then(restaurants => {
                if (restaurants.length > 0) {
                    setExistingRestaurant(restaurants[0])
                }
            })
            .catch(console.error)
            .finally(() => setChecking(false))
    }, [user])

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
            description: '',
            address: '',
            city: '',
            sections: [{ name: '', category: 'OTHER' as SectionCategory, items: [{ name: '', description: '', price: '' }] }],
        },
        mode: 'onChange',
    })

    const {
        register,
        control,
        handleSubmit,
        trigger,
        watch,
        formState: { errors },
    } = form

    const { fields: sectionFields, append: addSection, remove: removeSection } = useFieldArray({
        control,
        name: 'sections',
    })

    const values = watch()

    const nextStep = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const fields: (keyof FormData)[] =
            step === 0 ? ['name', 'description', 'address', 'city'] : ['sections']
        const valid = await trigger(fields)
        if (valid) setStep(s => s + 1)
    }

    const onSubmit = async (data: FormData) => {
        if (!user) return
        setSubmitting(true)
        setSubmitError('')
        try {
            const restaurant = await createRestaurant(user.id, {
                name: data.name,
                description: data.description ?? '',
                address: data.address,
                city: data.city,
            })

            for (const section of data.sections) {
                const createdSection = await createMenuSection(restaurant.id, section.name, section.category)
                for (const item of section.items) {
                    await createMenuItem(createdSection.id, {
                        name: item.name,
                        description: item.description ?? '',
                        price: Number(item.price),
                        available: true,
                    })
                }
            }

            navigate('/dashboard?registered=true')
        } catch {
            setSubmitError('Something went wrong. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    if (checking) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Navbar />
                <main className="max-w-lg mx-auto px-4 sm:px-6 pt-24">
                    <p className="text-sm text-muted-foreground">Checking your account...</p>
                </main>
            </div>
        )
    }

    if (existingRestaurant) {
        return <ExistingRequestScreen restaurant={existingRestaurant} />
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-16">
                <div className="flex items-center gap-1 sm:gap-2 mb-8">
                    {STEPS.map((label, i) => (
                        <div key={i} className="flex items-center gap-1 sm:gap-2">
                            <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors shrink-0
                                    ${i <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                                    ${i === step ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                                `}
                            >
                                {i < step ? '✓' : i + 1}
                            </div>
                            <span className={`text-xs sm:text-sm hidden sm:inline ${i === step ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                {label}
                            </span>
                            <span className={`text-xs sm:hidden ${i === step ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                {i === step ? label : ''}
                            </span>
                            {i < STEPS.length - 1 && <div className="w-4 sm:w-8 h-px bg-border mx-0.5 sm:mx-1" />}
                        </div>
                    ))}
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    {step === 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Restaurant details</CardTitle>
                                <CardDescription>Basic information about your restaurant.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <Label>Restaurant name *</Label>
                                    <Input placeholder="e.g. Trattoria da Mario" {...register('name')} />
                                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                                </div>

                                <div className="space-y-1">
                                    <Label>Description</Label>
                                    <Textarea placeholder="A short description..." rows={3} {...register('description')} />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label>Address *</Label>
                                        <Input placeholder="Via Roma 1" {...register('address')} />
                                        {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Label>City *</Label>
                                        <Input placeholder="Milan" {...register('city')} />
                                        {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {step === 1 && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-lg font-semibold">Menu</h2>
                                <p className="text-sm text-muted-foreground">
                                    Organise your menu into sections (e.g. Starters, Mains, Desserts).
                                </p>
                            </div>

                            {sectionFields.map((section, si) => (
                                <SectionBlock
                                    key={section.id}
                                    sectionIndex={si}
                                    control={control}
                                    register={register}
                                    errors={errors}
                                    removable={sectionFields.length > 1}
                                    onRemove={() => removeSection(si)}
                                />
                            ))}

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => addSection({ name: '', category: 'OTHER' as SectionCategory, items: [{ name: '', description: '', price: '' }] })}
                            >
                                + Add section
                            </Button>
                        </div>
                    )}

                    {step === 2 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Review your request</CardTitle>
                                <CardDescription>
                                    Check everything before submitting. An admin will review your request.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono mb-2">Restaurant</p>
                                    <p className="font-semibold text-lg">{values.name}</p>
                                    {values.description && <p className="text-sm text-muted-foreground mt-1">{values.description}</p>}
                                    <p className="text-sm text-muted-foreground mt-1">{values.address}, {values.city}</p>
                                </div>

                                <Separator />

                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono mb-3">Menu</p>
                                    <div className="space-y-4">
                                        {values.sections?.map((section, si) => (
                                            <div key={si}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <p className="font-medium text-sm">{section.name}</p>
                                                    <span className="text-xs text-muted-foreground">{CATEGORY_LABELS[section.category]}</span>
                                                </div>
                                                <div className="space-y-1 pl-3 border-l border-border">
                                                    {section.items?.map((item, ii) => (
                                                        <div key={ii} className="flex justify-between text-sm">
                                                            <span>{item.name}</span>
                                                            <span className="text-muted-foreground">€{item.price}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Separator />

                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">PENDING</Badge>
                                    <p className="text-xs text-muted-foreground">Your request will be reviewed by an admin.</p>
                                </div>

                                {submitError && <p className="text-sm text-destructive">{submitError}</p>}
                            </CardContent>
                        </Card>
                    )}

                    <div className="flex justify-between mt-6">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setStep(s => s - 1)}
                            className={step === 0 ? 'invisible' : ''}
                        >
                            Back
                        </Button>

                        {step < STEPS.length - 1 ? (
                            <Button type="button" onClick={nextStep}>
                                Continue
                            </Button>
                        ) : (
                            <Button type="submit" disabled={submitting}>
                                {submitting ? 'Submitting...' : 'Submit request'}
                            </Button>
                        )}
                    </div>
                </form>
            </main>
        </div>
    )
}
