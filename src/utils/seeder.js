
import { db } from '../firebase/config';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { categories } from '../data/categories';

export const seedCategories = async () => {
    console.log("Starting category seed...");
    let successCount = 0;
    let failCount = 0;

    for (const category of categories) {
        try {
            const categoryRef = doc(db, 'categories', category.id);
            // Check if exists to avoid unnecessary writes, OR just overwrite to ensure freshness
            // Using setDoc with merge: true to update without destroying existing data (like counts if they worked)
            await setDoc(categoryRef, {
                ...category,
                lastUpdated: new Date().toISOString()
            }, { merge: true });

            console.log(`Seeded category: ${category.name}`);
            successCount++;
        } catch (error) {
            console.error(`Failed to seed category ${category.name}:`, error);
            failCount++;
        }
    }

    return { success: successCount, failed: failCount };
};
