// Category Editor - Add/Edit Categories
import { useState } from 'react';
import { useCategories } from '../../utils/categoryManager';
import { Plus, Save, Trash2, Edit3, Folder, Tag } from 'lucide-react';
import './CategoryEditor.css';

const CategoryEditor = () => {
    const { categories, addCategory, updateCategory, forceSyncToFirebase } = useCategories();
    const [editingCategory, setEditingCategory] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [syncing, setSyncing] = useState(false);

    const [formData, setFormData] = useState({
        id: '',
        name: '',
        emoji: '',
        description: '',
        color: '#3b82f6',
        subCategories: []
    });

    const [subCategoryForm, setSubCategoryForm] = useState({
        id: '',
        name: '',
        imageCount: 0,
        videoCount: 0
    });

    const resetForm = () => {
        setFormData({
            id: '',
            name: '',
            emoji: '',
            description: '',
            color: '#3b82f6',
            subCategories: []
        });
        setSubCategoryForm({
            id: '',
            name: '',
            imageCount: 0,
            videoCount: 0
        });
        setEditingCategory(null);
        setShowAddForm(false);
    };

    const handleAddSubCategory = () => {
        if (!subCategoryForm.name.trim()) return;

        const newSubCategory = {
            ...subCategoryForm,
            id: subCategoryForm.id || subCategoryForm.name.toLowerCase().replace(/\s+/g, '-')
        };

        setFormData(prev => ({
            ...prev,
            subCategories: [...prev.subCategories, newSubCategory]
        }));

        setSubCategoryForm({
            id: '',
            name: '',
            imageCount: 0,
            videoCount: 0
        });
    };

    const handleRemoveSubCategory = (index) => {
        setFormData(prev => ({
            ...prev,
            subCategories: prev.subCategories.filter((_, i) => i !== index)
        }));
    };

    const handleSaveCategory = async () => {
        if (!formData.name.trim()) return;

        const categoryData = {
            ...formData,
            id: formData.id || formData.name.toLowerCase().replace(/\s+/g, '-')
        };

        try {
            if (editingCategory) {
                await updateCategory(editingCategory.id, categoryData);
            } else {
                await addCategory(categoryData);
            }
            resetForm();
        } catch (error) {
            alert(`Error saving category: ${error.message}`);
        }
    };

    const handleEditCategory = (category) => {
        setFormData(category);
        setEditingCategory(category);
        setShowAddForm(true);
    };

    const handleForcSync = async () => {
        setSyncing(true);
        try {
            const result = await forceSyncToFirebase();
            alert(`Sync complete! ${result.synced} categories synced, ${result.errors} errors`);
        } catch (error) {
            alert(`Sync failed: ${error.message}`);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="category-editor">
            <div className="page-header">
                <div className="header-content">
                    <h1>Category Management</h1>
                    <p>Add, edit, and manage categories for your photo library</p>
                </div>
                <div className="header-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={handleForcSync}
                        disabled={syncing}
                    >
                        {syncing ? 'Syncing...' : 'Sync to Firebase'}
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowAddForm(true)}
                    >
                        <Plus size={16} />
                        Add Category
                    </button>
                </div>
            </div>

            {/* Category List */}
            <div className="categories-list">
                {categories.map(category => (
                    <div key={category.id} className="category-item">
                        <div className="category-info">
                            <div className="category-header">
                                <span className="category-emoji">{category.emoji}</span>
                                <div className="category-details">
                                    <h3>{category.name}</h3>
                                    <p>{category.description}</p>
                                </div>
                            </div>
                            <div className="category-stats">
                                <span>{category.subCategories?.length || 0} subcategories</span>
                            </div>
                        </div>
                        <div className="category-actions">
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleEditCategory(category)}
                            >
                                <Edit3 size={14} />
                                Edit
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add/Edit Form Modal */}
            {showAddForm && (
                <div className="modal-overlay" onClick={() => resetForm()}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
                            <button className="close-btn" onClick={resetForm}>×</button>
                        </div>

                        <div className="form-content">
                            {/* Basic Info */}
                            <div className="form-section">
                                <h3>Basic Information</h3>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Category Name</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="e.g. Kitchen"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Emoji</label>
                                        <input
                                            type="text"
                                            value={formData.emoji}
                                            onChange={(e) => setFormData(prev => ({ ...prev, emoji: e.target.value }))}
                                            placeholder="🍳"
                                            maxLength="2"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Brief description of this category"
                                        rows="2"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Color</label>
                                    <input
                                        type="color"
                                        value={formData.color}
                                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* Sub-categories */}
                            <div className="form-section">
                                <h3>Sub-categories</h3>
                                
                                {/* Add Sub-category Form */}
                                <div className="subcategory-form">
                                    <div className="form-row">
                                        <input
                                            type="text"
                                            placeholder="Sub-category name"
                                            value={subCategoryForm.name}
                                            onChange={(e) => setSubCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-secondary btn-sm"
                                            onClick={handleAddSubCategory}
                                        >
                                            <Plus size={14} />
                                            Add
                                        </button>
                                    </div>
                                </div>

                                {/* Sub-categories List */}
                                <div className="subcategories-list">
                                    {formData.subCategories.map((sub, index) => (
                                        <div key={index} className="subcategory-item">
                                            <span>{sub.name}</span>
                                            <button
                                                type="button"
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleRemoveSubCategory(index)}
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={resetForm}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleSaveCategory}>
                                <Save size={16} />
                                {editingCategory ? 'Update Category' : 'Add Category'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryEditor;