/**
 * Comprehensive error handling utilities for image loading
 */

// Error types for image loading failures
export const IMAGE_ERROR_TYPES = {
    NETWORK: 'network',
    CORS: 'cors', 
    AUTH: 'auth',
    NOT_FOUND: 'not-found',
    INVALID_URL: 'invalid-url',
    TIMEOUT: 'timeout',
    UNKNOWN: 'unknown'
};

// Error severity levels
export const ERROR_SEVERITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

/**
 * Validates Firebase Storage URL format and structure
 */
export const validateFirebaseStorageUrl = (url) => {
    if (!url || typeof url !== 'string') {
        return {
            isValid: false,
            error: 'No URL provided or invalid URL type',
            errorType: IMAGE_ERROR_TYPES.INVALID_URL
        };
    }

    try {
        const urlObj = new URL(url);
        
        // Check for Firebase Storage domains
        const validDomains = [
            'firebasestorage.googleapis.com',
            'storage.googleapis.com',
            'storage.cloud.google.com'
        ];
        
        const isValidDomain = validDomains.some(domain => 
            urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
        );
        
        if (!isValidDomain) {
            return {
                isValid: false,
                error: `Invalid Firebase Storage domain: ${urlObj.hostname}`,
                errorType: IMAGE_ERROR_TYPES.CORS
            };
        }
        
        // Ensure HTTPS protocol
        if (urlObj.protocol !== 'https:') {
            return {
                isValid: false,
                error: 'Firebase Storage URLs must use HTTPS protocol',
                errorType: IMAGE_ERROR_TYPES.CORS
            };
        }

        // Check for required path structure
        if (!urlObj.pathname.includes('/o/') && !urlObj.pathname.includes('/v0/b/')) {
            return {
                isValid: false,
                error: 'Invalid Firebase Storage path structure',
                errorType: IMAGE_ERROR_TYPES.INVALID_URL
            };
        }
        
        return { isValid: true };
    } catch (error) {
        return {
            isValid: false,
            error: `Invalid URL format: ${error.message}`,
            errorType: IMAGE_ERROR_TYPES.INVALID_URL
        };
    }
};

/**
 * Determines the specific error type and details from an image load failure
 */
export const analyzeImageError = (error, url, additionalContext = {}) => {
    const timestamp = new Date().toISOString();
    const baseError = {
        timestamp,
        url: url?.substring(0, 100) + (url?.length > 100 ? '...' : ''),
        context: additionalContext
    };

    // Check network connectivity first
    if (!navigator.onLine) {
        return {
            ...baseError,
            type: IMAGE_ERROR_TYPES.NETWORK,
            severity: ERROR_SEVERITY.HIGH,
            message: 'No internet connection available',
            userMessage: 'Please check your internet connection and try again',
            retryable: true,
            retryDelay: 2000
        };
    }

    // Validate URL structure
    const urlValidation = validateFirebaseStorageUrl(url);
    if (!urlValidation.isValid) {
        return {
            ...baseError,
            type: urlValidation.errorType,
            severity: ERROR_SEVERITY.CRITICAL,
            message: urlValidation.error,
            userMessage: 'Invalid image URL format',
            retryable: false,
            retryDelay: 0
        };
    }

    // Analyze the error event if available
    if (error && error.target) {
        const img = error.target;
        
        // Check if image dimensions are zero (common CORS/404 issue)
        if (img.naturalWidth === 0 && img.naturalHeight === 0) {
            // Check for CORS-specific indicators
            if (url && (url.includes('googleapis.com') || url.includes('firebasestorage'))) {
                return {
                    ...baseError,
                    type: IMAGE_ERROR_TYPES.CORS,
                    severity: ERROR_SEVERITY.HIGH,
                    message: 'Image blocked by CORS policy or Firebase Storage configuration',
                    userMessage: 'Image access is restricted. Please check storage permissions.',
                    retryable: true,
                    retryDelay: 3000,
                    suggestions: [
                        'Check Firebase Storage CORS configuration',
                        'Verify storage rules allow read access',
                        'Ensure authentication token is valid'
                    ]
                };
            }
            
            return {
                ...baseError,
                type: IMAGE_ERROR_TYPES.NOT_FOUND,
                severity: ERROR_SEVERITY.MEDIUM,
                message: 'Image not found or access denied',
                userMessage: 'The requested image could not be found',
                retryable: false,
                retryDelay: 0
            };
        }
    }

    // Check for authentication-related issues
    if (url && url.includes('token=')) {
        const urlObj = new URL(url);
        const token = urlObj.searchParams.get('token');
        
        if (!token) {
            return {
                ...baseError,
                type: IMAGE_ERROR_TYPES.AUTH,
                severity: ERROR_SEVERITY.HIGH,
                message: 'Missing authentication token in URL',
                userMessage: 'Authentication required to access this image',
                retryable: true,
                retryDelay: 1000
            };
        }
        
        // Check if token might be expired (basic heuristic)
        try {
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]));
                const now = Math.floor(Date.now() / 1000);
                
                if (payload.exp && payload.exp < now) {
                    return {
                        ...baseError,
                        type: IMAGE_ERROR_TYPES.AUTH,
                        severity: ERROR_SEVERITY.HIGH,
                        message: 'Authentication token has expired',
                        userMessage: 'Session expired. Please refresh the page.',
                        retryable: true,
                        retryDelay: 1000
                    };
                }
            }
        } catch (tokenError) {
            // Token parsing failed, might be malformed
            return {
                ...baseError,
                type: IMAGE_ERROR_TYPES.AUTH,
                severity: ERROR_SEVERITY.HIGH,
                message: 'Invalid authentication token format',
                userMessage: 'Authentication error. Please refresh the page.',
                retryable: true,
                retryDelay: 1000
            };
        }
    }

    // Check for timeout-related errors
    if (error && (error.type === 'timeout' || error.message?.includes('timeout'))) {
        return {
            ...baseError,
            type: IMAGE_ERROR_TYPES.TIMEOUT,
            severity: ERROR_SEVERITY.MEDIUM,
            message: 'Image load timeout',
            userMessage: 'Image is taking too long to load',
            retryable: true,
            retryDelay: 5000
        };
    }

    // Default to network error for unknown cases
    return {
        ...baseError,
        type: IMAGE_ERROR_TYPES.NETWORK,
        severity: ERROR_SEVERITY.MEDIUM,
        message: error?.message || 'Unknown image loading error',
        userMessage: 'Failed to load image. Please try again.',
        retryable: true,
        retryDelay: 2000
    };
};

/**
 * Logs detailed error information for debugging
 */
export const logImageError = (errorInfo, additionalData = {}) => {
    const logData = {
        ...errorInfo,
        ...additionalData,
        userAgent: navigator.userAgent,
        connectionType: navigator.connection?.effectiveType || 'unknown',
        onlineStatus: navigator.onLine
    };

    // Use different console methods based on severity
    switch (errorInfo.severity) {
        case ERROR_SEVERITY.CRITICAL:
            console.error('🚨 CRITICAL Image Error:', logData);
            break;
        case ERROR_SEVERITY.HIGH:
            console.error('❌ High Priority Image Error:', logData);
            break;
        case ERROR_SEVERITY.MEDIUM:
            console.warn('⚠️ Medium Priority Image Error:', logData);
            break;
        case ERROR_SEVERITY.LOW:
            console.log('ℹ️ Low Priority Image Error:', logData);
            break;
        default:
            console.error('❌ Image Error:', logData);
    }

    // In production, you might want to send this to an error tracking service
    if (process.env.NODE_ENV === 'production' && errorInfo.severity !== ERROR_SEVERITY.LOW) {
        // Example: Send to error tracking service
        // errorTrackingService.captureException(errorInfo, logData);
    }
};

/**
 * Creates user-friendly error messages with actionable suggestions
 */
export const createErrorMessage = (errorInfo) => {
    const baseMessage = {
        title: getErrorTitle(errorInfo.type),
        message: errorInfo.userMessage || errorInfo.message,
        type: errorInfo.type,
        severity: errorInfo.severity,
        retryable: errorInfo.retryable
    };

    // Add specific suggestions based on error type
    switch (errorInfo.type) {
        case IMAGE_ERROR_TYPES.NETWORK:
            return {
                ...baseMessage,
                suggestions: [
                    'Check your internet connection',
                    'Try refreshing the page',
                    'Wait a moment and try again'
                ]
            };
            
        case IMAGE_ERROR_TYPES.CORS:
            return {
                ...baseMessage,
                suggestions: [
                    'Contact your administrator about storage configuration',
                    'Try refreshing the page',
                    'Clear your browser cache'
                ]
            };
            
        case IMAGE_ERROR_TYPES.AUTH:
            return {
                ...baseMessage,
                suggestions: [
                    'Refresh the page to renew your session',
                    'Log out and log back in',
                    'Contact support if the problem persists'
                ]
            };
            
        case IMAGE_ERROR_TYPES.NOT_FOUND:
            return {
                ...baseMessage,
                suggestions: [
                    'The image may have been moved or deleted',
                    'Contact the content owner',
                    'Try accessing the gallery again'
                ]
            };
            
        default:
            return {
                ...baseMessage,
                suggestions: [
                    'Try refreshing the page',
                    'Check your internet connection',
                    'Contact support if the problem continues'
                ]
            };
    }
};

/**
 * Gets user-friendly error titles
 */
const getErrorTitle = (errorType) => {
    switch (errorType) {
        case IMAGE_ERROR_TYPES.NETWORK:
            return '🌐 Connection Problem';
        case IMAGE_ERROR_TYPES.CORS:
            return '🔒 Access Restricted';
        case IMAGE_ERROR_TYPES.AUTH:
            return '🔐 Authentication Required';
        case IMAGE_ERROR_TYPES.NOT_FOUND:
            return '📄 Image Not Found';
        case IMAGE_ERROR_TYPES.INVALID_URL:
            return '🔗 Invalid Link';
        case IMAGE_ERROR_TYPES.TIMEOUT:
            return '⏱️ Loading Timeout';
        default:
            return '❌ Loading Error';
    }
};

/**
 * Determines optimal retry strategy based on error type and attempt count
 */
export const getRetryStrategy = (errorInfo, attemptCount, maxRetries = 3) => {
    if (!errorInfo.retryable || attemptCount >= maxRetries) {
        return { shouldRetry: false, delay: 0 };
    }

    // Exponential backoff with jitter
    const baseDelay = errorInfo.retryDelay || 1000;
    const exponentialDelay = baseDelay * Math.pow(2, attemptCount);
    const jitter = Math.random() * 1000; // Add up to 1 second of jitter
    const delay = Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds

    return {
        shouldRetry: true,
        delay: Math.floor(delay)
    };
};

/**
 * Batch error handler for multiple simultaneous image failures
 */
export const handleBatchImageErrors = (errors) => {
    const errorsByType = errors.reduce((acc, error) => {
        const type = error.type || IMAGE_ERROR_TYPES.UNKNOWN;
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(error);
        return acc;
    }, {});

    const totalErrors = errors.length;
    const criticalErrors = errors.filter(e => e.severity === ERROR_SEVERITY.CRITICAL).length;
    const highPriorityErrors = errors.filter(e => e.severity === ERROR_SEVERITY.HIGH).length;

    console.group(`📊 Batch Image Error Summary (${totalErrors} total)`);
    console.log(`🚨 Critical: ${criticalErrors}`);
    console.log(`❌ High Priority: ${highPriorityErrors}`);
    console.log(`📈 Errors by type:`, errorsByType);
    console.groupEnd();

    // Return summary for UI display
    return {
        totalErrors,
        criticalErrors,
        highPriorityErrors,
        errorsByType,
        mostCommonError: Object.keys(errorsByType).reduce((a, b) => 
            errorsByType[a].length > errorsByType[b].length ? a : b
        ),
        retryableErrors: errors.filter(e => e.retryable).length
    };
};