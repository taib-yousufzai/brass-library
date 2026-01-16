import { useState, useRef, useEffect, useCallback } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { analyzeImageError, logImageError, getRetryStrategy } from '../utils/imageErrorHandler';
import { ErrorPlaceholder } from './ErrorPlaceholders';
import './ImageWithFallback.css';

const ImageWithFallback = ({
    src,
    alt = '',
    className = '',
    style = {},
    lazy = true,
    retryCount = 3,
    retryDelay = 1000,
    onLoad,
    onError,
    onRetry,
    placeholder,
    errorPlaceholder,
    ...props
}) => {
    const [loadingState, setLoadingState] = useState({
        status: 'loading', // 'loading', 'loaded', 'error', 'retry'
        error: null,
        retryAttempts: 0,
        lastAttempt: null
    });

    const [isInView, setIsInView] = useState(!lazy);
    const [currentSrc, setCurrentSrc] = useState(lazy ? null : src);
    
    const imgRef = useRef(null);
    const observerRef = useRef(null);
    const retryTimeoutRef = useRef(null);

    // Intersection Observer for lazy loading
    useEffect(() => {
        if (!lazy || !imgRef.current) return;

        observerRef.current = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    setCurrentSrc(src);
                    observerRef.current?.disconnect();
                }
            },
            {
                rootMargin: '50px',
                threshold: 0.1
            }
        );

        observerRef.current.observe(imgRef.current);

        return () => {
            observerRef.current?.disconnect();
        };
    }, [lazy, src]);

    // Update src when prop changes
    useEffect(() => {
        if (src !== currentSrc && (isInView || !lazy)) {
            setCurrentSrc(src);
            setLoadingState(prev => ({
                ...prev,
                status: 'loading',
                error: null
            }));
        }
    }, [src, isInView, lazy, currentSrc]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
        };
    }, []);

    const validateFirebaseStorageUrl = useCallback((url) => {
        if (!url) return { isValid: false, error: 'No URL provided' };
        
        try {
            const urlObj = new URL(url);
            
            // Check for Firebase Storage domains
            const validDomains = [
                'firebasestorage.googleapis.com',
                'storage.googleapis.com'
            ];
            
            const isValidDomain = validDomains.some(domain => 
                urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
            );
            
            if (!isValidDomain) {
                return { isValid: false, error: 'Invalid Firebase Storage domain' };
            }
            
            // Ensure HTTPS
            if (urlObj.protocol !== 'https:') {
                return { isValid: false, error: 'URL must use HTTPS protocol' };
            }
            
            return { isValid: true };
        } catch (error) {
            return { isValid: false, error: 'Invalid URL format' };
        }
    }, []);

    const determineErrorType = useCallback((error, url) => {
        // Network-related errors
        if (!navigator.onLine) {
            return {
                type: 'network',
                message: 'No internet connection',
                retryable: true
            };
        }

        // URL validation errors
        const urlValidation = validateFirebaseStorageUrl(url);
        if (!urlValidation.isValid) {
            return {
                type: 'cors',
                message: urlValidation.error,
                retryable: false
            };
        }

        // HTTP status errors (if available)
        if (error && error.target) {
            const img = error.target;
            
            // Check if image failed to load (common CORS issue)
            if (img.naturalWidth === 0 && img.naturalHeight === 0) {
                return {
                    type: 'cors',
                    message: 'Image blocked by CORS policy or not found',
                    retryable: true
                };
            }
        }

        // Authentication errors (Firebase Storage specific)
        if (url && url.includes('token=')) {
            return {
                type: 'auth',
                message: 'Authentication token may be expired',
                retryable: true
            };
        }

        // Default network error
        return {
            type: 'network',
            message: 'Failed to load image',
            retryable: true
        };
    }, [validateFirebaseStorageUrl]);

    const handleImageLoad = useCallback((event) => {
        console.log(`✅ Image loaded successfully: ${currentSrc?.substring(0, 50)}...`);
        
        setLoadingState(prev => ({
            ...prev,
            status: 'loaded',
            error: null
        }));

        if (onLoad) {
            onLoad(event);
        }
    }, [currentSrc, onLoad]);

    const handleImageError = useCallback((event) => {
        const errorInfo = analyzeImageError(event, currentSrc, {
            component: 'ImageWithFallback',
            retryAttempts: loadingState.retryAttempts
        });
        
        // Log the error for debugging
        logImageError(errorInfo, {
            src: currentSrc,
            alt,
            retryAttempts: loadingState.retryAttempts,
            maxRetries: retryCount
        });

        setLoadingState(prev => ({
            ...prev,
            status: 'error',
            error: errorInfo,
            lastAttempt: Date.now()
        }));

        if (onError) {
            onError(event, errorInfo);
        }

        // Auto-retry for retryable errors
        const retryStrategy = getRetryStrategy(errorInfo, loadingState.retryAttempts, retryCount);
        
        if (retryStrategy.shouldRetry) {
            console.log(`🔄 Auto-retrying in ${retryStrategy.delay}ms (attempt ${loadingState.retryAttempts + 1}/${retryCount})`);
            
            retryTimeoutRef.current = setTimeout(() => {
                handleRetry();
            }, retryStrategy.delay);
        }
    }, [currentSrc, alt, loadingState.retryAttempts, retryCount, onError]);

    const handleRetry = useCallback(() => {
        if (loadingState.retryAttempts >= retryCount) {
            console.warn(`⚠️ Maximum retry attempts reached for: ${currentSrc?.substring(0, 50)}...`);
            return;
        }

        console.log(`🔄 Retrying image load (attempt ${loadingState.retryAttempts + 1}/${retryCount}): ${currentSrc?.substring(0, 50)}...`);

        setLoadingState(prev => ({
            ...prev,
            status: 'retry',
            retryAttempts: prev.retryAttempts + 1,
            error: null
        }));

        if (onRetry) {
            onRetry(loadingState.retryAttempts + 1);
        }

        // Force image reload by updating src
        if (imgRef.current) {
            const img = imgRef.current;
            const originalSrc = img.src;
            img.src = '';
            setTimeout(() => {
                img.src = originalSrc;
                setLoadingState(prev => ({
                    ...prev,
                    status: 'loading'
                }));
            }, 100);
        }
    }, [loadingState.retryAttempts, retryCount, currentSrc, onRetry]);

    const renderPlaceholder = () => {
        if (placeholder) {
            return placeholder;
        }

        return (
            <div className="image-placeholder">
                <ImageIcon size={24} />
                <span>Loading...</span>
            </div>
        );
    };

    const renderErrorPlaceholder = () => {
        if (errorPlaceholder) {
            return errorPlaceholder;
        }

        return (
            <ErrorPlaceholder
                errorType={loadingState.error?.type}
                errorMessage={loadingState.error?.message}
                onRetry={loadingState.error?.retryable && loadingState.retryAttempts < retryCount ? handleRetry : null}
                retryCount={loadingState.retryAttempts}
                maxRetries={retryCount}
                isRetrying={loadingState.status === 'retry'}
            />
        );
    };

    const shouldShowImage = currentSrc && (loadingState.status === 'loaded' || loadingState.status === 'loading' || loadingState.status === 'retry');

    return (
        <div 
            ref={imgRef}
            className={`image-with-fallback ${className} ${loadingState.status}`}
            style={style}
        >
            {shouldShowImage && (
                <img
                    src={currentSrc}
                    alt={alt}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    style={{
                        opacity: loadingState.status === 'loaded' ? 1 : 0,
                        transition: 'opacity 0.3s ease'
                    }}
                    {...props}
                />
            )}
            
            {loadingState.status === 'loading' && renderPlaceholder()}
            {loadingState.status === 'retry' && renderPlaceholder()}
            {loadingState.status === 'error' && renderErrorPlaceholder()}
        </div>
    );
};

export default ImageWithFallback;