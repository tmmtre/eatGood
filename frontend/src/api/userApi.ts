import api from './axios'

export interface UserResponse {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
    emailVerified: boolean
    profileImageId: string | null
    profileImageUrl: string | null
    trustPercentage: number | null
    createdAt: string
    ownerPickCount: number
}

export const getUser = async (id: string): Promise<UserResponse> => {
    const res = await api.get<UserResponse>(`/users/${id}`)
    return res.data
}

export const updateUser = async (
    id: string,
    data: { firstName?: string; lastName?: string; email?: string }
): Promise<UserResponse> => {
    const res = await api.put<UserResponse>(`/users/${id}`, data)
    return res.data
}

export const uploadProfileImage = async (id: string, image: File): Promise<void> => {
    const form = new FormData()
    form.append('image', image)
    await api.put(`/users/${id}/profile-image`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    })
}

export const changePassword = async (
    id: string,
    data: { currentPassword: string; newPassword: string }
): Promise<void> => {
    await api.put(`/users/${id}/password`, data)
}
