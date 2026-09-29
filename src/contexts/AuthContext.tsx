import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, googleAuthProvider, db } from '../lib/firebase.ts';
import { UserProfile, UserRole, Professional } from '../types/index.ts';
import { seedInitialDatabase } from '../services/seedService.ts';

const ADMIN_EMAIL = 'watson.manuel.eta@gmail.com';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  professionalProfile: Professional | null;
  role: UserRole;
  isAdmin: boolean;
  isProfessional: boolean;
  isClient: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  switchDemoUser: (target: 'cliente' | 'profissional' | 'administrador') => Promise<void>;
  registerProfile: (data: Partial<UserProfile>, asProfessional?: Partial<Professional>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [professionalProfile, setProfessionalProfile] = useState<Professional | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Active persona override for quick-testing requirement
  const [activeOverrideRole, setActiveOverrideRole] = useState<UserRole | null>(null);

  // Initial database check & seed
  useEffect(() => {
    seedInitialDatabase(false);
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setCurrentUser(fbUser);

      if (fbUser) {
        try {
          const userRef = doc(db, 'users', fbUser.uid);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            // Elevate admin if email matches
            if (fbUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
              data.role = 'administrador';
            }
            setUserProfile(data);
            if (data.role === 'profissional') {
              loadProfessionalProfile(fbUser.uid);
            }
          } else {
            // New user registered via Google
            const isDefaultAdmin = fbUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
            const newProfile: UserProfile = {
              uid: fbUser.uid,
              name: fbUser.displayName || 'Utilizador AjudaJá',
              email: fbUser.email || '',
              phone: fbUser.phoneNumber || '',
              role: isDefaultAdmin ? 'administrador' : 'cliente',
              avatarUrl: fbUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${fbUser.displayName || 'User'}`,
              province: 'Luanda',
              city: 'Maianga',
              createdAt: new Date().toISOString(),
            };
            await setDoc(userRef, newProfile);
            setUserProfile(newProfile);
          }
        } catch (err) {
          console.error('Erro ao carregar perfil do utilizador:', err);
        }
      } else {
        // Fallback default persona for test environment: Ana Paula Kaluanda (Cliente)
        loadDefaultPersona();
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadProfessionalProfile = async (userId: string) => {
    try {
      const profDoc = await getDoc(doc(db, 'professionals', userId));
      if (profDoc.exists()) {
        setProfessionalProfile({ id: profDoc.id, ...profDoc.data() } as Professional);
      }
    } catch (e) {
      console.error('Erro ao obter perfil de profissional:', e);
    }
  };

  const loadDefaultPersona = () => {
    // Default demo client
    const demoClient: UserProfile = {
      uid: 'user_cliente_ana',
      name: 'Ana Paula Kaluanda',
      email: 'ana.kaluanda@exemplo.ao',
      phone: '+244 923 111 222',
      role: 'cliente',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      province: 'Luanda',
      city: 'Maianga',
      address: 'Rua Rainha Ginga, Edifício Bengo nº 42',
      latitude: -8.8250,
      longitude: 13.2330,
      createdAt: '2026-01-05T10:00:00.000Z',
    };
    setUserProfile(demoClient);
    setProfessionalProfile(null);
  };

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      await signInWithPopup(auth, googleAuthProvider);
    } catch (error) {
      console.error('Falha no login com Google:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
      loadDefaultPersona();
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  const switchDemoUser = async (target: 'cliente' | 'profissional' | 'administrador') => {
    setIsLoading(true);
    if (target === 'cliente') {
      const client: UserProfile = {
        uid: 'user_cliente_ana',
        name: 'Ana Paula Kaluanda',
        email: 'ana.kaluanda@exemplo.ao',
        phone: '+244 923 111 222',
        role: 'cliente',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        province: 'Luanda',
        city: 'Maianga',
        address: 'Rua Rainha Ginga, Edifício Bengo nº 42',
        latitude: -8.8250,
        longitude: 13.2330,
        createdAt: '2026-01-05T10:00:00.000Z',
      };
      setUserProfile(client);
      setProfessionalProfile(null);
    } else if (target === 'profissional') {
      const profUser: UserProfile = {
        uid: 'user_prof_antonio',
        name: 'António Kapango',
        email: 'antonio.canalizador@ajudaja.ao',
        phone: '+244 923 456 789',
        role: 'profissional',
        avatarUrl: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&auto=format&fit=crop&q=80',
        province: 'Luanda',
        city: 'Maianga',
        createdAt: '2026-01-10T08:00:00.000Z',
      };
      setUserProfile(profUser);
      // Fetch or attach professional profile
      const profDoc = await getDoc(doc(db, 'professionals', 'prof_antonio_canalizador'));
      if (profDoc.exists()) {
        setProfessionalProfile({ id: profDoc.id, ...profDoc.data() } as Professional);
      }
    } else if (target === 'administrador') {
      const adminUser: UserProfile = {
        uid: 'user_admin_watson',
        name: 'Watson Manuel (Administrador)',
        email: ADMIN_EMAIL,
        phone: '+244 923 000 001',
        role: 'administrador',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
        province: 'Luanda',
        city: 'Ingombota',
        createdAt: '2026-01-01T00:00:00.000Z',
      };
      setUserProfile(adminUser);
      setProfessionalProfile(null);
    }
    setIsLoading(false);
  };

  const registerProfile = async (
    data: Partial<UserProfile>, 
    asProfessional?: Partial<Professional>
  ) => {
    setIsLoading(true);
    try {
      const uid = currentUser?.uid || `user_${Date.now()}`;
      const now = new Date().toISOString();
      const updatedProfile: UserProfile = {
        uid,
        name: data.name || 'Novo Utilizador',
        email: data.email || currentUser?.email || 'utilizador@ajudaja.ao',
        phone: data.phone || '',
        role: data.role || 'cliente',
        avatarUrl: data.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${data.name || 'User'}`,
        province: data.province || 'Luanda',
        city: data.city || 'Maianga',
        address: data.address || '',
        latitude: data.latitude,
        longitude: data.longitude,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, 'users', uid), updatedProfile);
      setUserProfile(updatedProfile);

      if (data.role === 'profissional' && asProfessional) {
        const profId = `prof_${uid}`;
        const newProf: Professional = {
          id: profId,
          userId: uid,
          fullName: data.name || '',
          businessName: asProfessional.businessName || data.name || '',
          phone: data.phone || '',
          email: data.email || '',
          avatarUrl: updatedProfile.avatarUrl,
          categoryId: asProfessional.categoryId || 'canalizacao',
          categoryName: asProfessional.categoryName || 'Canalização',
          subcategory: asProfessional.subcategory || '',
          description: asProfessional.description || '',
          experienceYears: asProfessional.experienceYears || 1,
          serviceArea: asProfessional.serviceArea || `${data.city || 'Luanda'} e arredores`,
          province: data.province || 'Luanda',
          city: data.city || 'Maianga',
          latitude: data.latitude || -8.8399,
          longitude: data.longitude || 13.2894,
          availability: 'disponivel',
          basePrice: asProfessional.basePrice || 5000,
          status: 'pendente', // Must be verified by admin
          rating: 5.0,
          reviewCount: 0,
          completedJobsCount: 0,
          createdAt: now,
          updatedAt: now,
        };
        await setDoc(doc(db, 'professionals', profId), newProf);
        setProfessionalProfile(newProf);
      }
    } catch (err) {
      console.error('Erro no registo de perfil:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!userProfile?.uid) return;
    try {
      const docSnap = await getDoc(doc(db, 'users', userProfile.uid));
      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as UserProfile);
      }
    } catch (e) {
      console.error('Erro ao atualizar perfil:', e);
    }
  };

  const currentRole = userProfile?.role || 'cliente';
  const isAdmin = currentRole === 'administrador' || userProfile?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const isProfessional = currentRole === 'profissional';
  const isClient = currentRole === 'cliente';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        professionalProfile,
        role: currentRole,
        isAdmin,
        isProfessional,
        isClient,
        isLoading,
        signInWithGoogle,
        signOut,
        switchDemoUser,
        registerProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
