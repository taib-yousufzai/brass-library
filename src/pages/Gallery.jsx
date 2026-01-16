import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/FirebaseAuthContext';
import { db } from '../firebase/config';
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { useCategories } from '../utils/categoryManager';
import { scanStorageForMediaOptimized } from '../utils/storageScanner';
import ImageWithFallback from '../components/ImageWithFallback';
import { 
    ArrowLeft,
    Grid,
    List,
    Download,
    Share2,
    Heart,
    Filter,
    SortDesc,
    X,
    Play,
    Image as ImageIcon,
    Lock,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import './Gallery.css';

const Gallery = () => {
    // Basic state initialization
    const { categoryId, subCategoryId, mediaType } = useParams();
    const { hasPermission, isClient, user } = useAuth();
    const { getCategoryById } = useCategories();
    
    // Component state
    const [viewMode, setViewMode] = useState('grid');
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [favorites, setFavorites] = useState(new Set());
    const [mediaItems, setMediaItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [visibleItems, setVisibleItems] = useState(20);
    const [loadingMore, setLoadingMore] = useState(false);
    const [imageErrors, setImageErrors] = useState(new Map());
    const [showBatchErrorMessage, setShowBatchErrorMessage] = useState(false);
    const [retryKey, setRetryKey] = useState(0);

    // Get category and subcategory data safely
    const category = getCategoryById(categoryId);
    const subCategory = category?.subCategories?.find(s => s.id === subCategoryId);
    const isVideo = mediaType === 'video';

    // Simple error handling functions
    const handleImageError = useCallback((mediaId, errorInfo) => {
        setImageErrors(prev => {
            const newErrors = new Map(prev);
            newErrors.set(mediaId, errorInfo);
            
            if (newErrors.size >= 3) {
                setShowBatchErrorMessage(true);
            }
            
            return newErrors;
        });
    }, []);

    const handleImageLoad = useCallback((mediaId) => {
        setImageErrors(prev => {
            const newErrors = new Map(prev);
            newErrors.delete(mediaId);
            
            if (newErrors.size < 3) {
                setShowBatchErrorMessage(false);
            }
            
            return newErrors;
        });
    }, []);

    const retryAllFailedImages = useCallback(() => {
        setImageErrors(new Map());
        setShowBatchErrorMessage(false);
        setRetryKey(prev => prev + 1);
        console.log('🔄 Retrying all failed images...');
    }, []);

    const dismissBatchError = useCallback(() => {
        setShowBatchErrorMessage(false);
    }, []);

    // Load media items with error handling
    useEffect(() => {
        if (!categoryId || !subCategoryId || !mediaType) return;

        const loadMedia = async () => {
            setLoading(true);
            console.log(`📷 Loading media: ${categoryId}/${subCategoryId}/${mediaType}`);
            
            try {
                const items = await scanStorageForMediaOptimized(categoryId, subCategoryId, mediaType);
                console.log(`✅ Loaded ${items.length} media items`);
                setMediaItems(items || []);
                setVisibleItems(Math.min(20, items?.length || 0));
            } catch (error) {
                console.error('❌ Error loading media:', error);
                setMediaItems([]);
            } finally {
                setLoading(false);
            }
        };

        loadMedia();
    }, [categoryId, subCategoryId, mediaType]);

    // Infinite scroll / Load more functionality
    const loadMoreItems = () => {
        if (loadingMore || visibleItems >= mediaItems.length) return;
        
        try {
            setLoadingMore(true);
            setTimeout(() => {
                try {
                    setVisibleItems(prev => Math.min(prev + 20, mediaItems.length));
                    setLoadingMore(false);
                } catch (error) {
                    console.error('Error updating visible items:', error);
                    setLoadingMore(false);
                }
            }, 300); // Small delay to show loading state
        } catch (error) {
            console.error('Error in loadMoreItems:', error);
            setLoadingMore(false);
        }
    };

    // Intersection Observer for infinite scroll
    useEffect(() => {
        let observer = null;
        
        try {
            observer = new IntersectionObserver(
                (entries) => {
                    try {
                        if (entries[0] && entries[0].isIntersecting && !loadingMore && visibleItems < mediaItems.length) {
                            loadMoreItems();
                        }
                    } catch (error) {
                        console.error('Error in intersection observer callback:', error);
                    }
                },
                { threshold: 0.1 }
            );

            const sentinel = document.querySelector('.load-more-sentinel');
            if (sentinel && observer) {
                observer.observe(sentinel);
            }
        } catch (error) {
            console.error('Error setting up intersection observer:', error);
        }

        return () => {
            try {
                if (observer) {
                    observer.disconnect();
                }
            } catch (error) {
                console.error('Error disconnecting intersection observer:', error);
            }
        };
    }, [loadingMore, visibleItems, mediaItems.length]);

    // Simple favorites handling
    useEffect(() => {
        if (!user) return;

        const loadFavorites = () => {
            try {
                // Try local storage first
                const localFavorites = localStorage.getItem(`favorites_${user.uid}`);
                if (localFavorites) {
                    setFavorites(new Set(JSON.parse(localFavorites)));
                }

                // Try Firebase if available
                const unsubscribe = onSnapshot(
                    doc(db, 'users', user.uid), 
                    (doc) => {
                        if (doc.exists()) {
                            const data = doc.data();
                            const favs = new Set(data.favorites || []);
                            setFavorites(favs);
                            // Sync to local storage
                            localStorage.setItem(`favorites_${user.uid}`, JSON.stringify([...favs]));
                        }
                    },
                    (error) => {
                        console.warn('Firebase favorites blocked, using local storage');
                    }
                );

                return unsubscribe;
            } catch (error) {
                console.warn('Error setting up favorites:', error);
                setFavorites(new Set());
            }
        };

        const unsubscribe = loadFavorites();
        return () => {
            if (unsubscribe && typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, [user]);

    // Screenshot protection for clients
    useEffect(() => {
        if (isClient) {
            // Disable right-click
            const handleContextMenu = (e) => {
                e.preventDefault();
                return false;
            };

            // Disable keyboard shortcuts
            const handleKeyDown = (e) => {
                // Block Print Screen
                if (e.key === 'PrintScreen') {
                    e.preventDefault();
                    return false;
                }
                // Block Ctrl+S, Ctrl+P, Ctrl+Shift+S
                if (e.ctrlKey && (e.key === 's' || e.key === 'p' || e.key === 'S' || e.key === 'P')) {
                    e.preventDefault();
                    return false;
                }
                // Block F12 (DevTools)
                if (e.key === 'F12') {
                    e.preventDefault();
                    return false;
                }
            };

            document.addEventListener('contextmenu', handleContextMenu);
            document.addEventListener('keydown', handleKeyDown);

            return () => {
                document.removeEventListener('contextmenu', handleContextMenu);
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [isClient]);

    const toggleFavorite = useCallback(async (mediaId) => {
        if (!user || !mediaId) return;

        try {
            // Update local state immediately
            const newFavorites = new Set(favorites);
            if (favorites.has(mediaId)) {
                newFavorites.delete(mediaId);
            } else {
                newFavorites.add(mediaId);
            }
            setFavorites(newFavorites);

            // Save to local storage
            localStorage.setItem(`favorites_${user.uid}`, JSON.stringify([...newFavorites]));

            // Try Firebase update (optional)
            try {
                const userRef = doc(db, 'users', user.uid);
                if (favorites.has(mediaId)) {
                    await updateDoc(userRef, { favorites: arrayRemove(mediaId) });
                } else {
                    await updateDoc(userRef, { favorites: arrayUnion(mediaId) });
                }
            } catch (firebaseError) {
                console.warn('Firebase blocked, using local storage only');
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    }, [user, favorites]);

    // Navigation functions for media viewer
    const getCurrentMediaIndex = () => {
        if (!selectedMedia || !mediaItems || mediaItems.length === 0) return -1;
        return mediaItems.findIndex(item => item && item.id === selectedMedia.id);
    };

    const preloadAdjacentImages = (currentIndex) => {
        if (!mediaItems || mediaItems.length === 0) return;
        
        // Preload next and previous images for faster navigation
        const preloadImage = (index) => {
            try {
                if (index >= 0 && index < mediaItems.length) {
                    const media = mediaItems[index];
                    if (media && media.url && !media.type.includes('video')) {
                        const img = new Image();
                        img.src = media.url;
                        img.onerror = () => {
                            console.warn(`Failed to preload image at index ${index}`);
                        };
                    }
                }
            } catch (error) {
                console.error(`Error preloading image at index ${index}:`, error);
            }
        };

        // Preload previous and next images
        preloadImage(currentIndex - 1);
        preloadImage(currentIndex + 1);
    };

    const goToPreviousMedia = () => {
        try {
            const currentIndex = getCurrentMediaIndex();
            if (currentIndex > 0 && mediaItems[currentIndex - 1]) {
                const newMedia = mediaItems[currentIndex - 1];
                setSelectedMedia(newMedia);
                preloadAdjacentImages(currentIndex - 1);
            }
        } catch (error) {
            console.error('Error navigating to previous media:', error);
        }
    };

    const goToNextMedia = () => {
        try {
            const currentIndex = getCurrentMediaIndex();
            if (currentIndex < mediaItems.length - 1 && mediaItems[currentIndex + 1]) {
                const newMedia = mediaItems[currentIndex + 1];
                setSelectedMedia(newMedia);
                preloadAdjacentImages(currentIndex + 1);
            }
        } catch (error) {
            console.error('Error navigating to next media:', error);
        }
    };

    // Preload adjacent images when a media item is selected
    useEffect(() => {
        if (selectedMedia && mediaItems && mediaItems.length > 0) {
            try {
                const currentIndex = getCurrentMediaIndex();
                if (currentIndex >= 0) {
                    preloadAdjacentImages(currentIndex);
                }
            } catch (error) {
                console.error('Error preloading adjacent images:', error);
            }
        }
    }, [selectedMedia, mediaItems]);

    // Keyboard navigation for media viewer
    useEffect(() => {
        if (!selectedMedia) return;

        const handleKeyDown = (e) => {
            try {
                switch (e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        goToPreviousMedia();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        goToNextMedia();
                        break;
                    case 'Escape':
                        e.preventDefault();
                        setSelectedMedia(null);
                        break;
                    default:
                        // Do nothing for other keys
                        break;
                }
            } catch (error) {
                console.error('Error handling keyboard navigation:', error);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            try {
                document.removeEventListener('keydown', handleKeyDown);
            } catch (error) {
                console.error('Error removing keyboard event listener:', error);
            }
        };
    }, [selectedMedia, mediaItems]);

    const handleDownload = (media) => {
        if (!hasPermission('canDownload')) {
            alert('Download not available for your account. Please contact your designer.');
            return;
        }
        // In real app, trigger download
        console.log('Downloading:', media);
    };

    const handleShare = (media) => {
        if (!hasPermission('canShare')) {
            alert('Sharing not available for your account.');
            return;
        }
        // In real app, open share modal
        console.log('Sharing:', media);
    };

    if (!category || !subCategory) {
        return (
            <div className="not-found">
                <h2>Content not found</h2>
                <Link to="/categories" className="btn btn-primary">
                    Back to Categories
                </Link>
            </div>
        );
    }

    return (
        <div className={`gallery-page ${isClient ? 'protected-content' : ''}`}>
            {/* Back Link */}
            <Link to={`/category/${categoryId}`} className="back-link">
                <ArrowLeft size={18} />
                <span>Back to {category.name}</span>
            </Link>

            {/* Gallery Header */}
            <div className="gallery-header">
                <div className="gallery-title">
                    <span className="category-emoji">{category.emoji}</span>
                    <div className="title-info">
                        <h1>{subCategory.name}</h1>
                        <p>{isVideo ? 'Videos' : 'Images'} • {category.name}</p>
                    </div>
                </div>

                <div className="gallery-controls">
                    {/* View Mode Toggle */}
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

                    <button className="btn btn-secondary">
                        <Filter size={16} />
                        Filter
                    </button>

                    <button className="btn btn-secondary">
                        <SortDesc size={16} />
                        Sort
                    </button>
                </div>
            </div>

            {/* Client Protection Notice */}
            {isClient && (
                <div className="protection-notice">
                    <Lock size={16} />
                    <span>View-only mode. Downloads and screenshots are disabled for your account.</span>
                </div>
            )}

            {/* Batch Error Message */}
            {showBatchErrorMessage && (
                <div className="batch-error-notice">
                    <div className="error-content">
                        <ImageIcon size={20} />
                        <div className="error-text">
                            <h4>Multiple images failed to load</h4>
                            <p>
                                {imageErrors.size} image{imageErrors.size !== 1 ? 's' : ''} couldn't be displayed. 
                                This might be due to network issues or storage configuration problems.
                            </p>
                        </div>
                    </div>
                    <div className="error-actions">
                        <button className="btn btn-primary btn-sm" onClick={retryAllFailedImages}>
                            Retry All
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={dismissBatchError}>
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Gallery Grid */}
            {loading ? (
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading {isVideo ? 'videos' : 'images'}...</p>
                </div>
            ) : mediaItems.length > 0 ? (
                <>
                    <div className={`gallery-grid ${viewMode}`}>
                        {mediaItems.slice(0, visibleItems).map((media, index) => (
                            <div
                                key={media.id}
                                className="media-card"
                                style={{ animationDelay: `${(index % 20) * 0.05}s` }}
                                onClick={() => setSelectedMedia(media)}
                            >
                                {/* Media Preview */}
                                <div className="media-preview">
                                    {isVideo ? (
                                        <div className="video-thumbnail">
                                            <ImageWithFallback
                                                key={`${media.id}-thumbnail-${retryKey}`}
                                                src={media.thumbnail} 
                                                alt={media.name} 
                                                draggable="false"
                                                lazy={index > 8} // Lazy load after first 9 images
                                                onLoad={() => {
                                                    console.log(`🖼️ Loaded thumbnail: ${media.name}`);
                                                    handleImageLoad(media.id);
                                                }}
                                                onError={(e, errorInfo) => {
                                                    console.error(`❌ Failed to load thumbnail: ${media.name}`, errorInfo);
                                                    handleImageError(media.id, errorInfo);
                                                }}
                                            />
                                            <div className="play-overlay">
                                                <Play size={32} />
                                            </div>
                                        </div>
                                    ) : (
                                        <ImageWithFallback
                                            key={`${media.id}-image-${retryKey}`}
                                            src={media.url} 
                                            alt={media.name} 
                                            draggable="false"
                                            lazy={index > 8} // Lazy load after first 9 images
                                            onLoad={() => {
                                                console.log(`🖼️ Loaded image: ${media.name}`);
                                                handleImageLoad(media.id);
                                            }}
                                            onError={(e, errorInfo) => {
                                                console.error(`❌ Failed to load image: ${media.name}`, errorInfo);
                                                handleImageError(media.id, errorInfo);
                                            }}
                                        />
                                    )}

                                    {/* Client Watermark */}
                                    {isClient && (
                                        <>
                                            <div className="watermark-overlay"></div>
                                            <div className="watermark-text">PREVIEW</div>
                                        </>
                                    )}

                                    {/* Quick Actions */}
                                    <div className="media-actions">
                                        <button
                                            className={`action-btn ${favorites.has(media.id) ? 'active' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFavorite(media.id);
                                            }}
                                        >
                                            <Heart size={18} fill={favorites.has(media.id) ? 'currentColor' : 'none'} />
                                        </button>

                                        {hasPermission('canDownload') && (
                                            <button
                                                className="action-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDownload(media);
                                                }}
                                            >
                                                <Download size={18} />
                                            </button>
                                        )}

                                        {hasPermission('canShare') && (
                                            <button
                                                className="action-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleShare(media);
                                                }}
                                            >
                                                <Share2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Media Info */}
                                <div className="media-info">
                                    <h4>{media.name}</h4>
                                    {media.tags && (
                                        <div className="media-tags">
                                            {media.tags.slice(0, 3).map(tag => (
                                                <span key={tag} className="tag">#{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Load More Sentinel */}
                    {visibleItems < mediaItems.length && (
                        <div className="load-more-container">
                            <div className="load-more-sentinel"></div>
                            {loadingMore && (
                                <div className="loading-more">
                                    <div className="loading-spinner"></div>
                                    <p>Loading more {isVideo ? 'videos' : 'images'}...</p>
                                </div>
                            )}
                            {!loadingMore && (
                                <button className="btn btn-secondary load-more-btn" onClick={loadMoreItems}>
                                    Load More ({mediaItems.length - visibleItems} remaining)
                                </button>
                            )}
                        </div>
                    )}
                </>
            ) : (
                /* Empty State */
                <div className="empty-state">
                    {isVideo ? <Play size={64} /> : <ImageIcon size={64} />}
                    <h3>No {isVideo ? 'videos' : 'images'} yet</h3>
                    <p>This collection is empty. Check back soon for new content.</p>
                    {hasPermission('canUpload') && (
                        <Link to="/upload" className="btn btn-primary">
                            Upload {isVideo ? 'Videos' : 'Images'}
                        </Link>
                    )}
                </div>
            )}

            {/* Media Viewer Modal */}
            {selectedMedia && (
                <div className="media-viewer-overlay" onClick={() => setSelectedMedia(null)}>
                    <div className="media-viewer" onClick={(e) => e.stopPropagation()}>
                        {/* Close button */}
                        <button className="close-viewer" onClick={() => setSelectedMedia(null)}>
                            <X size={24} />
                        </button>

                        {/* Previous button */}
                        {getCurrentMediaIndex() > 0 && (
                            <button className="nav-viewer nav-prev" onClick={goToPreviousMedia}>
                                <ChevronLeft size={32} />
                            </button>
                        )}

                        {/* Next button */}
                        {getCurrentMediaIndex() < mediaItems.length - 1 && (
                            <button className="nav-viewer nav-next" onClick={goToNextMedia}>
                                <ChevronRight size={32} />
                            </button>
                        )}

                        <div className={`viewer-content ${isClient ? 'protected-content' : ''}`}>
                            {isVideo ? (
                                <video
                                    src={selectedMedia.url}
                                    controls={!isClient}
                                    autoPlay
                                    controlsList={isClient ? "nodownload" : ""}
                                />
                            ) : (
                                <ImageWithFallback
                                    src={selectedMedia.url}
                                    alt={selectedMedia.name}
                                    draggable="false"
                                    lazy={false}
                                    className="viewer-image"
                                />
                            )}

                            {/* Client Watermark in Viewer */}
                            {isClient && (
                                <>
                                    <div className="watermark-overlay"></div>
                                    <div className="watermark-text">PREVIEW ONLY</div>
                                </>
                            )}
                        </div>

                        <div className="viewer-info">
                            <h3>{selectedMedia.name}</h3>
                            <div className="viewer-meta">
                                <span className="media-counter">
                                    {getCurrentMediaIndex() + 1} of {mediaItems.length}
                                </span>
                            </div>
                            <div className="viewer-actions">
                                <button
                                    className={`btn ${favorites.has(selectedMedia.id) ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => toggleFavorite(selectedMedia.id)}
                                >
                                    <Heart size={18} fill={favorites.has(selectedMedia.id) ? 'currentColor' : 'none'} />
                                    {favorites.has(selectedMedia.id) ? 'Saved' : 'Save'}
                                </button>

                                {hasPermission('canDownload') && (
                                    <button className="btn btn-secondary" onClick={() => handleDownload(selectedMedia)}>
                                        <Download size={18} />
                                        Download
                                    </button>
                                )}

                                {hasPermission('canShare') && (
                                    <button className="btn btn-secondary" onClick={() => handleShare(selectedMedia)}>
                                        <Share2 size={18} />
                                        Share
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Gallery;