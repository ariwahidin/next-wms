// // src/store/index.ts
// import { configureStore, combineReducers } from '@reduxjs/toolkit';
// import userReducer from './userSlice';
// import storage from 'redux-persist/lib/storage'; // menggunakan localStorage
// import {
//   persistStore,
//   persistReducer,
//   FLUSH,
//   REHYDRATE,
//   PAUSE,
//   PERSIST,
//   PURGE,
//   REGISTER,
// } from 'redux-persist';

// // Gabungkan reducer
// const rootReducer = combineReducers({
//   user: userReducer,
// });

// // Konfigurasi persist
// const persistConfig = {
//   key: 'root',
//   storage,
//   whitelist: ['user'], // hanya 'user' yang dipersist
// };

// // Bungkus reducer dengan persistReducer
// const persistedReducer = persistReducer(persistConfig, rootReducer);

// // Buat store dengan middleware yang support redux-persist
// export const store = configureStore({
//   reducer: persistedReducer,
//   middleware: (getDefaultMiddleware) =>
//     getDefaultMiddleware({
//       serializableCheck: {
//         ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
//       },
//     }),
// });

// // Export persistor untuk digunakan di _app.tsx
// export const persistor = persistStore(store);

// // Type export
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;


import { configureStore, combineReducers } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import createNoSSRStorage from '@/utils/createNoSSRStorage'; // ini yang penting

const persistConfig = {
  key: 'root',
  storage: createNoSSRStorage(),
  whitelist: ['user'],
};

const rootReducer = combineReducers({
  user: userReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

