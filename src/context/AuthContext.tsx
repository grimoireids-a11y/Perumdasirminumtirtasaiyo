import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { auth, db, testFirestoreConnection } from '../lib/firebase';
import { UserProfile, UserRole } from '../types/audit';
import { INITIAL_UNITS, INITIAL_REGULATIONS, INITIAL_OFFICIALS } from '../data/initialData';

interface AuthContextType {
  currentUser: FirebaseUser | { uid: string; email: string; displayName?: string } | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (identifier: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (
    identifier: string,
    pass: string,
    displayName: string,
    role: UserRole,
    unitId?: string,
    unitName?: string
  ) => Promise<{ pendingApproval: boolean }>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  seedInitialDataIfEmpty: () => Promise<void>;
  switchUserRole: (role: UserRole) => Promise<void>;
  updateProfileData: (updates: Partial<UserProfile>) => Promise<void>;
  approveUser: (uid: string, assignedRole?: UserRole) => Promise<void>;
  rejectUser: (uid: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_USER_KEY = 'spi_tirta_saiyo_local_user';
const SUPERMAN_UID = 'superman_root';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize and ensure root Kepala SPI account superman/superman123 exists
  const ensureSupermanAccount = async () => {
    try {
      const docRef = doc(db, 'users', SUPERMAN_UID);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        const supermanProfile: UserProfile = {
          uid: SUPERMAN_UID,
          username: 'superman',
          email: 'superman@tirtasaiyo.co.id',
          password: 'superman123',
          displayName: 'Kepala Satuan Pengawasan Intern',
          role: 'KEPALA_SPI',
          isActive: true,
          approvalStatus: 'APPROVED',
          nip: '19780415 200501 1 004',
          phone: '081267890123',
          createdAt: new Date().toISOString(),
        };
        await setDoc(docRef, supermanProfile);
        console.log('Akun root Kepala SPI superman/superman123 berhasil diinisialisasi.');
      }
    } catch (e) {
      console.warn('Superman account verification warning:', e);
    }
  };

  useEffect(() => {
    testFirestoreConnection();
    ensureSupermanAccount();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
          } else {
            // New Google user registration
            const usersSnap = await getDocs(collection(db, 'users'));
            const isFirst = usersSnap.empty;
            const isRootAdmin = user.email === 'hekctorsilalahi@gmail.com';
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'Auditor Tirta Saiyo',
              role: isFirst || isRootAdmin ? 'KEPALA_SPI' : 'AUDITOR',
              isActive: isFirst || isRootAdmin,
              approvalStatus: isFirst || isRootAdmin ? 'APPROVED' : 'PENDING',
              createdAt: new Date().toISOString(),
            };
            await setDoc(doc(db, 'users', user.uid), newProfile);
            setUserProfile(newProfile);
          }
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          setUserProfile(null);
        }
        setLoading(false);
      } else {
        // Check local saved session
        const savedLocal = localStorage.getItem(LOCAL_USER_KEY);
        if (savedLocal) {
          try {
            const parsed = JSON.parse(savedLocal) as UserProfile;
            setCurrentUser({ uid: parsed.uid, email: parsed.email, displayName: parsed.displayName });
            setUserProfile(parsed);
          } catch (e) {
            localStorage.removeItem(LOCAL_USER_KEY);
            setCurrentUser(null);
            setUserProfile(null);
          }
        } else {
          setCurrentUser(null);
          setUserProfile(null);
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCred = await signInWithPopup(auth, provider);
      const user = userCred.user;
      setCurrentUser(user);

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const prof = userDoc.data() as UserProfile;
        if (!prof.isActive || prof.approvalStatus === 'PENDING') {
          await firebaseSignOut(auth);
          throw new Error('Akun Anda sedang menunggu persetujuan dan aktivasi dari Kepala SPI (Super User).');
        }
        setUserProfile(prof);
      } else {
        const isRootAdmin = user.email === 'hekctorsilalahi@gmail.com';
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Pengguna SPI',
          role: isRootAdmin ? 'KEPALA_SPI' : 'AUDITOR',
          isActive: isRootAdmin,
          approvalStatus: isRootAdmin ? 'APPROVED' : 'PENDING',
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', user.uid), newProfile);
        if (!isRootAdmin) {
          await firebaseSignOut(auth);
          throw new Error('Pendaftaran dengan Google berhasil! Akun Anda sedang menunggu persetujuan dan aktivasi dari Kepala SPI.');
        }
        setUserProfile(newProfile);
      }
    } catch (err: unknown) {
      console.error('Google sign-in error:', err);
      throw err;
    }
  };

  const login = async (identifier: string, pass: string) => {
    const cleanId = identifier.trim().toLowerCase();

    // 1. Check for root Kepala SPI account superman / superman123
    if (cleanId === 'superman' || cleanId === 'superman@tirtasaiyo.co.id') {
      try {
        const supermanDoc = await getDoc(doc(db, 'users', SUPERMAN_UID));
        let expectedPass = 'superman123';
        let currentSupermanData: UserProfile;

        if (supermanDoc.exists()) {
          currentSupermanData = supermanDoc.data() as UserProfile;
          expectedPass = currentSupermanData.password || 'superman123';
        } else {
          // recreate if missing
          currentSupermanData = {
            uid: SUPERMAN_UID,
            username: 'superman',
            email: 'superman@tirtasaiyo.co.id',
            password: 'superman123',
            displayName: 'Kepala Satuan Pengawasan Intern',
            role: 'KEPALA_SPI',
            isActive: true,
            approvalStatus: 'APPROVED',
            createdAt: new Date().toISOString(),
          };
          try {
            await setDoc(doc(db, 'users', SUPERMAN_UID), currentSupermanData);
          } catch (writeErr) {
            console.warn('Could not write superman record to Firestore:', writeErr);
          }
        }

        if (pass !== expectedPass) {
          throw new Error('Kata sandi untuk akun superman salah.');
        }

        setCurrentUser({ uid: SUPERMAN_UID, email: currentSupermanData.email, displayName: currentSupermanData.displayName });
        setUserProfile(currentSupermanData);
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(currentSupermanData));
        return;
      } catch (err: any) {
        if (err.message && err.message.includes('Kata sandi')) {
          throw err;
        }
        // Resilient fallback when initial connection or rules are warming up
        if (pass === 'superman123') {
          const fallbackSuperman: UserProfile = {
            uid: SUPERMAN_UID,
            username: 'superman',
            email: 'superman@tirtasaiyo.co.id',
            password: 'superman123',
            displayName: 'Kepala Satuan Pengawasan Intern',
            role: 'KEPALA_SPI',
            isActive: true,
            approvalStatus: 'APPROVED',
            createdAt: new Date().toISOString(),
          };
          setCurrentUser({ uid: SUPERMAN_UID, email: fallbackSuperman.email, displayName: fallbackSuperman.displayName });
          setUserProfile(fallbackSuperman);
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(fallbackSuperman));
          return;
        }
        console.error('Superman login error:', err);
        throw err;
      }
    }

    // 2. Check in Firestore for registered users matching email or username
    try {
      const usersRef = collection(db, 'users');
      const qEmail = query(usersRef, where('email', '==', cleanId));
      let snap = await getDocs(qEmail);

      if (snap.empty) {
        const qUser = query(usersRef, where('username', '==', cleanId));
        snap = await getDocs(qUser);
      }

      if (!snap.empty) {
        const prof = snap.docs[0].data() as UserProfile;

        // Verify password
        if (prof.password && prof.password !== pass) {
          throw new Error('Kata sandi tidak sesuai. Silakan periksa kembali.');
        }

        // Check approval status
        if (prof.approvalStatus === 'PENDING' || !prof.isActive) {
          throw new Error(
            'Akun Anda terdaftar namun masih MENUNGGU PERSETUJUAN dan aktivasi dari Kepala SPI (Super User). Hubungi Kepala SPI untuk verifikasi akun.'
          );
        }

        setCurrentUser({ uid: prof.uid, email: prof.email, displayName: prof.displayName });
        setUserProfile(prof);
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(prof));
        return;
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('MENUNGGU PERSETUJUAN') || err.message.includes('Kata sandi'))) {
        throw err;
      }
      console.warn('Firestore query check warning:', err);
    }

    // 3. Try Firebase Auth as alternative
    try {
      const userCred = await signInWithEmailAndPassword(auth, cleanId, pass);
      const userDoc = await getDoc(doc(db, 'users', userCred.user.uid));
      if (userDoc.exists()) {
        const prof = userDoc.data() as UserProfile;
        if (!prof.isActive || prof.approvalStatus === 'PENDING') {
          await firebaseSignOut(auth);
          throw new Error('Akun Anda sedang menunggu persetujuan dan aktivasi dari Kepala SPI (Super User).');
        }
        setUserProfile(prof);
      }
    } catch (err: any) {
      if (err?.code === 'auth/operation-not-allowed') {
        throw new Error('Akun tidak ditemukan atau kata sandi tidak cocok. Pastikan akun sudah didaftarkan.');
      }
      throw err;
    }
  };

  const register = async (
    identifier: string,
    pass: string,
    displayName: string,
    role: UserRole,
    unitId?: string,
    unitName?: string
  ): Promise<{ pendingApproval: boolean }> => {
    const cleanId = identifier.trim().toLowerCase();
    const isEmail = cleanId.includes('@');
    const emailVal = isEmail ? cleanId : `${cleanId}@tirtasaiyo.co.id`;
    const usernameVal = isEmail ? cleanId.split('@')[0] : cleanId;

    // Check if username/email already exists
    const usersRef = collection(db, 'users');
    const qEmail = query(usersRef, where('email', '==', emailVal));
    const snap = await getDocs(qEmail);
    if (!snap.empty) {
      throw new Error('Email atau nama pengguna ini sudah terdaftar. Silakan gunakan menu Masuk.');
    }

    const uid = 'usr_' + Date.now();
    // Rule: New user registrations require approval by Kepala SPI (isActive: false, approvalStatus: 'PENDING')
    const newProfile: UserProfile = {
      uid,
      username: usernameVal,
      email: emailVal,
      password: pass,
      displayName,
      role,
      unitId,
      unitName,
      isActive: false, // Menunggu persetujuan Kepala SPI
      approvalStatus: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', uid), newProfile);
    return { pendingApproval: true };
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      // ignore
    }
    localStorage.removeItem(LOCAL_USER_KEY);
    setCurrentUser(null);
    setUserProfile(null);
  };

  const hasRole = (roles: UserRole | UserRole[]) => {
    if (!userProfile) return false;
    if (Array.isArray(roles)) {
      return roles.includes(userProfile.role);
    }
    return userProfile.role === roles;
  };

  const switchUserRole = async (newRole: UserRole) => {
    if (!userProfile) return;
    const updated = { ...userProfile, role: newRole };
    setUserProfile(updated);
    try {
      await updateDoc(doc(db, 'users', userProfile.uid), { role: newRole });
    } catch (e) {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updated));
    }
  };

  const updateProfileData = async (updates: Partial<UserProfile>) => {
    if (!userProfile) return;
    const updated = { ...userProfile, ...updates };
    setUserProfile(updated);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updated));

    try {
      await updateDoc(doc(db, 'users', userProfile.uid), updates);
    } catch (e) {
      console.warn('Profile update remote warning:', e);
    }
  };

  const approveUser = async (uid: string, assignedRole?: UserRole) => {
    try {
      const updates: any = {
        isActive: true,
        approvalStatus: 'APPROVED',
      };
      if (assignedRole) {
        updates.role = assignedRole;
      }
      await updateDoc(doc(db, 'users', uid), updates);
    } catch (err) {
      console.error('Error approving user:', err);
      throw err;
    }
  };

  const rejectUser = async (uid: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        isActive: false,
        approvalStatus: 'REJECTED',
      });
    } catch (err) {
      console.error('Error rejecting user:', err);
      throw err;
    }
  };

  const seedInitialDataIfEmpty = async () => {
    try {
      const unitsSnap = await getDocs(collection(db, 'units'));
      if (unitsSnap.empty) {
        for (const u of INITIAL_UNITS) {
          const id = u.code.toLowerCase().replace(/[^a-z0-9]/g, '-');
          await setDoc(doc(db, 'units', id), { ...u, id });
        }
      }

      const regsSnap = await getDocs(collection(db, 'regulations'));
      if (regsSnap.empty) {
        for (let i = 0; i < INITIAL_REGULATIONS.length; i++) {
          const r = INITIAL_REGULATIONS[i];
          const id = `reg-${i + 1}`;
          await setDoc(doc(db, 'regulations', id), { ...r, id });
        }
      }

      const ofcSnap = await getDocs(collection(db, 'signatories'));
      if (ofcSnap.empty) {
        for (const ofc of INITIAL_OFFICIALS) {
          await setDoc(doc(db, 'signatories', ofc.id), ofc);
        }
      }
    } catch (error) {
      console.error('Error seeding initial structure data:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        login,
        loginWithGoogle,
        register,
        logout,
        hasRole,
        seedInitialDataIfEmpty,
        switchUserRole,
        updateProfileData,
        approveUser,
        rejectUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthOptional = () => {
  return useContext(AuthContext);
};
