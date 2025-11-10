import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { verificationService } from '../services/verification.service';
import type { DIDDocument } from '../services/verification.service';

interface VerificationContextType {
  isInitialized: boolean;
  didDocument: DIDDocument | null;
  issuerDid: string | null;
  error: string | null;
  refresh: () => Promise<void>;
}

const VerificationContext = createContext<VerificationContextType | undefined>(undefined);

interface VerificationProviderProps {
  children: ReactNode;
}

export function VerificationProvider({ children }: VerificationProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [didDocument, setDidDocument] = useState<DIDDocument | null>(null);
  const [issuerDid, setIssuerDid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initializeService = async () => {
    try {
      setError(null);
      console.log('Initializing verification service...');
      
      await verificationService.initialize();
      
      setDidDocument(verificationService.getDIDDocument());
      setIssuerDid(verificationService.getIssuerDid());
      setIsInitialized(true);
      
      console.log('Verification service initialized successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize verification service';
      console.error('Verification service initialization failed:', errorMessage);
      setError(errorMessage);
      setIsInitialized(false);
    }
  };

  const refresh = async () => {
    setIsInitialized(false);
    setDidDocument(null);
    setIssuerDid(null);
    await initializeService();
  };

  useEffect(() => {
    initializeService();
  }, []);

  const contextValue: VerificationContextType = {
    isInitialized,
    didDocument,
    issuerDid,
    error,
    refresh,
  };

  return (
    <VerificationContext.Provider value={contextValue}>
      {children}
    </VerificationContext.Provider>
  );
}

export function useVerification(): VerificationContextType {
  const context = useContext(VerificationContext);
  if (context === undefined) {
    throw new Error('useVerification must be used within a VerificationProvider');
  }
  return context;
}

export default VerificationProvider;