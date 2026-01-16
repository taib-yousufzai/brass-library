
import { db, storage } from './src/firebase/config.js';
import { categories } from './src/data/categories.js';
import { collection, query, where, getDocs, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage';

// Helper to map names back to IDs
const categoryMap = {}; // Name -> ID
const subCategoryMap = {}; // Name -> ID (Global map might collide, but usually names are unique enough or we use context)

categories.forEach(cat => {
    categoryMap[cat.name] = cat.id;
    // Fallback if folder used ID
    categoryMap[cat.id] = cat.id;

    cat.subCategories.forEach(sub => {
        subCategoryMap[sub.name] = sub.id;
        subCategoryMap[sub.id] = sub.id;
    });
});

async function recoverMedia() {
    console.log('🚀 Starting Media Recovery...');
    console.log('1. Scanning Storage for files...');

    let recoveredCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Recursive function to list all files
    async function processFolder(folderRef) {
        try {
            const res = await listAll(folderRef);

            // Process sub-folders
            for (const folder of res.prefixes) {
                await processFolder(folder);
            }

            // Process files
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
            // Path format: interior-library/{Category}/{SubCategory}/{Type}/{Filename}
            const pathParts = fileRef.fullPath.split('/');

            // Basic validation
            if (pathParts[0] !== 'interior-library' || pathParts.length < 5) {
                // Not part of our structure
                return;
            }

            const categoryName = pathParts[1];
            const subCategoryName = pathParts[2];
            const typeFolder = pathParts[3]; // 'image' or 'video'

            const categoryId = categoryMap[categoryName];
            const subCategoryId = subCategoryMap[subCategoryName];

            if (!categoryId || !subCategoryId) {
                console.warn(`⚠️ Could not map path to IDs: ${fileRef.fullPath}`);
                return;
            }

            const mediaType = typeFolder.includes('video') ? 'video' : 'image';

            // Check if already exists in Firestore
            const url = await getDownloadURL(fileRef);
            const q = query(collection(db, 'media'), where('url', '==', url));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                skippedCount++;
                process.stdout.write('.');
                return;
            }

            // Get metadata for size/type
            const metadata = await getMetadata(fileRef);

            // Create Firestore Document
            await addDoc(collection(db, 'media'), {
                name: metadata.name,
                url: url,
                type: mediaType,
                categoryId: categoryId,
                subCategoryId: subCategoryId,
                tags: [],
                createdAt: serverTimestamp(), // Use current time as fallback
                size: metadata.size,
                contentType: metadata.contentType
            });

            console.log(`\n✅ Recovered: ${metadata.name} -> ${categoryId}/${subCategoryId}`);
            recoveredCount++;

        } catch (error) {
            console.error('\nError processing file:', fileRef.fullPath, error);
            errorCount++;
        }
    }

    // Start scanning from root of library
    const rootRef = ref(storage, 'interior-library');
    await processFolder(rootRef);

    console.log('\n\n==========================================');
    console.log(`Recovery Complete!`);
    console.log(`✅ Recovered: ${recoveredCount}`);
    console.log(`⏭️  Skipped (Existing): ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('==========================================');

    if (recoveredCount > 0) {
        console.log('🔄 Recalculating category counts...');
        // Simple recalculation script inline just to be safe
        await recalculateCounts();
    }

    process.exit(0);
}

// Inline recalculation logic to avoid dependency issues in script
async function recalculateCounts() {
    try {
        const mediaSnapshot = await getDocs(collection(db, 'media'));
        const counts = {};

        mediaSnapshot.forEach(doc => {
            const data = doc.data();
            const catId = data.categoryId;
            const subCatId = data.subCategoryId;
            const type = data.type;

            if (catId && subCatId && type) {
                if (!counts[catId]) counts[catId] = {};
                if (!counts[catId][subCatId]) counts[catId][subCatId] = { imageCount: 0, videoCount: 0 };

                if (type === 'image') counts[catId][subCatId].imageCount++;
                else if (type === 'video') counts[catId][subCatId].videoCount++;
            }
        });

        const categoriesSnapshot = await getDocs(collection(db, 'categories'));

        for (const catDoc of categoriesSnapshot.docs) {
            const catData = catDoc.data();
            const catId = catDoc.id;
            let hasChanges = false;

            const updatedSubCats = catData.subCategories.map(sub => {
                const calculated = counts[catId]?.[sub.id] || { imageCount: 0, videoCount: 0 };
                return { ...sub, imageCount: calculated.imageCount, videoCount: calculated.videoCount };
            });

            await setDoc(doc(db, 'categories', catId), {
                subCategories: updatedSubCats,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        }
        console.log('✅ Counts updated.');
    } catch (e) {
        console.error('Error in count recalculation:', e);
    }
}

recoverMedia();
