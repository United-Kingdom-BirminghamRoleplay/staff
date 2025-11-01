class SecuritySystem {
    constructor() {
        this.SECURITY_WEBHOOK = 'https://discord.com/api/webhooks/1425515405513855067/sf52yCMSFc6EZgHzJLWHheoUhCbKt12Nf7GF5sUhCRq26EyrClQbALK7neJQGCvjm37T';
        this.init();
    }

    init() {
        this.logPageAccess();
        this.detectSuspiciousActivity();
        this.monitorConsoleAccess();
        this.trackUserActions();
    }

    async logPageAccess() {
        const user = this.getCurrentUser();
        const pageInfo = {
            page: window.location.pathname,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            ip: await this.getClientIP(),
            user: user ? user.robloxUsername : 'Anonymous'
        };

        this.sendSecurityLog('Page Access', pageInfo, 0x3b82f6);
        this.saveToDatabase('page_access', pageInfo);
    }

    async detectSuspiciousActivity() {
        // Monitor rapid page changes
        let pageChanges = 0;
        const originalPushState = history.pushState;
        history.pushState = (...args) => {
            pageChanges++;
            if (pageChanges > 10) {
                this.sendSecurityAlert('Rapid Navigation Detected', {
                    changes: pageChanges,
                    user: this.getCurrentUser()?.robloxUsername || 'Anonymous'
                });
            }
            return originalPushState.apply(history, args);
        };

        // Monitor failed login attempts
        this.monitorFailedLogins();
    }

    monitorConsoleAccess() {
        const originalLog = console.log;
        console.log = (...args) => {
            if (args.some(arg => typeof arg === 'string' && arg.includes('auth'))) {
                this.sendSecurityAlert('Console Auth Access', {
                    user: this.getCurrentUser()?.robloxUsername || 'Anonymous',
                    args: args.map(a => String(a).substring(0, 100))
                });
            }
            return originalLog.apply(console, args);
        };
    }

    trackUserActions() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('button[onclick*="delete"], button[onclick*="ban"], button[onclick*="suspend"]')) {
                this.sendSecurityLog('Critical Action', {
                    action: e.target.textContent.trim(),
                    user: this.getCurrentUser()?.robloxUsername || 'Anonymous',
                    target: e.target.onclick?.toString().substring(0, 100)
                }, 0xff6b35);
            }
        });
    }

    monitorFailedLogins() {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const response = await originalFetch.apply(window, args);
            
            if (args[0].includes('auth.php') && !response.ok) {
                this.sendSecurityAlert('Failed Login Attempt', {
                    ip: await this.getClientIP(),
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent
                });
            }
            
            return response;
        };
    }

    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch {
            return 'Unknown';
        }
    }

    getCurrentUser() {
        try {
            const auth = localStorage.getItem('staff_auth') || localStorage.getItem('ukbrum_auth');
            return auth ? JSON.parse(auth) : null;
        } catch {
            return null;
        }
    }

    sendSecurityLog(type, data, color = 0xffd700) {
        const embed = {
            title: `🔒 Security Log: ${type}`,
            color: color,
            fields: Object.entries(data).map(([key, value]) => ({
                name: key.charAt(0).toUpperCase() + key.slice(1),
                value: String(value).substring(0, 1024),
                inline: true
            })),
            timestamp: new Date().toISOString(),
            footer: { text: 'Staff Security System' }
        };

        fetch(this.SECURITY_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] })
        }).catch(() => {});
    }

    sendSecurityAlert(type, data) {
        this.sendSecurityLog(type, data, 0xff0000);
    }

    async saveToDatabase(type, data) {
        try {
            await fetch('./api/save.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'security_log',
                    logType: type,
                    data: JSON.stringify(data)
                })
            });
        } catch (error) {
            console.error('Failed to save security log:', error);
        }
    }
}

// Initialize security system
window.securitySystem = new SecuritySystem();