import { useEffect, useRef } from 'react';
import { CheckCircle, Upload, Eye, X, Home } from 'lucide-react';
import './UploadSuccessModal.css';

const UploadSuccessModal = ({
    isOpen,
    uploadResults,
    onUploadMore,
    onViewGallery,
    onGoToDashboard,
    onClose
}) => {
    const modalRef = useRef(null);
    const firstButtonRef = useRef(null);

    // Handle keyboard navigation and focus management
    useEffect(() => {
        if (isOpen) {
            // Focus the first button when modal opens
            firstButtonRef.current?.focus();

            // Handle escape key
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    onClose();
                }
            };

            // Handle tab key for focus trap
            const handleTab = (e) => {
                if (e.key === 'Tab') {
                    const focusableElements = modalRef.current?.querySelectorAll(
                        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    );
                    
                    if (focusableElements && focusableElements.length > 0) {
                        const firstElement = focusableElements[0];
                        const lastElement = focusableElements[focusableElements.length - 1];

                        if (e.shiftKey) {
                            // Shift + Tab
                            if (document.activeElement === firstElement) {
                                e.preventDefault();
                                lastElement.focus();
                            }
                        } else {
                            // Tab
                            if (document.activeElement === lastElement) {
                                e.preventDefault();
                                firstElement.focus();
                            }
                        }
                    }
                }
            };

            document.addEventListener('keydown', handleEscape);
            document.addEventListener('keydown', handleTab);

            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';

            return () => {
                document.removeEventListener('keydown', handleEscape);
                document.removeEventListener('keydown', handleTab);
                document.body.style.overflow = 'unset';
            };
        }
    }, [isOpen, onClose]);

    // Don't render if not open
    if (!isOpen) return null;

    // Handle backdrop click
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Format upload results for display
    const {
        successCount = 0,
        totalCount = 0,
        categoryName = '',
        subCategoryName = '',
        mediaType = 'image'
    } = uploadResults || {};

    const isPartialSuccess = successCount > 0 && successCount < totalCount;
    const isCompleteSuccess = successCount === totalCount && totalCount > 0;
    const mediaTypeLabel = mediaType === 'image' ? 'Images' : 'Videos';

    return (
        <div 
            className="modal-overlay upload-success-overlay"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-success-title"
            aria-describedby="upload-success-description"
        >
            <div 
                ref={modalRef}
                className="modal-content upload-success-modal"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    className="upload-success-close"
                    onClick={onClose}
                    aria-label="Close modal"
                >
                    <X size={20} />
                </button>

                {/* Success icon and title */}
                <div className="upload-success-header">
                    <div className="upload-success-icon">
                        <CheckCircle size={48} />
                    </div>
                    <h2 id="upload-success-title" className="upload-success-title">
                        {isCompleteSuccess ? 'Upload Complete!' : 
                         isPartialSuccess ? 'Upload Partially Complete' : 
                         'Upload Finished'}
                    </h2>
                </div>

                {/* Upload results */}
                <div className="upload-success-content">
                    <div id="upload-success-description" className="upload-success-description">
                        {isCompleteSuccess ? (
                            <p>
                                Successfully uploaded <strong>{successCount}</strong> of{' '}
                                <strong>{totalCount}</strong> {totalCount === 1 ? 'file' : 'files'}
                            </p>
                        ) : isPartialSuccess ? (
                            <p>
                                Successfully uploaded <strong>{successCount}</strong> of{' '}
                                <strong>{totalCount}</strong> {totalCount === 1 ? 'file' : 'files'}.{' '}
                                {totalCount - successCount} {totalCount - successCount === 1 ? 'file' : 'files'} failed.
                            </p>
                        ) : (
                            <p>Upload process completed.</p>
                        )}
                    </div>

                    {/* Category and location info */}
                    {categoryName && subCategoryName && (
                        <div className="upload-success-location">
                            <div className="location-info">
                                <span className="location-label">Uploaded to:</span>
                                <span className="location-path">
                                    {categoryName} &gt; {subCategoryName} &gt; {mediaTypeLabel}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Upload statistics */}
                    {successCount > 0 && (
                        <div className="upload-success-stats">
                            <div className="stat-item">
                                <span className="stat-label">Files uploaded:</span>
                                <span className="stat-value">{successCount}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Media type:</span>
                                <span className="stat-value">{mediaTypeLabel}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action buttons */}
                <div className="upload-success-actions">
                    <button
                        ref={firstButtonRef}
                        className="btn btn-primary upload-more-btn"
                        onClick={onUploadMore}
                        aria-label="Upload more files with the same settings"
                    >
                        <Upload size={18} />
                        Upload More
                    </button>
                    <button
                        className="btn btn-secondary view-gallery-btn"
                        onClick={onViewGallery}
                        aria-label="View uploaded files in gallery"
                    >
                        <Eye size={18} />
                        View Gallery
                    </button>
                    <button
                        className="btn btn-secondary dashboard-btn"
                        onClick={onGoToDashboard}
                        aria-label="Go to Dashboard"
                    >
                        <Home size={18} />
                        Dashboard
                    </button>
                </div>

                {/* Additional info for partial success */}
                {isPartialSuccess && (
                    <div className="upload-success-warning">
                        <p>
                            Some files couldn't be uploaded. You can try uploading them again
                            or check the console for detailed error information.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadSuccessModal;