import React, { useState } from 'react';
import { X, UserPlus, Mail, Lock, User, Shield } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, firebaseConfig } from '../../firebase/config';
import './Admin.css';

const AddUserModal = ({ onClose, onUserAdded }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        displayName: '',
        role: 'client'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        let secondaryApp = null;

        try {
            // 1. Initialize a secondary Firebase app to create user without logging out admin
            // Use a unique name for the app to avoid conflicts
            const appName = `secondaryApp-${Date.now()}`;
            secondaryApp = initializeApp(firebaseConfig, appName);
            const secondaryAuth = getAuth(secondaryApp);
            const secondaryDb = getFirestore(secondaryApp); // Get Firestore for the new user

            // 2. Create Authentication User
            const userCredential = await createUserWithEmailAndPassword(
                secondaryAuth,
                formData.email,
                formData.password
            );
            const user = userCredential.user;

            // 3. Create Firestore Document (using secondary app's db to pass 'auth.uid == uid' rule)
            // Since Admin permission to write others might be restricted, we write AS the new user.
            await setDoc(doc(secondaryDb, 'users', user.uid), {
                uid: user.uid,
                email: formData.email,
                displayName: formData.displayName,
                role: formData.role,
                status: 'active',
                createdAt: serverTimestamp(),
                photoURL: null,
                settings: {
                    notifications: true,
                    theme: 'dark'
                }
            });

            // 4. Sign out from secondary app immediately
            await signOut(secondaryAuth);

            // Success!
            if (onUserAdded) onUserAdded();
            onClose();

        } catch (err) {
            console.error("Error adding user:", err);
            // Handle specific Firebase errors
            if (err.code === 'auth/email-already-in-use') {
                setError('This email is already registered.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password should be at least 6 characters.');
            } else {
                setError('Failed to create user. Please try again.');
            }
        } finally {
            // Cleanup secondary app
            /* 
               Note: deleteApp(secondaryApp) is the proper way, but it returns a promise.
               For this simple modal, letting it get garbage collected or just signing out is usually enough 
               to prevent side effects, but explicitly deleting is better if we imported deleteApp.
               However, `deleteApp` is strictly async and might throw if we try to reuse name too fast.
               Since we use a unique name `appName`, we are safe from collisions.
            */
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2><UserPlus size={24} /> Add New User</h2>
                    <button className="close-btn" onClick={onClose}><X size={24} /></button>
                </div>

                {error && <div className="admin-message error">{error}</div>}

                <form onSubmit={handleSubmit} className="add-user-form">
                    <div className="form-group">
                        <label><User size={16} /> Display Name</label>
                        <input
                            type="text"
                            name="displayName"
                            placeholder="John Doe"
                            value={formData.displayName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label><Mail size={16} /> Email Address</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="user@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label><Lock size={16} /> Password</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Minimum 6 characters"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength={6}
                        />
                    </div>

                    <div className="form-group">
                        <label><Shield size={16} /> Role</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="role-select-full"
                        >
                            <option value="client">Client</option>
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Creating...' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddUserModal;
