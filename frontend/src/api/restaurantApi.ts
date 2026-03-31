import api from './axios'
import type { RestaurantResponse, MenuSectionResponse } from '../types/restaurant'

export const createRestaurant = async (
    userId: string,
    data: { name: string; description: string; address: string; city: string }
): Promise<RestaurantResponse> => {
    const res = await api.post<RestaurantResponse>(`/restaurants/user/${userId}`, data)
    return res.data
}

export const getPendingRestaurants = async (): Promise<RestaurantResponse[]> => {
    const res = await api.get<RestaurantResponse[]>('/restaurants/admin/pending')
    return res.data
}

export const getAllRestaurants = async (): Promise<RestaurantResponse[]> => {
    const res = await api.get<RestaurantResponse[]>('/restaurants/admin/all')
    return res.data
}

export const approveRestaurant = async (id: number): Promise<RestaurantResponse> => {
    const res = await api.put<RestaurantResponse>(`/restaurants/admin/${id}/approve`)
    return res.data
}

export const rejectRestaurant = async (id: number): Promise<RestaurantResponse> => {
    const res = await api.put<RestaurantResponse>(`/restaurants/admin/${id}/reject`)
    return res.data
}

export const getMyRestaurants = async (userId: string): Promise<RestaurantResponse[]> => {
    const res = await api.get<RestaurantResponse[]>(`/restaurants/user/${userId}`)
    return res.data
}

export const getSectionsByRestaurant = async (restaurantId: number): Promise<MenuSectionResponse[]> => {
    const res = await api.get<MenuSectionResponse[]>(`/sections/restaurant/${restaurantId}`)
    return res.data
}

export const createMenuSection = async (restaurantId: number, name: string): Promise<MenuSectionResponse> => {
    const res = await api.post<MenuSectionResponse>(`/sections/restaurant/${restaurantId}`, { name })
    return res.data
}

export const updateMenuSection = async (id: number, name: string): Promise<MenuSectionResponse> => {
    const res = await api.put<MenuSectionResponse>(`/sections/${id}`, { name })
    return res.data
}

export const deleteMenuSection = async (id: number): Promise<void> => {
    await api.delete(`/sections/${id}`)
}

const buildItemFormData = (
    item: { name: string; description?: string; price: number; available: boolean },
    image?: File
): FormData => {
    const formData = new FormData()
    formData.append('item', new Blob([JSON.stringify(item)], { type: 'application/json' }))
    if (image) formData.append('image', image)
    return formData
}

export const createMenuItem = async (
    sectionId: number,
    item: { name: string; description?: string; price: number; available: boolean },
    image?: File
): Promise<void> => {
    await api.post(`/items/section/${sectionId}`, buildItemFormData(item, image), {
        headers: { 'Content-Type': 'multipart/form-data' },
    })
}

export const updateMenuItem = async (
    id: number,
    item: { name: string; description?: string; price: number; available: boolean },
    image?: File
): Promise<void> => {
    await api.put(`/items/${id}`, buildItemFormData(item, image), {
        headers: { 'Content-Type': 'multipart/form-data' },
    })
}

export const deleteMenuItem = async (id: number): Promise<void> => {
    await api.delete(`/items/${id}`)
}
