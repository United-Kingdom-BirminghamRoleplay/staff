// Migration notification system
class MigrationNotification {
    constructor() {
        this.init();
    }
    
    init() {
        // Check if user has seen the migration notification
        const hasSeenNotification = localStorage.getItem('discord_migration_seen');
        
        if (!hasSeenNotification && window.discordAuth && window.discordAuth.isAuthenticated()) {
            this.showMigrationNotification();
        }
    }
    
    showMigrationNotification() {
        const notification = document.createElement('div');
        notification.className = 'migration-notification';
        notification.innerHTML = `
            <div class="migration-content">
                <div class="migration-header">
                    <i class="fab fa-discord"></i>
                    <h3>Welcome to Discord Authentication!</h3>
                    <button class="close-notification" onclick="migrationNotification.closeNotification()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="migration-body">
                    <p>🎉 Great news! We've successfully migrated to Discord OAuth for enhanced security.</p>
                    <ul>
                        <li>✅ No more passwords to remember</li>
                        <li>✅ Secure Discord-based authentication</li>
                        <li>✅ Your profile picture is now displayed</li>
                        <li>✅ Automatic role-based permissions</li>
                    </ul>
                    <p><strong>Note:</strong> Staff account approval is no longer needed - your Discord server roles determine your access level.</p>
                </div>
                <div class="migration-footer">
                    <button class="btn-understand" onclick="migrationNotification.closeNotification()">
                        Got it!
                    </button>
                </div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .migration-notification {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10004;
                animation: fadeIn 0.3s ease;
            }
            
            .migration-content {
                background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                border: 2px solid #5865F2;
                border-radius: 16px;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
                animation: slideInUp 0.4s ease;
            }
            
            .migration-header {
                background: linear-gradient(135deg, #5865F2 0%, #7289DA 100%);
                color: white;
                padding: 1.5rem;
                border-radius: 14px 14px 0 0;
                display: flex;
                align-items: center;
                gap: 1rem;
                position: relative;
            }
            
            .migration-header i {
                font-size: 1.5rem;
            }
            
            .migration-header h3 {
                margin: 0;
                flex: 1;
            }
            
            .close-notification {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 4px;
                transition: background 0.3s ease;
            }
            
            .close-notification:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .migration-body {
                padding: 1.5rem;
                color: #e2e8f0;
            }
            
            .migration-body p {
                margin-bottom: 1rem;
                line-height: 1.6;
            }
            
            .migration-body ul {
                margin: 1rem 0;
                padding-left: 1.5rem;
            }
            
            .migration-body li {
                margin-bottom: 0.5rem;
                color: #94a3b8;
            }
            
            .migration-footer {
                padding: 1rem 1.5rem;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                text-align: center;
            }
            
            .btn-understand {
                background: linear-gradient(135deg, #5865F2 0%, #7289DA 100%);
                color: white;
                border: none;
                padding: 0.75rem 2rem;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .btn-understand:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(88, 101, 242, 0.4);
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(30px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(notification);
    }
    
    closeNotification() {
        const notification = document.querySelector('.migration-notification');
        if (notification) {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
        
        // Mark as seen
        localStorage.setItem('discord_migration_seen', 'true');
    }
}

// Add fadeOut animation
const fadeOutStyle = document.createElement('style');
fadeOutStyle.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(fadeOutStyle);

// Initialize migration notification
window.migrationNotification = new MigrationNotification();