// Connection Manager - Aggressive retry and monitoring
class ConnectionManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.retryAttempts = 0;
        this.maxRetries = 50; // Very aggressive
        this.retryDelay = 1000; // Start with 1 second
        this.maxRetryDelay = 30000; // Max 30 seconds
        this.listeners = new Set();
        
        this.setupEventListeners();
        this.startConnectionMonitoring();
    }

    setupEventListeners() {
        window.addEventListener('online', () => {
            console.log('🟢 Network connection restored');
            this.isOnline = true;
            this.retryAttempts = 0;
            this.retryDelay = 1000;
            this.notifyListeners('online');
        });

        window.addEventListener('offline', () => {
            console.log('🔴 Network connection lost');
            this.isOnline = false;
            this.startAggressiveReconnection();
            this.notifyListeners('offline');
        });
    }

    startConnectionMonitoring() {
        // Check connection every 5 seconds
        setInterval(() => {
            this.checkConnection();
        }, 5000);
    }

    async checkConnection() {
        try {
            // Try to fetch a small resource from Google (more reliable than Firestore endpoint)
            const response = await fetch('https://www.google.com/favicon.ico', {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache'
            });
            
            if (!this.isOnline) {
                console.log('🟢 Connection restored via health check');
                this.isOnline = true;
                this.retryAttempts = 0;
                this.notifyListeners('online');
            }
        } catch (error) {
            if (this.isOnline) {
                console.log('🔴 Connection lost via health check');
                this.isOnline = false;
                this.startAggressiveReconnection();
                this.notifyListeners('offline');
            }
        }
    }

    startAggressiveReconnection() {
        if (this.retryAttempts >= this.maxRetries) {
            console.log('⚠️ Max retry attempts reached, continuing to monitor...');
            // Don't give up, just slow down the retries
            this.retryAttempts = 0;
            this.retryDelay = this.maxRetryDelay;
        }

        setTimeout(() => {
            if (!this.isOnline) {
                console.log(`🔄 Reconnection attempt ${this.retryAttempts + 1}/${this.maxRetries}`);
                this.retryAttempts++;
                
                // Exponential backoff with jitter
                this.retryDelay = Math.min(
                    this.retryDelay * 1.5 + Math.random() * 1000,
                    this.maxRetryDelay
                );
                
                this.checkConnection();
                this.startAggressiveReconnection();
            }
        }, this.retryDelay);
    }

    addListener(callback) {
        this.listeners.add(callback);
    }

    removeListener(callback) {
        this.listeners.delete(callback);
    }

    notifyListeners(status) {
        this.listeners.forEach(callback => callback(status));
    }

    getStatus() {
        return {
            isOnline: this.isOnline,
            retryAttempts: this.retryAttempts,
            retryDelay: this.retryDelay
        };
    }
}

export const connectionManager = new ConnectionManager();