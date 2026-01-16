// Role definitions
export const ROLES = {
    ADMIN: 'admin',
    STAFF: 'staff',
    CLIENT: 'client'
};

export const PERMISSIONS = {
    [ROLES.ADMIN]: {
        canUpload: true,
        canDelete: true,
        canDownload: true,
        canScreenshot: true,
        canShare: true,
        canManageCategories: true,
        canManageUsers: true,
        canViewAnalytics: true,
        canFavorite: true
    },
    [ROLES.STAFF]: {
        canUpload: false,
        canDelete: false,
        canDownload: true,
        canScreenshot: true,
        canShare: true,
        canManageCategories: false,
        canManageUsers: false,
        canViewAnalytics: false,
        canFavorite: true
    },
    [ROLES.CLIENT]: {
        canUpload: false,
        canDelete: false,
        canDownload: false,
        canScreenshot: false,
        canShare: false,
        canManageCategories: false,
        canManageUsers: false,
        canViewAnalytics: false,
        canFavorite: true
    }
};
