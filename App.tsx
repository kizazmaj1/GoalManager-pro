
import React, { useState, useEffect } from 'react';
import { User } from './types';
import LoginScreen from './components/LoginScreen';
import BookingDashboard from './components/BookingDashboard';

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('goalManagerUser');
      if (savedUser) {
          setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('goalManagerUser');
    }
  }, []);

  const handleLogin = (userData: Omit<User, 'loginKey'>) => {
    const userWithSession = { ...userData, loginKey: Date.now() };
    localStorage.setItem('goalManagerUser', JSON.stringify(userWithSession));
    setUser(userWithSession);
  };

  const handleLogout = () => {
    localStorage.removeItem('goalManagerUser');
    setUser(null);
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <BookingDashboard key={user.loginKey || user.contact} user={user} onLogout={handleLogout} />;
}
