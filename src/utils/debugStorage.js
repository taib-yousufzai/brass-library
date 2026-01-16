// Debug utility to explore Firebase Storage structure
import { storage } from '../firebase/config';
import { ref, listAll } from 'firebase/storage';

export const debugStorageStructure = async () => {
    console.log('🔍 DEBUG: Exploring Firebase Storage structure...');
    
    try {
        // Check root level
        const rootRef = ref(storage);
        const rootResult = await listAll(rootRef);
        
        console.log('📂 Root level folders:', rootResult.prefixes.map(p => p.name));
        console.log('📄 Root level files:', rootResult.items.map(i => i.name));
        
        // Check the files folder specifically (based on your storage structure)
        try {
            const filesRef = ref(storage, 'files');
            const filesResult = await listAll(filesRef);
            
            console.log('📂 /files folder contents:');
            console.log('  Folders:', filesResult.prefixes.map(p => p.name));
            console.log('  Files:', filesResult.items.length);
            
            // Explore the URL-encoded folders
            for (const folder of filesResult.prefixes) {
                try {
                    const folderResult = await listAll(folder);
                    console.log(`📁 /files/${folder.name}:`);
                    console.log(`  Files: ${folderResult.items.length}`);
                    console.log(`  Subfolders: ${folderResult.prefixes.length}`);
                    
                    // Show first few files
                    if (folderResult.items.length > 0) {
                        console.log('  Sample files:', folderResult.items.slice(0, 3).map(i => i.name));
                    }
                } catch (e) {
                    console.log(`  ❌ Cannot access ${folder.name}`);
                }
            }
        } catch (error) {
            console.log('❌ /files folder not accessible');
        }
        
        // Check other common paths
        const commonPaths = [
            'interior-library',
            'images',
            'media',
            'uploads'
        ];
        
        for (const path of commonPaths) {
            try {
                const pathRef = ref(storage, path);
                const pathResult = await listAll(pathRef);
                
                if (pathResult.prefixes.length > 0 || pathResult.items.length > 0) {
                    console.log(`📂 Found content in /${path}:`);
                    console.log(`  Folders: ${pathResult.prefixes.map(p => p.name).join(', ')}`);
                    console.log(`  Files: ${pathResult.items.length} files`);
                }
            } catch (error) {
                console.log(`❌ Path /${path} not accessible`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error exploring storage:', error);
    }
};

// Call this function from browser console: debugStorageStructure()
window.debugStorageStructure = debugStorageStructure;