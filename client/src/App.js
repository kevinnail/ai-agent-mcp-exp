import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navigation from './components/Navigation/Navigation';
import Auth from './components/Auth/Auth';
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
            <Route
              path="/chatbot"
              element={
                <ProtectedRoute>
                  <Chatbot />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
