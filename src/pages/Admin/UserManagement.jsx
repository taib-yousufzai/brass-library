import React, { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, UserPlus, Filter, X } from 'lucide-react';
import { db } from '../../firebase/config';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import AddUserModal from './AddUserModal';
import './Admin.css';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [roleFilter, setRoleFilter] = useState('all');

    useEffect(() => {
        console.log("UserManagement mounted/rendered");
    }, []);

    // Fetch users from Firestore
    useEffect(() => {
        setLoading(true);
        const unsubscribe = onSnapshot(
            collection(db, 'users'),
            (snapshot) => {
                const userList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    // Keep existing fields or defaults
                    role: doc.data().role || 'client',
                    status: doc.data().status || 'active',
                    lastLogin: doc.data().lastLogin ? new Date(doc.data().lastLogin.toDate()).toLocaleDateString() : 'Never'
                }));
                setUsers(userList);
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching users:", error);
                setLoading(false);
                // Don't alert immediately to avoid spamming if it's a transient permission issue
            }
        );

        return () => unsubscribe();
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        try {
            await updateDoc(doc(db, 'users', userId), {
                role: newRole
            });
        } catch (error) {
            console.error("Error updating user role:", error);
            alert("Failed to update user role");
        }
    };

    const handleDelete = async (user) => {
        if (window.confirm(`Are you sure you want to delete ${user.displayName || user.email}? \n\nNOTE: This only deletes their profile data. The authentication account must be disabled/deleted from the Firebase Console manually for security reasons.`)) {
            try {
                await deleteDoc(doc(db, 'users', user.id));
            } catch (error) {
                console.error("Error deleting user:", error);
                alert("Failed to delete user");
            }
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.displayName || user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    return (
        <div className="admin-page-content">
            <div className="page-header">
                <div className="header-title">
                    <h1>User Management</h1>
                    <p className="text-muted">{users.length} total users</p>
                </div>

                <div className="header-actions">
                    <div className="search-bar">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="filter-dropdown">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Roles</option>
                            <option value="admin">Admins</option>
                            <option value="staff">Staff</option>
                            <option value="client">Clients</option>
                        </select>
                    </div>

                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                        <UserPlus size={18} />
                        <span>Add User</span>
                    </button>
                </div>
            </div>

            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Last Login</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="text-center p-4">Loading users...</td>
                            </tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="text-center p-4">No users found</td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <td>
                                        <div className="user-cell">
                                            <div className="user-avatar">
                                                {(user.displayName || user.name || user.email || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="user-name">{user.displayName || user.name || 'Unknown User'}</div>
                                                <div className="user-email text-muted" style={{ fontSize: '0.8rem' }}>{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            className={`role-select-badge role-${user.role}`}
                                        >
                                            <option value="client">Client</option>
                                            <option value="staff">Staff</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${user.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                                            <span className="status-dot"></span>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="text-muted">{user.lastLogin}</td>
                                    <td>
                                        <div className="actions">
                                            <button
                                                className="action-btn delete"
                                                title="Delete User Data"
                                                onClick={() => handleDelete(user)}
                                                disabled={user.role === 'admin'}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showAddModal && (
                <AddUserModal
                    onClose={() => setShowAddModal(false)}
                    onUserAdded={() => {
                        // Optional: Show success toast
                    }}
                />
            )}
        </div>
    );
};

export default UserManagement;
