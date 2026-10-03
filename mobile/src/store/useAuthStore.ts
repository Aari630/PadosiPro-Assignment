import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { apiClient } from '../api/client';

interface User {
  id: string;
  email: string;
  hasProfile: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setHasProfile: (status: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  
  login: async (token, user) => {
    await SecureStore.setItemAsync('userToken', token);
    await SecureStore.setItemAsync('userData', JSON.stringify(user));
    set({ token, user });
  },
  
  logout: async () => {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userData');
    set({ token: null, user: null });
  },
  
  checkAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const userData = await SecureStore.getItemAsync('userData');
      
      if (token && userData) {
        const storedUser = JSON.parse(userData) as User;

        try {
          await apiClient.get('/profile', { headers: { Authorization: `Bearer ${token}` } });
          set({ token, user: storedUser, isLoading: false });
        } catch (error) {
          const status = axios.isAxiosError(error) ? error.response?.status : undefined;

          if (status === 401 || status === 403) {
            await SecureStore.deleteItemAsync('userToken');
            await SecureStore.deleteItemAsync('userData');
            set({ token: null, user: null, isLoading: false });
          } else {
            set({ token, user: storedUser, isLoading: false });
          }
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
    }
  },

  setHasProfile: async (status: boolean) => {
    set((state) => {
      if (state.user) {
        const updatedUser = { ...state.user, hasProfile: status };
        SecureStore.setItemAsync('userData', JSON.stringify(updatedUser)).catch(console.error);
        return { user: updatedUser };
      }
      return state;
    });
  }
}));