// Firebase Authentication Context with Role Management
import { createContext, useContext, useState, useEffect } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { getRoleByEmail } from '../utils/roleManager';
import { refreshRole } from '../utils/authUtils'; // Import the new helper

const FirebaseAuthContext = createContext();

export const useAuth = () => {
    const context = useContext(FirebaseAuthContext);
    if (!context) {
        throw new Error('useAuth must be used within a FirebaseAuthProvider');
    }
    return context;
};

import { ROLES, PERMISSIONS } from '../utils/roles';

// Re-export for backward compatibility if needed, but better to update consumers
export { ROLES, PERMISSIONS };


export const FirebaseAuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Get user permissions based on role
    const getPermissions = () => {
        return PERMISSIONS[userRole] || PERMISSIONS[ROLES.CLIENT];
    };

    // Check if user has specific permission
    const hasPermission = (permission) => {
        const permissions = getPermissions();
        return permissions[permission] || false;
    };

    // Helper to sync role from claims or firestore
    const syncUserRole = async (firebaseUser, forceRefresh = false) => {
        if (!firebaseUser) {
            setUserRole(null);
            return;
        }

        try {
            // 1. Try Custom Claims first (fastest & secure)
            if (forceRefresh) {
                await firebaseUser.getIdToken(true);
            }
            const tokenResult = await firebaseUser.getIdTokenResult();
            const claimRole = tokenResult.claims.role;

            if (claimRole) {
                console.log("Using Role from Custom Claims:", claimRole);
                setUserRole(claimRole);
                return claimRole;
            }

            // 2. Fallback to Firestore (if claim not ready yet)
            console.log("No custom claim found, checking Firestore...");

            // EMERGENCY FIX & SELF-REPAIR:
            // If admin@gmail.com or demo-admin has no claim, we force the role LOCALLY
            const adminEmails = ['admin@gmail.com', 'demo-admin@interior-library.com'];
            if (adminEmails.includes(firebaseUser.email)) {
                console.log("Admin Emergency Fix: Detected admin without custom claim.");

                // 1. Force Local Role immediately so UI works
                setUserRole(ROLES.ADMIN);

                // 2. Try to repair but don't block
                try {
                    setDoc(doc(db, 'users', firebaseUser.uid), {
                        role: ROLES.ADMIN,
                        email: firebaseUser.email,
                        lastSystemRepair: new Date().toISOString()
                    }, { merge: true });
                } catch (writeErr) {
                    console.warn("Admin Self-Repair: Could not write to Firestore (Client Offline?)", writeErr);
                }

                return ROLES.ADMIN;
            }

            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            let finalRole = ROLES.CLIENT; // Default

            if (userDoc.exists()) {
                finalRole = userDoc.data().role;
            } else {
                // Create user document if it doesn't exist
                finalRole = getRoleByEmail(firebaseUser.email);
                await setDoc(doc(db, 'users', firebaseUser.uid), {
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName || '',
                    role: finalRole,
                    createdAt: new Date().toISOString(),
                    favorites: [],
                    authType: 'firebase'
                });
            }

            setUserRole(finalRole);
            return finalRole;

        } catch (err) {
            console.error('Error fetching user role:', err);
            setUserRole(ROLES.CLIENT); // Default role
            return ROLES.CLIENT;
        }
    };

    // Manual Refresh Function exposed to context
    const refreshUserRole = async () => {
        if (!user) return null;
        console.log("Refreshing user role manually...");
        return await syncUserRole(user, true);
    };

    // Login function
    const login = async (email, password) => {
        try {
            setError(null);
            const result = await signInWithEmailAndPassword(auth, email, password);
            // Sync role after login
            await syncUserRole(result.user);
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Register function
    const register = async (email, password, displayName = '', selectedRole = null) => {
        try {
            setError(null);
            const result = await createUserWithEmailAndPassword(auth, email, password);

            // Determine role: use selected role, email mapping, or default to client
            const assignedRole = selectedRole || getRoleByEmail(email);

            // Save user data to Firestore
            await setDoc(doc(db, 'users', result.user.uid), {
                email,
                displayName: displayName || result.user.displayName || '',
                role: assignedRole,
                createdAt: new Date().toISOString(),
                favorites: [],
                authType: 'firebase',
                roleSource: selectedRole ? 'manual' : 'email-mapping'
            });

            // Note: The Cloud Function will pick this up and set the claim.
            // Initially, we rely on the local knowledge or Firestore until claim is ready.
            setUserRole(assignedRole);
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Demo login function (creates temporary Firebase users)
    const demoLogin = async (role) => {
        const demoCredentials = {
            admin: { email: 'demo-admin@interior-library.com', password: 'demo123admin' },
            staff: { email: 'demo-staff@interior-library.com', password: 'demo123staff' },
            client: { email: 'demo-client@interior-library.com', password: 'demo123client' }
        };

        const creds = demoCredentials[role];
        if (!creds) return;

        try {
            // Try to login first
            await login(creds.email, creds.password);
        } catch (error) {
            // If login fails, register the demo user
            try {
                await register(creds.email, creds.password, `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`, role);
            } catch (registerError) {
                console.error('Demo login failed:', registerError);
                throw registerError;
            }
        }
    };

    // Logout function
    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setUserRole(null);
            setError(null);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                await syncUserRole(firebaseUser);
            } else {
                setUser(null);
                setUserRole(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        user,
        userRole,
        refreshUserRole, // Exposed for UI
        loading,
        error,
        login,
        register,
        logout,
        demoLogin,
        hasPermission,
        getPermissions,
        isAdmin: userRole === ROLES.ADMIN,
        isStaff: userRole === ROLES.STAFF,
        isClient: userRole === ROLES.CLIENT
    };

    return (
        <FirebaseAuthContext.Provider value={value}>
            {children}
        </FirebaseAuthContext.Provider>
    );
};

export default FirebaseAuthContext;