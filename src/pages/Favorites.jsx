// Favorites Page
import { useState, useEffect } from 'react';
import { useAuth } from '../context/FirebaseAuthContext';
import { Link } from 'react-router-dom';
import { db } from '../firebase/config';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { Heart, Grid, List, Download, Share2, Trash2, X } from 'lucide-react';
import './Favorites.css';

const Favorites = () => {
    const { hasPermission, isClient, user } = useAuth();
    const [viewMode, setViewMode] = useState('grid');
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [favoriteItems, setFavoriteItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch favorites
    useEffect(() => {
        if (!user) return;

        setLoading(true);
        const unsubscribe = onSnapshot(doc(db, 'users', user.uid), async (userDoc) => {
            if (userDoc.exists()) {
                const data = userDoc.data();
                const favIds = data.favorites || [];

                if (favIds.length === 0) {
                    setFavoriteItems([]);
                    setLoading(false);
                    return;
                }

                try {
                    // Fetch all favorite media items
                    // Note: In a production app with many favorites, you might want to paginate this
                    // or use a 'favorites' subcollection instead of an array.
                    const items = await Promise.all(
                        favIds.map(async (id) => {
                            const mediaDoc = await getDoc(doc(db, 'media', id));
                            if (mediaDoc.exists()) {
                                return { id: mediaDoc.id, ...mediaDoc.data() };
                            }
                            return null;
                        })
                    );

                    // Filter out nulls (deleted items)
                    setFavoriteItems(items.filter(item => item !== null));
                } catch (error) {
                    console.error("Error fetching favorites:", error);
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const toggleSelect = (id) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const clearSelection = () => {
        setSelectedItems(new Set());
    };

    const handleBulkDownload = () => {
        if (!hasPermission('canDownload')) {
            alert('Download not available for your account.');
            return;
        }
        console.log('Downloading selected items:', Array.from(selectedItems));
    };

    const handleBulkShare = () => {
        if (!hasPermission('canShare')) {
            alert('Sharing not available for your account.');
            return;
        }
        console.log('Sharing selected items:', Array.from(selectedItems));
    };

    return (
        <div className="favorites-page">
            {/* Page Header */}
            <div className="page-header">
                <div className="header-content">
                    <h1>
                        <Heart size={28} className="header-icon" />
                        My Favorites
                    </h1>
                    <p>Your saved design inspirations</p>
                </div>

                <div className="header-actions">
                    <div className="view-toggle">
                        <button
                            className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedItems.size > 0 && (
                <div className="bulk-actions-bar">
                    <div className="selection-info">
                        <span>{selectedItems.size} items selected</span>
                        <button className="clear-btn" onClick={clearSelection}>
                            <X size={14} />
                            Clear
                        </button>
                    </div>
                    <div className="bulk-actions">
                        {hasPermission('canDownload') && (
                            <button className="btn btn-secondary" onClick={handleBulkDownload}>
                                <Download size={16} />
                                Download All
                            </button>
                        )}
                        {hasPermission('canShare') && (
                            <button className="btn btn-secondary" onClick={handleBulkShare}>
                                <Share2 size={16} />
                                Share via Email
                            </button>
                        )}
                        <button className="btn btn-secondary delete-btn">
                            <Trash2 size={16} />
                            Remove
                        </button>
                    </div>
                </div>
            )}

            {/* Favorites Grid */}
            {favoriteItems.length > 0 ? (
                <div className={`favorites-grid ${viewMode}`}>
                    {favoriteItems.map((item, index) => (
                        <div
                            key={item.id}
                            className={`favorite-card ${selectedItems.has(item.id) ? 'selected' : ''}`}
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <div className="favorite-checkbox">
                                <input
                                    type="checkbox"
                                    checked={selectedItems.has(item.id)}
                                    onChange={() => toggleSelect(item.id)}
                                />
                            </div>
                            <div className="favorite-preview">
                                <img src={item.thumbnail} alt={item.name} />
                                <div className="favorite-overlay">
                                    <Link to={item.link} className="view-btn">View</Link>
                                </div>
                            </div>
                            <div className="favorite-info">
                                <h4>{item.name}</h4>
                                <p>{item.category} • {item.subCategory}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* Empty State */
                <div className="empty-state">
                    <Heart size={64} />
                    <h3>No favorites yet</h3>
                    <p>Browse the library and save designs you love</p>
                    <Link to="/categories" className="btn btn-primary">
                        Explore Categories
                    </Link>
                </div>
            )}
        </div>
    );
};

export default Favorites;
