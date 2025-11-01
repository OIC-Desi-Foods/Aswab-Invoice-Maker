import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
// FIX: Changed import path to '@firebase/auth' to resolve module name collision.
import { Auth, getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, updatePassword, User as FirebaseAuthUser, reauthenticateWithCredential, EmailAuthProvider } from '@firebase/auth';
import { User } from '../types';
import { auth } from '../firebase/config';
import { initializeUserData, updateUserData } from '../firebase/firestore';


interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserAccount: (name: string, newPassword?: string, currentPassword?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          name: user.displayName || 'User',
        });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    await signInWithEmailAndPassword(auth, email, password);
  };
  
  const signup = async (name: string, email: string, password: string): Promise<void> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    await initializeUserData(userCredential.user);
    // State will update via onAuthStateChanged listener
  };


  const logout = () => {
    signOut(auth);
  };

  const updateUserAccount = async (name: string, newPassword?: string, currentPassword?: string): Promise<void> => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("No user is currently signed in.");
    }

    // If a password change is requested, re-authenticate first.
    if (newPassword && currentPassword) {
        if (!user.email) {
            throw new Error("Cannot re-authenticate user without an email.");
        }
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        // Re-authenticate the user to confirm their identity.
        await reauthenticateWithCredential(user, credential);
        // If re-authentication is successful, update the password.
        await updatePassword(user, newPassword);
    }

    // Update display name if it has changed.
    if (user.displayName !== name) {
        await updateProfile(user, { displayName: name });
    }

    // Update local state to reflect name change immediately.
    setCurrentUser(prevUser => {
        if (!prevUser) return null;
        return { ...prevUser, name };
    });
  };


  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, signup, logout, updateUserAccount }}>
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