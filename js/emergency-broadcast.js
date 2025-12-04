// Emergency Broadcast System
window.EmergencyBroadcast = {
    isActive: false,
    
    async checkForBroadcast() {
        try {
            const response = await fetch('./api/load.php?type=emergency_broadcast');
            const data = await response.json();
            
            if (data && data.active && !this.isActive) {
                this.showBroadcast(data);
            }
        } catch (error) {
            console.error('Error checking emergency broadcast:', error);
        }
    },
    
    showBroadcast(broadcastData) {
        this.isActive = true;
        
        const overlay = document.createElement('div');
        overlay.id = 'emergencyOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, rgba(220, 38, 38, 0.95), rgba(239, 68, 68, 0.9));
            backdrop-filter: blur(10px);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: emergencyPulse 2s ease-in-out infinite;
        `;
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(20, 20, 20, 0.9));
            border: 3px solid #dc2626;
            border-radius: 25px;
            padding: 50px;
            max-width: 650px;
            width: 90%;
            text-align: center;
            box-shadow: 0 0 60px rgba(220, 38, 38, 0.9), inset 0 0 30px rgba(220, 38, 38, 0.1);
            animation: emergencyShake 0.5s ease-in-out;
            backdrop-filter: blur(15px);
        `;
        
        modal.innerHTML = `
            <div style="margin-bottom: 30px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #dc2626; margin-bottom: 20px; animation: emergencyBlink 1s ease-in-out infinite;"></i>
                <h1 style="color: #dc2626; font-size: 2.5rem; margin: 0 0 10px 0; text-shadow: 0 0 10px rgba(220, 38, 38, 0.5);">EMERGENCY BROADCAST</h1>
                <p style="color: #ff6b6b; font-size: 1.2rem; margin: 0;">URGENT STAFF NOTIFICATION</p>
            </div>
            
            <div style="background: rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 30px; margin: 30px 0; border: 2px solid rgba(220, 38, 38, 0.3);">
                <h2 style="color: white; margin: 0 0 20px 0; font-size: 1.8rem;">${broadcastData.title || 'Emergency Notice'}</h2>
                <p style="color: rgba(255, 255, 255, 0.9); font-size: 1.1rem; line-height: 1.6; margin: 0;">${broadcastData.message || 'Emergency broadcast message'}</p>
                ${broadcastData.timestamp ? `<p style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; margin: 20px 0 0 0;">Issued: ${new Date(broadcastData.timestamp).toLocaleString()}</p>` : ''}
            </div>
            
            <div style="margin: 30px 0;">
                <label style="display: flex; align-items: center; justify-content: center; gap: 10px; color: white; font-size: 1.1rem; cursor: pointer;">
                    <input type="checkbox" id="emergencyAcknowledge" style="width: 20px; height: 20px; accent-color: #dc2626;">
                    <span>I have read and understood this emergency message</span>
                </label>
            </div>
            
            <button id="emergencyContinue" disabled style="
                background: linear-gradient(135deg, #dc2626, #991b1b);
                color: white;
                border: none;
                padding: 18px 45px;
                border-radius: 50px;
                font-size: 1.3rem;
                font-weight: 700;
                cursor: not-allowed;
                opacity: 0.5;
                transition: all 0.4s ease;
                box-shadow: 0 10px 30px rgba(220, 38, 38, 0.4);
                text-transform: uppercase;
                letter-spacing: 1px;
            ">Continue to Sharepoint</button>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes emergencyPulse {
                0%, 100% { background: linear-gradient(135deg, rgba(220, 38, 38, 0.95), rgba(239, 68, 68, 0.9)); }
                50% { background: linear-gradient(135deg, rgba(239, 68, 68, 0.98), rgba(220, 38, 38, 0.95)); }
            }
            @keyframes emergencyShake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
            @keyframes emergencyBlink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
            }
        `;
        document.head.appendChild(style);
        
        // Handle acknowledgment checkbox
        const checkbox = document.getElementById('emergencyAcknowledge');
        const continueBtn = document.getElementById('emergencyContinue');
        
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                continueBtn.disabled = false;
                continueBtn.style.cursor = 'pointer';
                continueBtn.style.opacity = '1';
                continueBtn.style.transform = 'scale(1.05)';
            } else {
                continueBtn.disabled = true;
                continueBtn.style.cursor = 'not-allowed';
                continueBtn.style.opacity = '0.5';
                continueBtn.style.transform = 'scale(1)';
            }
        });
        
        continueBtn.addEventListener('click', () => {
            if (checkbox.checked) {
                this.dismissBroadcast(broadcastData.id);
            }
        });
    },
    
    async dismissBroadcast(broadcastId) {
        try {
            // Mark as read for this user
            await fetch('./api/save.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    type: 'acknowledge_emergency_broadcast', 
                    broadcastId: broadcastId 
                })
            });
            
            // Remove overlay
            const overlay = document.getElementById('emergencyOverlay');
            if (overlay) {
                overlay.style.animation = 'fadeOut 0.5s ease-out';
                setTimeout(() => {
                    overlay.remove();
                    this.isActive = false;
                }, 500);
            }
        } catch (error) {
            console.error('Error dismissing broadcast:', error);
        }
    },
    
    // Initialize checking
    init() {
        this.checkForBroadcast();
        // Check every 30 seconds for new broadcasts
        setInterval(() => this.checkForBroadcast(), 30000);
    }
};

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.EmergencyBroadcast.init();
});