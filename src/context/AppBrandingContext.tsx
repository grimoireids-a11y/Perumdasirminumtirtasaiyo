import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthOptional } from './AuthContext';

export interface AppBrandingConfig {
  appName: string;              // e.g. "SPI SMART"
  appTagline: string;           // e.g. "RBIA"
  appFullName: string;          // e.g. "Sistem Informasi Pengawasan Intern Berbasis Risiko"
  institutionName: string;      // e.g. "Perumda Air Minum Tirta Saiyo Kabupaten Pasaman"
  shortInstitutionName: string; // e.g. "Perumda Tirta Saiyo Pasaman"
  address: string;              // e.g. "Jl. Jenderal Sudirman No. 12, Lubuk Sikaping, Kab. Pasaman, Sumatera Barat"
  phone: string;                // e.g. "(0753) 20123"
  email: string;                // e.g. "spi@tirtasaiyo.co.id"
  website: string;              // e.g. "www.tirtasaiyo.co.id"
  logoType: 'default' | 'image';
  logoUrl: string;              // Data URL (base64) or direct image URL
  logoThemeColor?: string;      // Accent ring/color
  accentColor?: string;         // Alias for logoThemeColor
  officeAddress?: string;       // Alias for address
  officePhone?: string;         // Alias for phone
  officeEmail?: string;         // Alias for email
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_BRANDING: AppBrandingConfig = {
  appName: 'SPI SMART',
  appTagline: 'RBIA',
  appFullName: 'Sistem Informasi Pengawasan Intern Berbasis Risiko (RBIA)',
  institutionName: 'Perumda Air Minum Tirta Saiyo Kabupaten Pasaman',
  shortInstitutionName: 'Perumda Tirta Saiyo Pasaman',
  address: 'Lubuk Sikaping, Kabupaten Pasaman, Sumatera Barat',
  phone: '(0753) 20123',
  email: 'spi@tirtasaiyo.co.id',
  website: 'www.tirtasaiyo.co.id',
  logoType: 'default',
  logoUrl: '',
  logoThemeColor: '#10b981',
};

interface AppBrandingContextType {
  branding: AppBrandingConfig;
  loading: boolean;
  updateBranding: (newConfig: Partial<AppBrandingConfig>) => Promise<void>;
  resetBranding: () => Promise<void>;
  canEditBranding: boolean;
}

const AppBrandingContext = createContext<AppBrandingContextType | undefined>(undefined);

export const AppBrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuthOptional();
  const userProfile = auth?.userProfile;
  const [branding, setBranding] = useState<AppBrandingConfig>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);

  // Kepala SPI and Admin Sistem are authorized to change branding
  const canEditBranding = userProfile?.role === 'KEPALA_SPI' || userProfile?.role === 'ADMIN_SISTEM';

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'app_settings', 'branding'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Partial<AppBrandingConfig>;
          const merged: AppBrandingConfig = {
            ...DEFAULT_BRANDING,
            ...data,
          };
          setBranding(merged);

          // Dynamically update document title
          if (merged.appName && merged.shortInstitutionName) {
            document.title = `${merged.appName} - ${merged.shortInstitutionName}`;
          }
        } else {
          setBranding(DEFAULT_BRANDING);
          document.title = `${DEFAULT_BRANDING.appName} - ${DEFAULT_BRANDING.shortInstitutionName}`;
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching branding settings:', error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const updateBranding = async (newConfig: Partial<AppBrandingConfig>) => {
    try {
      const payload: AppBrandingConfig = {
        ...branding,
        ...newConfig,
        updatedAt: new Date().toISOString(),
        updatedBy: userProfile?.displayName || userProfile?.email || 'Kepala SPI',
      };

      await setDoc(doc(db, 'app_settings', 'branding'), payload, { merge: true });
      setBranding(payload);
    } catch (err) {
      console.error('Failed to update branding settings:', err);
      throw err;
    }
  };

  const resetBranding = async () => {
    try {
      const payload: AppBrandingConfig = {
        ...DEFAULT_BRANDING,
        updatedAt: new Date().toISOString(),
        updatedBy: userProfile?.displayName || userProfile?.email || 'Kepala SPI (Reset)',
      };

      await setDoc(doc(db, 'app_settings', 'branding'), payload);
      setBranding(payload);
    } catch (err) {
      console.error('Failed to reset branding settings:', err);
      throw err;
    }
  };

  return (
    <AppBrandingContext.Provider
      value={{
        branding,
        loading,
        updateBranding,
        resetBranding,
        canEditBranding,
      }}
    >
      {children}
    </AppBrandingContext.Provider>
  );
};

export const useAppBranding = () => {
  const context = useContext(AppBrandingContext);
  if (!context) {
    throw new Error('useAppBranding must be used within an AppBrandingProvider');
  }
  return context;
};
