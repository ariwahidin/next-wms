export interface MainVas {
  id: number;
  name: string;
  isKoli?: boolean;
  isActive?: boolean;
  defaultPrice?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMainVasPayload {
  name: string;
  isKoli?: boolean;
  isActive?: boolean;
  defaultPrice?: number;
}
