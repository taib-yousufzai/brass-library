/**
 * CORS Verification Script
 * This script helps verify that CORS headers are properly configured for Firebase Storage
 */

// Test CORS configuration by making a request to a Firebase Storage URL
async function verifyCORS(imageUrl) {
    try {
        console.log('🔍 Testing CORS configuration for:', imageUrl);
        
        const response = await fetch(imageUrl, {
            method: 'HEAD', // Use HEAD to avoid downloading the full image
            mode: 'cors'
        });
        
        console.log('✅ Response Status:', response.status);
        console.log('📋 Response Headers:');
        
        // Check for important CORS headers
        const corsHeaders = [
            'access-control-allow-origin',
            'access-control-allow-methods',
            'access-control-allow-headers',
            'content-type',
            'cache-control'
        ];
        
        corsHeaders.forEach(header => {
            const value = response.headers.get(header);
            if (value) {
                console.log(`   ✅ ${header}: ${value}`);
            } else {
                console.log(`   ❌ ${header}: Not present`);
            }
        });
        
        return response.ok;
        
    } catch (error) {
        console.error('❌ CORS verification failed:', error.message);
        
        if (error.message.includes('CORS')) {
            console.log('💡 This indicates a CORS configuration issue.');
            console.log('   Please run: apply-cors.bat to fix this.');
        }
        
        return false;
    }
}

// Example usage - replace with actual Firebase Storage URL
const exampleUrl = 'https://firebasestorage.googleapis.com/v0/b/lifeasy-lib-9dc5b.appspot.com/o/interior-library%2Ftest-image.jpg?alt=media';

console.log('==========================================');
console.log('    Firebase Storage CORS Verification');
console.log('==========================================');
console.log('');

// You can test with an actual image URL from your Firebase Storage
// verifyCORS(exampleUrl);

console.log('To test CORS with an actual image URL:');
console.log('1. Replace exampleUrl with your Firebase Storage image URL');
console.log('2. Uncomment the verifyCORS(exampleUrl) line');
console.log('3. Run: node verify-cors.js');
console.log('');
console.log('Or test in browser console:');
console.log(`fetch('YOUR_IMAGE_URL', {method: 'HEAD', mode: 'cors'}).then(r => console.log('CORS OK:', r.ok)).catch(e => console.error('CORS Error:', e));`);