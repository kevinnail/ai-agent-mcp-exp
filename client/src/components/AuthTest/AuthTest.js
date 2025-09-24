import React from 'react';
import { useUser } from '../../hooks/useUser.js';
import { signOutUser } from '../../services/fetch-auth.js';
import { toast } from 'react-toastify';
import './AuthTest.css';
import Loading from '../Loading/Loading.js';

export default function AuthTest() {
  const { user, setUser, loading, setLoading } = useUser();

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOutUser();
      setUser(null);
      toast.success('Successfully signed out!');
      setLoading(false);
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error(`Sign out failed: ${error.message}`);
    }
  };

  return loading ? (
    <Loading />
  ) : (
    <div className="auth-test-container">
      <h2>Success! You are authenticated.</h2>
      <p>Welcome, {user.email}!</p>
      <button onClick={handleSignOut} className="sign-out-btn">
        Sign Out
      </button>
    </div>
  );
}
