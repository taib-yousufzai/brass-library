
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Config from src/firebase/config.js (Simplified for node script)
const firebaseConfig = {
    apiKey: "AIzaSyDWzuEi0XvHj9SKEpj1xEe7TMLxfMh3r98",
    authDomain: "lifeasy-lib-9dc5b.firebaseapp.com",
    projectId: "lifeasy-lib-9dc5b",
    storageBucket: "lifeasy-lib-9dc5b.firebasestorage.app",
    messagingSenderId: "306247620264",
    appId: "1:306247620264:web:2f70fa76b1a9f3299e949d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function listMedia() {
    console.log('Fetching media items...');
    try {
        const querySnapshot = await getDocs(collection(db, 'media'));
        if (querySnapshot.empty) {
            console.log('No media documents found.');
        } else {
            console.log(`Found ${querySnapshot.size} media documents.`);
        }

        console.log('Fetching categories...');
        const catSnapshot = await getDocs(collection(db, 'categories'));
        if (catSnapshot.empty) {
            console.log('No categories found.');
        } else {
            console.log(`Found ${catSnapshot.size} categories:`);
            catSnapshot.forEach((doc) => {
                const data = doc.data();
                console.log(`- ID: ${doc.id}, Name: ${data.name}`);
                if (data.subCategories) {
                    console.log(`  SubCategories: ${data.subCategories.length}`);
                    data.subCategories.forEach(sub => {
                        console.log(`    - ${sub.id} (${sub.name})`);
                    });
                }
            });
        }
    } catch (e) {
        console.error('Error fetching data:', e);
    }
}

listMedia();
