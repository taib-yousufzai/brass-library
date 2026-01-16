// Local Authentication Context (No Firebase Auth)
import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';

const LocalAuthContext = createContext();

export const useAuth = () => {
    const context = useContext(LocalAuthContext);
    if (!context) {
        throw new Error('useAuth must be used within a LocalAuthProvider');
    }
    return context;
};

// Role definitions
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

// Predefined users with credentials
const PREDEFINED_USERS = {
    // Admin users
    'admin@admin.com': { password: 'admin123', role: 'admin', name: 'Admin User' },
    '1921sumitabe@gmail.com': { password: 'admin123', role: 'admin', name: 'Sumit Admin' },
    'admin@lifeasy.com': { password: 'admin123', role: 'admin', name: 'Lifeasy Admin' },
    
    // Staff users
    'staff@staff.com': { password: 'staff123', role: 'staff', name: 'Staff User' },
    'designer@lifeasy.com': { password: 'staff123', role: 'staff', name: 'Designer' },
    
    // Client users
    'client@client.com': { password: 'client123', role: 'client', name: 'Client User' },
    'user@user.com': { password: 'user123', role: 'client', name: 'Regular User' }
};

export const LocalAuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load user from localStorage on app start
    useEffect(() => {
        const savedUser = localStorage.getItem('interior_library_user');
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                setUser(userData);
                setUserRole(userData.role);
            } catch (err) {
                console.error('Error loading saved user:', err);
                localStorage.removeItem('interior_library_user');
            }
        }
        setLoading(false);
    }, []);

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
            const normalizedEmail = email.toLowerCase().trim();
            
            // Check predefined users
            const predefinedUser = PREDEFINED_USERS[normalizedEmail];
            if (predefinedUser && predefinedUser.password === password) {
                const userData = {
                    uid: `local_${Date.now()}`,
                    email: normalizedEmail,
                    displayName: predefinedUser.name,
                    role: predefinedUser.role,
                    loginTime: new Date().toISOString()
                };
                
                // Save to localStorage
                localStorage.setItem('interior_library_user', JSON.stringify(userData));
                
                // Save to Firestore for data consistency
                try {
                    await setDoc(doc(db, 'users', userData.uid), {
                        ...userData,
                        createdAt: new Date().toISOString(),
                        favorites: [],
                        authType: 'local'
                    });
                } catch (firestoreError) {
                    console.warn('Firestore save failed, continuing with local auth:', firestoreError);
                }
                
                setUser(userData);
                setUserRole(userData.role);
                return { user: userData };
            }
            
            throw new Error('Invalid email or password');
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Register function
    const register = async (email, password, displayName = '', selectedRole = 'client') => {
        try {
            setError(null);
            const normalizedEmail = email.toLowerCase().trim();
            
            // Check if user already exists
            if (PREDEFINED_USERS[normalizedEmail]) {
                throw new Error('User already exists with this email');
            }
            
            // Create new user
            const userData = {
                uid: `local_${Date.now()}`,
                email: normalizedEmail,
                displayName: displayName || 'New User',
                role: selectedRole,
                createdAt: new Date().toISOString()
            };
            
            // Save to localStorage
            localStorage.setItem('interior_library_user', JSON.stringify(userData));
            
            // Save to Firestore
            try {
                await setDoc(doc(db, 'users', userData.uid), {
                    ...userData,
                    favorites: [],
                    authType: 'local'
                });
            } catch (firestoreError) {
                console.warn('Firestore save failed, continuing with local auth:', firestoreError);
            }
            
            setUser(userData);
            setUserRole(userData.role);
            return { user: userData };
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Demo login function
    const demoLogin = (role) => {
        const demoUsers = {
            admin: { 
                uid: 'demo-admin', 
                email: 'demo-admin@interior-library.com', 
                displayName: 'Demo Admin', 
                role: 'admin' 
            },
            staff: { 
                uid: 'demo-staff', 
                email: 'demo-staff@interior-library.com', 
                displayName: 'Demo Staff', 
                role: 'staff' 
            },
            client: { 
                uid: 'demo-client', 
                email: 'demo-client@interior-library.com', 
                displayName: 'Demo Client', 
                role: 'client' 
            }
        };

        const userData = demoUsers[role];
        if (userData) {
            localStorage.setItem('interior_library_user', JSON.stringify(userData));
            setUser(userData);
            setUserRole(userData.role);
        }
    };

    // Logout function
    const logout = () => {
        localStorage.removeItem('interior_library_user');
        setUser(null);
        setUserRole(null);
        setError(null);
    };

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
        <LocalAuthContext.Provider value={value}>
            {children}
        </LocalAuthContext.Provider>
    );
};

export default LocalAuthContext;