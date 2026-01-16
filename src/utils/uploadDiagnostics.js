// Upload Diagnostics - Help debug upload issues
import { db, storage } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const runUploadDiagnostics = async () => {
    const results = {
        timestamp: new Date().toISOString(),
        tests: []
    };

    console.log('🔍 Running upload diagnostics...');

    // Test 1: Network connectivity
    try {
        const response = await fetch('https://www.google.com/favicon.ico', { method: 'HEAD', mode: 'no-cors' });
        results.tests.push({
            name: 'Network Connectivity',
            status: 'PASS',
            message: 'Internet connection is working'
        });
    } catch (error) {
        results.tests.push({
            name: 'Network Connectivity',
            status: 'FAIL',
            message: 'No internet connection detected',
            error: error.message
        });
    }

    // Test 2: Firebase Storage connectivity
    try {
        // Try to upload a tiny test file
        const testData = new Blob(['test'], { type: 'text/plain' });
        const testRef = ref(storage, `diagnostics/test-${Date.now()}.txt`);
        await uploadBytes(testRef, testData);
        const testUrl = await getDownloadURL(testRef);
        
        results.tests.push({
            name: 'Firebase Storage Upload',
            status: 'PASS',
            message: 'Successfully uploaded test file to Firebase Storage',
            testUrl: testUrl.substring(0, 100) + '...'
        });
    } catch (error) {
        results.tests.push({
            name: 'Firebase Storage Upload',
            status: 'FAIL',
            message: 'Failed to upload to Firebase Storage',
            error: error.message,
            errorCode: error.code
        });
    }

    // Test 3: Firestore write
    try {
        const testDoc = doc(db, 'diagnostics', `test-${Date.now()}`);
        await setDoc(testDoc, {
            test: true,
            timestamp: new Date(),
            message: 'Diagnostic test document'
        });
        
        results.tests.push({
            name: 'Firestore Write',
            status: 'PASS',
            message: 'Successfully wrote test document to Firestore'
        });
    } catch (error) {
        results.tests.push({
            name: 'Firestore Write',
            status: 'FAIL',
            message: 'Failed to write to Firestore',
            error: error.message,
            errorCode: error.code
        });
    }

    // Test 4: Check if Firestore is in offline mode
    try {
        // Try to read a non-existent document to see if we get a network error
        const testDoc = doc(db, 'diagnostics', 'non-existent-doc');
        await getDoc(testDoc);
        
        results.tests.push({
            name: 'Firestore Online Status',
            status: 'PASS',
            message: 'Firestore is operating in online mode'
        });
    } catch (error) {
        if (error.message.includes('offline')) {
            results.tests.push({
                name: 'Firestore Online Status',
                status: 'WARNING',
                message: 'Firestore appears to be in offline mode',
                error: error.message
            });
        } else {
            results.tests.push({
                name: 'Firestore Online Status',
                status: 'PASS',
                message: 'Firestore is operating normally (expected error for non-existent doc)'
            });
        }
    }

    // Summary
    const passCount = results.tests.filter(t => t.status === 'PASS').length;
    const failCount = results.tests.filter(t => t.status === 'FAIL').length;
    const warnCount = results.tests.filter(t => t.status === 'WARNING').length;

    results.summary = {
        total: results.tests.length,
        passed: passCount,
        failed: failCount,
        warnings: warnCount,
        overallStatus: failCount > 0 ? 'ISSUES_DETECTED' : warnCount > 0 ? 'WARNINGS' : 'ALL_GOOD'
    };

    console.log('📊 Upload Diagnostics Results:', results);
    return results;
};

export const displayDiagnosticsResults = (results) => {
    let message = `🔍 Upload Diagnostics Results (${results.timestamp})\n\n`;
    
    results.tests.forEach(test => {
        const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
        message += `${icon} ${test.name}: ${test.message}\n`;
        if (test.error) {
            message += `   Error: ${test.error}\n`;
        }
        message += '\n';
    });

    message += `📊 Summary: ${results.summary.passed} passed, ${results.summary.failed} failed, ${results.summary.warnings} warnings\n\n`;

    if (results.summary.overallStatus === 'ISSUES_DETECTED') {
        message += '🚨 Issues detected that may prevent uploads from working properly.\n';
        message += 'Please check your internet connection and Firebase configuration.';
    } else if (results.summary.overallStatus === 'WARNINGS') {
        message += '⚠️ Some warnings detected. Uploads may work but could be slower or unreliable.';
    } else {
        message += '🎉 All systems appear to be working correctly for uploads!';
    }

    return message;
};