// Security and Session Management
class SecurityManager {
    constructor() {
        this.SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours
        this.ACTIVITY_CHECK_INTERVAL = 60000; // 1 minute
        this.WEBHOOK_LOGGING = 'https://discord.com/api/webhooks/1425515491501412474/4W2uXzEixiv6jauOdFWjY6YPAN1afAZ1oTxu6o4wWVGDRovNb4DHJWMudPLFLZr02AVo';
        this.WEBHOOK_FORMS = 'https://discord.com/api/webhooks/1425515405513855067/sf52yCMSFc6EZgHzJLWHheoUhCbKt12Nf7GF5sUhCRq26EyrClQbALK7neJQGCvjm37T';
        this.lastActivity = Date.now();
        this.init();
    }

    init() {
        this.trackActivity();
        this.startSessionCheck();
        this.logSuspiciousActivity();
    }

    trackActivity() {
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, () => {
                this.lastActivity = Date.now();
            }, true);
        });
    }

    startSessionCheck() {
        setInterval(() => {
            const authData = localStorage.getItem('ukbrum_auth');
            if (authData) {
                const user = JSON.parse(authData);
                const sessionAge = Date.now() - user.loginTime;
                const inactiveTime = Date.now() - this.lastActivity;

                if (sessionAge > this.SESSION_TIMEOUT || inactiveTime > this.SESSION_TIMEOUT) {
                    this.forceLogout('Session timeout');
                }
            }
        }, this.ACTIVITY_CHECK_INTERVAL);
    }

    forceLogout(reason) {
        this.logActivity('FORCE_LOGOUT', { reason });
        localStorage.removeItem('ukbrum_auth');
        this.showNotification('Session expired. Please log in again.', 'warning');
        setTimeout(() => location.reload(), 2000);
    }

    logActivity(action, data = {}) {
        const authData = localStorage.getItem('ukbrum_auth');
        const user = authData ? JSON.parse(authData) : null;
        
        const logData = {
            timestamp: new Date().toISOString(),
            action,
            user: user ? user.rank : 'anonymous',
            ip: 'client-side',
            userAgent: navigator.userAgent,
            url: window.location.href,
            ...data
        };

        this.sendToWebhook(this.WEBHOOK_LOGGING, {
            embeds: [{
                title: `🔒 Security Log: ${action}`,
                color: action.includes('SUSPICIOUS') ? 0xff0000 : 0x00ff00,
                fields: [
                    { name: 'User', value: logData.user, inline: true },
                    { name: 'Action', value: action, inline: true },
                    { name: 'Time', value: logData.timestamp, inline: true },
                    { name: 'URL', value: logData.url, inline: false }
                ],
                footer: { text: 'UKBRUM Staff Security System' }
            }]
        });
    }

    logSuspiciousActivity() {
        // Monitor for suspicious patterns
        let rapidClicks = 0;
        let lastClickTime = 0;

        document.addEventListener('click', () => {
            const now = Date.now();
            if (now - lastClickTime < 100) {
                rapidClicks++;
                if (rapidClicks > 10) {
                    this.logActivity('SUSPICIOUS_RAPID_CLICKS', { count: rapidClicks });
                    rapidClicks = 0;
                }
            } else {
                rapidClicks = 0;
            }
            lastClickTime = now;
        });

        // Monitor console access
        let devtools = false;
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > 200 || window.outerWidth - window.innerWidth > 200) {
                if (!devtools) {
                    devtools = true;
                    this.logActivity('SUSPICIOUS_DEVTOOLS_OPEN');
                }
            } else {
                devtools = false;
            }
        }, 1000);
    }

    sendToWebhook(url, data) {
        console.log('Webhook attempt:', url, data);
        if (url && url !== 'YOUR_LOGGING_WEBHOOK_URL' && url !== 'YOUR_FORMS_WEBHOOK_URL') {
            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }).then(response => {
                console.log('Webhook response:', response.status);
            }).catch(error => {
                console.error('Webhook error:', error);
            });
        } else {
            console.log('Webhook not sent - placeholder URL');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 5000);
    }
}

// Initialize security manager
const securityManager = new SecurityManager();