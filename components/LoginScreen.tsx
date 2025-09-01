import React, { useState } from 'react';
import { User } from '../types';

interface LoginScreenProps {
  onLogin: (userData: Omit<User, 'loginKey'>) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (name.trim() && contact.trim()) {
      onLogin({ name, contact });
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-teal-400 to-blue-500 p-4">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 text-center animate-fade-in-up">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">GoalManager Pro</h1>
        <p className="text-gray-600 mt-2 mb-8">Dobrodošli! Unesite podatke za nastavak.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Ime i prezime" 
            required 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition text-base"
          />
          <input 
            type="text" 
            value={contact} 
            onChange={(e) => setContact(e.target.value)} 
            placeholder="Email ili broj telefona" 
            required 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition text-base"
          />
          <button 
            type="submit" 
            className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-transform hover:scale-105 text-lg"
          >
            Prijavi se
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;