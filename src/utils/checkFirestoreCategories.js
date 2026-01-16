// Diagnostic tool to check Firestore categories
import { db } from '../firebase/config';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

export const checkFirestoreCategories = async () => {
    console.log('🔍 [Diagnostic] Checking Firestore categories...');
    
    try {
        const categoriesSnapshot = await getDocs(collection(db, 'categories'));
        
        if (categoriesSnapshot.empty) {
            console.warn('⚠️ [Diagnostic] No categories found in Firestore!');
            return { exists: false, count: 0, categories: [] };
        }
        
        const categories = [];
        categoriesSnapshot.forEach(doc => {
            const data = doc.data();
            console.log(`📁 [Diagnostic] Category "${doc.id}":`, {
                id: doc.id,
                name: data.name,
                subCategoriesCount: data.subCategories?.length || 0,
                subCategories: data.subCategories?.map(sub => ({
                    id: sub.id,
                    name: sub.name,
                    imageCount: sub.imageCount,
                    videoCount: sub.videoCount,
                    totalItems: (sub.imageCount || 0) + (sub.videoCount || 0)
                }))
            });
            categories.push({ id: doc.id, ...data });
        });
        
        console.log(`✅ [Diagnostic] Found ${categories.length} categories in Firestore`);
        return { exists: true, count: categories.length, categories };
        
    } catch (error) {
        console.error('❌ [Diagnostic] Error checking Firestore:', error);
        return { exists: false, error: error.message };
    }
};

export const checkSpecificCategory = async (categoryId) => {
    console.log(`🔍 [Diagnostic] Checking category "${categoryId}" in Firestore...`);
    
    try {
        const categoryDoc = await getDoc(doc(db, 'categories', categoryId));
        
        if (!categoryDoc.exists()) {
            console.warn(`⚠️ [Diagnostic] Category "${categoryId}" not found in Firestore!`);
            return { exists: false };
        }
        
        const data = categoryDoc.data();
        console.log(`📁 [Diagnostic] Category "${categoryId}" data:`, {
            id: categoryDoc.id,
            name: data.name,
            subCategoriesCount: data.subCategories?.length || 0,
            subCategories: data.subCategories?.map(sub => ({
                id: sub.id,
                name: sub.name,
                imageCount: sub.imageCount,
                videoCount: sub.videoCount,
                totalItems: (sub.imageCount || 0) + (sub.videoCount || 0)
            }))
        });
        
        return { exists: true, data: { id: categoryDoc.id, ...data } };
        
    } catch (error) {
        console.error(`❌ [Diagnostic] Error checking category "${categoryId}":`, error);
        return { exists: false, error: error.message };
    }
};

// Make these available globally for console debugging
if (typeof window !== 'undefined') {
    window.checkFirestoreCategories = checkFirestoreCategories;
    window.checkSpecificCategory = checkSpecificCategory;
}
