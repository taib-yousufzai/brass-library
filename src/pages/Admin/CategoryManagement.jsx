import React, { useState, useEffect } from 'react';
import {
    Plus, Edit2, Trash2, FolderOpen, Layers, Save, X,
    ChefHat, Sofa, Bed, UtensilsCrossed, Bath, DoorOpen, LayoutGrid,
    Frame, Building2, Trees, Landmark, BookOpen, Clapperboard, Store
} from 'lucide-react';
import { db } from '../../firebase/config';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { categories as localCategories } from '../../data/categories';
import { syncCategories, recoverMedia } from '../../utils/populateCategories';
import { recalculateCategoryCounts } from '../../utils/updateCategoryCounts';
import './Admin.css';

const CategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingCategory, setEditingCategory] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSubCategoryView, setIsSubCategoryView] = useState(false);
    const [selectedParentId, setSelectedParentId] = useState(null);

    const [isSaving, setIsSaving] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // Form State
    const [formData, setFormData] = useState({ name: '', icon: 'FolderOpen', subCount: 0 });

    const AVAILABLE_ICONS = [
        { name: 'ChefHat', icon: ChefHat },
        { name: 'Sofa', icon: Sofa },
        { name: 'Bed', icon: Bed },
        { name: 'UtensilsCrossed', icon: UtensilsCrossed },
        { name: 'Bath', icon: Bath },
        { name: 'DoorOpen', icon: DoorOpen },
        { name: 'LayoutGrid', icon: LayoutGrid },
        { name: 'Frame', icon: Frame },
        { name: 'Building2', icon: Building2 },
        { name: 'Trees', icon: Trees },
        { name: 'Landmark', icon: Landmark },
        { name: 'BookOpen', icon: BookOpen },
        { name: 'Clapperboard', icon: Clapperboard },
        { name: 'Store', icon: Store },
        { name: 'Layers', icon: Layers },
        { name: 'FolderOpen', icon: FolderOpen }
    ];

    const renderIcon = (iconName, size = 20) => {
        const IconComponent = AVAILABLE_ICONS.find(i => i.name === iconName)?.icon || FolderOpen;
        return <IconComponent size={size} />;
    };

    // Fetch categories
    useEffect(() => {
        const unsubscribe = onSnapshot(
            collection(db, 'categories'),
            (snapshot) => {
                if (snapshot.empty) {
                    console.log("Firestore empty/unreachable. Using local fallback.");
                    setCategories(localCategories);
                } else {
                    const cats = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setCategories(cats);
                }
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching categories (using fallback):", error);
                setCategories(localCategories);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            icon: category.icon || 'FolderOpen',
            subCount: category.subCategories?.length || 0
        });
        setShowAddModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await deleteDoc(doc(db, 'categories', id));
            } catch (error) {
                console.error("Error deleting category:", error);
                alert("Failed to delete category");
            }
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            alert("Category name is required");
            return;
        }

        setIsSaving(true);
        try {
            if (isSubCategoryView && selectedParentId) {
                // Handling Sub-categories (adding/updating local array in parent doc)
                // Note: For a robust system, sub-categories should ideally be a sub-collection 
                // but strictly following existing structure where they are an array.

                const parentCat = categories.find(c => c.id === selectedParentId);
                if (!parentCat) return;

                let updatedSubs = [...(parentCat.subCategories || [])];

                if (editingCategory) {
                    // Edit existing sub-category
                    updatedSubs = updatedSubs.map(sub =>
                        sub.id === editingCategory.id ? { ...sub, name: formData.name } : sub
                    );
                } else {
                    // Add new sub-category
                    const newSub = {
                        id: `sub-${Date.now()}`,
                        name: formData.name,
                        imageCount: 0,
                        videoCount: 0
                    };
                    updatedSubs.push(newSub);
                }

                await updateDoc(doc(db, 'categories', selectedParentId), {
                    subCategories: updatedSubs
                });

            } else {
                // Main Category
                if (editingCategory) {
                    // Update existing
                    await updateDoc(doc(db, 'categories', editingCategory.id), {
                        name: formData.name,
                        icon: formData.icon
                    });
                } else {
                    // Add new
                    const newCategory = {
                        name: formData.name,
                        icon: formData.icon,
                        emoji: '📁', // Default emoji
                        description: 'New category',
                        color: '#64748b', // Default color
                        subCategories: []
                    };
                    await addDoc(collection(db, 'categories'), newCategory);
                }
            }
            setShowAddModal(false);
            setEditingCategory(null);
            setFormData({ name: '', icon: 'FolderOpen', subCount: 0 });
        } catch (error) {
            console.error("Error saving category:", error);
            alert("Failed to save changes: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const openSubCategories = (category) => {
        setSelectedParentId(category.id);
        setIsSubCategoryView(true);
    };

    const handleSync = async () => {
        if (!window.confirm("This will update all category definitions from the local code to Firestore. Existing item counts will be preserved. Continue?")) {
            return;
        }

        setIsSyncing(true);
        try {
            const result = await syncCategories();
            if (result.success) {
                alert(result.message);
            } else {
                alert("Sync failed: " + result.message);
            }
        } catch (error) {
            console.error("Sync error:", error);
            alert("Sync failed");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleRecalculate = async () => {
        if (!window.confirm("This will scan all media items and update category counts. This might take a moment. Continue?")) {
            return;
        }

        setIsSyncing(true);
        try {
            const result = await recalculateCategoryCounts();
            if (result.success) {
                alert(result.message);
            } else {
                alert("Recalculation failed: " + result.message);
            }
        } catch (error) {
            console.error("Recalculate error:", error);
            alert("Recalculation failed");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleRecovery = async () => {
        if (!window.confirm("This will scan the Storage bucket for ALL files and recreate missing database entries. \n\nThis may take a minute. Please do not close the window.")) {
            return;
        }

        setIsSyncing(true);
        try {
            const result = await recoverMedia();
            alert(result.message);
        } catch (error) {
            console.error("Recovery error:", error);
            alert("Recovery failed: " + error.message);
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="admin-page">
            <div className="page-header">
                <div className="header-breadcrumbs">
                    {isSubCategoryView && (
                        <button className="back-link" onClick={() => setIsSubCategoryView(false)}>
                            Categories
                        </button>
                    )}
                    <h1>{isSubCategoryView ? 'Manage Sub-Categories' : 'Category Management'}</h1>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    {!isSubCategoryView && (
                        <button
                            className="btn btn-secondary"
                            onClick={handleSync}
                            disabled={isSyncing}
                            title="Sync default categories to Firestore"
                        >
                            <Layers size={18} />
                            {isSyncing ? 'Syncing...' : 'Sync Defaults'}
                        </button>
                    )}

                    {!isSubCategoryView && (
                        <button
                            className="btn btn-secondary"
                            onClick={handleRecalculate}
                            disabled={isSyncing}
                            title="Recalculate counts based on actual media"
                        >
                            <LayoutGrid size={18} />
                            {isSyncing ? 'Calculating...' : 'Recalc Counts'}
                        </button>
                    )}

                    {!isSubCategoryView && (
                        <button
                            className="btn btn-secondary"
                            onClick={handleRecovery}
                            disabled={isSyncing}
                            title="Recover missing media files from Storage"
                            style={{ backgroundColor: '#eab308', borderColor: '#eab308' }} // Warning color
                        >
                            <FolderOpen size={18} />
                            {isSyncing ? 'Scanning...' : 'Recover Media'}
                        </button>
                    )}

                    <button className="btn btn-primary" onClick={() => {
                        setEditingCategory(null);
                        setFormData({ name: '', icon: 'FolderOpen', subCount: 0 });
                        setShowAddModal(true);
                    }}>
                        <Plus size={18} />
                        Add {isSubCategoryView ? 'Sub-Category' : 'Category'}
                    </button>
                </div>
            </div>

            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Icon</th>
                            <th>Name</th>
                            <th>{isSubCategoryView ? 'Items' : 'Sub-Categories'}</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(isSubCategoryView
                            ? categories.find(c => c.id === selectedParentId)?.subCategories || []
                            : categories
                        ).map((item) => (
                            <tr key={item.id}>
                                <td>
                                    <div className="cat-icon-preview">
                                        {renderIcon(item.icon)}
                                    </div>
                                </td>
                                <td>
                                    <span className="cat-name">{item.name}</span>
                                </td>
                                <td>
                                    <span className="text-muted">
                                        {isSubCategoryView ? '0 items' : `${item.subCategories?.length || 0} sub-categories`}
                                    </span>
                                </td>
                                <td>
                                    <div className="actions">
                                        {!isSubCategoryView && (
                                            <button className="action-btn" title="View Sub-categories" onClick={() => openSubCategories(item)}>
                                                <Layers size={16} />
                                            </button>
                                        )}
                                        <button className="action-btn" title="Edit" onClick={() => handleEdit(item)}>
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="action-btn delete" title="Delete" onClick={() => handleDelete(item.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {
                showAddModal && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: '500px' }}>
                            <div className="modal-header">
                                <h2>{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
                                <button className="close-btn" onClick={() => setShowAddModal(false)}><X size={20} /></button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Category Name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Category Icon</label>
                                    <div className="icon-grid">
                                        {AVAILABLE_ICONS.map(({ name, icon: Icon }) => (
                                            <button
                                                key={name}
                                                className={`icon-select-btn ${formData.icon === name ? 'selected' : ''}`}
                                                onClick={() => setFormData({ ...formData, icon: name })}
                                                title={name}
                                            >
                                                <Icon size={20} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                                    <Save size={18} />
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default CategoryManagement;
