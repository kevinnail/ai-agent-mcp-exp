import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import './Auth.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useUser } from '../../hooks/useUser.js';
import Loading from '../Loading/Loading.js';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignIn, setIsSignIn] = useState(true);
  const { logInUser, user, loading, setLoading } = useUser();
  const { type } = useParams();

  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/auth-test');
    }
  }, [user]);

  const submitAuth = async () => {
    try {
      setLoading(true);
      await logInUser(email, password, type);

      toast.success('Successfully signed in!', {
        theme: 'colored',
        draggable: true,
        draggablePercent: 60,
        toastId: 'auth-success',
        autoClose: 3000,
      });

      // Redirect to the page they were trying to access, or home
      const from = location.state?.from?.pathname || '/auth-test';
      navigate(from, { replace: true });
    } catch (e) {
      console.error(e);
      toast.error('Sign in failed. Please check your credentials.', {
        theme: 'colored',
        draggable: true,
        draggablePercent: 60,
        toastId: 'auth-error',
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return loading ? (
    <Loading />
  ) : (
    <>
      <div
        style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
      ></div>
      <div className="auth-container">
        <div className="sign-in-sign-out">
          <NavLink
            className="link"
            to="/auth/sign-in"
            onClick={() => setIsSignIn(true)}
          >
            Sign-in
          </NavLink>
          <NavLink
            className="link"
            to="/auth/sign-up"
            onClick={() => setIsSignIn(false)}
          >
            Sign-up
          </NavLink>
        </div>

        <form
          className="email-container"
          onSubmit={(e) => {
            e.preventDefault();
            submitAuth();
          }}
        >
          <input
            className="input"
            type="email"
            placeholder="email@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            //   disabled={authLoading}
            required
          />

          <input
            className="input"
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            //   disabled={authLoading}
            required
          />
          {/* <button type="submit" disabled={authLoading}> */}
          <button type="submit">{isSignIn ? 'Sign In' : 'Sign Up'}</button>
        </form>
      </div>
    </>
  );
}
