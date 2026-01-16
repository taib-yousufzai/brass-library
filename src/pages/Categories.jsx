// Categories Page - All 14 Main Categories Grid
import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { useState } from 'react';
import { useCategories } from '../utils/categoryManager';
import './Categories.css';

const Categories = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const { categories } = useCategories(); // Use the new category manager

    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (category.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="categories-page">
            {/* Page Header */}
            <div className="page-header">
                <div className="header-content">
                    <h1>Design Library</h1>
                    <p>Browse through {categories.length} curated categories of interior design inspiration</p>
                </div>

                <div className="header-search">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="category-search-input"
                    />
                </div>
            </div>

            {/* Categories Grid */}
            <div className="categories-grid">
                {filteredCategories.map((category, index) => (
                    <Link
                        to={`/category/${category.id}`}
                        key={category.id}
                        className="category-tile"
                        style={{
                            '--tile-color': category.color,
                            animationDelay: `${index * 0.05}s`
                        }}
                    >
                        {/* Background Gradient */}
                        <div className="tile-bg"></div>

                        {/* Content */}
                        <div className="tile-content">
                            <div className="tile-emoji">{category.emoji}</div>
                            <h3 className="tile-title">{category.name}</h3>
                            <p className="tile-description">{category.description}</p>

                            <div className="tile-meta">
                                <span className="tile-count">
                                    {category.subCategories?.length || 0} sub-categories
                                </span>
                                <ArrowRight size={18} className="tile-arrow" />
                            </div>
                        </div>

                        {/* Hover Effects */}
                        <div className="tile-glow"></div>
                        <div className="tile-border"></div>
                    </Link>
                ))}
            </div>

            {/* No Results */}
            {filteredCategories.length === 0 && (
                <div className="no-results">
                    <div className="no-results-icon">🔍</div>
                    <h3>No categories found</h3>
                    <p>Try adjusting your search term</p>
                </div>
            )}
        </div>
    );
};

export default Categories;
