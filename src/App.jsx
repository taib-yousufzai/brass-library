// Main App Component with Routing
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FirebaseAuthProvider, useAuth } from './context/FirebaseAuthContext';
import { useCategorySync } from './hooks/useCategorySync';

// Layout
import MainLayout from './components/Layout/MainLayout';
import ConnectionStatus from './components/ConnectionStatus';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import SubCategories from './pages/SubCategories';
import Gallery from './pages/Gallery';
import Upload from './pages/Upload';
import Favorites from './pages/Favorites';
import CategoryManagement from './pages/Admin/CategoryManagement';
import CategoryEditor from './pages/Admin/CategoryEditor';
import Analytics from './pages/Admin/Analytics';
import UserManagement from './pages/Admin/UserManagement';
import RoleManagement from './pages/Admin/RoleManagement';
import { ROLES } from './utils/roles';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, userRole, loading } = useAuth();

    console.log('ProtectedRoute Check:', { path: window.location.pathname, user: user?.email, userRole, allowedRoles, loading });

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!user) {
        console.log('ProtectedRoute: No user, redirecting to login');
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        console.log(`ProtectedRoute: Role ${userRole} not in allowed ${allowedRoles}, redirecting to home`);
        return <Navigate to="/" replace />;
    }

    return children;
};

// App Routes
const AppRoutes = () => {
    const { user } = useAuth();
    
    // Sync categories once when app starts
    useCategorySync();

    return (
        <Routes>
            {/* Public Routes */}
            <Route
                path="/login"
                element={user ? <Navigate to="/" replace /> : <Login />}
            />
            <Route
                path="/register"
                element={user ? <Navigate to="/" replace /> : <Register />}
            />

            {/* Protected Routes */}
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <MainLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Dashboard />} />
                <Route path="categories" element={<Categories />} />
                <Route path="category/:categoryId" element={<SubCategories />} />
                <Route path="category/:categoryId/:subCategoryId/:mediaType" element={<Gallery />} />
                <Route path="favorites" element={<Favorites />} />
                <Route path="upload" element={<Upload />} />

                {/* Placeholder routes for future features */}
                {/* <Route path="settings" element={<PlaceholderPage title="Settings" />} /> */}

                {/* Admin Routes */}
                <Route path="admin/analytics" element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                        <Analytics />
                    </ProtectedRoute>
                } />
                <Route path="admin/users" element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                        <UserManagement />
                    </ProtectedRoute>
                } />
                <Route path="admin/categories" element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                        <CategoryManagement />
                    </ProtectedRoute>
                } />
                <Route path="admin/category-editor" element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                        <CategoryEditor />
                    </ProtectedRoute>
                } />
                <Route path="admin/roles" element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                        <RoleManagement />
                    </ProtectedRoute>
                } />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};


// Main App
function App() {
    return (
        <BrowserRouter>
            <FirebaseAuthProvider>
                <AppRoutes />
                <ConnectionStatus />
            </FirebaseAuthProvider>
        </BrowserRouter>
    );
}

export default App;
