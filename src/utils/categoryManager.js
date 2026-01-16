// Category Manager - Hybrid Local + Firebase System
import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';
import { categories as localCategories } from '../data/categories';

class CategoryManager {
    constructor() {
        this.categories = [...localCategories]; // Start with local categories
        this.listeners = new Set();
        this.isOnline = navigator.onLine;
        this.setupNetworkListeners();
    }

    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('🟢 Network online - attempting Firebase sync');
            this.syncWithFirebase();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('🔴 Network offline - using local categories only');
        });
    }

    // Get current categories (always works)
    getCategories() {
        return this.categories;
    }

    // Get category by ID (always works)
    getCategoryById(id) {
        return this.categories.find(cat => cat.id === id);
    }

    // Add a new category (works offline, syncs when online)
    async addCategory(newCategory) {
        // Add to local array immediately
        this.categories.push({
            ...newCategory,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        
        this.notifyListeners();
        
        // Try to sync to Firebase if online
        if (this.isOnline) {
            try {
                await setDoc(doc(db, 'categories', newCategory.id), {
                    ...newCategory,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                console.log(`✅ Category "${newCategory.name}" synced to Firebase`);
            } catch (error) {
                console.warn(`⚠️ Category "${newCategory.name}" added locally, will sync when online:`, error.message);
            }
        } else {
            console.log(`📱 Category "${newCategory.name}" added locally, will sync when online`);
        }
    }

    // Update existing category
    async updateCategory(categoryId, updates) {
        const index = this.categories.findIndex(cat => cat.id === categoryId);
        if (index !== -1) {
            this.categories[index] = {
                ...this.categories[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            
            this.notifyListeners();
            
            // Try to sync to Firebase if online
            if (this.isOnline) {
                try {
                    await updateDoc(doc(db, 'categories', categoryId), {
                        ...updates,
                        updatedAt: new Date().toISOString()
                    });
                    console.log(`✅ Category "${categoryId}" updated in Firebase`);
                } catch (error) {
                    console.warn(`⚠️ Category "${categoryId}" updated locally, will sync when online:`, error.message);
                }
            }
        }
    }

    // Sync with Firebase (when connection is available)
    async syncWithFirebase() {
        if (!this.isOnline) return;

        try {
            console.log('🔄 Syncing categories with Firebase...');
            
            // Listen to Firebase categories
            const unsubscribe = onSnapshot(
                collection(db, 'categories'),
                (snapshot) => {
                    if (!snapshot.empty) {
                        const firebaseCategories = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));
                        
                        // Merge Firebase categories with local ones
                        this.mergeCategories(firebaseCategories);
                        console.log(`📊 Synced with ${firebaseCategories.length} Firebase categories`);
                    }
                },
                (error) => {
                    console.warn('⚠️ Firebase sync failed, continuing with local categories:', error.message);
                }
            );

            return unsubscribe;
        } catch (error) {
            console.warn('⚠️ Could not establish Firebase sync:', error.message);
        }
    }

    // Merge Firebase categories with local ones
    mergeCategories(firebaseCategories) {
        console.log(`🔄 [CategoryManager] Starting merge:`, {
            localCategoriesCount: localCategories.length,
            firebaseCategoriesCount: firebaseCategories.length,
            timestamp: new Date().toISOString()
        });
        
        const merged = [...localCategories]; // Start with local as base
        
        // Add or update categories from Firebase
        firebaseCategories.forEach(fbCat => {
            const existingIndex = merged.findIndex(cat => cat.id === fbCat.id);
            if (existingIndex !== -1) {
                console.log(`🔄 [CategoryManager] Updating category "${fbCat.id}" from Firebase:`, {
                    categoryId: fbCat.id,
                    categoryName: fbCat.name,
                    firebaseSubCategories: fbCat.subCategories?.length || 0,
                    localSubCategories: merged[existingIndex].subCategories?.length || 0,
                    firebaseSubCategoryCounts: fbCat.subCategories?.map(sub => ({
                        id: sub.id,
                        name: sub.name,
                        imageCount: sub.imageCount,
                        videoCount: sub.videoCount
                    })),
                    timestamp: new Date().toISOString()
                });
                
                // Update existing category (preserve local structure, update counts)
                merged[existingIndex] = {
                    ...merged[existingIndex],
                    ...fbCat,
                    // Preserve local subcategory structure but update counts
                    subCategories: merged[existingIndex].subCategories?.map(localSub => {
                        const fbSub = fbCat.subCategories?.find(s => s.id === localSub.id);
                        if (fbSub) {
                            console.log(`🔄 [CategoryManager] Merging subcategory "${localSub.id}":`, {
                                subCategoryId: localSub.id,
                                subCategoryName: localSub.name,
                                localImageCount: localSub.imageCount,
                                firebaseImageCount: fbSub.imageCount,
                                localVideoCount: localSub.videoCount,
                                firebaseVideoCount: fbSub.videoCount,
                                willUseFirebase: true
                            });
                            return { ...localSub, ...fbSub };
                        }
                        return localSub;
                    }) || fbCat.subCategories
                };
            } else {
                console.log(`➕ [CategoryManager] Adding new category from Firebase:`, {
                    categoryId: fbCat.id,
                    categoryName: fbCat.name,
                    timestamp: new Date().toISOString()
                });
                // Add new category from Firebase
                merged.push(fbCat);
            }
        });

        console.log(`✅ [CategoryManager] Merge complete:`, {
            mergedCategoriesCount: merged.length,
            timestamp: new Date().toISOString()
        });

        this.categories = merged;
        this.notifyListeners();
    }

    // Subscribe to category changes
    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    // Notify all listeners of changes
    notifyListeners() {
        this.listeners.forEach(callback => callback(this.categories));
    }

    // Force sync all local categories to Firebase
    async forceSyncToFirebase() {
        if (!this.isOnline) {
            throw new Error('Cannot sync to Firebase while offline');
        }

        console.log('🚀 Force syncing all categories to Firebase...');
        let synced = 0;
        let errors = 0;

        for (const category of this.categories) {
            try {
                await setDoc(doc(db, 'categories', category.id), {
                    ...category,
                    updatedAt: new Date().toISOString()
                });
                synced++;
            } catch (error) {
                console.error(`❌ Failed to sync category ${category.id}:`, error);
                errors++;
            }
        }

        console.log(`✅ Force sync complete: ${synced} synced, ${errors} errors`);
        return { synced, errors };
    }
}

// Create singleton instance
export const categoryManager = new CategoryManager();

// React hook for using categories
export const useCategories = () => {
    const [categories, setCategories] = useState(categoryManager.getCategories());

    useEffect(() => {
        const unsubscribe = categoryManager.subscribe(setCategories);
        
        // Try to sync with Firebase on mount
        categoryManager.syncWithFirebase();
        
        return unsubscribe;
    }, []);

    return {
        categories,
        addCategory: categoryManager.addCategory.bind(categoryManager),
        updateCategory: categoryManager.updateCategory.bind(categoryManager),
        getCategoryById: categoryManager.getCategoryById.bind(categoryManager),
        forceSyncToFirebase: categoryManager.forceSyncToFirebase.bind(categoryManager)
    };
};