// lib/api/itemPackaging.ts

import type { ItemPackaging, ItemCodeOption } from "@/types/itemPackaging";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

interface ApiResponse<T> {
    data: T;
    meta?: {
        total: number;
        page: number;
        limit: number;
        total_pages: number;
    };
    message?: string;
}

export const itemPackagingAPI = {
    async getAll(
        page: number = 1,
        limit: number = 10,
        search: string = ""
    ): Promise<ApiResponse<ItemPackaging[]>> {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            search,
        });

        const response = await fetch(
            `${API_BASE_URL}/product/item-packaging?${params}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${document.cookie
                        .split("; ")
                        .find((row) => row.startsWith("wms-auth-token="))
                        ?.split("=")[1] || ""}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error("Failed to fetch items");
        }

        return response.json();
    },

    async getById(id: number): Promise<ApiResponse<ItemPackaging>> {
        const response = await fetch(
            `${API_BASE_URL}/product/item-packaging/${id}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${document.cookie
                        .split("; ")
                        .find((row) => row.startsWith("wms-auth-token="))
                        ?.split("=")[1] || ""}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error("Failed to fetch item");
        }

        return response.json();
    },

    async getItemCodeOptions(): Promise<ApiResponse<ItemCodeOption[]>> {
        const response = await fetch(
            `${API_BASE_URL}/product/item-packaging/item-codes`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${document.cookie
                        .split("; ")
                        .find((row) => row.startsWith("wms-auth-token="))
                        ?.split("=")[1] || ""}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error("Failed to fetch item codes");
        }

        return response.json();
    },

    async create(
        data: Partial<ItemPackaging>
    ): Promise<ApiResponse<ItemPackaging>> {
        const response = await fetch(
            `${API_BASE_URL}/product/item-packaging`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${document.cookie
                        .split("; ")
                        .find((row) => row.startsWith("wms-auth-token="))
                        ?.split("=")[1] || ""}`,
                },
                body: JSON.stringify(data),
            }
        );

        if (!response.ok) {
            throw new Error("Failed to create item");
        }

        return response.json();
    },

    async update(
        id: number,
        data: Partial<ItemPackaging>
    ): Promise<ApiResponse<ItemPackaging>> {
        const response = await fetch(
            `${API_BASE_URL}/product/item-packaging/${id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${document.cookie
                        .split("; ")
                        .find((row) => row.startsWith("wms-auth-token="))
                        ?.split("=")[1] || ""}`,
                },
                body: JSON.stringify(data),
            }
        );

        if (!response.ok) {
            throw new Error("Failed to update item");
        }

        return response.json();
    },

    async delete(id: number): Promise<ApiResponse<null>> {
        const response = await fetch(
            `${API_BASE_URL}/product/item-packaging/${id}`,
            {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${document.cookie
                        .split("; ")
                        .find((row) => row.startsWith("wms-auth-token="))
                        ?.split("=")[1] || ""}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error("Failed to delete item");
        }

        return response.json();
    },
};