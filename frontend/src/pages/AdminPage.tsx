import Navbar from '@/components/Navbar'

export default function AdminPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <main className="max-w-5xl mx-auto px-6 pt-24 pb-12">
                <div className="mb-8">
                    <p className="text-xs font-mono text-destructive uppercase tracking-widest mb-2">Admin Panel</p>
                    <h1 className="text-3xl font-semibold tracking-tight">System Control</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Full access to platform configuration and user management.</p>
                </div>
            </main>
        </div>
    )
}
