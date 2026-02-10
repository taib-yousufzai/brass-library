// Favorites Page
import { useState, useEffect } from 'react';
import { useAuth } from '../context/FirebaseAuthContext';
import { Link } from 'react-router-dom';
import { Heart, Grid, List, Download, Share2, Trash2, X } from 'lucide-react';
import ImageWithFallback from '../components/ImageWithFallback';
import { downloadMultipleFiles, createProgressUI } from '../utils/downloadUtils';
import { downloadFromFirebase, isFirebaseStorageUrl } from '../utils/firebaseDownloadFix';
import './Favorites.css';

const Favorites = () => {
    const { hasPermission, isClient, user } = useAuth();
    const [viewMode, setViewMode] = useState('grid');
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [favoriteItems, setFavoriteItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch favorites from localStorage
    useEffect(() => {
        if (!user) {
            setFavoriteItems([]);
            setLoading(false);
            return;
        }

        const loadFavorites = () => {
            try {
                setLoading(true);
                const storageKey = `favorites_${user.uid}`;
                const storedFavorites = localStorage.getItem(storageKey);

                if (storedFavorites) {
                    const favArray = JSON.parse(storedFavorites);

                    if (Array.isArray(favArray)) {
                        // Handle both object format (new) and ID format (legacy)
                        const favoriteObjects = favArray.filter(fav => {
                            if (typeof fav === 'object' && fav.id) {
                                return true; // New object format
                            }
                            return false; // Skip legacy ID format for now
                        });

                        setFavoriteItems(favoriteObjects);
                        console.log(`📚 Loaded ${favoriteObjects.length} favorite objects from localStorage`);
                    } else {
                        setFavoriteItems([]);
                    }
                } else {
                    setFavoriteItems([]);
                }
            } catch (error) {
                console.error('❌ Error loading favorites:', error);
                setFavoriteItems([]);
            } finally {
                setLoading(false);
            }
        };

        loadFavorites();

        // Listen for localStorage changes (when favorites are updated from other tabs/components)
        const handleStorageChange = (e) => {
            if (e.key === `favorites_${user.uid}`) {
                loadFavorites();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Also listen for custom events from the same tab
        const handleFavoritesUpdate = () => {
            loadFavorites();
        };

        window.addEventListener('favoritesUpdated', handleFavoritesUpdate);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
        };
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

    const selectAll = () => {
        const allIds = favoriteItems.map(item => item.id);
        setSelectedItems(new Set(allIds));
    };

    const isAllSelected = () => {
        return favoriteItems.length > 0 && selectedItems.size === favoriteItems.length;
    };

    const handleBulkDownload = async () => {
        if (!hasPermission('canDownload')) {
            alert('⚠️ Download not available for your account.');
            return;
        }

        if (selectedItems.size === 0) {
            alert('⚠️ Please select items to download.');
            return;
        }

        try {
            console.log('📥 Starting bulk download for', selectedItems.size, 'items');

            // Get selected favorite items
            const itemsToDownload = favoriteItems.filter(item => selectedItems.has(item.id));

            if (itemsToDownload.length === 0) {
                alert('⚠️ No valid items selected for download.');
                return;
            }

            // Prepare files array for the download utility
            const files = itemsToDownload.map(item => ({
                url: item.url,
                filename: item.name || `design-${item.id}`
            }));

            // Create progress UI
            const progressUI = createProgressUI('Downloading Your Favorites...');

            // Track progress and results
            let successful = 0;
            let failed = 0;

            // Use the reusable download utility
            const result = await downloadMultipleFiles(files, {
                concurrency: 1, // Sequential downloads to avoid overwhelming browser
                onProgress: ({ current, total, filename, status }) => {
                    progressUI.update(current, total, status, filename);
                },
                onFileComplete: ({ result, index, successful: successCount, failed: failedCount }) => {
                    successful = successCount;
                    failed = failedCount;

                    const item = itemsToDownload[index];
                    if (result.success) {
                        console.log(`✅ Downloaded: ${item.name} (method: ${result.method})`);
                    } else {
                        console.error(`❌ Failed to download: ${item.name} - ${result.error}`);
                    }
                }
            });

            // Complete the progress UI
            progressUI.complete(result.successful, result.failed, result.total);

            // Show completion message
            if (result.successful > 0) {
                const message = result.failed > 0
                    ? `✅ Download completed with some issues!\n\nSuccessful: ${result.successful}\nFailed: ${result.failed}\nTotal: ${result.total}\n\nFailed downloads may be due to network issues or file access restrictions.`
                    : `✅ All downloads completed successfully!\n\nDownloaded ${result.successful} files.`;

                setTimeout(() => alert(message), 3500); // Show after progress UI disappears
            } else {
                setTimeout(() => {
                    alert(`❌ All downloads failed.\n\nThis may be due to:\n• Network connectivity issues\n• Browser security restrictions\n• File access permissions\n\nPlease try again or contact support.`);
                }, 3500);
            }

            // Clear selection after download attempt
            clearSelection();

        } catch (error) {
            console.error('❌ Bulk download error:', error);
            alert('❌ Failed to start bulk download. Please try again.');
        }
    };

    const handleBulkShare = async () => {
        if (!hasPermission('canShare')) {
            alert('⚠️ Sharing not available for your account.');
            return;
        }

        if (selectedItems.size === 0) {
            alert('⚠️ Please select items to share.');
            return;
        }

        try {
            // Get selected favorite items
            const itemsToShare = favoriteItems.filter(item => selectedItems.has(item.id));

            if (itemsToShare.length === 0) {
                alert('⚠️ No valid items selected for sharing.');
                return;
            }

            // Create email content
            const emailSubject = `Interior Design Inspiration - ${itemsToShare.length} Selected Items`;

            let emailBody = `Hi there!\n\nI wanted to share some beautiful interior design inspirations with you:\n\n`;

            itemsToShare.forEach((item, index) => {
                emailBody += `${index + 1}. ${item.name}\n`;
                emailBody += `   Category: ${item.category} > ${item.subCategory}\n`;
                emailBody += `   View: ${item.url}\n\n`;
            });

            emailBody += `These designs are from Brass Space Interior Solution.\n\n`;
            emailBody += `Best regards,\n${user?.displayName || user?.email || 'Brass Space Interior Solution Team'}`;

            // Try different sharing methods

            // Method 1: Web Share API (if supported)
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: emailSubject,
                        text: emailBody,
                        url: window.location.origin
                    });
                    console.log('✅ Shared successfully via Web Share API');
                    clearSelection();
                    return;
                } catch (shareError) {
                    if (shareError.name !== 'AbortError') {
                        console.warn('⚠️ Web Share API failed, trying email fallback:', shareError);
                    } else {
                        console.log('ℹ️ Share cancelled by user');
                        return;
                    }
                }
            }

            // Method 2: Email client (mailto)
            try {
                const encodedSubject = encodeURIComponent(emailSubject);
                const encodedBody = encodeURIComponent(emailBody);

                // Check if the mailto URL would be too long (some email clients have limits)
                const mailtoUrl = `mailto:?subject=${encodedSubject}&body=${encodedBody}`;

                if (mailtoUrl.length > 2000) {
                    // If too long, create a shorter version with just the links
                    let shortBody = `Hi there!\n\nI wanted to share ${itemsToShare.length} interior design inspirations with you:\n\n`;
                    itemsToShare.forEach((item, index) => {
                        shortBody += `${index + 1}. ${item.name}: ${item.url}\n`;
                    });
                    shortBody += `\nBest regards,\n${user?.displayName || user?.email || 'Brass Space Interior Solution Team'}`;

                    const shortMailtoUrl = `mailto:?subject=${encodedSubject}&body=${encodeURIComponent(shortBody)}`;
                    window.location.href = shortMailtoUrl;
                } else {
                    window.location.href = mailtoUrl;
                }

                console.log('✅ Opened email client for sharing');

                // Show success message
                setTimeout(() => {
                    alert(`✅ Email client opened!\n\nSharing ${itemsToShare.length} items via email.\nIf your email client didn't open, you can copy the links manually.`);
                }, 500);

                clearSelection();
                return;

            } catch (emailError) {
                console.error('❌ Email sharing failed:', emailError);
            }

            // Method 3: Copy to clipboard as fallback
            try {
                let clipboardText = `Interior Design Inspiration - ${itemsToShare.length} Selected Items\n\n`;
                itemsToShare.forEach((item, index) => {
                    clipboardText += `${index + 1}. ${item.name}\n`;
                    clipboardText += `   Category: ${item.category} > ${item.subCategory}\n`;
                    clipboardText += `   Link: ${item.url}\n\n`;
                });

                await navigator.clipboard.writeText(clipboardText);

                alert(`✅ Content copied to clipboard!\n\nYou can now paste this into an email or message to share ${itemsToShare.length} design inspirations.`);

                console.log('✅ Copied sharing content to clipboard');
                clearSelection();

            } catch (clipboardError) {
                console.error('❌ Clipboard sharing failed:', clipboardError);

                // Method 4: Show modal with content to copy manually
                showShareModal(itemsToShare, emailSubject, emailBody);
            }

        } catch (error) {
            console.error('❌ Bulk share error:', error);
            alert('❌ Failed to share items. Please try again.');
        }
    };

    // Helper function to show share modal as final fallback
    const showShareModal = (items, subject, body) => {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 12px;
                padding: 24px;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; color: #333;">Share Design Inspirations</h3>
                    <button id="close-share-modal" style="
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: #666;
                        padding: 0;
                        width: 30px;
                        height: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">&times;</button>
                </div>
                <p style="color: #666; margin-bottom: 16px;">Copy the content below and paste it into your email or message:</p>
                <textarea id="share-content" readonly style="
                    width: 100%;
                    height: 300px;
                    padding: 12px;
                    border: 2px solid #ddd;
                    border-radius: 8px;
                    font-family: system-ui;
                    font-size: 14px;
                    line-height: 1.5;
                    resize: vertical;
                    box-sizing: border-box;
                ">${body}</textarea>
                <div style="display: flex; gap: 12px; margin-top: 16px; justify-content: flex-end;">
                    <button id="copy-share-content" style="
                        background: #4CAF50;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 500;
                    ">Copy to Clipboard</button>
                    <button id="close-share-modal-btn" style="
                        background: #666;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 500;
                    ">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Focus the textarea and select all content
        const textarea = document.getElementById('share-content');
        textarea.focus();
        textarea.select();

        // Close modal handlers
        const closeModal = () => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
            clearSelection();
        };

        document.getElementById('close-share-modal').onclick = closeModal;
        document.getElementById('close-share-modal-btn').onclick = closeModal;
        modal.onclick = (e) => {
            if (e.target === modal) closeModal();
        };

        // Copy to clipboard handler
        document.getElementById('copy-share-content').onclick = async () => {
            try {
                await navigator.clipboard.writeText(body);
                alert('✅ Content copied to clipboard!');
                closeModal();
            } catch (error) {
                console.error('❌ Failed to copy:', error);
                // Select the text for manual copying
                textarea.select();
                alert('⚠️ Please manually copy the selected text (Ctrl+C or Cmd+C)');
            }
        };

        // Keyboard handler
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        });
    };

    const handleBulkRemove = () => {
        if (selectedItems.size === 0) {
            alert('⚠️ Please select items to remove.');
            return;
        }

        const itemCount = selectedItems.size;
        const confirmRemove = window.confirm(
            `⚠️ Remove from Favorites\n\nAre you sure you want to remove ${itemCount} item${itemCount !== 1 ? 's' : ''} from your favorites?\n\nThis action cannot be undone.`
        );

        if (!confirmRemove) {
            return;
        }

        try {
            const storageKey = `favorites_${user.uid}`;
            const storedFavorites = localStorage.getItem(storageKey);

            if (storedFavorites) {
                const favArray = JSON.parse(storedFavorites);
                const selectedItemsArray = Array.from(selectedItems);

                // Remove selected items from favorites
                const updatedFavorites = favArray.filter(fav => {
                    const itemId = typeof fav === 'object' && fav.id ? fav.id : fav;
                    return !selectedItemsArray.includes(itemId);
                });

                localStorage.setItem(storageKey, JSON.stringify(updatedFavorites));

                // Update local state
                setFavoriteItems(prev => prev.filter(item => !selectedItemsArray.includes(item.id)));

                // Clear selection
                clearSelection();

                // Dispatch custom event to notify other components
                window.dispatchEvent(new CustomEvent('favoritesUpdated'));

                console.log(`✅ Removed ${itemCount} items from favorites`);
                alert(`✅ Removed ${itemCount} item${itemCount !== 1 ? 's' : ''} from favorites!`);
            }
        } catch (error) {
            console.error('❌ Error removing items from favorites:', error);
            alert('❌ Failed to remove items from favorites. Please try again.');
        }
    };

    const handleRemoveFromFavorites = (itemId) => {
        try {
            const storageKey = `favorites_${user.uid}`;
            const storedFavorites = localStorage.getItem(storageKey);

            if (storedFavorites) {
                const favArray = JSON.parse(storedFavorites);
                const updatedFavorites = favArray.filter(fav => {
                    if (typeof fav === 'object' && fav.id) {
                        return fav.id !== itemId;
                    } else if (typeof fav === 'string') {
                        return fav !== itemId;
                    }
                    return false;
                });

                localStorage.setItem(storageKey, JSON.stringify(updatedFavorites));

                // Update local state
                setFavoriteItems(prev => prev.filter(item => item.id !== itemId));

                // Dispatch custom event to notify other components
                window.dispatchEvent(new CustomEvent('favoritesUpdated'));

                console.log('✅ Removed from favorites:', itemId);
            }
        } catch (error) {
            console.error('❌ Error removing from favorites:', error);
        }
    };

    if (loading) {
        return (
            <div className="favorites-page">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading your favorites...</p>
                </div>
            </div>
        );
    }

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
                    {favoriteItems.length > 0 && (
                        <div className="selection-controls">
                            <button
                                className={`btn btn-sm ${isAllSelected() ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={isAllSelected() ? clearSelection : selectAll}
                                title={isAllSelected() ? 'Clear selection' : 'Select all items'}
                            >
                                {isAllSelected() ? (
                                    <>
                                        <X size={16} />
                                        Clear All ({selectedItems.size})
                                    </>
                                ) : (
                                    <>
                                        <Heart size={16} />
                                        Select All ({favoriteItems.length})
                                    </>
                                )}
                            </button>
                        </div>
                    )}

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
                        <button className="btn btn-secondary delete-btn" onClick={handleBulkRemove}>
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
                                <ImageWithFallback
                                    src={item.thumbnail || item.url}
                                    alt={item.name}
                                    className="favorite-image"
                                />
                                <div className="favorite-overlay">
                                    <Link
                                        to={`/category/${item.categoryId}/${item.subCategoryId}/${item.mediaType}`}
                                        className="view-btn"
                                    >
                                        View Gallery
                                    </Link>
                                    <button
                                        className="remove-btn"
                                        onClick={() => handleRemoveFromFavorites(item.id)}
                                        title="Remove from favorites"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="favorite-info">
                                <h4>{item.name}</h4>
                                <p>{item.category} • {item.subCategory}</p>
                                <span className="favorite-date">
                                    Added {item.addedAt ? new Date(item.addedAt).toLocaleDateString() : 'Recently'}
                                </span>
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
