// Quick fix to update user role in Firestore
import { db } from '../firebase/config';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

export const fixUserRole = async (email, newRole) => {
    try {
        console.log(`Fixing role for ${email} to ${newRole}`);
        
        // Query users collection for the email
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email.toLowerCase()));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            console.log(`No user found with email: ${email}`);
            return false;
        }
        
        // Update all matching users (should be only one)
        for (const userDoc of querySnapshot.docs) {
            await updateDoc(doc(db, 'users', userDoc.id), { 
                role: newRole,
                updatedAt: new Date().toISOString(),
                roleSource: 'manual-fix'
            });
            console.log(`Updated user ${userDoc.id} role to ${newRole}`);
        }
        
        return true;
    } catch (error) {
        console.error('Error fixing user role:', error);
        throw error;
    }
};

// Call this function to fix your role immediately
export const fixMyRole = () => {
    return fixUserRole('1921sumitabe@gmail.com', 'admin');
};