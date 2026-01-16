import { useEffect } from 'react';
import { syncCategories } from '../utils/populateCategories';

export const useCategorySync = () => {
    useEffect(() => {
        // DISABLED: Firebase keeps detecting as offline
        // Categories will work with local data only
        console.log('📁 Category sync disabled - using local categories only');
    }, []);
};