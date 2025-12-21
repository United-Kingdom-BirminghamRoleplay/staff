// Website Lock Check System
class WebsiteLockChecker {
    constructor() {
        this.checkLockStatus();
    }

    async checkLockStatus() {
        try {
            const response = await fetch('./api/load.php?type=website_control');
            const status = await response.json();
            
            if (status.site_locked) {
                // Check if user has unlock code in session
                const unlockCode = sessionStorage.getItem('unlock_code');
                if (unlockCode && unlockCode === status.unlock_code) {
                    return; // User has valid unlock code
                }
                
                // Show lock screen with unlock option
                this.showLockScreen();
            }
        } catch (error) {
            console.error('Error checking lock status:', error);
        }
    }

    showLockScreen() {
        document.body.innerHTML = `
            <div class="lock-screen">
                <div class="lock-content">
                    <div class="lock-icon">
                        <i class="fas fa-lock"></i>
                    </div>
                    <h1>Website Locked</h1>
                    <p class="lock-message">This website is currently locked for maintenance.</p>
                    
                    <div class="unlock-section">
                        <input type="text" id="unlockCode" placeholder="Enter unlock code" class="unlock-input">
                        <button onclick="this.checkUnlockCode()" class="unlock-btn">Unlock</button>
                    </div>
                    
                    <div class="lock-footer">
                        <p>If you have the unlock code, enter it above to access the website.</p>
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
                .lock-message {
                    color: #e2e8f0;
                    font-size: 1rem;
                    margin-bottom: 2rem;
                    line-height: 1.6;
                }
                .unlock-section {
                    margin: 2rem 0;
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                }
                .unlock-input {
                    padding: 12px 16px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    font-size: 16px;
                    width: 200px;
                }
                .unlock-btn {
                    padding: 12px 24px;
                    background: #dc2626;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                }
                .unlock-btn:hover {
                    background: #b91c1c;
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
        
        // Add unlock function to window
        window.checkUnlockCode = async () => {
            const code = document.getElementById('unlockCode').value;
            if (!code) return;
            
            try {
                const response = await fetch('./api/save.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'verify_unlock_code',
                        code: code
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    sessionStorage.setItem('unlock_code', code);
                    location.reload();
                } else {
                    alert('Invalid unlock code');
                }
            } catch (error) {
                alert('Error verifying code');
            }
        };
    }
}

// Initialize lock checker when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WebsiteLockChecker();
});