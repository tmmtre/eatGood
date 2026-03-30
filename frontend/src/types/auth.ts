export interface RegisterRequest {
    firstName: string
    lastName: string
    email: string
    password: string
}

export interface LoginRequest {
    email: string
    password: string
}

export interface AuthResponse {
    token: string
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
}

export interface User {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
}

export const getFullName = (user: User) => `${user.firstName} ${user.lastName}`
