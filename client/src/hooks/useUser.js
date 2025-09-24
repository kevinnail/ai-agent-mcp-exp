import { useUserStore } from '../stores/userStore.js';

export function useUser() {
  const { user, setUser, loading, setLoading, error, setError, logInUser } =
    useUserStore();

  return {
    user,
    setUser,
    error,
    setError,
    logInUser,
    loading,
    setLoading,
  };
}
