import React, { useState } from 'react';
import { SparklesIcon } from './icons';

interface GeminiModalProps {
  isOpen: boolean;
  content: string;
  isLoading: boolean;
  onClose: () => void;
}

const TypingIndicator = () => (
    <div className="flex items-center space-x-1.5 p-2">
      <div className="w-2 h-2 bg-teal-300 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-teal-300 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-teal-300 rounded-full animate-pulse"></div>
    </div>
);

const GeminiModal: React.FC<GeminiModalProps> = ({ isOpen, content, isLoading, onClose }) => {
  const [copySuccess, setCopySuccess] = useState('');

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      setCopySuccess('Kopirano!');
      setTimeout(() => setCopySuccess(''), 2000);
    }, () => {
      setCopySuccess('Neuspešno.');
    });
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 sm:p-0 backdrop-blur-sm modal-content-container">
      <div className="bg-gray-800 border border-gray-700 rounded-t-2xl sm:rounded-xl shadow-2xl p-6 w-full max-w-md relative text-white modal-content">
        <h3 className="text-xl sm:text-2xl font-bold text-teal-400 mb-4 flex items-center">
          <SparklesIcon /> <span className="ml-2">AI Asistent</span>
        </h3>
        <div className="bg-gray-900/50 p-4 rounded-lg min-h-[150px] whitespace-pre-wrap font-mono text-sm text-gray-300 overflow-y-auto ring-1 ring-gray-700">
          {isLoading ? <TypingIndicator /> : content}
        </div>
        <div className="mt-6 flex items-center justify-between">
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-gray-200 font-semibold rounded-lg hover:bg-gray-500 transition-colors">
            Zatvori
          </button>
          {!isLoading && content && (
            <button onClick={handleCopy} className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors">
              {copySuccess || 'Kopiraj tekst'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeminiModal;