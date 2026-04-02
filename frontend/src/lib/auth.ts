export function getRoleBasedPath(role: string): string {
    if (role === 'ADMIN') return '/admin'
    if (role === 'OWNER') return '/owner'
    return '/dashboard'
}
