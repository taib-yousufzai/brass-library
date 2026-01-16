import { AlertCircle, RefreshCw, Wifi, Lock, FileX, Link, Clock, HelpCircle } from 'lucide-react';
import { IMAGE_ERROR_TYPES } from '../utils/imageErrorHandler';
import './ErrorPlaceholders.css';

/**
 * Network Error Placeholder
 */
export const NetworkErrorPlaceholder = ({ onRetry, retryCount, maxRetries, isRetrying }) => (
    <div className="error-placeholder network-error">
        <Wifi size={32} />
        <div className="error-content">
            <h4>Connection Problem</h4>
            <p>Unable to load image due to network issues</p>
            {onRetry && retryCount < maxRetries && (
                <button 
                    className="retry-button"
                    onClick={onRetry}
                    disabled={isRetrying}
                >
                    <RefreshCw size={16} className={isRetrying ? 'spinning' : ''} />
                    {isRetrying ? 'Retrying...' : 'Try Again'}
                </button>
            )}
            {retryCount > 0 && (
                <span className="retry-info">Attempt {retryCount}/{maxRetries}</span>
            )}
        </div>
    </div>
);

/**
 * CORS/Access Error Placeholder
 */
export const CorsErrorPlaceholder = ({ onRetry, retryCount, maxRetries, isRetrying }) => (
    <div className="error-placeholder cors-error">
        <Lock size={32} />
        <div className="error-content">
            <h4>Access Restricted</h4>
            <p>Image access is blocked by security settings</p>
            <div className="error-suggestions">
                <small>This may be due to:</small>
                <ul>
                    <li>CORS configuration issues</li>
                    <li>Storage permission settings</li>
                    <li>Browser security restrictions</li>
                </ul>
            </div>
            {onRetry && retryCount < maxRetries && (
                <button 
                    className="retry-button"
                    onClick={onRetry}
                    disabled={isRetrying}
                >
                    <RefreshCw size={16} className={isRetrying ? 'spinning' : ''} />
                    {isRetrying ? 'Retrying...' : 'Retry'}
                </button>
            )}
        </div>
    </div>
);

/**
 * Authentication Error Placeholder
 */
export const AuthErrorPlaceholder = ({ onRetry, retryCount, maxRetries, isRetrying }) => (
    <div className="error-placeholder auth-error">
        <Lock size={32} />
        <div className="error-content">
            <h4>Authentication Required</h4>
            <p>Please sign in to view this image</p>
            <div className="error-suggestions">
                <small>Try:</small>
                <ul>
                    <li>Refreshing the page</li>
                    <li>Signing out and back in</li>
                    <li>Clearing browser cache</li>
                </ul>
            </div>
            {onRetry && retryCount < maxRetries && (
                <button 
                    className="retry-button"
                    onClick={onRetry}
                    disabled={isRetrying}
                >
                    <RefreshCw size={16} className={isRetrying ? 'spinning' : ''} />
                    {isRetrying ? 'Retrying...' : 'Retry'}
                </button>
            )}
        </div>
    </div>
);

/**
 * Not Found Error Placeholder
 */
export const NotFoundErrorPlaceholder = ({ onRetry, retryCount, maxRetries, isRetrying }) => (
    <div className="error-placeholder not-found-error">
        <FileX size={32} />
        <div className="error-content">
            <h4>Image Not Found</h4>
            <p>The requested image could not be located</p>
            <div className="error-suggestions">
                <small>The image may have been:</small>
                <ul>
                    <li>Moved or deleted</li>
                    <li>Renamed or relocated</li>
                    <li>Temporarily unavailable</li>
                </ul>
            </div>
            {onRetry && retryCount < maxRetries && (
                <button 
                    className="retry-button secondary"
                    onClick={onRetry}
                    disabled={isRetrying}
                >
                    <RefreshCw size={16} className={isRetrying ? 'spinning' : ''} />
                    {isRetrying ? 'Checking...' : 'Check Again'}
                </button>
            )}
        </div>
    </div>
);

/**
 * Invalid URL Error Placeholder
 */
export const InvalidUrlErrorPlaceholder = () => (
    <div className="error-placeholder invalid-url-error">
        <Link size={32} />
        <div className="error-content">
            <h4>Invalid Image Link</h4>
            <p>The image URL format is not supported</p>
            <div className="error-suggestions">
                <small>This usually indicates:</small>
                <ul>
                    <li>Malformed URL structure</li>
                    <li>Unsupported storage provider</li>
                    <li>Configuration error</li>
                </ul>
            </div>
        </div>
    </div>
);

/**
 * Timeout Error Placeholder
 */
export const TimeoutErrorPlaceholder = ({ onRetry, retryCount, maxRetries, isRetrying }) => (
    <div className="error-placeholder timeout-error">
        <Clock size={32} />
        <div className="error-content">
            <h4>Loading Timeout</h4>
            <p>Image is taking too long to load</p>
            <div className="error-suggestions">
                <small>This might be due to:</small>
                <ul>
                    <li>Slow internet connection</li>
                    <li>Large image file size</li>
                    <li>Server response delays</li>
                </ul>
            </div>
            {onRetry && retryCount < maxRetries && (
                <button 
                    className="retry-button"
                    onClick={onRetry}
                    disabled={isRetrying}
                >
                    <RefreshCw size={16} className={isRetrying ? 'spinning' : ''} />
                    {isRetrying ? 'Loading...' : 'Try Again'}
                </button>
            )}
        </div>
    </div>
);

/**
 * Generic Error Placeholder
 */
export const GenericErrorPlaceholder = ({ onRetry, retryCount, maxRetries, isRetrying, errorMessage }) => (
    <div className="error-placeholder generic-error">
        <AlertCircle size={32} />
        <div className="error-content">
            <h4>Loading Error</h4>
            <p>{errorMessage || 'An unexpected error occurred'}</p>
            {onRetry && retryCount < maxRetries && (
                <button 
                    className="retry-button"
                    onClick={onRetry}
                    disabled={isRetrying}
                >
                    <RefreshCw size={16} className={isRetrying ? 'spinning' : ''} />
                    {isRetrying ? 'Retrying...' : 'Retry'}
                </button>
            )}
            {retryCount > 0 && (
                <span className="retry-info">Attempt {retryCount}/{maxRetries}</span>
            )}
        </div>
    </div>
);

/**
 * Batch Error Summary Placeholder
 */
export const BatchErrorPlaceholder = ({ errorSummary, onRetryAll, isRetrying }) => {
    const { totalErrors, retryableErrors, mostCommonError, errorsByType } = errorSummary;
    
    return (
        <div className="error-placeholder batch-error">
            <AlertCircle size={32} />
            <div className="error-content">
                <h4>Multiple Loading Errors</h4>
                <p>{totalErrors} images failed to load</p>
                
                <div className="error-breakdown">
                    <div className="error-stats">
                        <span className="stat">
                            <strong>{retryableErrors}</strong> can be retried
                        </span>
                        <span className="stat">
                            <strong>{totalErrors - retryableErrors}</strong> permanent failures
                        </span>
                    </div>
                    
                    <div className="error-types">
                        <small>Error breakdown:</small>
                        <ul>
                            {Object.entries(errorsByType).map(([type, errors]) => (
                                <li key={type}>
                                    {getErrorTypeIcon(type)} {errors.length} {type} error{errors.length !== 1 ? 's' : ''}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                
                {retryableErrors > 0 && onRetryAll && (
                    <button 
                        className="retry-button batch-retry"
                        onClick={onRetryAll}
                        disabled={isRetrying}
                    >
                        <RefreshCw size={16} className={isRetrying ? 'spinning' : ''} />
                        {isRetrying ? 'Retrying All...' : `Retry ${retryableErrors} Images`}
                    </button>
                )}
            </div>
        </div>
    );
};

/**
 * Main Error Placeholder Component - routes to specific error types
 */
export const ErrorPlaceholder = ({ 
    errorType, 
    errorMessage, 
    onRetry, 
    retryCount = 0, 
    maxRetries = 3, 
    isRetrying = false,
    errorSummary 
}) => {
    // Handle batch errors
    if (errorSummary) {
        return (
            <BatchErrorPlaceholder 
                errorSummary={errorSummary}
                onRetryAll={onRetry}
                isRetrying={isRetrying}
            />
        );
    }

    // Route to specific error type components
    switch (errorType) {
        case IMAGE_ERROR_TYPES.NETWORK:
            return (
                <NetworkErrorPlaceholder 
                    onRetry={onRetry}
                    retryCount={retryCount}
                    maxRetries={maxRetries}
                    isRetrying={isRetrying}
                />
            );
            
        case IMAGE_ERROR_TYPES.CORS:
            return (
                <CorsErrorPlaceholder 
                    onRetry={onRetry}
                    retryCount={retryCount}
                    maxRetries={maxRetries}
                    isRetrying={isRetrying}
                />
            );
            
        case IMAGE_ERROR_TYPES.AUTH:
            return (
                <AuthErrorPlaceholder 
                    onRetry={onRetry}
                    retryCount={retryCount}
                    maxRetries={maxRetries}
                    isRetrying={isRetrying}
                />
            );
            
        case IMAGE_ERROR_TYPES.NOT_FOUND:
            return (
                <NotFoundErrorPlaceholder 
                    onRetry={onRetry}
                    retryCount={retryCount}
                    maxRetries={maxRetries}
                    isRetrying={isRetrying}
                />
            );
            
        case IMAGE_ERROR_TYPES.INVALID_URL:
            return <InvalidUrlErrorPlaceholder />;
            
        case IMAGE_ERROR_TYPES.TIMEOUT:
            return (
                <TimeoutErrorPlaceholder 
                    onRetry={onRetry}
                    retryCount={retryCount}
                    maxRetries={maxRetries}
                    isRetrying={isRetrying}
                />
            );
            
        default:
            return (
                <GenericErrorPlaceholder 
                    onRetry={onRetry}
                    retryCount={retryCount}
                    maxRetries={maxRetries}
                    isRetrying={isRetrying}
                    errorMessage={errorMessage}
                />
            );
    }
};

/**
 * Helper function to get icons for error types
 */
const getErrorTypeIcon = (errorType) => {
    switch (errorType) {
        case IMAGE_ERROR_TYPES.NETWORK:
            return '🌐';
        case IMAGE_ERROR_TYPES.CORS:
            return '🔒';
        case IMAGE_ERROR_TYPES.AUTH:
            return '🔐';
        case IMAGE_ERROR_TYPES.NOT_FOUND:
            return '📄';
        case IMAGE_ERROR_TYPES.INVALID_URL:
            return '🔗';
        case IMAGE_ERROR_TYPES.TIMEOUT:
            return '⏱️';
        default:
            return '❌';
    }
};

export default ErrorPlaceholder;