import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navigation from './components/Navigation/Navigation';
import Home from './components/Home/Home';
import ApiTest from './components/ApiTest/ApiTest';
import Auth from './components/Auth/Auth';
import AuthTest from './components/AuthTest/AuthTest';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute.js';
import { useUserStore } from './stores/userStore';
import { ToastContainer } from 'react-toastify';
import Chatbot from './components/Chatbot/Chatbot.js';

export default function App() {
  const fetchUser = useUserStore((state) => state.fetchUser);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <Router>
      <ToastContainer position="top-center" />

      <div className="App">
        <Navigation />

        <main className="App-main">
          <Routes>
            <Route path="/auth/:type" element={<Auth />} />
            <Route path="/" element={<Home />} />
            <Route path="/api-test" element={<ApiTest />} />
            <Route
              path="/chatbot"
              element={
                <ProtectedRoute>
                  <Chatbot />
                </ProtectedRoute>
              }
            />
            <Route
              path="/auth-test"
              element={
                <ProtectedRoute>
                  <AuthTest />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
