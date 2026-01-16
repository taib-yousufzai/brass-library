// Interior Design Library - Categories Data
// All 14 main categories with their sub-categories

export const categories = [
    {
        id: 'kitchen',
        name: 'Kitchen',
        icon: 'ChefHat',
        emoji: '🍳',
        description: 'Modern kitchen designs from modular to luxury',
        color: '#f59e0b',
        subCategories: [
            { id: 'l-shape', name: 'L-Shape Kitchen', imageCount: 0, videoCount: 0 },
            { id: 'u-shape', name: 'U-Shape Kitchen', imageCount: 0, videoCount: 0 },
            { id: 'parallel', name: 'Parallel Kitchen', imageCount: 0, videoCount: 0 },
            { id: 'island', name: 'Island Kitchen', imageCount: 0, videoCount: 0 },
            { id: 'g-shape', name: 'G-Shape Kitchen', imageCount: 0, videoCount: 0 },
            { id: 'straight', name: 'Straight Kitchen', imageCount: 0, videoCount: 0 },
            { id: 'open', name: 'Open Kitchen', imageCount: 0, videoCount: 0 },
            { id: 'modular', name: 'Modular Kitchen', imageCount: 0, videoCount: 0 },
            { id: 'small', name: 'Small Kitchen', imageCount: 0, videoCount: 0 },
            { id: 'luxury', name: 'Luxury Kitchen', imageCount: 0, videoCount: 0 }
        ]
    },
    {
        id: 'living-area',
        name: 'Living Area',
        icon: 'Sofa',
        emoji: '🛋️',
        description: 'Stunning living room designs and wall treatments',
        color: '#8b5cf6',
        subCategories: [
            { id: 'tv-unit', name: 'TV Unit Design', imageCount: 0, videoCount: 0 },
            { id: 'cnc-wall', name: 'CNC Wall Design', imageCount: 0, videoCount: 0 },
            { id: 'wall-paneling', name: 'Wall Paneling', imageCount: 0, videoCount: 0 },
            { id: 'sofa-back', name: 'Sofa Back Panel', imageCount: 0, videoCount: 0 },
            { id: 'partition', name: 'Partition Design', imageCount: 0, videoCount: 0 },
            { id: 'wallpaper', name: 'Wallpaper Design', imageCount: 0, videoCount: 0 },
            { id: 'lighting', name: 'Lighting Design', imageCount: 0, videoCount: 0 },
            { id: 'ceiling', name: 'Living False Ceiling', imageCount: 0, videoCount: 0 }
        ]
    },
    {
        id: 'bedroom',
        name: 'Bedroom',
        icon: 'Bed',
        emoji: '🛏️',
        description: 'Cozy and elegant bedroom interiors',
        color: '#ec4899',
        subCategories: [
            { id: 'master', name: 'Master Bedroom', imageCount: 0, videoCount: 0 },
            { id: 'kids', name: 'Kids Bedroom', imageCount: 0, videoCount: 0 },
            { id: 'guest', name: 'Guest Bedroom', imageCount: 0, videoCount: 0 },
            { id: 'bed-back', name: 'Bed Back Panel', imageCount: 0, videoCount: 0 },
            { id: 'lighting', name: 'Bedroom Lighting', imageCount: 0, videoCount: 0 },
            { id: 'ceiling', name: 'Bedroom False Ceiling', imageCount: 0, videoCount: 0 }
        ]
    },
    {
        id: 'dining-area',
        name: 'Dining Area',
        icon: 'UtensilsCrossed',
        emoji: '🍽️',
        description: 'Elegant dining room setups and designs',
        color: '#14b8a6',
        subCategories: [
            { id: 'table', name: 'Dining Table Design', imageCount: 0, videoCount: 0 },
            { id: 'crockery', name: 'Crockery Unit', imageCount: 0, videoCount: 0 },
            { id: 'bar', name: 'Bar Unit', imageCount: 0, videoCount: 0 },
            { id: 'wall-panel', name: 'Dining Wall Panel', imageCount: 0, videoCount: 0 },
            { id: 'ceiling', name: 'Dining False Ceiling', imageCount: 0, videoCount: 0 }
        ]
    },
    {
        id: 'bathroom',
        name: 'Bathroom',
        icon: 'Bath',
        emoji: '🚿',
        description: 'Modern and luxury bathroom designs',
        color: '#06b6d4',
        subCategories: [
            { id: 'modern', name: 'Modern Bathroom', imageCount: 0, videoCount: 0 },
            { id: 'luxury', name: 'Luxury Bathroom', imageCount: 0, videoCount: 0 },
            { id: 'small', name: 'Small Bathroom', imageCount: 0, videoCount: 0 },
            { id: 'vanity', name: 'Vanity Unit', imageCount: 0, videoCount: 0 },
            { id: 'shower', name: 'Shower Area', imageCount: 0, videoCount: 0 },
            { id: 'tile', name: 'Tile Design', imageCount: 0, videoCount: 0 }
        ]
    },
    {
        id: 'wardrobe',
        name: 'Wardrobe',
        icon: 'DoorOpen',
        emoji: '🚪',
        description: 'Stylish wardrobe and storage solutions',
        color: '#a855f7',
        subCategories: [
            { id: 'sliding', name: 'Sliding Wardrobe', imageCount: 0, videoCount: 0 },
            { id: 'hinged', name: 'Hinged Wardrobe', imageCount: 0, videoCount: 0 },
            { id: 'walkin', name: 'Walk-in Wardrobe', imageCount: 0, videoCount: 0 },
            { id: 'open', name: 'Open Wardrobe', imageCount: 0, videoCount: 0 },
            { id: 'glass', name: 'Glass Wardrobe', imageCount: 0, videoCount: 0 },
            { id: 'kids', name: 'Kids Wardrobe', imageCount: 0, videoCount: 0 }
        ]
    },
    {
        id: 'false-ceiling',
        name: 'False Ceiling',
        icon: 'LayoutGrid',
        emoji: '🎯',
        description: 'Designer false ceiling patterns and styles',
        color: '#f97316',
        subCategories: [
            { id: 'gypsum', name: 'Gypsum Ceiling', imageCount: 0, videoCount: 0 },
            { id: 'pop', name: 'POP Ceiling', imageCount: 0, videoCount: 0 },
            { id: 'wooden', name: 'Wooden Ceiling', imageCount: 0, videoCount: 0 },
            { id: 'designer', name: 'Designer Ceiling', imageCount: 0, videoCount: 0 },
            { id: 'cove', name: 'Cove Lighting Ceiling', imageCount: 0, videoCount: 0 },
            { id: 'minimal', name: 'Minimal Ceiling', imageCount: 0, videoCount: 0 }
        ]
    },
    {
        id: 'wall-decor',
        name: 'Wall Décor',
        icon: 'Frame',
        emoji: '🖼️',
        description: 'Creative wall decoration ideas',
        color: '#eab308',
        subCategories: [
            { id: 'cnc', name: 'CNC Wall Design', imageCount: 0, videoCount: 0 },
            { id: 'wallpaper', name: 'Wallpaper', imageCount: 0, videoCount: 0 },
            { id: 'paneling', name: 'Wall Paneling', imageCount: 0, videoCount: 0 },
            { id: '3d-panels', name: '3D Wall Panels', imageCount: 0, videoCount: 0 },
            { id: 'texture', name: 'Paint & Texture', imageCount: 0, videoCount: 0 },
            { id: 'art', name: 'Wall Art', imageCount: 0, videoCount: 0 }
        ]
    },
    {
        id: 'facade',
        name: 'Facade / Exterior',
        icon: 'Building2',
        emoji: '🏢',
        description: 'Stunning building exteriors and facades',
        color: '#64748b',
        subCategories: [
            { id: 'modern', name: 'Modern Facade', imageCount: 0, videoCount: 0 },
            { id: 'luxury', name: 'Luxury Facade', imageCount: 0, videoCount: 0 },
            { id: 'glass', name: 'Glass Elevation', imageCount: 0, videoCount: 0 },
            { id: 'stone', name: 'Stone Cladding', imageCount: 0, videoCount: 0 },
            { id: 'wooden', name: 'Wooden Cladding', imageCount: 0, videoCount: 0 },
            { id: 'balcony', name: 'Balcony Facade', imageCount: 0, videoCount: 0 }
        ]
    },
    {
        id: 'balcony',
        name: 'Balcony',
        icon: 'Trees',
        emoji: '🌿',
        description: 'Beautiful balcony designs and gardens',
        color: '#22c55e',
        subCategories: [
            { id: 'open', name: 'Open Balcony', imageCount: 0, videoCount: 0 },
            { id: 'covered', name: 'Covered Balcony', imageCount: 0, videoCount: 0 },
            { id: 'seating', name: 'Balcony Seating', imageCount: 0, videoCount: 0 },
            { id: 'garden', name: 'Balcony Garden', imageCount: 0, videoCount: 0 },
            { id: 'glass-railing', name: 'Glass Railing Balcony', imageCount: 0, videoCount: 0 }
        ]
    },
    {
        id: 'temple-room',
        name: 'Temple Room',
        icon: 'Landmark',
        emoji: '🛕',
        description: 'Sacred temple and pooja room designs',
        color: '#dc2626',
        subCategories: [
            { id: 'wooden', name: 'Wooden Mandir', imageCount: 0, videoCount: 0 },
            { id: 'marble', name: 'Marble Mandir', imageCount: 0, videoCount: 0 },
            { id: 'wall-mounted', name: 'Wall Mounted Mandir', imageCount: 0, videoCount: 0 },
            { id: 'traditional', name: 'Traditional Temple', imageCount: 0, videoCount: 0 },
            { id: 'modern', name: 'Modern Temple Design', imageCount: 0, videoCount: 0 }
        ]
    },
    {
        id: 'study-room',
        name: 'Library / Study Room',
        icon: 'BookOpen',
        emoji: '📚',
        description: 'Productive study and home office spaces',
        color: '#2563eb',
        subCategories: [
            { id: 'home-library', name: 'Home Library', imageCount: 0, videoCount: 0 },
            { id: 'study-table', name: 'Study Table Design', imageCount: 0, videoCount: 0 },
            { id: 'bookshelf', name: 'Bookshelf Design', imageCount: 0, videoCount: 0 },
            { id: 'kids-study', name: 'Kids Study Room', imageCount: 0, videoCount: 0 },
            { id: 'home-office', name: 'Home Office', imageCount: 0, videoCount: 0 }
        ]
    },
    {
        id: 'entertainment',
        name: 'Entertainment Room',
        icon: 'Clapperboard',
        emoji: '🎬',
        description: 'Home theatres and gaming spaces',
        color: '#7c3aed',
        subCategories: [
            { id: 'theatre', name: 'Home Theatre', imageCount: 0, videoCount: 0 },
            { id: 'gaming', name: 'Gaming Room', imageCount: 0, videoCount: 0 },
            { id: 'music', name: 'Music Room', imageCount: 0, videoCount: 0 },
            { id: 'media-wall', name: 'Media Wall Design', imageCount: 0, videoCount: 0 },
            { id: 'acoustic', name: 'Acoustic Panel Design', imageCount: 0, videoCount: 0 }
        ]
    },
    {
        id: 'commercial',
        name: 'Commercial Interior',
        icon: 'Store',
        emoji: '🏬',
        description: 'Professional commercial space designs',
        color: '#0891b2',
        subCategories: [
            { id: 'office', name: 'Office Interior', imageCount: 0, videoCount: 0 },
            { id: 'retail', name: 'Retail Shop', imageCount: 0, videoCount: 0 },
            { id: 'restaurant', name: 'Restaurant Interior', imageCount: 0, videoCount: 0 },
            { id: 'cafe', name: 'Cafe Interior', imageCount: 0, videoCount: 0 },
            { id: 'salon', name: 'Salon Interior', imageCount: 0, videoCount: 0 },
            { id: 'clinic', name: 'Clinic / Hospital Interior', imageCount: 0, videoCount: 0 }
        ]
    },
    {
        id: 'materials',
        name: 'Materials & Finishes',
        icon: 'Layers',
        emoji: '🧱',
        description: 'Material samples and finish options',
        color: '#78716c',
        subCategories: [
            { id: 'laminates', name: 'Laminates', imageCount: 0, videoCount: 0 },
            { id: 'plywood', name: 'Plywood', imageCount: 0, videoCount: 0 },
            { id: 'mdf', name: 'MDF', imageCount: 0, videoCount: 0 },
            { id: 'acrylic', name: 'Acrylic', imageCount: 0, videoCount: 0 },
            { id: 'glass', name: 'Glass', imageCount: 0, videoCount: 0 },
            { id: 'marble', name: 'Marble', imageCount: 0, videoCount: 0 },
            { id: 'tiles', name: 'Tiles', imageCount: 0, videoCount: 0 },
            { id: 'hardware', name: 'Hardware', imageCount: 0, videoCount: 0 },
            { id: 'lighting', name: 'Lighting', imageCount: 0, videoCount: 0 }
        ]
    }
];

// Helper functions
export const getCategoryById = (id) => categories.find(cat => cat.id === id);

export const getSubCategoryById = (categoryId, subCategoryId) => {
    const category = getCategoryById(categoryId);
    if (!category) return null;
    return category.subCategories.find(sub => sub.id === subCategoryId);
};

export const getAllSubCategories = () => {
    return categories.flatMap(cat =>
        cat.subCategories.map(sub => ({
            ...sub,
            categoryId: cat.id,
            categoryName: cat.name
        }))
    );
};

// Tags for filtering
export const tags = [
    { id: 'luxury', name: 'Luxury', color: '#eab308' },
    { id: 'modular', name: 'Modular', color: '#8b5cf6' },
    { id: 'small-space', name: 'Small Space', color: '#06b6d4' },
    { id: 'budget', name: 'Budget Friendly', color: '#22c55e' },
    { id: 'modern', name: 'Modern', color: '#3b82f6' },
    { id: 'traditional', name: 'Traditional', color: '#f97316' },
    { id: 'minimalist', name: 'Minimalist', color: '#64748b' },
    { id: 'premium', name: 'Premium', color: '#ec4899' }
];

// Filters
export const filters = {
    type: [
        { id: 'all', name: 'All' },
        { id: 'image', name: 'Images' },
        { id: 'video', name: 'Videos' }
    ],
    space: [
        { id: 'all', name: 'All' },
        { id: 'residential', name: 'Residential' },
        { id: 'commercial', name: 'Commercial' }
    ],
    budget: [
        { id: 'all', name: 'All' },
        { id: 'budget', name: 'Budget' },
        { id: 'mid', name: 'Mid-Range' },
        { id: 'luxury', name: 'Luxury' }
    ]
};