export interface Category {
    id: number;
    name: string;
    user_id: number | null;
}

export interface CategoryCreate {
    name: string;
}

export interface CategoryUpdate {
    name?: string;
}
