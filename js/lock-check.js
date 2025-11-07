// Website Lock Check System
class WebsiteLockChecker {
    constructor() {
        this.checkLockStatus();
    }

    async checkLockStatus() {
        try {
            const response = await fetch('./api/load.php?type=website_control');
            const status = await response.json();
            
            // Check for emergency broadcast
            if (status.emergency_message) {
                this.showEmergencyBroadcast(status.emergency_message);
            }
            
            if (status.locked) {
                // Check if user has level 5+ access
                if (window.discordAuth && window.discordAuth.isAuthenticated()) {
                    const user = window.discordAuth.getCurrentUser();
                    if (user.level >= 5) {
                        // Level 5+ users can bypass lock
                        return;
                    }
                }
                
                // Show lock screen for everyone else
                this.showLockScreen(status.reason || 'Maintenance in progress');
            }
        } catch (error) {
            console.error('Error checking lock status:', error);
        }
    }
    
    showEmergencyBroadcast(message) {
        if (document.getElementById('emergencyBroadcast')) return;
        
        const broadcast = document.createElement('div');
        broadcast.id = 'emergencyBroadcast';
        broadcast.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            background: linear-gradient(45deg, #dc2626, #ef4444);
            color: white;
            padding: 15px;
            text-align: center;
            font-weight: bold;
            z-index: 10001;
            animation: emergencyPulse 2s infinite;
            box-shadow: 0 4px 15px rgba(220, 38, 38, 0.5);
        `;
        broadcast.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i> 
            EMERGENCY BROADCAST: ${message}
            <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; color: white; font-size: 18px; cursor: pointer;">×</button>
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes emergencyPulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.8; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(broadcast);
    }

    showLockScreen(reason) {
        document.body.innerHTML = `
            <div class="lock-screen">
                <div class="lock-content">
                    <div class="lock-icon">
                        <i class="fas fa-lock"></i>
                    </div>
                    <h1>Website Locked</h1>
                    <p class="lock-reason">Reason: ${reason}</p>
                    <p class="lock-message">This website is currently locked for maintenance. Please check back later.</p>
                    <div class="lock-footer">
                        <p>If you believe this is an error, please contact an administrator.</p>
                    </div>
                </div>
            </div>
            <style>
                .lock-screen {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                }
                .lock-content {
                    text-align: center;
                    max-width: 500px;
                    padding: 3rem;
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                }
                .lock-icon {
                    font-size: 4rem;
                    color: #dc2626;
                    margin-bottom: 2rem;
                    animation: pulse 2s infinite;
                }
                .lock-content h1 {
                    color: white;
                    font-size: 2.5rem;
                    margin-bottom: 1rem;
                    font-weight: 700;
                }
                .lock-reason {
                    color: #fbbf24;
                    font-size: 1.2rem;
                    margin-bottom: 1rem;
                    font-weight: 600;
                }
                .lock-message {
                    color: #e2e8f0;
                    font-size: 1rem;
                    margin-bottom: 2rem;
                    line-height: 1.6;
                }
                .lock-footer p {
                    color: #94a3b8;
                    font-size: 0.9rem;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            </style>
        `;
    }
}

// Initialize lock checker when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WebsiteLockChecker();
});