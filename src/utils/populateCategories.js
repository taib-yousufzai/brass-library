// Utility to populate Firestore with categories
import { db, storage } from '../firebase/config';
import { doc, setDoc, collection, getDocs, getDoc, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage';
import { categories } from '../data/categories';

export const populateCategories = async () => {
    try {
        console.log('Populating categories in Firestore...');

        // Check if categories already exist
        const categoriesSnapshot = await getDocs(collection(db, 'categories'));
        if (!categoriesSnapshot.empty) {
            console.log('Categories already exist in Firestore');
            return true;
        }

        // Populate categories
        const promises = categories.map(category =>
            setDoc(doc(db, 'categories', category.id), {
                ...category,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            })
        );

        await Promise.all(promises);
        console.log('Successfully populated categories in Firestore');
        return true;
    } catch (error) {
        console.error('Error populating categories:', error);
        return false;
    }
};

export const ensureCategoriesExist = async () => {
    try {
        const categoriesSnapshot = await getDocs(collection(db, 'categories'));
        if (categoriesSnapshot.empty) {
            console.log('No categories found, populating...');
            return await populateCategories();
        }
        return true;
    } catch (error) {
        console.error('Error checking categories:', error);
        return false;
    }
};

/**
 * Force syncs local categories to Firestore.
 * Merges local data (name, icon, etc.) with remote data (preserving counts).
 */
export const syncCategories = async () => {
    try {
        console.log('Syncing categories to Firestore...');
        let updatedCount = 0;
        let createdCount = 0;

        // Process each category one by one
        for (const localCat of categories) {
            const catRef = doc(db, 'categories', localCat.id);
            const catDoc = await getDoc(catRef);

            if (catDoc.exists()) {
                // Update existing category
                const remoteData = catDoc.data();

                // Merge sub-categories to preserve counts
                const mergedSubData = localCat.subCategories.map(localSub => {
                    // Try to find matching sub-category in remote data
                    const remoteSub = remoteData.subCategories?.find(r => r.id === localSub.id);

                    if (remoteSub) {
                        // Preserve counts from remote, update static data from local
                        return {
                            ...localSub,
                            imageCount: remoteSub.imageCount || 0,
                            videoCount: remoteSub.videoCount || 0
                        };
                    } else {
                        // New sub-category
                        return localSub;
                    }
                });

                // Check if we missed any remote-only sub-categories (if any were manually added)
                // Optional: For now, we strictly enforce local config as the source of truth for STRUCTURE
                // but we could append them if needed. Sticking to local structure for consistency.

                await setDoc(catRef, {
                    ...localCat,
                    subCategories: mergedSubData,
                    updatedAt: new Date().toISOString()
                }, { merge: true });

                updatedCount++;
            } else {
                // Create new category
                await setDoc(catRef, {
                    ...localCat,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                createdCount++;
            }
        }

        console.log(`Sync complete: Created ${createdCount}, Updated ${updatedCount} categories`);
        return { success: true, message: `Sync Complete: Created ${createdCount}, Updated ${updatedCount}` };
    } catch (error) {
        console.error('Error syncing categories:', error);

        let errorMessage = error.message;
        if (error.message.includes('client is offline')) {
            errorMessage = 'Client is offline. Categories created locally.';
            // Return success-ish state to prevent UI errors, but warn user
            return { success: false, message: 'Offline mode: Categories saved locally only.' };
        }

        return { success: false, message: `Sync failed: ${errorMessage}` };
    }
};

/**
 * Recalculates category counts based on actual media items in Firestore.
 * This ensures the counts are accurate even if they drift over time.
 */
export const recalculateCounts = async () => {
    try {
        console.log('🔄 Recalculating counts from media collection...');

        // 1. Fetch all media items
        // Note: For large datasets, this should be a Cloud Function. 
        // For this scale, client-side calculation is acceptable.
        const mediaSnapshot = await getDocs(collection(db, 'media'));
        const counts = {};

        // 2. Aggregate counts locally
        mediaSnapshot.forEach(doc => {
            const data = doc.data();
            const catId = data.categoryId;
            const subCatId = data.subCategoryId;
            const type = data.type; // 'image' or 'video'

            if (catId && subCatId && type) {
                if (!counts[catId]) counts[catId] = {};
                if (!counts[catId][subCatId]) counts[catId][subCatId] = { imageCount: 0, videoCount: 0 };

                if (type === 'image') counts[catId][subCatId].imageCount++;
                else if (type === 'video') counts[catId][subCatId].videoCount++;
            }
        });

        console.log('📊 Aggregated counts:', counts);

        // 3. Update Categories
        const categoriesSnapshot = await getDocs(collection(db, 'categories'));
        let updatedCount = 0;

        const updatePromises = categoriesSnapshot.docs.map(async (catDoc) => {
            const catData = catDoc.data();
            const catId = catDoc.id;
            let hasChanges = false;

            // Update sub-categories with new counts
            const updatedSubCats = catData.subCategories.map(sub => {
                const calculated = counts[catId]?.[sub.id] || { imageCount: 0, videoCount: 0 };

                if (sub.imageCount !== calculated.imageCount || sub.videoCount !== calculated.videoCount) {
                    hasChanges = true;
                    return {
                        ...sub,
                        imageCount: calculated.imageCount,
                        videoCount: calculated.videoCount
                    };
                }
                return sub;
            });

            if (hasChanges) {
                updatedCount++;
                await setDoc(doc(db, 'categories', catId), {
                    subCategories: updatedSubCats,
                    updatedAt: new Date().toISOString()
                }, { merge: true });
            }
        });

        await Promise.all(updatePromises);
        console.log(`✅ Recalculation complete. Updated ${updatedCount} categories.`);
        alert(`Recalculation complete! Updated ${updatedCount} categories with actual media counts.`);

    } catch (error) {
        console.error('❌ Error recalculating counts:', error);
        alert('Error recalculating counts. See console for details.');
    }
};

/**
 * Scans Firebase Storage for files and recreates missing Firestore documents.
 */
export const recoverMedia = async () => {
    console.log('🚀 Starting Robust Media Recovery...');

    // Helper to map names/IDs back to canonical IDs
    const categoryMap = {}; // Name/ID -> ID
    const subCategoryMap = {}; // Name/ID -> ID

    categories.forEach(cat => {
        categoryMap[cat.name.toLowerCase()] = cat.id;
        categoryMap[cat.id.toLowerCase()] = cat.id;
        // Handle common variations if needed
        categoryMap[cat.name.replace(/\s+/g, '-').toLowerCase()] = cat.id;

        cat.subCategories.forEach(sub => {
            subCategoryMap[sub.name.toLowerCase()] = sub.id;
            subCategoryMap[sub.id.toLowerCase()] = sub.id;
            subCategoryMap[sub.name.replace(/\s+/g, '-').toLowerCase()] = sub.id;
        });
    });

    let recoveredCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const processedUrls = new Set(); // Track URLs to avoid duplicates

    // Recursive function to list all files
    async function processFolder(folderRef) {
        try {
            console.log(`📂 Scanning folder: ${folderRef.fullPath}`);
            const res = await listAll(folderRef);

            for (const folder of res.prefixes) {
                await processFolder(folder);
            }

            for (const itemRef of res.items) {
                await processFile(itemRef);
            }
        } catch (error) {
            console.error('Error listing folder:', folderRef.fullPath, error);
            errorCount++;
        }
    }

    async function processFile(fileRef) {
        try {
            const url = await getDownloadURL(fileRef);

            // Deduplication check
            if (processedUrls.has(url)) return;
            processedUrls.add(url);

            // Check existence in Firestore
            const q = query(collection(db, 'media'), where('url', '==', url));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                skippedCount++;
                return;
            }

            // Parse metadata from path
            const fullPath = fileRef.fullPath.toLowerCase();
            const pathParts = fullPath.split('/');

            // 1. Identify Category
            let categoryId = null;
            // Look for known category IDs/Names in the path
            for (const key of Object.keys(categoryMap)) {
                if (fullPath.includes(key) || pathParts.some(p => p.includes(key))) {
                    categoryId = categoryMap[key];
                    break;
                }
            }

            // 2. Identify SubCategory
            let subCategoryId = null;
            for (const key of Object.keys(subCategoryMap)) {
                if (fullPath.includes(key) || pathParts.some(p => p.includes(key))) {
                    subCategoryId = subCategoryMap[key];
                    break;
                }
            }

            // 3. Identify Type
            const mediaType = fullPath.includes('video') || fileRef.name.endsWith('.mp4') || fileRef.name.endsWith('.mov') ? 'video' : 'image';

            if (categoryId && subCategoryId) {
                const metadata = await getMetadata(fileRef);

                await addDoc(collection(db, 'media'), {
                    name: metadata.name,
                    url: url,
                    type: mediaType,
                    categoryId: categoryId,
                    subCategoryId: subCategoryId,
                    tags: [], // Could infer from path?
                    createdAt: serverTimestamp(),
                    size: metadata.size,
                    contentType: metadata.contentType
                });
                console.log(`✅ Recovered: ${metadata.name} -> ${categoryId}/${subCategoryId}`);
                recoveredCount++;
            } else {
                console.warn(`⚠️ Skipping file (could not identify category/subcategory): ${fileRef.fullPath}`);
                // Optional: Log this to help user debug file structure
            }

        } catch (error) {
            console.error('Error processing file:', fileRef.fullPath, error);
            errorCount++;
        }
    }

    try {
        // Scan common roots
        const roots = ['interior-library', 'files'];
        for (const root of roots) {
            const rootRef = ref(storage, root);
            // Check if root exists (listAll will throw or return empty)
            try {
                await processFolder(rootRef);
            } catch (e) {
                console.log(`Root '${root}' not found or inaccessible.`);
            }
        }

        console.log(`Recovery Complete: Recovered ${recoveredCount}, Skipped ${skippedCount}, Errors ${errorCount}`);

        let message = `Recovery Complete!\nRecovered: ${recoveredCount} items\nSkipped (Already exists): ${skippedCount}\nErrors: ${errorCount}`;

        if (recoveredCount > 0) {
            message += '\n\nAutomatically recalculating counts...';
            await recalculateCounts();
        } else if (skippedCount > 0) {
            // Even if we only skipped items, we should recalc to ensure counts match the existing items
            message += '\n\nRecalculating counts to be sure...';
            await recalculateCounts();
        }

        return { success: true, message };

    } catch (error) {
        console.error("Recovery fatal error:", error);
        throw error;
    }
};
