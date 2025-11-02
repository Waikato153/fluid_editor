'use client';

import LocalStorageHelper from './storageHelper';
export const getCredential = (): string | null => {
  if (typeof window === 'undefined') {
    console.error('getCredential should only be called on the client-side.');
    return null;
  }

  try {
    const jwtToken = LocalStorageHelper.getItem('jwtToken');


    if (!jwtToken) {
      console.error('AuthToken is missing');
      return null;
    }

    if (typeof jwtToken === "string") {
      const encodedCredential = btoa(jwtToken+':jwt');
      return `Basic ${encodedCredential}`;
    }
  } catch (error) {
    console.error('Error generating credentials:', error);
  }

  return null;
};

