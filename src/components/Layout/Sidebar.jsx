// Sidebar Navigation Component
import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/FirebaseAuthContext';
import { db } from '../../firebase/config';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';
import {
    LayoutDashboard,
    FolderOpen,
    Heart,
    Upload,
    Users,
    BarChart3,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    ChefHat,
    Sofa,
    Bed,
    UtensilsCrossed,
    Bath,
    DoorOpen,
    LayoutGrid,
    Frame,
    Building2,
    Trees,
    Landmark,
    BookOpen,
    Clapperboard,
    Store,
    Layers,
    Menu,
    Edit3
} from 'lucide-react';
import './Sidebar.css';

// Icon mapping
const iconMap = {
    ChefHat, Sofa, Bed, UtensilsCrossed, Bath, DoorOpen,
    LayoutGrid, Frame, Building2, Trees, Landmark, BookOpen,
    Clapperboard, Store, Layers
};

const Sidebar = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [showCategories, setShowCategories] = useState(true);
    const [categories, setCategories] = useState([]);
    const { user, userRole, logout, hasPermission, isAdmin } = useAuth();
    const location = useLocation();

    // Fetch categories for sidebar
    useEffect(() => {
        // Fetch only what's needed, e.g., name, id, icon
        const q = query(collection(db, 'categories'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const cats = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCategories(cats);
        }, (error) => {
            console.warn("Sidebar category fetch failed:", error);
            // Non-critical, just don't crash
        });
        return () => unsubscribe();
    }, []);

    const mainNavItems = [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/categories', icon: FolderOpen, label: 'Library' },
        { path: '/favorites', icon: Heart, label: 'Favorites' }
    ];

    const adminNavItems = [
        { path: '/upload', icon: Upload, label: 'Upload Media', permission: 'canUpload' },
        { path: '/admin/categories', icon: Layers, label: 'Manage Categories', permission: 'canManageCategories' },
        { path: '/admin/category-editor', icon: Edit3, label: 'Category Editor', permission: 'canManageCategories' },
        { path: '/admin/users', icon: Users, label: 'User Management', permission: 'canManageUsers' },
        { path: '/admin/analytics', icon: BarChart3, label: 'Analytics', permission: 'canViewAnalytics' }
    ];

    const getIcon = (iconName) => {
        const Icon = iconMap[iconName];
        return Icon ? <Icon size={18} /> : <FolderOpen size={18} />;
    };

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            {/* Logo */}
            <div className="sidebar-header">
                <div className="logo">
                    {!collapsed && (
                        <>
                            <span className="logo-icon">✦</span>
                            <span className="logo-text">Interior Library</span>
                        </>
                    )}
                    {collapsed && <span className="logo-icon">✦</span>}
                </div>
                <button
                    className="collapse-btn"
                    onClick={() => setCollapsed(!collapsed)}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            {/* User Profile */}
            <div className="sidebar-user">
                <div className="user-avatar">
                    {user?.displayName?.[0] || user?.email?.[0] || 'U'}
                </div>
                {!collapsed && (
                    <div className="user-info">
                        <span className="user-name">{user?.displayName || user?.email || 'User'}</span>
                        <span className={`user-role role-${userRole}`}>
                            {userRole?.charAt(0).toUpperCase() + userRole?.slice(1)}
                        </span>
                    </div>
                )}
            </div>

            {/* Main Navigation */}
            <nav className="sidebar-nav">
                <div className="nav-section">
                    {!collapsed && <span className="nav-section-title">Main</span>}
                    <ul className="nav-list">
                        {mainNavItems.map((item) => (
                            <li key={item.path}>
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                    title={collapsed ? item.label : ''}
                                >
                                    <item.icon size={20} />
                                    {!collapsed && <span>{item.label}</span>}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Categories Section */}
                <div className="nav-section">
                    {!collapsed && (
                        <button
                            className="nav-section-title clickable"
                            onClick={() => setShowCategories(!showCategories)}
                        >
                            Categories
                            <ChevronRight
                                size={14}
                                className={`chevron ${showCategories ? 'rotated' : ''}`}
                            />
                        </button>
                    )}
                    {showCategories && !collapsed && (
                        <ul className="nav-list categories-list">
                            {categories.slice(0, 8).map((category) => (
                                <li key={category.id}>
                                    <NavLink
                                        to={`/category/${category.id}`}
                                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                    >
                                        {getIcon(category.icon)}
                                        <span>{category.name}</span>
                                    </NavLink>
                                </li>
                            ))}
                            <li>
                                <NavLink to="/categories" className="nav-link view-all">
                                    <Menu size={18} />
                                    <span>View All Categories</span>
                                </NavLink>
                            </li>
                        </ul>
                    )}
                </div>

                {/* Admin Section */}
                {isAdmin && (
                    <div className="nav-section">
                        {!collapsed && <span className="nav-section-title">Admin</span>}
                        <ul className="nav-list">
                            {adminNavItems.map((item) => (
                                hasPermission(item.permission) && (
                                    <li key={item.path}>
                                        <NavLink
                                            to={item.path}
                                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                            title={collapsed ? item.label : ''}
                                            onClick={(e) => {
                                                console.log(`Sidebar: Clicked ${item.label} -> ${item.path}`);
                                                // e.preventDefault(); // Un-comment to test if default nav fails
                                            }}
                                        >
                                            <item.icon size={20} />
                                            {!collapsed && <span>{item.label}</span>}
                                        </NavLink>
                                    </li>
                                )
                            ))}
                        </ul>
                    </div>
                )}
            </nav>

            {/* Sidebar Footer */}
            <div className="sidebar-footer">
                <NavLink
                    to="/settings"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    title={collapsed ? 'Settings' : ''}
                >
                    <Settings size={20} />
                    {!collapsed && <span>Settings</span>}
                </NavLink>
                <button
                    className="nav-link logout-btn"
                    onClick={logout}
                    title={collapsed ? 'Logout' : ''}
                >
                    <LogOut size={20} />
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
