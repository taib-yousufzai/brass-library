// Role Management Admin Page
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/FirebaseAuthContext';
import { ROLES } from '../../utils/roles';
import { Navigate } from 'react-router-dom';
import {
    updateUserRoleByEmail,
    bulkUpdateRoles,
    EMAIL_ROLE_MAPPINGS,
    getRoleByEmail
} from '../../utils/roleManager';
import { db } from '../../firebase/config';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import {
    Users,
    Shield,
    Mail,
    Crown,
    UserCheck,
    User,
    RefreshCw,
    Save
} from 'lucide-react';
import '../Admin/Admin.css';

const RoleManagement = () => {
    const { hasPermission } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [newRole, setNewRole] = useState('client');
    const [message, setMessage] = useState('');

    // Redirect if not admin
    if (!hasPermission('canManageUsers')) {
        return <Navigate to="/" replace />;
    }

    // Load users from Firestore
    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const usersRef = collection(db, 'users');
            const q = query(usersRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);

            const usersList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setUsers(usersList);
        } catch (error) {
            console.error('Error loading users:', error);
            setMessage('Error loading users');
        } finally {
            setLoading(false);
        }
    };

    // Update single user role
    const handleUpdateRole = async (email, role) => {
        try {
            setUpdating(true);
            await updateUserRoleByEmail(email, role);
            setMessage(`Successfully updated ${email} to ${role}`);
            await loadUsers(); // Refresh the list
        } catch (error) {
            setMessage(`Error updating role: ${error.message}`);
        } finally {
            setUpdating(false);
        }
    };

    // Bulk update roles based on email mappings
    const handleBulkUpdate = async () => {
        try {
            setUpdating(true);
            await bulkUpdateRoles();
            setMessage('Bulk role update completed successfully');
            await loadUsers(); // Refresh the list
        } catch (error) {
            setMessage(`Error in bulk update: ${error.message}`);
        } finally {
            setUpdating(false);
        }
    };

    // Add new email mapping (for demonstration)
    const handleAddEmailMapping = async () => {
        if (!newEmail || !newRole) {
            setMessage('Please enter both email and role');
            return;
        }

        try {
            await updateUserRoleByEmail(newEmail, newRole);
            setMessage(`Successfully assigned ${newRole} role to ${newEmail}`);
            setNewEmail('');
            setNewRole('client');
            await loadUsers();
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin': return <Crown size={16} className="role-icon admin" />;
            case 'staff': return <UserCheck size={16} className="role-icon staff" />;
            default: return <User size={16} className="role-icon client" />;
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin': return '#dc2626';
            case 'staff': return '#2563eb';
            default: return '#64748b';
        }
    };

    return (
        <div className="admin-page">
            <div className="page-header">
                <div className="header-content">
                    <h1>
                        <Shield size={24} />
                        Role Management
                    </h1>
                    <p>Manage user roles and permissions</p>
                </div>
            </div>

            {message && (
                <div className={`admin-message ${message.includes('Error') ? 'error' : 'success'}`}>
                    {message}
                </div>
            )}

            {/* Email Role Mappings */}
            <div className="admin-section">
                <h2>Predefined Email Mappings</h2>
                <div className="email-mappings">
                    {Object.entries(EMAIL_ROLE_MAPPINGS).map(([email, role]) => (
                        <div key={email} className="email-mapping">
                            <Mail size={16} />
                            <span className="email">{email}</span>
                            <span className="arrow">→</span>
                            <span className="role" style={{ color: getRoleColor(role) }}>
                                {getRoleIcon(role)}
                                {role}
                            </span>
                        </div>
                    ))}
                </div>

                <button
                    className="btn btn-primary"
                    onClick={handleBulkUpdate}
                    disabled={updating}
                >
                    <RefreshCw size={16} />
                    {updating ? 'Updating...' : 'Apply Email Mappings'}
                </button>
            </div>

            {/* Manual Role Assignment */}
            <div className="admin-section">
                <h2>Assign Role by Email</h2>
                <div className="role-assignment-form">
                    <input
                        type="email"
                        placeholder="Enter email address"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="form-input"
                    />
                    <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="form-select"
                    >
                        <option value="client">Client</option>
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                    </select>
                    <button
                        className="btn btn-secondary"
                        onClick={handleAddEmailMapping}
                        disabled={updating}
                    >
                        <Save size={16} />
                        Assign Role
                    </button>
                </div>
            </div>

            {/* Current Users */}
            <div className="admin-section">
                <h2>
                    <Users size={20} />
                    Current Users ({users.length})
                </h2>

                {loading ? (
                    <div className="loading">Loading users...</div>
                ) : (
                    <div className="users-table">
                        <div className="table-header">
                            <span>Email</span>
                            <span>Display Name</span>
                            <span>Current Role</span>
                            <span>Suggested Role</span>
                            <span>Actions</span>
                        </div>

                        {users.map(user => {
                            const suggestedRole = getRoleByEmail(user.email);
                            const needsUpdate = user.role !== suggestedRole;

                            return (
                                <div key={user.id} className={`table-row ${needsUpdate ? 'needs-update' : ''}`}>
                                    <span className="user-email">{user.email}</span>
                                    <span className="user-name">{user.displayName || 'N/A'}</span>
                                    <span className="user-role">
                                        {getRoleIcon(user.role)}
                                        {user.role}
                                    </span>
                                    <span className="suggested-role">
                                        {getRoleIcon(suggestedRole)}
                                        {suggestedRole}
                                        {needsUpdate && <span className="update-indicator">!</span>}
                                    </span>
                                    <div className="user-actions">
                                        {needsUpdate && (
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() => handleUpdateRole(user.email, suggestedRole)}
                                                disabled={updating}
                                            >
                                                Update
                                            </button>
                                        )}
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleUpdateRole(user.email, e.target.value)}
                                            className="role-select"
                                            disabled={updating}
                                        >
                                            <option value="client">Client</option>
                                            <option value="staff">Staff</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoleManagement;