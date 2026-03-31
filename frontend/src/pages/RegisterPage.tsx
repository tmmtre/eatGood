import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { register as registerUser } from '../api/authApi.ts'
import { useAuthStore } from '../store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const registerSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.email({ message: 'Invalid email address' }),
    password: z.string().min(8, 'Password must be at least 8 characters'),
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
    const navigate = useNavigate()
    const setAuth = useAuthStore((state) => state.setAuth)

    const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
    })

    const onSubmit = async (data: RegisterForm) => {
        try {
            const response = await registerUser(data)
            setAuth(
                { id: response.id, firstName: response.firstName, lastName: response.lastName, email: response.email, role: response.role },
                response.token
            )
            navigate('/dashboard')
        } catch {
            setError('root', { message: 'Registration failed. Email may already be in use.' })
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Create an account</CardTitle>
                    <CardDescription>Start managing your restaurant menu</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                        <div className="space-y-1">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input id="firstName" placeholder="John" {...register('firstName')} />
                            {errors.firstName && <p className="text-sm text-red-500">{errors.firstName.message}</p>}
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input id="lastName" placeholder="Doe" {...register('lastName')} />
                            {errors.lastName && <p className="text-sm text-red-500">{errors.lastName.message}</p>}
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" placeholder="you@example.com" {...register('email')} />
                            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
                            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                        </div>

                        {errors.root && <p className="text-sm text-red-500">{errors.root.message}</p>}

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating account...' : 'Create account'}
                        </Button>

                        <p className="text-center text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary hover:underline">Sign in</Link>
                        </p>

                    </form>
                </CardContent>
            </Card>
        </div>
    )
}