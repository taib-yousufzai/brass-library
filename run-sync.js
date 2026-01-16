
import { db } from './src/firebase/config.js';
import { categories } from './src/data/categories.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';

async function syncCategories() {
    try {
        console.log('Syncing categories to Firestore...');
        let updatedCount = 0;
        let createdCount = 0;

        for (const localCat of categories) {
            const catRef = doc(db, 'categories', localCat.id);
            const catDoc = await getDoc(catRef);

            if (catDoc.exists()) {
                const remoteData = catDoc.data();

                const mergedSubData = localCat.subCategories.map(localSub => {
                    const remoteSub = remoteData.subCategories?.find(r => r.id === localSub.id);
                    if (remoteSub) {
                        return {
                            ...localSub,
                            imageCount: remoteSub.imageCount || 0,
                            videoCount: remoteSub.videoCount || 0
                        };
                    } else {
                        return localSub;
                    }
                });

                await setDoc(catRef, {
                    ...localCat,
                    subCategories: mergedSubData,
                    updatedAt: new Date().toISOString()
                }, { merge: true });

                updatedCount++;
            } else {
                await setDoc(catRef, {
                    ...localCat,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                createdCount++;
            }
        };

        console.log(`Sync complete: Created ${createdCount}, Updated ${updatedCount} categories`);
        process.exit(0);
    } catch (error) {
        console.error('Error syncing categories:', error);
        process.exit(1);
    }
}

syncCategories();
