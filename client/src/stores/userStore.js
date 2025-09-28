import { create } from 'zustand';
import { getUser } from '../services/fetch-auth.js';
import { authUser } from '../services/auth.js';

const googleId = process.env.REACT_APP_GOOGLE_USER_ID;

export const useUserStore = create((set) => ({
  user: null,
  error: '',
  loading: true,
  userId: null,

  setUser: (user) => set({ user }),
  setError: (error) => set({ error }),
  setLoading: (loading) => set({ loading }),
  setUserId: (userId) => set({ userId }),

  fetchUser: async () => {
    try {
      const user = await getUser();
      if (user && user.id && user.email) {
        set({ user, userId: googleId, loading: false });
      } else {
        set({ user: null, loading: false });
      }
    } catch (error) {
      console.error('Error in fetchUser:', error);
      set({ error, user: null, loading: false });
      if (error.status === 401) {
        // Could call signOut here to clear cookies
      }
    }
  },

  logInUser: async (email, password, type) => {
    const user = await authUser(email, password, type);
    set({ user, loading: false });
  },
}));
