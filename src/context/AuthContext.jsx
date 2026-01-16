// Authentication Context with Role-Based Access Control
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

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Role permissions
export const ROLES = {
    ADMIN: 'admin',
    STAFF: 'staff',
    CLIENT: 'client'
};

export const PERMISSIONS = {
    [ROLES.ADMIN]: {
        canUpload: true,
        canDelete: true,
        canDownload: true,
        canScreenshot: true,
        canShare: true,
        canManageCategories: true,
        canManageUsers: true,
        canViewAnalytics: true,
        canFavorite: true
    },
    [ROLES.STAFF]: {
        canUpload: false,
        canDelete: false,
        canDownload: true,
        canScreenshot: true,
        canShare: true,
        canManageCategories: false,
        canManageUsers: false,
        canViewAnalytics: false,
        canFavorite: true
    },
    [ROLES.CLIENT]: {
        canUpload: false,
        canDelete: false,
        canDownload: false,
        canScreenshot: false,
        canShare: false,
        canManageCategories: false,
        canManageUsers: false,
        canViewAnalytics: false,
        canFavorite: true
    }
};

export const AuthProvider = ({ children }) => {
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

    // Login function
    const login = async (email, password) => {
        try {
            setError(null);
            const result = await signInWithEmailAndPassword(auth, email, password);

            // Get user role from Firestore
            const userDoc = await getDoc(doc(db, 'users', result.user.uid));
            if (userDoc.exists()) {
                setUserRole(userDoc.data().role);
            }

            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Register function
    const register = async (email, password, displayName = '', manualRole = null) => {
        try {
            console.log('AuthContext register called with:', { email, displayName, manualRole });
            setError(null);
            const result = await createUserWithEmailAndPassword(auth, email, password);
            console.log('Firebase user created:', result.user.uid);

            // Determine role: use manual role if provided, otherwise check email mappings
            const assignedRole = manualRole || getRoleByEmail(email);
            console.log('Assigned role:', assignedRole, 'Manual role:', manualRole);

            // Save user data to Firestore
            const userData = {
                email,
                displayName,
                role: assignedRole,
                createdAt: new Date().toISOString(),
                favorites: [],
                roleSource: manualRole ? 'manual' : 'email-mapping'
            };
            console.log('Saving user data to Firestore:', userData);
            
            await setDoc(doc(db, 'users', result.user.uid), userData);
            console.log('User data saved to Firestore successfully');

            setUserRole(assignedRole);
            return result;
        } catch (err) {
            console.error('Registration error in AuthContext:', err);
            setError(err.message);
            throw err;
        }
    };

    // Logout function
    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setUserRole(null);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Demo login (for testing without Firebase)
    const demoLogin = (role) => {
        const demoUsers = {
            admin: { uid: 'demo-admin', email: 'admin@demo.com', displayName: 'Admin User' },
            staff: { uid: 'demo-staff', email: 'staff@demo.com', displayName: 'Staff User' },
            client: { uid: 'demo-client', email: 'client@demo.com', displayName: 'Client User' }
        };

        setUser(demoUsers[role]);
        setUserRole(role);
        setLoading(false);
    };

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);

                // Get user role
                try {
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    if (userDoc.exists()) {
                        setUserRole(userDoc.data().role);
                    } else {
                        setUserRole(ROLES.CLIENT); // Default role
                    }
                } catch (err) {
                    console.error('Error fetching user role:', err);
                    setUserRole(ROLES.CLIENT);
                }
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
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
