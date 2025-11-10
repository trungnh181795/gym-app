import { useState, useEffect } from 'react';
import { apiClient } from '../api';
import type { GymBusinessInfo } from '../types';

export const useGymInfo = () => {
  const [gymInfo, setGymInfo] = useState<GymBusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGymInfo = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getGymInfo();
        setGymInfo(data);
      } catch (err) {
        console.error('Failed to fetch gym info:', err);
        setError('Failed to load gym information');
      } finally {
        setLoading(false);
      }
    };

    fetchGymInfo();
  }, []);

  /**
   * Get display name for an issuer DID
   * If the DID matches our gym's DID, return the gym name
   * Otherwise return the DID itself
   */
  const getIssuerDisplayName = (issuerDid: string): string => {
    if (gymInfo && issuerDid === gymInfo.did) {
      return gymInfo.name;
    }
    return issuerDid;
  };

  /**
   * Get full issuer info for display
   */
  const getIssuerInfo = (issuerDid: string) => {
    if (gymInfo && issuerDid === gymInfo.did) {
      return {
        name: gymInfo.name,
        fullName: gymInfo.fullName,
        businessType: gymInfo.businessType,
        location: gymInfo.location,
        website: gymInfo.website,
        did: gymInfo.did,
        isOurGym: true
      };
    }
    return {
      name: issuerDid,
      fullName: issuerDid,
      businessType: 'Unknown',
      location: 'Unknown',
      website: null,
      did: issuerDid,
      isOurGym: false
    };
  };

  return {
    gymInfo,
    loading,
    error,
    getIssuerDisplayName,
    getIssuerInfo
  };
};

export default useGymInfo;