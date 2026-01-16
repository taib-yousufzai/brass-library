// SubCategories Page - Shows sub-categories for a main category
import { useParams, Link } from 'react-router-dom';
import { Image, Video, ArrowRight, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCategories } from '../utils/categoryManager';
import './SubCategories.css';

const SubCategories = () => {
    const { categoryId } = useParams();
    const { categories, getCategoryById } = useCategories(); // Get categories from hook
    const [category, setCategory] = useState(null);

    useEffect(() => {
        if (!categoryId) return;

        // Get category from the categories array (which updates when categoryManager changes)
        const foundCategory = getCategoryById(categoryId);
        setCategory(foundCategory);
        
        // Debug: Log category data to help identify count issues
        if (foundCategory) {
            const totalImages = foundCategory.subCategories.reduce((acc, sub) => acc + (sub.imageCount || 0), 0);
            const totalVideos = foundCategory.subCategories.reduce((acc, sub) => acc + (sub.videoCount || 0), 0);
            console.log(`📊 [SubCategories] Category "${foundCategory.name}" counts:`, {
                categoryId: foundCategory.id,
                subCategories: foundCategory.subCategories.length,
                totalImages,
                totalVideos,
                subCategoryCounts: foundCategory.subCategories.map(sub => ({
                    id: sub.id,
                    name: sub.name,
                    images: sub.imageCount || 0,
                    videos: sub.videoCount || 0,
                    hasImageCount: 'imageCount' in sub,
                    hasVideoCount: 'videoCount' in sub,
                    imageCountType: typeof sub.imageCount,
                    videoCountType: typeof sub.videoCount
                }))
            });
        } else {
            console.error(`❌ [SubCategories] Category not found:`, { categoryId });
        }
    }, [categoryId, categories]); // Changed dependency to 'categories' instead of 'getCategoryById'

    if (!category) {
        return (
            <div className="not-found">
                <h2>Category not found</h2>
                <Link to="/categories" className="btn btn-primary">
                    Back to Categories
                </Link>
            </div>
        );
    }

    return (
        <div className="subcategories-page">
            {/* Back Link */}
            <Link to="/categories" className="back-link">
                <ArrowLeft size={18} />
                <span>All Categories</span>
            </Link>

            {/* Category Header */}
            <div className="category-header" style={{ '--cat-color': category.color }}>
                <div className="category-header-bg"></div>
                <div className="category-header-content">
                    <span className="category-emoji-large">{category.emoji}</span>
                    <div className="category-header-info">
                        <h1>{category.name}</h1>
                        <p>{category.description}</p>
                        <div className="category-stats">
                            <span>{category.subCategories.length} Sub-categories</span>
                            <span className="separator">•</span>
                            <span>{category.subCategories.reduce((acc, sub) => acc + (sub.imageCount || 0), 0)} Images</span>
                            <span className="separator">•</span>
                            <span>{category.subCategories.reduce((acc, sub) => acc + (sub.videoCount || 0), 0)} Videos</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sub-categories Grid */}
            <div className="subcategories-grid">
                {category.subCategories.map((subCat, index) => (
                    <div
                        key={subCat.id}
                        className="subcategory-card"
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        <div className="subcat-header">
                            <h3>{subCat.name}</h3>
                            <span className="subcat-badge">
                                {(subCat.imageCount || 0) + (subCat.videoCount || 0)} items
                            </span>
                        </div>

                        <div className="subcat-preview">
                            <div className="preview-placeholder">
                                <span className="preview-emoji">{category.emoji}</span>
                                <span className="preview-text">No media yet</span>
                            </div>
                        </div>

                        <div className="subcat-actions">
                            <Link
                                to={`/category/${categoryId}/${subCat.id}/image`}
                                className="subcat-link"
                            >
                                <Image size={16} />
                                <span>Images</span>
                                <span className="link-count">{subCat.imageCount || 0}</span>
                                <ArrowRight size={14} className="link-arrow" />
                            </Link>

                            <Link
                                to={`/category/${categoryId}/${subCat.id}/video`}
                                className="subcat-link"
                            >
                                <Video size={16} />
                                <span>Videos</span>
                                <span className="link-count">{subCat.videoCount || 0}</span>
                                <ArrowRight size={14} className="link-arrow" />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SubCategories;
