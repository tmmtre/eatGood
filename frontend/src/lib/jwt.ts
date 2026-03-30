export interface JwtPayload {
    sub: string
    id: string
    role: 'ADMIN' | 'OWNER' | 'USER'
    iat: number
    exp: number
}

export function decodeJwt(token: string): JwtPayload | null {
    try {
        const payload = token.split('.')[1]
        const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
        return decoded as JwtPayload
    } catch {
        return null
    }
}

export function isTokenExpired(token: string): boolean {
    const payload = decodeJwt(token)
    if (!payload) return true
    return payload.exp * 1000 < Date.now()
}