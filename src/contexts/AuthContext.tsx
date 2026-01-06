import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { createUserProfile, getUserProfile } from '../lib/db';
import type { UserData } from '../types';

interface AuthContextValue {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener (per spec: auth.onAuthStateChanged)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Load user data (one-time read per spec)
        const profile = await getUserProfile(firebaseUser.uid);
        setUserData(profile);
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    // Validation per spec
    if (!email || !password) {
      throw new Error('Please fill in all fields');
    }
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (name: string, email: string, password: string) => {
    // Validation per spec
    if (!name || !email || !password) {
      throw new Error('Please fill in all fields');
    }
    
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user profile at /users/{userId} (per spec)
    await createUserProfile(credential.user.uid, name, email);
    
    // Load the profile we just created
    const profile = await getUserProfile(credential.user.uid);
    setUserData(profile);
  };

  const logout = async () => {
    await signOut(auth);
    setUserData(null);
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
