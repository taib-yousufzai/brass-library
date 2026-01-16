import { useState, useEffect } from 'react';
import { connectionManager } from '../utils/connectionManager';

export const useConnectionStatus = () => {
    const [status, setStatus] = useState(connectionManager.getStatus());
    const [showReconnecting, setShowReconnecting] = useState(false);

    useEffect(() => {
        const handleStatusChange = (connectionStatus) => {
            const newStatus = connectionManager.getStatus();
            setStatus(newStatus);
            
            if (connectionStatus === 'offline') {
                setShowReconnecting(true);
            } else if (connectionStatus === 'online') {
                setShowReconnecting(false);
            }
        };

        connectionManager.addListener(handleStatusChange);

        return () => {
            connectionManager.removeListener(handleStatusChange);
        };
    }, []);

    return {
        isOnline: status.isOnline,
        retryAttempts: status.retryAttempts,
        retryDelay: status.retryDelay,
        showReconnecting
    };
};