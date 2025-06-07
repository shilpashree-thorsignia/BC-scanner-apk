import React, { createContext, useContext, useState } from 'react';
import { API_BASE_URL } from '../config';



interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (userData: SignUpData) => Promise<User>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
}

interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const signIn = async (email: string, password: string) => {
    // No authentication needed
    return Promise.resolve();
  };

  const signUp = async (userData: SignUpData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: userData.firstName,
          last_name: userData.lastName,
          email: userData.email,
          phone: userData.phone,
          password: userData.password
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Sign up failed');
      }

      // Return the created user data
      return data;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    // No authentication needed
    return Promise.resolve();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      signUp, 
      signOut,
      setUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;