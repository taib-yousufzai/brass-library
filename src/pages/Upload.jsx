import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/FirebaseAuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { storage, db } from '../firebase/config';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, onSnapshot, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { categories as localCategories } from '../data/categories';
import { ensureCategoriesExist, syncCategories } from '../utils/populateCategories';
import {
    Upload,
    Image,
    Video,
    X,
    CheckCircle,
    AlertCircle,
    Folder,
    Tag
} from 'lucide-react';
import UploadSuccessModal from '../components/UploadSuccessModal';
import './Upload.css';
import '../utils/checkFirestoreCategories'; // Import diagnostic tools
import { categoryManager } from '../utils/categoryManager'; // Import category manager

const UploadPage = () => {
    const { hasPermission, isAdmin } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [categories, setCategories] = useState(localCategories); // Start with local categories
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    const [mediaType, setMediaType] = useState('image');
    const [files, setFiles] = useState([]);
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState({
        message: '',
        isUploading: false,
        completedCount: 0,
        totalCount: 0,
        currentFile: ''
    });
    const [uploadProgress, setUploadProgress] = useState({});
    const [loadingCategories, setLoadingCategories] = useState(false); // Only true when manually syncing

    // Modal state management for upload success
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [uploadResults, setUploadResults] = useState(null);

    // Enhanced error message handler
    const getErrorMessage = (error) => {
        const errorMessages = {
            'STORAGE_NOT_ENABLED': {
                title: '❌ Firebase Storage Not Enabled',
                message: 'Firebase Storage is not enabled for this project.',
                actions: [
                    '1. Go to Firebase Console',
                    '2. Navigate to Storage',
                    '3. Click "Get Started"',
                    '4. Enable Storage for your project'
                ],
                userAction: 'Contact your administrator to enable Firebase Storage.'
            },
            'PERMISSION_DENIED': {
                title: '🔒 Upload Permission Denied',
                message: 'You do not have permission to upload files.',
                actions: [
                    '1. Check that you are logged in',
                    '2. Verify your account has upload permissions',
                    '3. Try refreshing the page and logging in again'
                ],
                userAction: 'Contact your administrator if you believe you should have upload access.'
            },
            'UPLOAD_CANCELED': {
                title: '⚠️ Upload Canceled',
                message: 'The upload was canceled due to a timeout or user action.',
                actions: [
                    '1. Check your internet connection',
                    '2. Try uploading smaller files',
                    '3. Upload fewer files at once'
                ],
                userAction: 'You can retry the upload when ready.'
            },
            'INVALID_FILE_FORMAT': {
                title: '📄 Invalid File Format',
                message: 'The selected file format is not supported.',
                actions: [
                    '1. For images: Use JPG, PNG, or WEBP format',
                    '2. For videos: Use MP4 or MOV format',
                    '3. Check that the file is not corrupted'
                ],
                userAction: 'Please select a supported file format and try again.'
            },
            'STORAGE_QUOTA_EXCEEDED': {
                title: '💾 Storage Quota Exceeded',
                message: 'The storage quota for this project has been exceeded.',
                actions: [
                    '1. Delete some existing files to free up space',
                    '2. Contact administrator to increase storage quota'
                ],
                userAction: 'Try uploading smaller files or contact your administrator.'
            },
            'USER_NOT_AUTHENTICATED': {
                title: '🔐 Authentication Required',
                message: 'You need to be logged in to upload files.',
                actions: [
                    '1. Click the login button',
                    '2. Sign in with your account',
                    '3. Return to this page to upload'
                ],
                userAction: 'Please log in and try again.'
            },
            'NETWORK_ERROR': {
                title: '🌐 Network Connection Error',
                message: 'There was a problem with your internet connection.',
                actions: [
                    '1. Check your internet connection',
                    '2. Try again in a few moments',
                    '3. If using WiFi, try switching to mobile data or vice versa'
                ],
                userAction: 'Please check your connection and retry the upload.'
            },
            'NETWORK_CONNECTION_ERROR': {
                title: '🌐 Connection Timeout',
                message: 'The upload failed due to a network timeout.',
                actions: [
                    '1. Check your internet connection speed',
                    '2. Try uploading smaller files',
                    '3. Move closer to your WiFi router if using WiFi'
                ],
                userAction: 'Please check your connection and try again with smaller files.'
            },
            'UPLOAD_TIMEOUT': {
                title: '⏱️ Upload Timeout',
                message: 'The upload took longer than 5 minutes and was canceled.',
                actions: [
                    '1. Use smaller files (under 10MB recommended)',
                    '2. Check your internet connection speed',
                    '3. Try uploading fewer files at once',
                    '4. Retry the upload'
                ],
                userAction: 'Try uploading smaller files or check your internet connection.'
            },
            'STORAGE_BUCKET_ERROR': {
                title: '🪣 Storage Configuration Error',
                message: 'There is a problem with the Firebase Storage configuration.',
                actions: [
                    '1. Contact your administrator',
                    '2. Verify Firebase project settings'
                ],
                userAction: 'This is a configuration issue. Please contact support.'
            },
            'FIREBASE_PROJECT_ERROR': {
                title: '🔧 Firebase Project Error',
                message: 'There is a problem with the Firebase project configuration.',
                actions: [
                    '1. Contact your administrator',
                    '2. Verify Firebase project is properly set up'
                ],
                userAction: 'This is a project configuration issue. Please contact support.'
            }
        };

        // Extract error type from error message
        let errorType = 'UNKNOWN_ERROR';
        if (error.message) {
            const match = error.message.match(/^([A-Z_]+):/);
            if (match) {
                errorType = match[1];
            } else if (error.message.includes('Upload timeout')) {
                errorType = 'UPLOAD_TIMEOUT';
            } else {
                // Check for specific error patterns
                Object.keys(errorMessages).forEach(key => {
                    if (error.message.includes(key)) {
                        errorType = key;
                    }
                });
            }
        }

        const errorInfo = errorMessages[errorType] || {
            title: '❌ Upload Error',
            message: error.message || 'An unexpected error occurred during upload.',
            actions: [
                '1. Try uploading the file again',
                '2. Check your internet connection',
                '3. Try with a different file'
            ],
            userAction: 'If the problem persists, please contact support.'
        };

        return errorInfo;
    };

    const showErrorAlert = (error) => {
        const errorInfo = getErrorMessage(error);
        const alertMessage = `${errorInfo.title}\n\n${errorInfo.message}\n\n💡 Try these solutions:\n${errorInfo.actions.join('\n')}\n\n${errorInfo.userAction}`;
        alert(alertMessage);
    };

    // Modal action handlers
    const handleUploadMore = () => {
        // Clean up object URLs to prevent memory leaks
        files.forEach(fileObj => {
            if (fileObj.preview) {
                URL.revokeObjectURL(fileObj.preview);
            }
        });
        
        // Reset form while preserving category, subcategory, and media type selections
        setFiles([]);
        setTags([]);
        setTagInput('');
        setUploading(false);
        setUploadStatus({
            message: '',
            isUploading: false,
            completedCount: 0,
            totalCount: 0,
            currentFile: ''
        });
        setUploadProgress({});
        setShowSuccessModal(false);
        setUploadResults(null);
        
        // Clear file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleViewGallery = () => {
        if (uploadResults && uploadResults.redirectUrl) {
            setShowSuccessModal(false);
            navigate(uploadResults.redirectUrl);
        }
    };

    const handleGoToDashboard = () => {
        setShowSuccessModal(false);
        navigate('/');
    };

    const handleCloseModal = () => {
        setShowSuccessModal(false);
        setUploadResults(null);
    };

    // Function to create upload results data structure
    const createUploadResults = (successCount, totalCount) => {
        const categoryName = currentCategory?.name || selectedCategory;
        const subCategoryName = subCategories.find(sub => sub.id === selectedSubCategory)?.name || selectedSubCategory;
        const redirectUrl = `/category/${selectedCategory}/${selectedSubCategory}/${mediaType}`;
        
        return {
            successCount,
            totalCount,
            categoryName,
            subCategoryName,
            mediaType,
            redirectUrl
        };
    };

    // Handle sync categories function (was missing)
    const handleSyncCategories = async () => {
        setLoadingCategories(true);
        try {
            await syncCategories();
        } catch (error) {
            console.error('Error syncing categories:', error);
        } finally {
            setLoadingCategories(false);
        }
    };

    useEffect(() => {
        const loadCategories = async () => {
            try {
                // Silently sync categories to Firebase in the background
                await syncCategories();
                
                // Listen to Firestore categories
                const unsubscribe = onSnapshot(
                    collection(db, 'categories'),
                    (snapshot) => {
                        if (!snapshot.empty) {
                            const cats = snapshot.docs.map(doc => ({
                                id: doc.id,
                                ...doc.data()
                            }));
                            
                            // Sort categories to match local order
                            const sortedCats = localCategories.map(localCat => 
                                cats.find(cat => cat.id === localCat.id) || localCat
                            );
                            
                            setCategories(sortedCats);
                        }
                        // If empty, keep using local categories (already set in initial state)
                    },
                    (error) => {
                        console.error('Error loading categories from Firestore:', error);
                        // Keep using local categories (already set in initial state)
                    }
                );

                return unsubscribe;
            } catch (error) {
                console.error('Error setting up categories:', error);
                // Keep using local categories (already set in initial state)
            }
        };

        loadCategories();
    }, []);

    // Redirect if not admin
    if (!hasPermission('canUpload')) {
        return <Navigate to="/" replace />;
    }


    const currentCategory = categories.find(c => c.id === selectedCategory);
    // Handle both array structure and potential sub-collection structure (though sticking to array as per current design)
    const subCategories = currentCategory?.subCategories || [];

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files);
        console.log(`🔍 [handleFileSelect] Starting file selection:`, {
            numberOfFilesSelected: selectedFiles.length,
            fileNames: selectedFiles.map(f => f.name),
            timestamp: new Date().toISOString()
        });
        
        const validFiles = [];
        const invalidFiles = [];

        selectedFiles.forEach(file => {
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');
            const maxSize = isVideo ? 500 * 1024 * 1024 : 50 * 1024 * 1024; // 500MB video, 50MB image

            let isValid = true;
            let reason = '';

            if (mediaType === 'image' && !isImage) {
                isValid = false;
                reason = `Expected image file, got ${file.type}`;
            } else if (mediaType === 'video' && !isVideo) {
                isValid = false;
                reason = `Expected video file, got ${file.type}`;
            } else if (file.size > maxSize) {
                isValid = false;
                const maxSizeMB = maxSize / 1024 / 1024;
                const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
                reason = `File too large: ${fileSizeMB}MB (max: ${maxSizeMB}MB)`;
            } else if (file.size === 0) {
                isValid = false;
                reason = 'File is empty';
            }

            if (isValid) {
                validFiles.push(file);
            } else {
                invalidFiles.push({ file, reason });
                console.warn(`❌ Invalid file rejected:`, {
                    fileName: file.name,
                    fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                    fileType: file.type,
                    reason,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Show warning for invalid files
        if (invalidFiles.length > 0) {
            const invalidFilesList = invalidFiles.map(item => `• ${item.file.name}: ${item.reason}`).join('\n');
            alert(`⚠️ Some files were not added:\n\n${invalidFilesList}\n\n💡 Please check file types and sizes:\n• Images: JPG, PNG, WEBP (max 50MB)\n• Videos: MP4, MOV (max 500MB)`);
        }

        // Defensive check: only update state if we have valid files to add
        if (validFiles.length > 0) {
            console.log(`📁 Adding ${validFiles.length} valid files:`, {
                files: validFiles.map(f => ({
                    name: f.name,
                    size: `${(f.size / 1024 / 1024).toFixed(2)} MB`,
                    type: f.type
                })),
                timestamp: new Date().toISOString()
            });

            setFiles(prev => {
                // Ensure proper spread operator usage to add all files to the array
                const newFiles = [...prev, ...validFiles.map(file => ({
                    file,
                    preview: URL.createObjectURL(file),
                    status: 'pending'
                }))];
                
                console.log(`📊 [handleFileSelect] State update - files array:`, {
                    previousLength: prev.length,
                    newLength: newFiles.length,
                    addedFiles: validFiles.length,
                    expectedNewLength: prev.length + validFiles.length,
                    allFilesAdded: newFiles.length === prev.length + validFiles.length,
                    timestamp: new Date().toISOString()
                });
                
                // Verify all files were added correctly
                if (newFiles.length !== prev.length + validFiles.length) {
                    console.error(`⚠️ [handleFileSelect] File array length mismatch!`, {
                        expected: prev.length + validFiles.length,
                        actual: newFiles.length,
                        difference: (prev.length + validFiles.length) - newFiles.length
                    });
                }
                
                return newFiles;
            });
        } else {
            console.log(`ℹ️ [handleFileSelect] No valid files to add (validFiles array is empty)`, {
                selectedFilesCount: selectedFiles.length,
                invalidFilesCount: invalidFiles.length,
                timestamp: new Date().toISOString()
            });
        }
    };

    const removeFile = (index) => {
        setFiles(prev => {
            const newFiles = [...prev];
            URL.revokeObjectURL(newFiles[index].preview);
            newFiles.splice(index, 1);
            return newFiles;
        });

        // Clear progress for this file and reindex remaining entries
        setUploadProgress(prev => {
            const newProgress = {};
            Object.keys(prev).forEach(key => {
                const oldIndex = parseInt(key);
                if (oldIndex < index) {
                    // Keep entries before the removed index
                    newProgress[oldIndex] = prev[key];
                } else if (oldIndex > index) {
                    // Shift entries after the removed index down by 1
                    newProgress[oldIndex - 1] = prev[key];
                }
                // Skip the entry at the removed index
            });
            return newProgress;
        });
    };

    const addTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
            setTags(prev => [...prev, tagInput.trim().toLowerCase()]);
            setTagInput('');
        }
    };

    const removeTag = (tag) => {
        setTags(prev => prev.filter(t => t !== tag));
    };

    const handleUpload = async () => {
        if (!selectedCategory || !selectedSubCategory || files.length === 0) {
            alert('Please select category, sub-category, and add files');
            return;
        }

        const uploadStartTime = Date.now();
        console.log(`🚀 Starting upload batch at ${new Date().toISOString()}`);
        console.log(`📊 Upload details:`, {
            totalFiles: files.length,
            mediaType,
            category: currentCategory?.name || selectedCategory,
            subCategory: subCategories.find(sub => sub.id === selectedSubCategory)?.name || selectedSubCategory,
            tags: tags.length > 0 ? tags : 'none'
        });
        console.log(`📋 [handleUpload] File array BEFORE loop:`, {
            fileArrayLength: files.length,
            fileNames: files.map(f => f.file.name),
            fileStatuses: files.map(f => f.status),
            timestamp: new Date().toISOString()
        });

        setUploading(true);
        setUploadStatus({
            message: 'Starting upload...',
            isUploading: true,
            completedCount: 0,
            totalCount: files.length,
            currentFile: ''
        });

        // Reset all upload progress at the start of a new upload batch
        setUploadProgress({});

        // Track how many items added to this subcategory
        let newItemsCount = 0;
        let failedUploads = 0;

        try {
            // Process each file independently
            for (let i = 0; i < files.length; i++) {
                console.log(`🔄 [handleUpload] Loop iteration ${i + 1}/${files.length}:`, {
                    currentIndex: i,
                    totalFiles: files.length,
                    fileName: files[i]?.file?.name || 'undefined',
                    fileStatus: files[i]?.status || 'undefined',
                    timestamp: new Date().toISOString()
                });
                
                // Defensive check: ensure file exists at this index
                if (!files[i]) {
                    console.error(`❌ [handleUpload] File at index ${i} is undefined!`, {
                        fileIndex: i,
                        totalFiles: files.length,
                        timestamp: new Date().toISOString()
                    });
                    failedUploads++;
                    continue; // Skip to next file
                }
                
                const fileObj = files[i];
                
                // Defensive check: ensure file object has required properties
                if (!fileObj.file) {
                    console.error(`❌ [handleUpload] File object at index ${i} is missing 'file' property!`, {
                        fileIndex: i,
                        fileObj: fileObj,
                        timestamp: new Date().toISOString()
                    });
                    failedUploads++;
                    continue; // Skip to next file
                }
                
                if (fileObj.status === 'complete') continue;

                try {
                    const fileStartTime = Date.now();
                    console.log(`📁 Processing file ${i + 1}/${files.length}:`, {
                        fileName: fileObj.file.name,
                        fileSize: `${(fileObj.file.size / 1024 / 1024).toFixed(2)} MB`,
                        fileType: fileObj.file.type,
                        startTime: new Date(fileStartTime).toISOString()
                    });

                    // Update status with current file being processed
                    setUploadStatus(prev => {
                        const newStatus = {
                            ...prev,
                            message: `Uploading file ${i + 1} of ${files.length}`,
                            currentFile: fileObj.file.name,
                            completedCount: i
                        };
                        console.log(`📊 [setUploadStatus] Status update:`, {
                            fileIndex: i,
                            fileName: fileObj.file.name,
                            message: newStatus.message,
                            completedCount: newStatus.completedCount,
                            totalCount: files.length,
                            timestamp: new Date().toISOString()
                        });
                        return newStatus;
                    });

                    // Create storage reference following the Firebase Storage structure:
                    // interior-library/category/sub-category/image or video/file
                    const timestamp = Date.now();
                    const categoryName = currentCategory?.name || selectedCategory;
                    const subCategoryName = subCategories.find(sub => sub.id === selectedSubCategory)?.name || selectedSubCategory;
                    const mediaFolder = mediaType === 'image' ? 'image' : 'video';
                    const storagePath = `interior-library/${categoryName}/${subCategoryName}/${mediaFolder}/${timestamp}_${fileObj.file.name}`;
                    
                    // Log storage path generation for verification (Requirements 2.1, 2.2)
                    console.log(`📂 [Storage Path] Generated for file ${i + 1}:`, {
                        fileIndex: i,
                        fileName: fileObj.file.name,
                        timestamp: timestamp,
                        timestampISO: new Date(timestamp).toISOString(),
                        category: categoryName,
                        subCategory: subCategoryName,
                        mediaType: mediaFolder,
                        fullPath: storagePath,
                        pathPattern: 'interior-library/{category}/{subcategory}/{mediaType}/{timestamp}_{filename}',
                        pathValid: storagePath.startsWith('interior-library/') && storagePath.includes(categoryName) && storagePath.includes(subCategoryName) && storagePath.includes(mediaFolder),
                        timestampUnique: true, // Each file gets its own timestamp from Date.now()
                        generationTime: new Date().toISOString()
                    });
                    
                    const storageRef = ref(storage, storagePath);

                    // Upload task with timeout
                    const uploadTask = uploadBytesResumable(storageRef, fileObj.file);

                    await new Promise((resolve, reject) => {
                        let timeoutId = null;
                        let uploadTaskUnsubscribe = null;

                        // Set a timeout for the upload (5 minutes)
                        timeoutId = setTimeout(() => {
                            const timeoutTime = Date.now();
                            const uploadDuration = ((timeoutTime - fileStartTime) / 1000).toFixed(2);

                            console.error(`⏱️ Upload timeout for file ${i + 1} (${fileObj.file.name}):`, {
                                timeoutDuration: '300s (5 minutes)',
                                actualDuration: `${uploadDuration}s`,
                                fileSize: `${(fileObj.file.size / 1024 / 1024).toFixed(2)} MB`,
                                timeoutTime: new Date(timeoutTime).toISOString()
                            });

                            // Cancel the upload task if it's still running
                            if (uploadTaskUnsubscribe) {
                                uploadTaskUnsubscribe();
                            }

                            // Try to cancel the upload task
                            try {
                                uploadTask.cancel();
                                console.log(`🚫 Upload task canceled for file ${i + 1} due to timeout`);
                            } catch (cancelError) {
                                console.warn(`⚠️ Could not cancel upload task for file ${i + 1}:`, cancelError.message);
                            }

                            reject(new Error('UPLOAD_TIMEOUT'));
                        }, 5 * 60 * 1000); // 5 minutes

                        uploadTaskUnsubscribe = uploadTask.on(
                            'state_changed',
                            (snapshot) => {
                                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                                const bytesTransferred = (snapshot.bytesTransferred / 1024 / 1024).toFixed(2);
                                const totalBytes = (snapshot.totalBytes / 1024 / 1024).toFixed(2);

                                console.log(`📈 Upload progress for file ${i + 1} (${fileObj.file.name}):`, {
                                    progress: `${progress.toFixed(1)}%`,
                                    transferred: `${bytesTransferred} MB`,
                                    total: `${totalBytes} MB`,
                                    state: snapshot.state,
                                    timestamp: new Date().toISOString()
                                });

                                setUploadProgress(prev => {
                                    const newProgress = { ...prev, [i]: progress };
                                    console.log(`📊 [setUploadProgress] Progress update for file ${i + 1}:`, {
                                        fileIndex: i,
                                        fileName: fileObj.file.name,
                                        progress: `${progress.toFixed(1)}%`,
                                        totalProgressEntries: Object.keys(newProgress).length,
                                        timestamp: new Date().toISOString()
                                    });
                                    return newProgress;
                                });
                            },
                            (error) => {
                                // Clear timeout on error
                                if (timeoutId) {
                                    clearTimeout(timeoutId);
                                    timeoutId = null;
                                }

                                const errorTime = Date.now();
                                const uploadDuration = ((errorTime - fileStartTime) / 1000).toFixed(2);

                                console.error(`❌ Upload error for file ${i + 1} (${fileObj.file.name}):`, {
                                    error: error.message,
                                    errorCode: error.code,
                                    uploadDuration: `${uploadDuration}s`,
                                    errorTime: new Date(errorTime).toISOString(),
                                    fileSize: `${(fileObj.file.size / 1024 / 1024).toFixed(2)} MB`
                                });

                                // Check for specific Firebase Storage errors
                                if (error.code === 'storage/unknown') {
                                    reject(new Error('STORAGE_NOT_ENABLED'));
                                } else if (error.code === 'storage/unauthorized') {
                                    reject(new Error('PERMISSION_DENIED'));
                                } else if (error.code === 'storage/canceled') {
                                    reject(new Error('UPLOAD_CANCELED'));
                                } else if (error.code === 'storage/invalid-format') {
                                    reject(new Error('INVALID_FILE_FORMAT'));
                                } else if (error.code === 'storage/invalid-argument') {
                                    reject(new Error('INVALID_FILE_ARGUMENT'));
                                } else if (error.code === 'storage/object-not-found') {
                                    reject(new Error('STORAGE_PATH_ERROR'));
                                } else if (error.code === 'storage/bucket-not-found') {
                                    reject(new Error('STORAGE_BUCKET_ERROR'));
                                } else if (error.code === 'storage/project-not-found') {
                                    reject(new Error('FIREBASE_PROJECT_ERROR'));
                                } else if (error.code === 'storage/quota-exceeded') {
                                    reject(new Error('STORAGE_QUOTA_EXCEEDED'));
                                } else if (error.code === 'storage/unauthenticated') {
                                    reject(new Error('USER_NOT_AUTHENTICATED'));
                                } else if (error.code === 'storage/retry-limit-exceeded') {
                                    reject(new Error('NETWORK_ERROR'));
                                } else if (error.message && error.message.includes('network')) {
                                    reject(new Error('NETWORK_CONNECTION_ERROR'));
                                } else if (error.message && error.message.includes('timeout')) {
                                    reject(new Error('UPLOAD_TIMEOUT'));
                                } else {
                                    reject(new Error(`UPLOAD_ERROR: ${error.message}`));
                                }
                            },
                            async () => {
                                // Clear timeout on successful completion
                                if (timeoutId) {
                                    clearTimeout(timeoutId);
                                    timeoutId = null;
                                }

                                const completionTime = Date.now();
                                const uploadDuration = ((completionTime - fileStartTime) / 1000).toFixed(2);

                                // Upload completed successfully
                                console.log(`✅ Upload completed for file ${i + 1} (${fileObj.file.name}):`, {
                                    uploadDuration: `${uploadDuration}s`,
                                    fileSize: `${(fileObj.file.size / 1024 / 1024).toFixed(2)} MB`,
                                    completionTime: new Date(completionTime).toISOString(),
                                    uploadSpeed: `${((fileObj.file.size / 1024 / 1024) / (uploadDuration || 1)).toFixed(2)} MB/s`
                                });

                                try {
                                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                                    console.log(`🔗 Download URL obtained for file ${i + 1}:`, {
                                        fileName: fileObj.file.name,
                                        url: downloadURL.substring(0, 100) + '...',
                                        timestamp: new Date().toISOString()
                                    });

                                    // Save metadata to Firestore (Requirements 3.1, 3.2, 3.3, 3.4)
                                    const firestoreStartTime = Date.now();
                                    console.log(`💾 [Firestore] Starting metadata save for file ${i + 1}:`, {
                                        fileIndex: i,
                                        fileName: fileObj.file.name,
                                        collection: 'media',
                                        metadata: {
                                            name: fileObj.file.name,
                                            url: downloadURL.substring(0, 100) + '...',
                                            type: mediaType,
                                            categoryId: selectedCategory,
                                            subCategoryId: selectedSubCategory,
                                            tags: tags,
                                            size: fileObj.file.size,
                                            contentType: fileObj.file.type
                                        },
                                        timestamp: new Date().toISOString()
                                    });
                                    
                                    // Call addDoc to create Firestore document (Requirement 3.1)
                                    const docRef = await addDoc(collection(db, 'media'), {
                                        name: fileObj.file.name,
                                        url: downloadURL,
                                        type: mediaType,
                                        categoryId: selectedCategory,
                                        subCategoryId: selectedSubCategory,
                                        tags: tags,
                                        createdAt: serverTimestamp(),
                                        size: fileObj.file.size,
                                        contentType: fileObj.file.type
                                    });

                                    const firestoreDuration = ((Date.now() - firestoreStartTime) / 1000).toFixed(2);
                                    
                                    // Log successful Firestore document creation (Requirements 3.1, 3.2, 3.3, 3.4)
                                    console.log(`✅ [Firestore] Metadata document created successfully for file ${i + 1}:`, {
                                        fileIndex: i,
                                        fileName: fileObj.file.name,
                                        documentId: docRef.id,
                                        collection: 'media',
                                        firestoreDuration: `${firestoreDuration}s`,
                                        allRequiredFieldsIncluded: true,
                                        fields: {
                                            name: '✓',
                                            url: '✓',
                                            type: '✓',
                                            categoryId: '✓',
                                            subCategoryId: '✓',
                                            tags: '✓',
                                            createdAt: '✓ (serverTimestamp)',
                                            size: '✓',
                                            contentType: '✓'
                                        },
                                        timestamp: new Date().toISOString()
                                    });

                                    newItemsCount++;

                                    // Update file status to 'complete' ONLY after Firestore save succeeds (Requirement 3.4)
                                    console.log(`🔄 [Status Update] Updating file status to 'complete' for file ${i + 1}:`, {
                                        fileIndex: i,
                                        fileName: fileObj.file.name,
                                        reason: 'Firestore metadata saved successfully',
                                        previousStatus: 'uploading',
                                        newStatus: 'complete',
                                        timestamp: new Date().toISOString()
                                    });
                                    
                                    setFiles(prev => {
                                        // Defensive check: ensure index is within bounds
                                        if (i < 0 || i >= prev.length) {
                                            console.error(`❌ [setFiles] Index out of bounds!`, {
                                                fileIndex: i,
                                                arrayLength: prev.length,
                                                timestamp: new Date().toISOString()
                                            });
                                            return prev; // Return unchanged if index is invalid
                                        }
                                        
                                        // Immutable update pattern: create new array and update specific index
                                        const newFiles = [...prev];
                                        newFiles[i] = {
                                            ...newFiles[i],
                                            status: 'complete'
                                        };
                                        
                                        console.log(`✅ [setFiles] Marking file ${i + 1} as complete:`, {
                                            fileIndex: i,
                                            fileName: newFiles[i].file.name,
                                            previousStatus: prev[i].status,
                                            newStatus: 'complete',
                                            totalFilesInArray: newFiles.length,
                                            arrayLengthPreserved: newFiles.length === prev.length,
                                            timestamp: new Date().toISOString()
                                        });
                                        
                                        return newFiles;
                                    });

                                    // Update completed count
                                    setUploadStatus(prev => {
                                        const newStatus = {
                                            ...prev,
                                            completedCount: prev.completedCount + 1
                                        };
                                        console.log(`📊 [setUploadStatus] Completed count update:`, {
                                            fileIndex: i,
                                            fileName: fileObj.file.name,
                                            previousCompletedCount: prev.completedCount,
                                            newCompletedCount: newStatus.completedCount,
                                            totalCount: files.length,
                                            timestamp: new Date().toISOString()
                                        });
                                        return newStatus;
                                    });

                                    resolve();
                                } catch (err) {
                                    console.error(`💾 Firestore error for file ${i + 1} (${fileObj.file.name}):`, {
                                        error: err.message,
                                        errorCode: err.code,
                                        timestamp: new Date().toISOString()
                                    });
                                    reject(err);
                                }
                            }
                        );
                    });

                    // Log successful completion of this file (Requirement 2.5)
                    console.log(`✅ File ${i + 1} of ${files.length} processed successfully:`, {
                        fileIndex: i,
                        fileName: fileObj.file.name,
                        fileSize: `${(fileObj.file.size / 1024 / 1024).toFixed(2)} MB`,
                        successfulUploadsCount: newItemsCount,
                        failedUploadsCount: failedUploads,
                        remainingFiles: files.length - (i + 1),
                        timestamp: new Date().toISOString()
                    });

                } catch (error) {
                    // Increment failed uploads counter (Requirement 2.5)
                    failedUploads++;
                    
                    // Log detailed error information for this specific file
                    console.error(`💥 Failed to upload file ${i + 1} of ${files.length} (${fileObj.file.name}):`, {
                        fileIndex: i,
                        fileName: fileObj.file.name,
                        fileSize: `${(fileObj.file.size / 1024 / 1024).toFixed(2)} MB`,
                        error: error.message,
                        errorCode: error.code || 'N/A',
                        errorStack: error.stack,
                        failedUploadsCount: failedUploads,
                        successfulUploadsCount: newItemsCount,
                        remainingFiles: files.length - (i + 1),
                        timestamp: new Date().toISOString()
                    });

                    // Mark file as failed but continue with next file (Requirement 2.5)
                    setFiles(prev => {
                        // Defensive check: ensure index is within bounds
                        if (i < 0 || i >= prev.length) {
                            console.error(`❌ [setFiles] Index out of bounds during error handling!`, {
                                fileIndex: i,
                                arrayLength: prev.length,
                                timestamp: new Date().toISOString()
                            });
                            return prev; // Return unchanged if index is invalid
                        }
                        
                        // Immutable update pattern: create new array and update specific index
                        const newFiles = [...prev];
                        newFiles[i] = {
                            ...newFiles[i],
                            status: 'error'
                        };
                        
                        console.log(`❌ [setFiles] Marking file ${i + 1} as error:`, {
                            fileIndex: i,
                            fileName: newFiles[i].file.name,
                            previousStatus: prev[i].status,
                            newStatus: 'error',
                            totalFilesInArray: newFiles.length,
                            arrayLengthPreserved: newFiles.length === prev.length,
                            timestamp: new Date().toISOString()
                        });
                        
                        return newFiles;
                    });

                    // Log continuation message - loop will continue to next file (Requirement 2.5)
                    console.log(`⚠️ Error handled for file ${i + 1}. Continuing with remaining files...`, {
                        failedSoFar: failedUploads,
                        successfulSoFar: newItemsCount,
                        remainingFiles: files.length - (i + 1),
                        nextFileIndex: i + 1,
                        willContinue: (i + 1) < files.length,
                        timestamp: new Date().toISOString()
                    });
                    
                    // Explicitly continue to next iteration (Requirement 2.5)
                    // Note: continue statement ensures loop proceeds to next file
                    continue;
                }
            }

            // Log comprehensive summary after loop completion (Requirement 2.5)
            console.log(`📋 [handleUpload] Upload loop completed:`, {
                totalFilesProcessed: files.length,
                successfulUploads: newItemsCount,
                failedUploads: failedUploads,
                successRate: `${((newItemsCount / files.length) * 100).toFixed(1)}%`,
                fileArrayLength: files.length,
                fileNames: files.map(f => f.file.name),
                fileStatuses: files.map(f => f.status),
                timestamp: new Date().toISOString()
            });

            console.log(`📋 [handleUpload] File array AFTER loop:`, {
                fileArrayLength: files.length,
                fileNames: files.map(f => f.file.name),
                fileStatuses: files.map(f => f.status),
                successfulUploads: newItemsCount,
                failedUploads: failedUploads,
                timestamp: new Date().toISOString()
            });

            // Update Counts in Category Document
            if (newItemsCount > 0) {
                console.log(`📊 Updating category counts:`, {
                    categoryId: selectedCategory,
                    subCategoryId: selectedSubCategory,
                    newItemsCount,
                    mediaType,
                    timestamp: new Date().toISOString()
                });

                // IMMEDIATE LOCAL UPDATE - Update categoryManager first for instant UI update
                try {
                    const localCategory = categoryManager.getCategoryById(selectedCategory);
                    if (localCategory) {
                        const updatedSubCats = localCategory.subCategories.map(sub => {
                            if (sub.id === selectedSubCategory) {
                                const newImageCount = (sub.imageCount || 0) + (mediaType === 'image' ? newItemsCount : 0);
                                const newVideoCount = (sub.videoCount || 0) + (mediaType === 'video' ? newItemsCount : 0);
                                console.log(`📊 [Local Update] Updating local category manager:`, {
                                    subCategoryId: sub.id,
                                    subCategoryName: sub.name,
                                    oldImageCount: sub.imageCount || 0,
                                    newImageCount,
                                    oldVideoCount: sub.videoCount || 0,
                                    newVideoCount,
                                    timestamp: new Date().toISOString()
                                });
                                return {
                                    ...sub,
                                    imageCount: newImageCount,
                                    videoCount: newVideoCount
                                };
                            }
                            return sub;
                        });
                        
                        // Update local category manager immediately
                        await categoryManager.updateCategory(selectedCategory, {
                            subCategories: updatedSubCats
                        });
                        
                        console.log(`✅ [Local Update] Category manager updated successfully - UI should reflect changes immediately`);
                    }
                } catch (localUpdateError) {
                    console.error(`❌ [Local Update] Failed to update local category manager:`, localUpdateError);
                }

                setUploadStatus(prev => ({
                    ...prev,
                    message: 'Updating category counts...',
                    currentFile: ''
                }));

                try {
                    const categoryUpdateStartTime = Date.now();
                    const categoryRef = doc(db, 'categories', selectedCategory);
                    
                    console.log(`🔍 [Category Update] Fetching category document from Firestore...`, {
                        categoryId: selectedCategory,
                        timestamp: new Date().toISOString()
                    });
                    
                    const categoryDoc = await getDoc(categoryRef);

                    if (categoryDoc.exists()) {
                    const catData = categoryDoc.data();
                    
                    console.log(`📊 [Category Update] Current category data from Firestore:`, {
                        categoryId: selectedCategory,
                        subCategoryId: selectedSubCategory,
                        currentSubCategories: catData.subCategories?.map(sub => ({
                            id: sub.id,
                            name: sub.name,
                            imageCount: sub.imageCount,
                            videoCount: sub.videoCount
                        })),
                        timestamp: new Date().toISOString()
                    });
                    
                    const updatedSubCats = catData.subCategories.map(sub => {
                        if (sub.id === selectedSubCategory) {
                            const oldImageCount = sub.imageCount || 0;
                            const oldVideoCount = sub.videoCount || 0;
                            const newImageCount = oldImageCount + (mediaType === 'image' ? newItemsCount : 0);
                            const newVideoCount = oldVideoCount + (mediaType === 'video' ? newItemsCount : 0);
                            
                            console.log(`📊 [Category Update] Updating subcategory "${sub.name}":`, {
                                subCategoryId: sub.id,
                                mediaType,
                                newItemsCount,
                                oldImageCount,
                                newImageCount,
                                imageCountChange: newImageCount - oldImageCount,
                                oldVideoCount,
                                newVideoCount,
                                videoCountChange: newVideoCount - oldVideoCount,
                                timestamp: new Date().toISOString()
                            });
                            
                            return {
                                ...sub,
                                imageCount: newImageCount,
                                videoCount: newVideoCount
                            };
                        }
                        return sub;
                    });

                    console.log(`📊 [Category Update] Updated subcategories:`, {
                        categoryId: selectedCategory,
                        updatedSubCategories: updatedSubCats.map(sub => ({
                            id: sub.id,
                            name: sub.name,
                            imageCount: sub.imageCount,
                            videoCount: sub.videoCount
                        })),
                        timestamp: new Date().toISOString()
                    });

                    await updateDoc(categoryRef, {
                        subCategories: updatedSubCats
                    });

                    const categoryUpdateDuration = ((Date.now() - categoryUpdateStartTime) / 1000).toFixed(2);
                    console.log(`✅ [Category Update] Category counts updated successfully in Firestore:`, {
                        categoryId: selectedCategory,
                        subCategoryId: selectedSubCategory,
                        updateDuration: `${categoryUpdateDuration}s`,
                        timestamp: new Date().toISOString()
                    });
                    } else {
                    console.warn(`⚠️ [Category Update] Category document not found in Firestore, creating it...`, {
                        categoryId: selectedCategory,
                        categoryName: currentCategory?.name,
                        timestamp: new Date().toISOString()
                    });

                    // Create the category document if it doesn't exist
                    // Use the current category data from local state (which might be from local file)
                    if (currentCategory) {
                        console.log(`📊 [Category Update] Current local category data:`, {
                            categoryId: selectedCategory,
                            categoryName: currentCategory.name,
                            subCategories: currentCategory.subCategories.map(sub => ({
                                id: sub.id,
                                name: sub.name,
                                imageCount: sub.imageCount || 0,
                                videoCount: sub.videoCount || 0
                            })),
                            timestamp: new Date().toISOString()
                        });
                        
                        const updatedSubCats = currentCategory.subCategories.map(sub => {
                            if (sub.id === selectedSubCategory) {
                                const oldImageCount = sub.imageCount || 0;
                                const oldVideoCount = sub.videoCount || 0;
                                const newImageCount = oldImageCount + (mediaType === 'image' ? newItemsCount : 0);
                                const newVideoCount = oldVideoCount + (mediaType === 'video' ? newItemsCount : 0);
                                
                                console.log(`📊 [Category Update] Creating subcategory with counts:`, {
                                    subCategoryId: sub.id,
                                    subCategoryName: sub.name,
                                    mediaType,
                                    newItemsCount,
                                    oldImageCount,
                                    newImageCount,
                                    oldVideoCount,
                                    newVideoCount,
                                    timestamp: new Date().toISOString()
                                });
                                
                                return {
                                    ...sub,
                                    imageCount: newImageCount,
                                    videoCount: newVideoCount
                                };
                            }
                            return sub;
                        });

                        console.log(`📊 [Category Update] Creating Firestore document with data:`, {
                            categoryId: selectedCategory,
                            updatedSubCategories: updatedSubCats.map(sub => ({
                                id: sub.id,
                                name: sub.name,
                                imageCount: sub.imageCount,
                                videoCount: sub.videoCount
                            })),
                            timestamp: new Date().toISOString()
                        });

                        await setDoc(categoryRef, {
                            ...currentCategory,
                            subCategories: updatedSubCats
                        });
                        
                        console.log(`✅ [Category Update] Category document created and counts updated in Firestore:`, {
                            categoryId: selectedCategory,
                            categoryName: currentCategory.name,
                            timestamp: new Date().toISOString()
                        });
                    } else {
                        console.error(`❌ [Category Update] Could not find local category data to create document:`, {
                            categoryId: selectedCategory,
                            timestamp: new Date().toISOString()
                        });
                    }
                    }
                } catch (categoryUpdateError) {
                    console.error(`❌ [Category Update] Failed to update category counts:`, {
                        categoryId: selectedCategory,
                        subCategoryId: selectedSubCategory,
                        error: categoryUpdateError.message,
                        errorCode: categoryUpdateError.code,
                        timestamp: new Date().toISOString()
                    });
                    // Don't throw - we still want to show success for uploaded files
                    console.warn(`⚠️ [Category Update] Continuing despite category update failure - files were uploaded successfully`);
                }
            }

            const totalUploadDuration = ((Date.now() - uploadStartTime) / 1000).toFixed(2);
            console.log(`🎉 Upload batch completed successfully:`, {
                totalFiles: files.length,
                successfulUploads: newItemsCount,
                totalDuration: `${totalUploadDuration}s`,
                averageTimePerFile: `${(totalUploadDuration / files.length).toFixed(2)}s`,
                completionTime: new Date().toISOString()
            });

            // Set success status
            setUploadStatus({
                message: `Upload complete! Successfully uploaded ${newItemsCount} file${newItemsCount !== 1 ? 's' : ''}`,
                isUploading: false,
                completedCount: files.length,
                totalCount: files.length,
                currentFile: ''
            });

            // Create upload results and show modal instead of alert
            const results = createUploadResults(newItemsCount, files.length);
            setUploadResults(results);
            setShowSuccessModal(true);

            // Clear all upload progress after successful completion
            setUploadProgress({});

        } catch (error) {
            const totalUploadDuration = ((Date.now() - uploadStartTime) / 1000).toFixed(2);
            console.error(`💥 Upload batch failed:`, {
                error: error.message,
                errorCode: error.code,
                totalDuration: `${totalUploadDuration}s`,
                completedFiles: files.filter(f => f.status === 'complete').length,
                totalFiles: files.length,
                failureTime: new Date().toISOString()
            });

            // Reset upload progress for failed uploads
            setUploadProgress(prev => {
                const newProgress = {};
                // Keep progress only for completed files
                files.forEach((file, index) => {
                    if (file.status === 'complete') {
                        newProgress[index] = 100;
                    }
                });
                return newProgress;
            });

            // Update status with error information
            setUploadStatus({
                message: `Upload failed: ${getErrorMessage(error).message}`,
                isUploading: false,
                completedCount: files.filter(f => f.status === 'complete').length,
                totalCount: files.length,
                currentFile: ''
            });

            // Show enhanced error message to user
            showErrorAlert(error);

            // Handle specific error types for state management
            if (error.message && (error.message.includes('UPLOAD_TIMEOUT') || error.message.includes('UPLOAD_CANCELED'))) {
                // Reset upload state for timeout/canceled uploads
                setFiles(prev => prev.map(file => ({
                    ...file,
                    status: file.status === 'complete' ? 'complete' : 'pending'
                })));
            }
        } finally {
            setUploading(false);

            // Clear status message after a delay if upload completed successfully
            setTimeout(() => {
                setUploadStatus(prev => ({
                    ...prev,
                    message: '',
                    currentFile: ''
                }));
            }, 3000);

            // Reset progress after upload completion or failure
            // Keep progress only for files that are still in progress or completed
            setUploadProgress(prev => {
                const newProgress = {};
                files.forEach((file, index) => {
                    // Only keep progress for completed files, clear everything else
                    if (file.status === 'complete') {
                        newProgress[index] = 100;
                    }
                });
                return newProgress;
            });
        }
    };

    return (
        <div className="upload-page">
            {/* Upload Success Modal */}
            <UploadSuccessModal
                isOpen={showSuccessModal}
                uploadResults={uploadResults}
                onUploadMore={handleUploadMore}
                onViewGallery={handleViewGallery}
                onGoToDashboard={handleGoToDashboard}
                onClose={handleCloseModal}
            />
            
            <div className="page-header">
                <h1>Upload Media</h1>
                <p>Add new images and videos to your design library</p>
            </div>

            <div className="upload-container">
                {/* Left Side - Upload Form */}
                <div className="upload-form">
                    {/* Media Type Selection */}
                    <div className="form-section">
                        <label className="form-label">Media Type</label>
                        <div className="media-type-selector">
                            <button
                                className={`type-btn ${mediaType === 'image' ? 'active' : ''}`}
                                onClick={() => setMediaType('image')}
                            >
                                <Image size={20} />
                                <span>Images</span>
                            </button>
                            <button
                                className={`type-btn ${mediaType === 'video' ? 'active' : ''}`}
                                onClick={() => setMediaType('video')}
                            >
                                <Video size={20} />
                                <span>Videos</span>
                            </button>
                        </div>
                    </div>

                    {/* Category Selection */}
                    <div className="form-section">
                        <label className="form-label">
                            <Folder size={16} />
                            Category
                        </label>

                        {/* Debug info */}
                        {categories.length === 0 && (
                            <div style={{ color: '#f59e0b', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                No categories found.
                                <button
                                    onClick={handleSyncCategories}
                                    disabled={loadingCategories}
                                    style={{ marginLeft: '0.5rem', color: '#2563eb', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                    {loadingCategories ? 'Syncing...' : 'Sync categories to Firebase'}
                                </button>
                            </div>
                        )}

                        <select
                            className="form-select"
                            value={selectedCategory}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                setSelectedSubCategory('');
                            }}
                        >
                            <option value="">
                                {categories.length === 0 ? 'No categories available' : 'Select a category'}
                            </option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.emoji || '📁'} {cat.name}
                                </option>
                            ))}
                        </select>

                        {/* Category count info */}
                        <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                            {categories.length} categories loaded
                        </div>
                    </div>

                    {/* Sub-Category Selection */}
                    <div className="form-section">
                        <label className="form-label">
                            <Folder size={16} />
                            Sub-Category
                        </label>
                        <select
                            className="form-select"
                            value={selectedSubCategory}
                            onChange={(e) => setSelectedSubCategory(e.target.value)}
                            disabled={!selectedCategory}
                        >
                            <option value="">Select a sub-category</option>
                            {subCategories.map(sub => (
                                <option key={sub.id} value={sub.id}>
                                    {sub.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Tags */}
                    <div className="form-section">
                        <label className="form-label">
                            <Tag size={16} />
                            Tags
                        </label>
                        <div className="tag-input-container">
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Add a tag..."
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                            />
                            <button className="btn btn-secondary" onClick={addTag}>Add</button>
                        </div>
                        {tags.length > 0 && (
                            <div className="tags-list">
                                {tags.map(tag => (
                                    <span key={tag} className="tag-chip">
                                        #{tag}
                                        <button onClick={() => removeTag(tag)}>
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Upload Button */}
                    <button
                        className="btn btn-primary upload-submit"
                        onClick={handleUpload}
                        disabled={uploading || files.length === 0 || !selectedCategory || !selectedSubCategory}
                    >
                        <Upload size={18} />
                        {uploading ? 'Uploading...' : `Upload ${files.length} file${files.length !== 1 ? 's' : ''}`}
                    </button>

                    {/* Upload Status */}
                    {uploadStatus.message && (
                        <div className={`upload-status ${uploadStatus.isUploading ? 'uploading' :
                            uploadStatus.message.includes('failed') || uploadStatus.message.includes('Upload failed') ? 'error' :
                                uploadStatus.message.includes('complete') ? 'success' : 'uploading'
                            }`}>
                            <div className="upload-status-message">
                                {uploadStatus.message}
                            </div>

                            {uploadStatus.currentFile && (
                                <div className="upload-status-details">
                                    📁 {uploadStatus.currentFile}
                                </div>
                            )}

                            {uploadStatus.isUploading && uploadStatus.totalCount > 0 && (
                                <div className="upload-status-progress">
                                    <span className="upload-status-count">
                                        {uploadStatus.completedCount}
                                    </span>
                                    <div className="upload-status-progress-bar">
                                        <div
                                            className="upload-status-progress-fill"
                                            style={{
                                                width: `${(uploadStatus.completedCount / uploadStatus.totalCount) * 100}%`
                                            }}
                                        />
                                    </div>
                                    <span className="upload-status-count">
                                        {uploadStatus.totalCount}
                                    </span>
                                </div>
                            )}

                            {!uploadStatus.isUploading && uploadStatus.completedCount > 0 && uploadStatus.totalCount > 0 && (
                                <div className="upload-status-details">
                                    ✅ {uploadStatus.completedCount} of {uploadStatus.totalCount} files processed
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Side - File Drop Zone */}
                <div className="upload-dropzone-container">
                    <div
                        className="upload-dropzone"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            const droppedFiles = Array.from(e.dataTransfer.files);
                            handleFileSelect({ target: { files: droppedFiles } });
                        }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept={mediaType === 'image' ? 'image/*' : 'video/*'}
                            onChange={handleFileSelect}
                            hidden
                        />
                        <div className="dropzone-content">
                            <Upload size={48} />
                            <h3>Drop files here</h3>
                            <p>or click to browse</p>
                            <span className="file-types">
                                {mediaType === 'image' ? 'JPG, PNG, WEBP up to 50MB' : 'MP4, MOV up to 500MB'}
                            </span>
                        </div>
                    </div>

                    {/* File Preview List */}
                    {files.length > 0 && (
                        <div className="file-list">
                            <h4>Selected Files ({files.length})</h4>
                            <div className="files-grid">
                                {files.map((item, index) => (
                                    <div key={index} className={`file-item ${item.status}`}>
                                        <div className="file-preview">
                                            {mediaType === 'image' ? (
                                                <img src={item.preview} alt="" />
                                            ) : (
                                                <video src={item.preview} />
                                            )}
                                            <button
                                                className="remove-file"
                                                onClick={() => removeFile(index)}
                                            >
                                                <X size={14} />
                                            </button>
                                            {uploadProgress[index] !== undefined && uploadProgress[index] < 100 && (
                                                <div className="upload-progress">
                                                    <div
                                                        className="progress-bar"
                                                        style={{ width: `${uploadProgress[index]}%` }}
                                                    />
                                                </div>
                                            )}
                                            {item.status === 'complete' && (
                                                <div className="upload-complete">
                                                    <CheckCircle size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <span className="file-name">{item.file.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UploadPage;
