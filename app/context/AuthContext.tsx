import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  requestRegistration: (userData: SignUpData) => Promise<{ email: string; firstName: string }>;
  verifyOTP: (email: string, otpCode: string) => Promise<User>;
  resendOTP: (email: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ email: string }>;
  verifyPasswordResetOTP: (email: string, otpCode: string, newPassword: string) => Promise<void>;
  resendPasswordResetOTP: (email: string) => Promise<void>;
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
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Load user from storage on app start
  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      console.log('Loading user from storage...');
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        console.log('User found in storage:', parsedUser.email);
        setUser(parsedUser);
      } else {
        console.log('No user found in storage');
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
    } finally {
      setLoading(false);
      console.log('Auth loading completed');
    }
  };

  const saveUserToStorage = async (userData: User) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  };

  const removeUserFromStorage = async () => {
    try {
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Error removing user from storage:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      // Create user object and save to storage
      const userData: User = {
        id: data.id.toString(),
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        phone: data.phone
      };
      
      setUser(userData);
      await saveUserToStorage(userData);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const requestRegistration = async (userData: SignUpData) => {
    try {
      console.log('Requesting registration with OTP...');
      const response = await fetch(`${API_BASE_URL}/register/request/`, {
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
        throw new Error(data.error || 'Registration request failed');
      }

      console.log('Registration request successful:', data);
      
      // Return email and firstName for OTP verification screen
      return {
        email: data.email,
        firstName: userData.firstName
      };
    } catch (error) {
      console.error('Registration request error:', error);
      throw error;
    }
  };

  const verifyOTP = async (email: string, otpCode: string) => {
    try {
      console.log('Verifying OTP...');
      const response = await fetch(`${API_BASE_URL}/register/verify/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          otp_code: otpCode
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'OTP verification failed');
      }

      console.log('OTP verification successful:', data);

      // Create user object from verified registration
      const userData: User = {
        id: data.id.toString(),
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        phone: data.phone
      };

      return userData;
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    }
  };

  const resendOTP = async (email: string) => {
    try {
      console.log('Resending OTP...');
      const response = await fetch(`${API_BASE_URL}/register/resend/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend OTP');
      }

      console.log('OTP resent successfully');
      return Promise.resolve();
    } catch (error) {
      console.error('Resend OTP error:', error);
      throw error;
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      console.log('Requesting password reset...');
      const response = await fetch(`${API_BASE_URL}/forgot-password/request/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim()
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Password reset request failed');
      }

      console.log('Password reset request successful:', data);
      
      return {
        email: data.email
      };
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  };

  const verifyPasswordResetOTP = async (email: string, otpCode: string, newPassword: string) => {
    try {
      console.log('Verifying password reset OTP...');
      const response = await fetch(`${API_BASE_URL}/forgot-password/verify/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          otp_code: otpCode,
          new_password: newPassword
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Password reset verification failed');
      }

      console.log('Password reset successful:', data);
      return Promise.resolve();
    } catch (error) {
      console.error('Password reset verification error:', error);
      throw error;
    }
  };

  const resendPasswordResetOTP = async (email: string) => {
    try {
      console.log('Resending password reset OTP...');
      const response = await fetch(`${API_BASE_URL}/forgot-password/resend/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend password reset OTP');
      }

      console.log('Password reset OTP resent successfully');
      return Promise.resolve();
    } catch (error) {
      console.error('Resend password reset OTP error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out user...');
      setUser(null);
      await removeUserFromStorage();
      console.log('User signed out successfully');
      return Promise.resolve();
    } catch (error) {
      console.error('Error during sign out:', error);
      throw error;
    }
  };

  const setUserData = async (userData: User | null) => {
    setUser(userData);
    if (userData) {
      await saveUserToStorage(userData);
    } else {
      await removeUserFromStorage();
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      requestRegistration,
      verifyOTP,
      resendOTP,
      requestPasswordReset,
      verifyPasswordResetOTP,
      resendPasswordResetOTP,
      signOut,
      setUser: setUserData 
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