// Storage Scanner - Direct Firebase Storage access
import { storage } from '../firebase/config';
import { ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage';
import { categories } from '../data/categories';

// Helper to map names back to IDs
const categoryMap = {};
const subCategoryMap = {};

categories.forEach(cat => {
    categoryMap[cat.name] = cat.id;
    categoryMap[cat.id] = cat.id;

    cat.subCategories.forEach(sub => {
        subCategoryMap[sub.name] = sub.id;
        subCategoryMap[sub.id] = sub.id;
    });
});

export const scanStorageForMedia = async (categoryId, subCategoryId, mediaType) => {
    console.log(`🔍 Scanning Storage for: ${categoryId}/${subCategoryId}/${mediaType}`);
    
    try {
        // Find category and subcategory names
        const category = categories.find(c => c.id === categoryId);
        const subCategory = category?.subCategories.find(s => s.id === subCategoryId);
        
        if (!category || !subCategory) {
            console.warn('Category or subcategory not found');
            return [];
        }

        const mediaItems = [];
        
        // Based on your Firebase Storage structure, try these paths:
        const possiblePaths = [
            // URL-encoded format (what we see in your storage)
            `files/2Finterior_library-2F${category.name}-2F${subCategory.name}-2F${mediaType}`,
            `files/2Finterior_library-2F${categoryId}-2F${subCategoryId}-2F${mediaType}`,
            
            // Standard format
            `interior-library/${category.name}/${subCategory.name}/${mediaType}`,
            `interior-library/${categoryId}/${subCategoryId}/${mediaType}`,
            
            // Alternative formats
            `files/interior_library/${category.name}/${subCategory.name}/${mediaType}`,
            `${category.name}/${subCategory.name}/${mediaType}`,
            `${categoryId}/${subCategoryId}/${mediaType}`,
            
            // Direct path based on your storage structure
            `files/2Finterior_library-2FKitchen-2FL-Shape%2DKitchen-2F${mediaType}`,
            `files/2Finterior_library-2FKitchen-2FL-Shape-2F${mediaType}`
        ];

        for (const path of possiblePaths) {
            try {
                console.log(`📂 Checking path: ${path}`);
                const folderRef = ref(storage, path);
                const result = await listAll(folderRef);
                
                if (result.items.length > 0) {
                    console.log(`✅ Found ${result.items.length} files in ${path}`);
                    
                    for (const itemRef of result.items) {
                        try {
                            const url = await getDownloadURL(itemRef);
                            const metadata = await getMetadata(itemRef);
                            
                            mediaItems.push({
                                id: itemRef.name, // Use filename as ID
                                name: metadata.name || itemRef.name,
                                url: url,
                                type: mediaType,
                                categoryId: categoryId,
                                subCategoryId: subCategoryId,
                                size: metadata.size,
                                contentType: metadata.contentType,
                                createdAt: { toMillis: () => new Date(metadata.timeCreated).getTime() },
                                tags: []
                            });
                        } catch (error) {
                            console.warn(`⚠️ Error processing file ${itemRef.name}:`, error);
                        }
                    }
                    break; // Found files, no need to check other paths
                }
            } catch (error) {
                // Path doesn't exist, continue to next
                console.log(`❌ Path not found: ${path}`);
            }
        }

        // Sort by creation time (newest first)
        mediaItems.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
        
        console.log(`📊 Total media items found: ${mediaItems.length}`);
        return mediaItems;
        
    } catch (error) {
        console.error('Error scanning storage:', error);
        return [];
    }
};

export const scanStorageForMediaOptimized = async (categoryId, subCategoryId, mediaType) => {
    console.log(`🚀 Optimized scan for: ${categoryId}/${subCategoryId}/${mediaType}`);
    
    try {
        // Find category and subcategory names
        const category = categories.find(c => c.id === categoryId);
        const subCategory = category?.subCategories.find(s => s.id === subCategoryId);
        
        if (!category || !subCategory) {
            console.warn('Category or subcategory not found');
            return [];
        }

        const mediaItems = [];
        
        // Optimized path checking - start with most likely paths first
        const prioritizedPaths = [
            // Most common format based on your storage structure
            `files/2Finterior_library-2F${category.name}-2F${subCategory.name}-2F${mediaType}`,
            `interior-library/${category.name}/${subCategory.name}/${mediaType}`,
            `files/2Finterior_library-2F${categoryId}-2F${subCategoryId}-2F${mediaType}`,
        ];

        let foundPath = null;
        let folderRef = null;

        // Quick path detection - stop at first successful path
        for (const path of prioritizedPaths) {
            try {
                console.log(`🔍 Quick check: ${path}`);
                folderRef = ref(storage, path);
                const result = await listAll(folderRef);
                
                if (result.items.length > 0) {
                    console.log(`✅ Found ${result.items.length} files in ${path}`);
                    foundPath = path;
                    
                    // Process files with minimal metadata fetching
                    const filePromises = result.items.map(async (itemRef, index) => {
                        try {
                            // Only get download URL, skip metadata for performance
                            const url = await getDownloadURL(itemRef);
                            
                            return {
                                id: `${itemRef.name}_${index}`, // Unique ID
                                name: itemRef.name,
                                url: url,
                                type: mediaType,
                                categoryId: categoryId,
                                subCategoryId: subCategoryId,
                                // Use placeholder values to avoid metadata fetch
                                size: 0,
                                contentType: mediaType === 'image' ? 'image/jpeg' : 'video/mp4',
                                createdAt: { toMillis: () => Date.now() - (index * 1000) }, // Fake timestamps
                                tags: [],
                                // Add lazy loading flag
                                isLazyLoaded: true
                            };
                        } catch (error) {
                            console.warn(`⚠️ Error processing file ${itemRef.name}:`, error);
                            return null;
                        }
                    });

                    const results = await Promise.all(filePromises);
                    mediaItems.push(...results.filter(item => item !== null));
                    break; // Found files, stop checking other paths
                }
            } catch (error) {
                // Path doesn't exist, continue to next
                console.log(`❌ Path not found: ${path}`);
            }
        }

        console.log(`📊 Optimized scan complete: ${mediaItems.length} items`);
        return mediaItems;
        
    } catch (error) {
        console.error('Error in optimized storage scan:', error);
        return [];
    }
};

export const scanAllStorage = async () => {
    console.log('🔍 Scanning all storage...');
    
    try {
        // Check the files folder structure we see in your storage
        const filesRef = ref(storage, 'files');
        const result = await listAll(filesRef);
        
        console.log(`📂 Found ${result.prefixes.length} folders in /files`);
        console.log(`📄 Found ${result.items.length} files in /files`);
        
        for (const folder of result.prefixes) {
            console.log(`📁 Folder: ${folder.name}`);
            
            try {
                const folderResult = await listAll(folder);
                console.log(`  📄 Files: ${folderResult.items.length}`);
                console.log(`  📁 Subfolders: ${folderResult.prefixes.length}`);
            } catch (e) {
                console.log(`  ❌ Cannot access folder: ${folder.name}`);
            }
        }
        
        // Also check root level
        const rootRef = ref(storage);
        const rootResult = await listAll(rootRef);
        console.log(`📂 Root level folders: ${rootResult.prefixes.map(p => p.name).join(', ')}`);
        
    } catch (error) {
        console.error('Error scanning all storage:', error);
    }
};