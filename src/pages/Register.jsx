// Registration Page
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/FirebaseAuthContext';
import { Eye, EyeOff, Mail, Lock, User, Crown, UserCheck, Shield } from 'lucide-react';
import './Auth.css';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [selectedRole, setSelectedRole] = useState('client');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        console.log('Registration attempt:', { email, selectedRole, displayName });

        // Validation
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            console.log('Calling register function with role:', selectedRole);
            const result = await register(email, password, displayName, selectedRole);
            console.log('Registration successful:', result);
            navigate('/');
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Role options with descriptions
    const roleOptions = [
        {
            value: 'admin',
            label: 'Admin',
            icon: <Crown size={18} />,
            description: 'Full access - Upload, manage users, analytics',
            color: '#dc2626'
        },
        {
            value: 'staff',
            label: 'Staff',
            icon: <UserCheck size={18} />,
            description: 'View, download, screenshot, share content',
            color: '#2563eb'
        },
        {
            value: 'client',
            label: 'Client',
            icon: <User size={18} />,
            description: 'View content and manage favorites only',
            color: '#64748b'
        }
    ];

    // Check if email will get automatic role
    const getAutomaticRole = (email) => {
        const adminEmails = [
            'admin@brassspace.com',
            'owner@brassspace.com',
            'manager@brassspace.com',
            '1921sumitabe@gmail.com'
        ];

        const staffEmails = [
            'staff@brassspace.com',
            'designer@brassspace.com',
            'architect@brassspace.com'
        ];

        if (adminEmails.includes(email.toLowerCase())) return 'admin';
        if (staffEmails.includes(email.toLowerCase())) return 'staff';
        return null;
    };

    const automaticRole = email ? getAutomaticRole(email) : null;

    return (
        <div className="auth-page">
            {/* Background Decoration */}
            <div className="auth-bg-decoration">
                <div className="decoration-circle circle-1"></div>
                <div className="decoration-circle circle-2"></div>
                <div className="decoration-circle circle-3"></div>
            </div>

            <div className="auth-container">
                {/* Left Side - Branding */}
                <div className="auth-branding">
                    <div className="branding-content">
                        <div className="brand-logo">
                            <span className="logo-icon">✦</span>
                            <span className="logo-text">Interior Library</span>
                        </div>
                        <h1 className="brand-tagline">
                            Choose Your <span className="highlight">Access Level</span>
                        </h1>
                        <p className="brand-description">
                            Create your account and select the appropriate role for your needs.
                            Get access to thousands of curated interior design resources from Brass Space Interior Solution.
                        </p>
                        <div className="brand-features">
                            <div className="feature">
                                <span className="feature-icon">👑</span>
                                <span>Admin - Full Control</span>
                            </div>
                            <div className="feature">
                                <span className="feature-icon">👨‍💼</span>
                                <span>Staff - Professional Access</span>
                            </div>
                            <div className="feature">
                                <span className="feature-icon">👤</span>
                                <span>Client - View & Favorites</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Registration Form */}
                <div className="auth-form-container">
                    <div className="auth-form-wrapper">
                        <div className="auth-header">
                            <h2>Create Account</h2>
                            <p>Sign up to access your design library</p>
                        </div>

                        {error && (
                            <div className="auth-error">
                                {error}
                            </div>
                        )}

                        <form className="auth-form" onSubmit={handleSubmit}>
                            <div className="input-group">
                                <label className="input-label">Display Name</label>
                                <div className="input-with-icon">
                                    <User size={18} className="input-icon" />
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Enter your name"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Email</label>
                                <div className="input-with-icon">
                                    <Mail size={18} className="input-icon" />
                                    <input
                                        type="email"
                                        className="input"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                {automaticRole && (
                                    <div className={`role-preview ${automaticRole}`}>
                                        ⚡ This email automatically gets {automaticRole} access
                                    </div>
                                )}
                            </div>

                            {/* Role Selection */}
                            <div className="input-group">
                                <label className="input-label">
                                    <Shield size={16} />
                                    Account Type
                                </label>
                                <div className="role-selector">
                                    {roleOptions.map((role) => (
                                        <div
                                            key={role.value}
                                            className={`role-option ${selectedRole === role.value ? 'selected' : ''} ${automaticRole === role.value ? 'automatic' : ''}`}
                                            onClick={() => setSelectedRole(role.value)}
                                            style={{ '--role-color': role.color }}
                                        >
                                            <div className="role-header">
                                                <div className="role-icon" style={{ color: role.color }}>
                                                    {role.icon}
                                                </div>
                                                <div className="role-info">
                                                    <span className="role-name">{role.label}</span>
                                                    {automaticRole === role.value && (
                                                        <span className="automatic-badge">Auto</span>
                                                    )}
                                                </div>
                                                <div className="role-radio">
                                                    <input
                                                        type="radio"
                                                        name="role"
                                                        value={role.value}
                                                        checked={selectedRole === role.value}
                                                        onChange={() => setSelectedRole(role.value)}
                                                    />
                                                </div>
                                            </div>
                                            <p className="role-description">{role.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Password</label>
                                <div className="input-with-icon">
                                    <Lock size={18} className="input-icon" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="input"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Confirm Password</label>
                                <div className="input-with-icon">
                                    <Lock size={18} className="input-icon" />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        className="input"
                                        placeholder="Confirm your password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary auth-submit"
                                disabled={loading}
                            >
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </button>
                        </form>

                        <p className="auth-footer">
                            Already have an account?{' '}
                            <Link to="/login" className="auth-link">Sign In</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;