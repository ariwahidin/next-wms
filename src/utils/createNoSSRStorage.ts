/* eslint-disable @typescript-eslint/no-unused-vars */
// src/utils/createNoSSRStorage.ts
import { Storage } from 'redux-persist';

const createNoSSRStorage = (): Storage => {
  if (typeof window === 'undefined') {
    return {
      getItem(_key) {
        return Promise.resolve(null);
      },
      setItem(_key, value) {
        return Promise.resolve(value);
      },
      removeItem(_key) {
        return Promise.resolve();
      },
    };
  }

  return {
    getItem(key) {
      return Promise.resolve(localStorage.getItem(key));
    },
    setItem(key, value) {
      localStorage.setItem(key, value);
      return Promise.resolve(value);
    },
    removeItem(key) {
      localStorage.removeItem(key);
      return Promise.resolve();
    },
  };
};

export default createNoSSRStorage;
