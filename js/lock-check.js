// Website Lock Check System
class WebsiteLockChecker {
    constructor() {
        this.checkLockStatus();
    }

    async checkLockStatus() {
        try {
            const response = await fetch('./api/load.php?type=website_settings');
            const settings = await response.json();
            
            if (settings.site_locked === 'true') {
                // Check if user has unlock code in session
                const unlockCode = sessionStorage.getItem('unlock_code');
                if (unlockCode && unlockCode === settings.unlock_code) {
                    return; // User has valid unlock code
                }
                
                // Redirect to locked.html
                if (!window.location.pathname.includes('locked.html')) {
                    window.location.href = 'locked.html';
                }
            }
        } catch (error) {
            console.error('Error checking lock status:', error);
        }
    }


}

// Initialize lock checker when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WebsiteLockChecker();
});