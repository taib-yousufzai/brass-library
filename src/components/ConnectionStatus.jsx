import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { Wifi, WifiOff, RotateCcw } from 'lucide-react';
import './ConnectionStatus.css';

const ConnectionStatus = () => {
    const { isOnline, retryAttempts, showReconnecting } = useConnectionStatus();

    if (isOnline && !showReconnecting) {
        return null; // Don't show anything when connected
    }

    return (
        <div className={`connection-status ${isOnline ? 'reconnecting' : 'offline'}`}>
            <div className="connection-content">
                {isOnline ? (
                    <>
                        <RotateCcw size={16} className="spinning" />
                        <span>Reconnecting...</span>
                    </>
                ) : (
                    <>
                        <WifiOff size={16} />
                        <span>
                            Connection lost - Retrying ({retryAttempts}/50)
                        </span>
                        <div className="retry-indicator">
                            <div className="retry-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ConnectionStatus;