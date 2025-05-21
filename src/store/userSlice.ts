/* eslint-disable @typescript-eslint/no-explicit-any */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
    name: string;
    email: string;
    base_url: string;
    isLoggedIn: boolean;
    token: string;
    menus: any[];
}

const initialState: UserState = {
    name: '',
    email: '',
    base_url: '',
    isLoggedIn: false,
    token: '',
    menus: [],
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser(state, action: PayloadAction<{ name: string; email: string; base_url: string; token: string; menus: any[] }>) {
            state.name = action.payload.name;
            state.email = action.payload.email;
            state.base_url = action.payload.base_url;
            state.token = action.payload.token;
            state.menus = action.payload.menus;
            state.isLoggedIn = true;
        },
        logout(state) {
            state.name = '';
            state.email = '';
            state.base_url = '';
            state.token = '';
            state.menus = [];
            state.isLoggedIn = false;
        },
    },
});

export const { setUser, logout } = userSlice.actions;
export default userSlice.reducer;

