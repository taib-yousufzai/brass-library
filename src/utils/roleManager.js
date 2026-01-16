// Role Management Utilities
import { db } from '../firebase/config';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

// Predefined email-to-role mappings
export const EMAIL_ROLE_MAPPINGS = {
    // ========================================
    // 👑 ADMIN EMAILS (Full Access)
    // ========================================
    'admin@lifeasy.com': 'admin',
    'owner@lifeasy.com': 'admin',
    'manager@lifeasy.com': 'admin',
    '1921sumitabe@gmail.com': 'admin', // Your email as admin (FIXED)
    '1921sumitsb@gmail.com': 'admin',  // Alternative spelling
    'admin@admin.com': 'admin',
    'test@admin.com': 'admin',
    
    // Add your admin emails here:
    // 'youremail@gmail.com': 'admin',
    // 'boss@company.com': 'admin',
    // 'ceo@company.com': 'admin',
    
    // ========================================
    // 👨‍💼 STAFF EMAILS (Professional Access)
    // ========================================
    'staff@lifeasy.com': 'staff',
    'designer@lifeasy.com': 'staff',
    'architect@lifeasy.com': 'staff',
    
    // Add your staff emails here:
    // 'employee1@company.com': 'staff',
    // 'designer@company.com': 'staff',
    // 'manager@company.com': 'staff',
    
    // ========================================
    // 👤 CLIENT EMAILS (View Only Access)
    // ========================================
    // Add client emails here (optional - all others default to client):
    // 'client1@company.com': 'client',
    // 'viewer@company.com': 'client',
};

// Function to get role by email
export const getRoleByEmail = (email) => {
    const normalizedEmail = email.toLowerCase().trim();
    return EMAIL_ROLE_MAPPINGS[normalizedEmail] || 'client'; // Default to client
};

// Function to update user role by email
export const updateUserRoleByEmail = async (email, newRole) => {
    try {
        const normalizedEmail = email.toLowerCase().trim();
        
        // Query users collection for the email
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', normalizedEmail));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            throw new Error(`No user found with email: ${email}`);
        }
        
        // Update all matching users (should be only one)
        const updatePromises = querySnapshot.docs.map(userDoc => 
            updateDoc(doc(db, 'users', userDoc.id), { role: newRole })
        );
        
        await Promise.all(updatePromises);
        
        console.log(`Successfully updated role for ${email} to ${newRole}`);
        return true;
    } catch (error) {
        console.error('Error updating user role:', error);
        throw error;
    }
};

// Function to bulk update roles based on email mappings
export const bulkUpdateRoles = async () => {
    try {
        const updatePromises = Object.entries(EMAIL_ROLE_MAPPINGS).map(
            ([email, role]) => updateUserRoleByEmail(email, role)
        );
        
        await Promise.all(updatePromises);
        console.log('Bulk role update completed');
        return true;
    } catch (error) {
        console.error('Error in bulk role update:', error);
        throw error;
    }
};

// Function to check if email should have admin access
export const isAdminEmail = (email) => {
    const role = getRoleByEmail(email);
    return role === 'admin';
};

// Function to check if email should have staff access
export const isStaffEmail = (email) => {
    const role = getRoleByEmail(email);
    return role === 'staff' || role === 'admin';
};