import { db } from '../firebase/config';
import { collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';

/**
 * Recalculates image and video counts for all categories based on actual media in Firestore
 * @returns {Promise<{success: boolean, message: string, stats: any}>} Result of the operation
 */
export const recalculateCategoryCounts = async () => {
    console.log('🔄 Starting category count recalculation...');
    
    try {
        // 1. Fetch all media items
        const mediaCollection = collection(db, 'media');
        const mediaSnapshot = await getDocs(mediaCollection);
        
        if (mediaSnapshot.empty) {
            console.warn('⚠️ No media found in database');
            return { success: true, message: 'No media found to count', stats: { totalMedia: 0 } };
        }

        console.log(`📊 Found ${mediaSnapshot.size} media items`);

        // 2. Aggregate counts
        // Structure: counts[categoryId][subCategoryId] = { imageCount: 0, videoCount: 0 }
        const counts = {};

        mediaSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const { categoryId, subCategoryId, type } = data;

            if (!categoryId || !subCategoryId) return;

            // Initialize structure if missing
            if (!counts[categoryId]) {
                counts[categoryId] = {};
            }
            if (!counts[categoryId][subCategoryId]) {
                counts[categoryId][subCategoryId] = { imageCount: 0, videoCount: 0 };
            }

            // Increment counts
            // Handle both 'image' and 'video' types from your Upload logic
            if (type === 'image') {
                counts[categoryId][subCategoryId].imageCount++;
            } else if (type === 'video') {
                counts[categoryId][subCategoryId].videoCount++;
            }
        });

        // 3. Fetch all categories
        const categoriesCollection = collection(db, 'categories');
        const categoriesSnapshot = await getDocs(categoriesCollection);
        
        if (categoriesSnapshot.empty) {
             console.error('❌ No categories found to update');
             return { success: false, message: 'No categories found' };
        }

        // 4. Update categories with new counts
        const batch = writeBatch(db);
        let updatedCategoriesCount = 0;
        let updatedSubCategoriesCount = 0;

        categoriesSnapshot.docs.forEach(catDoc => {
            const categoryData = catDoc.data();
            const categoryId = catDoc.id;
            const categoryCounts = counts[categoryId] || {};
            
            let hasChanges = false;
            
            // Map over subcategories and update counts
            const updatedSubCategories = (categoryData.subCategories || []).map(subCat => {
                const subCatCounts = categoryCounts[subCat.id] || { imageCount: 0, videoCount: 0 };
                
                // Check if counts are different
                if (subCat.imageCount !== subCatCounts.imageCount || subCat.videoCount !== subCatCounts.videoCount) {
                    hasChanges = true;
                    updatedSubCategoriesCount++;
                    return {
                        ...subCat,
                        imageCount: subCatCounts.imageCount,
                        videoCount: subCatCounts.videoCount
                    };
                }
                
                return subCat;
            });

            if (hasChanges) {
                const catRef = doc(db, 'categories', categoryId);
                batch.update(catRef, { 
                    subCategories: updatedSubCategories,
                    updatedAt: new Date().toISOString()
                });
                updatedCategoriesCount++;
            }
        });

        if (updatedCategoriesCount > 0) {
            await batch.commit();
            console.log(`✅ Updated ${updatedCategoriesCount} categories and ${updatedSubCategoriesCount} subcategories`);
            return { 
                success: true, 
                message: `Synced counts for ${updatedCategoriesCount} categories`,
                stats: { updatedCategories: updatedCategoriesCount }
            };
        } else {
             console.log('✅ Counts are already in sync');
             return { success: true, message: 'Counts are already in sync', stats: { updatedCategories: 0 } };
        }

    } catch (error) {
        console.error('❌ Error recalculating counts:', error);
        return { success: false, message: error.message };
    }
};
