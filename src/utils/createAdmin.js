// Admin Creation Utility
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

/**
 * Create a new admin user programmatically
 * @param {string} email - Admin email
 * @param {string} password - Admin password  
 * @param {string} displayName - Admin display name
 */
export const createAdminUser = async (email, password, displayName = '') => {
    try {
        console.log('Creating admin user:', email);
        
        // Create Firebase Auth user
        const result = await createUserWithEmailAndPassword(auth, email, password);
        
        // Save user data to Firestore with admin role
        await setDoc(doc(db, 'users', result.user.uid), {
            email,
            displayName,
            role: 'admin',
            createdAt: new Date().toISOString(),
            favorites: [],
            createdBy: 'system'
        });
        
        console.log('✅ Admin user created successfully:', email);
        return result;
        
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
        throw error;
    }
};

/**
 * Batch create multiple admin users
 * @param {Array} adminUsers - Array of {email, password, displayName}
 */
export const createMultipleAdmins = async (adminUsers) => {
    const results = [];
    
    for (const admin of adminUsers) {
        try {
            const result = await createAdminUser(admin.email, admin.password, admin.displayName);
            results.push({ success: true, email: admin.email, result });
        } catch (error) {
            results.push({ success: false, email: admin.email, error: error.message });
        }
    }
    
    return results;
};

// Example usage:
// createAdminUser('newadmin@company.com', 'securePassword123', 'New Admin');

// Batch create example:
// const newAdmins = [
//     { email: 'admin1@company.com', password: 'password123', displayName: 'Admin One' },
//     { email: 'admin2@company.com', password: 'password456', displayName: 'Admin Two' }
// ];
// createMultipleAdmins(newAdmins);