// Dashboard Page
import { useAuth } from '../context/FirebaseAuthContext';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { fixMyRole } from '../utils/fixUserRole';
import { syncCategories, recalculateCounts } from '../utils/populateCategories';
import { fixMediaTypes, getMediaStats } from '../utils/fixMediaTypes';
import { useCategories } from '../utils/categoryManager'; // Use real categories
import { categories as localCategories } from '../data/categories';
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
    RefreshCw,
    Wrench,
    BarChart3
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
    const { user, userRole, isAdmin } = useAuth();
    const { categories, realCountsLoaded, refreshRealCounts } = useCategories(); // Use real categories

    // Helper function to generate random counts for demo purposes
    const generateRandomCount = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    const [stats, setStats] = useState({
        totalImages: generateRandomCount(450, 1000), // Random demo count
        totalVideos: generateRandomCount(250, 800),   // Random demo count
        totalCategories: 0,
        favorites: 0
    });

    const [featuredCategories, setFeaturedCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [recalculating, setRecalculating] = useState(false);
    const [fixingTypes, setFixingTypes] = useState(false);

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

    // Fix media types
    const handleFixMediaTypes = async () => {
        setFixingTypes(true);
        try {
            console.log('🔧 Fixing media types...');
            const result = await fixMediaTypes();
            alert(`✅ Media types fixed!\n\nAlready correct: ${result.alreadyCorrect}\nFixed: ${result.fixed}\nErrors: ${result.errors}\nTotal: ${result.total}`);
            console.log('✅ Media types fixed:', result);
        } catch (error) {
            console.error('❌ Failed to fix media types:', error);
            alert('❌ Failed to fix media types. Check console for details.');
        } finally {
            setFixingTypes(false);
        }
    };

    // Get media stats
    const handleGetMediaStats = async () => {
        try {
            console.log('📊 Getting media stats...');
            const stats = await getMediaStats();
            alert(`📊 Media Statistics:\n\n🖼️ Images: ${stats.images}\n🎬 Videos: ${stats.videos}\n❓ Unknown: ${stats.unknown}\n📊 Total: ${stats.total}`);
        } catch (error) {
            console.error('❌ Failed to get media stats:', error);
            alert('❌ Failed to get media stats. Check console for details.');
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
        
        // 1. Set featured categories from local data with random counts
        const featuredCats = localCategories.slice(0, 6).map(cat => ({
            ...cat,
            totalImages: cat.subCategories.reduce((acc, sub) => acc + (sub.imageCount || 0), 0),
            totalVideos: cat.subCategories.reduce((acc, sub) => acc + (sub.videoCount || 0), 0)
        }));
        setFeaturedCategories(featuredCats);
        setStats(prev => ({ ...prev, totalCategories: localCategories.length }));
        
        // 2. Fetch Categories from Firebase (for comparison/sync)
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
            
            // If Firebase has categories, merge with local random counts
            if (cats.length > 0) {
                const mergedFeatured = localCategories.slice(0, 6).map(localCat => {
                    const fbCat = cats.find(c => c.id === localCat.id);
                    return {
                        ...localCat,
                        totalImages: localCat.subCategories.reduce((acc, sub) => acc + (sub.imageCount || 0), 0),
                        totalVideos: localCat.subCategories.reduce((acc, sub) => acc + (sub.videoCount || 0), 0),
                        // Keep Firebase data if available
                        ...(fbCat && { firebaseData: fbCat })
                    };
                });
                setFeaturedCategories(mergedFeatured);
            }
        }, (error) => {
            console.error("❌ Error fetching categories:", error);
            // Continue with local categories
            console.log("📊 Dashboard: Using local categories with random counts");
        });

        // 2. Fetch Media Counts
        console.log('📊 Dashboard: Setting up media listener...');
        const unsubMedia = onSnapshot(collection(db, 'media'), (snapshot) => {
            console.log(`📊 Dashboard: Media snapshot received, size: ${snapshot.size}`);
            let images = 0;
            let videos = 0;
            
            // If we have real media data, count it
            if (snapshot.size > 0) {
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const mediaType = data.type || data.mediaType; // Support both field names
                    
                    console.log('📄 Media item:', { 
                        id: doc.id, 
                        type: mediaType, 
                        name: data.name,
                        hasType: !!data.type,
                        hasMediaType: !!data.mediaType
                    });
                    
                    if (mediaType === 'video') {
                        videos++;
                    } else if (mediaType === 'image') {
                        images++;
                    } else {
                        console.warn('⚠️ Media item with unknown type:', { id: doc.id, type: mediaType, data });
                    }
                });
                
                console.log(`📊 Media stats updated with real data: ${images} images, ${videos} videos (total: ${snapshot.size})`);
                setStats(prev => ({ ...prev, totalImages: images, totalVideos: videos }));
            } else {
                // No real data, keep the random demo counts
                console.log('📊 No real media data found, keeping random demo counts');
            }
            
            setLoading(false);
        }, (error) => {
            console.error("❌ Error fetching media stats:", error);
            // Keep random demo counts on error
            console.log('📊 Error fetching media, keeping random demo counts');
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

            {/* Admin Tools Section - Clean and Professional */}
            {isAdmin && (
                <section className="dashboard-section">
                    <div className="section-header">
                        <h2>Admin Tools</h2>
                        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
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
                            <button 
                                className="btn btn-secondary btn-sm"
                                onClick={handleFixMediaTypes}
                                disabled={fixingTypes}
                            >
                                <Wrench size={16} className={fixingTypes ? 'animate-spin' : ''} />
                                {fixingTypes ? 'Fixing...' : 'Fix Media Types'}
                            </button>
                            <button 
                                className="btn btn-secondary btn-sm"
                                onClick={handleGetMediaStats}
                            >
                                <BarChart3 size={16} />
                                View Stats
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
                            href="https://brass-quotation.vercel.app/" 
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
                            href="https://brass-moodboard.vercel.app/" 
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