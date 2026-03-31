export interface MenuItemForm {
    name: string
    description: string
    price: string
}

export interface MenuSectionForm {
    name: string
    items: MenuItemForm[]
}

export interface RestaurantFormData {
    name: string
    description: string
    address: string
    city: string
    sections: MenuSectionForm[]
}

export interface RestaurantResponse {
    id: number
    name: string
    description: string
    address: string
    city: string
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
    createdAt: string
    user: { id: string; email: string; firstName: string; lastName: string }
}

export interface MenuItemResponse {
    id: number
    name: string
    description: string
    price: number
    available: boolean
}

export interface MenuSectionResponse {
    id: number
    name: string
    items: MenuItemResponse[]
}
