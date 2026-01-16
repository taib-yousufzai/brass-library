// Dashboard Page
import { useAuth } from '../context/FirebaseAuthContext';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { fixMyRole } from '../utils/fixUserRole';
import { syncCategories, recalculateCounts } from '../utils/populateCategories';
import {
    FolderOpen,
    Image,
    Video,
    Heart,
    TrendingUp,
    Upload,
    Users,
    ArrowRight,
    FileText,
    Palette,
    RefreshCw
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
    const { user, userRole, isAdmin, hasPermission } = useAuth();

    const [stats, setStats] = useState({
        totalImages: 0,
        totalVideos: 0,
        totalCategories: 0,
        favorites: 0
    });

    const [featuredCategories, setFeaturedCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [recalculating, setRecalculating] = useState(false);

    // Manual sync function for debugging
    const handleManualSync = async () => {
        setSyncing(true);
        try {
            console.log('🔄 Manual sync triggered...');
            await syncCategories();
            console.log('✅ Manual sync completed');
        } catch (error) {
            console.error('❌ Manual sync failed:', error);
        } finally {
            setSyncing(false);
        }
    };

    // Manual recalculate function for fixing counts
    const handleRecalculateCounts = async () => {
        setRecalculating(true);
        try {
            console.log('🔄 Manual recalculate triggered...');
            await recalculateCounts();
            console.log('✅ Manual recalculate completed');
        } catch (error) {
            console.error('❌ Manual recalculate failed:', error);
        } finally {
            setRecalculating(false);
        }
    };

    // Fix user role if needed
    useEffect(() => {
        const checkAndFixRole = async () => {
            if (user && user.email === '1921sumitabe@gmail.com' && userRole !== 'admin') {
                console.log('Fixing user role to admin...');
                try {
                    await fixMyRole();
                    console.log('Role fixed! Please refresh the page.');
                    // Refresh the page to reload with new role
                    window.location.reload();
                } catch (error) {
                    console.error('Error fixing role:', error);
                }
            }
        };
        
        if (user && userRole) {
            checkAndFixRole();
        }
    }, [user, userRole]);

    // Fetch data for dashboard
    useEffect(() => {
        console.log('🚀 Dashboard: Starting data fetch...');
        
        // 1. Fetch Categories
        const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
            console.log(`📊 Dashboard: Categories snapshot received, size: ${snapshot.size}`);
            const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log(`📊 Dashboard: Loaded ${cats.length} categories from Firebase:`, cats.map(cat => ({
                id: cat.id,
                name: cat.name,
                subCategories: cat.subCategories?.length || 0,
                totalImages: cat.subCategories?.reduce((acc, sub) => acc + (sub.imageCount || 0), 0) || 0,
                totalVideos: cat.subCategories?.reduce((acc, sub) => acc + (sub.videoCount || 0), 0) || 0
            })));
            setFeaturedCategories(cats.slice(0, 6));
            setStats(prev => ({ ...prev, totalCategories: cats.length }));
        }, (error) => {
            console.error("❌ Error fetching categories:", error);
            // Fallback to local categories if Firebase fails
            console.log("📊 Dashboard: Using local categories as fallback");
        });

        // 2. Fetch Media Counts
        console.log('📊 Dashboard: Setting up media listener...');
        const unsubMedia = onSnapshot(collection(db, 'media'), (snapshot) => {
            console.log(`📊 Dashboard: Media snapshot received, size: ${snapshot.size}`);
            let images = 0;
            let videos = 0;
            snapshot.forEach(doc => {
                const data = doc.data();
                console.log('📄 Media item:', { id: doc.id, type: data.type, name: data.name });
                if (data.type === 'video') videos++;
                else images++;
            });
            console.log(`📊 Media stats updated: ${images} images, ${videos} videos`);
            setStats(prev => ({ ...prev, totalImages: images, totalVideos: videos }));
            setLoading(false);
        }, (error) => {
            console.error("❌ Error fetching media stats:", error);
            // Set loading to false even on error so UI doesn't stay in loading state
            setLoading(false);
        });

        // 3. Fetch User Favorites Count
        let unsubUser = () => { };
        if (user) {
            console.log(`👤 Dashboard: Setting up user favorites listener for ${user.uid}`);
            unsubUser = onSnapshot(doc(db, 'users', user.uid), (doc) => {
                if (doc.exists()) {
                    const data = doc.data();
                    const favCount = (data.favorites || []).length;
                    console.log(`❤️ User favorites count: ${favCount}`);
                    setStats(prev => ({ ...prev, favorites: favCount }));
                } else {
                    console.log('👤 User document does not exist');
                }
            }, (error) => {
                console.error("❌ Error fetching user favorites:", error);
            });
        }

        return () => {
            console.log('🧹 Dashboard: Cleaning up listeners...');
            unsubCategories();
            unsubMedia();
            unsubUser();
        };
    }, [user]);

    return (
        <div className="dashboard">
            {/* Welcome Section */}
            <section className="dashboard-welcome">
                <div className="welcome-content">
                    <h1>Welcome back, <span className="highlight">{user?.displayName || 'Designer'}</span></h1>
                    <p>Explore your curated collection of interior design inspirations</p>
                </div>
                {isAdmin && (
                    <div className="welcome-actions">
                        <Link to="/upload" className="btn btn-primary">
                            <Upload size={18} />
                            Upload Media
                        </Link>
                        <Link to="/analytics" className="btn btn-secondary">
                            <TrendingUp size={18} />
                            View Analytics
                        </Link>
                    </div>
                )}
            </section>

            {/* Stats Grid */}
            <section className="dashboard-stats">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(237, 184, 43, 0.15)', color: 'var(--gold-400)' }}>
                        <FolderOpen size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.totalCategories}</span>
                        <span className="stat-label">Categories</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
                        <Image size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">
                            {loading ? '...' : stats.totalImages.toLocaleString()}
                        </span>
                        <span className="stat-label">Images</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
                        <Video size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">
                            {loading ? '...' : stats.totalVideos}
                        </span>
                        <span className="stat-label">Videos</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                        <Heart size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.favorites}</span>
                        <span className="stat-label">Favorites</span>
                    </div>
                </div>
            </section>

            {/* Debug Section for Admins */}
            {isAdmin && (
                <section className="dashboard-section">
                    <div className="section-header">
                        <h2>Debug Tools</h2>
                        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                            <button 
                                className="btn btn-secondary btn-sm"
                                onClick={handleManualSync}
                                disabled={syncing}
                            >
                                <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
                                {syncing ? 'Syncing...' : 'Sync Categories'}
                            </button>
                            <button 
                                className="btn btn-primary btn-sm"
                                onClick={handleRecalculateCounts}
                                disabled={recalculating}
                            >
                                <RefreshCw size={16} className={recalculating ? 'animate-spin' : ''} />
                                {recalculating ? 'Recalculating...' : 'Fix Counts'}
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {/* Featured Categories */}
            <section className="dashboard-section">
                <div className="section-header">
                    <h2>Browse Categories</h2>
                    <Link to="/categories" className="view-all-link">
                        View All <ArrowRight size={16} />
                    </Link>
                </div>

                <div className="featured-categories">
                    {featuredCategories.map((category, index) => (
                        <Link
                            to={`/category/${category.id}`}
                            key={category.id}
                            className="category-card"
                            style={{ '--card-color': category.color, animationDelay: `${index * 0.1}s` }}
                        >
                            <div className="category-emoji">{category.emoji}</div>
                            <div className="category-info">
                                <h3>{category.name}</h3>
                                <p>{category.subCategories.length} sub-categories</p>
                            </div>
                            <div className="category-arrow">
                                <ArrowRight size={20} />
                            </div>
                            <div className="category-glow"></div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Quick Actions for Admin */}
            {isAdmin && (
                <section className="dashboard-section">
                    <div className="section-header">
                        <h2>Quick Actions</h2>
                    </div>

                    <div className="quick-actions">
                        <Link to="/upload" className="action-card">
                            <div className="action-icon">
                                <Upload size={24} />
                            </div>
                            <div className="action-info">
                                <h4>Upload Media</h4>
                                <p>Add new images and videos to the library</p>
                            </div>
                        </Link>

                        <Link to="/users" className="action-card">
                            <div className="action-icon">
                                <Users size={24} />
                            </div>
                            <div className="action-info">
                                <h4>Manage Users</h4>
                                <p>Control access and permissions</p>
                            </div>
                        </Link>

                        <Link to="/analytics" className="action-card">
                            <div className="action-icon">
                                <TrendingUp size={24} />
                            </div>
                            <div className="action-info">
                                <h4>View Analytics</h4>
                                <p>Track most viewed designs</p>
                            </div>
                        </Link>

                        <a 
                            href="https://quotationbuilder-d79e9.web.app/" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="action-card"
                        >
                            <div className="action-icon">
                                <FileText size={24} />
                            </div>
                            <div className="action-info">
                                <h4>Quotation Builder</h4>
                                <p>Create professional quotations for clients</p>
                            </div>
                        </a>

                        <a 
                            href="https://vietual-office.web.app/" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="action-card"
                        >
                            <div className="action-icon">
                                <Palette size={24} />
                            </div>
                            <div className="action-info">
                                <h4>Mood Board Builder</h4>
                                <p>Create visual mood boards for design projects</p>
                            </div>
                        </a>
                    </div>
                </section>
            )}

            {/* Role-based Tips */}
            <section className="dashboard-tips">
                <div className="tip-card glass">
                    <div className="tip-icon">💡</div>
                    <div className="tip-content">
                        <h4>
                            {isAdmin ? 'Admin Tip' : userRole === 'staff' ? 'Staff Tip' : 'Quick Tip'}
                        </h4>
                        <p>
                            {isAdmin
                                ? 'You have full access to upload, manage, and organize all media content.'
                                : userRole === 'staff'
                                    ? 'You can download images, share via email, and save favorites.'
                                    : 'Browse and save designs to your favorites for inspiration. Contact your designer to get high-resolution versions.'}
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
