import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import type { currentUser } from '~/types/auth.types';
import type { RootState } from '~/store';
import { setCurrentUser } from '~/store/auth.slice'; // Assurez-vous que le chemin est correct
import { storageService } from '~/lib/storageService';

interface AuthContextType {
  user: currentUser | null;
  setUser: (user: currentUser | null) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<currentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const dispatch = useDispatch();
  const { token, accountType } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const userStr = await storageService.getItem('currentUser');
        const storedToken = await storageService.getItem('token');

        if (!userStr || !storedToken) {
          setLoading(false);
          return;
        }

        const currentUser = JSON.parse(userStr) as currentUser;
        setUser(currentUser);
        
        // Synchroniser avec Redux
        if (token && accountType && !user) {
          dispatch(setCurrentUser(currentUser));
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [token, accountType]);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}