import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { Header } from './components/layout/Header';
import { FamilyTree } from './components/family/FamilyTree';

const AuthWrapper: React.FC = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const { currentUser } = useAuth();

  if (!currentUser) {
    return isLoginMode ? (
      <LoginForm onToggleMode={() => setIsLoginMode(false)} />
    ) : (
      <RegisterForm onToggleMode={() => setIsLoginMode(true)} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <FamilyTree />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AuthWrapper />
    </AuthProvider>
  );
}

export default App;