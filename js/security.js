class SecuritySystem {
    constructor() {
        this.SECURITY_WEBHOOK = 'https://discord.com/api/webhooks/1425515405513855067/sf52yCMSFc6EZgHzJLWHheoUhCbKt12Nf7GF5sUhCRq26EyrClQbALK7neJQGCvjm37T';
        this.init();
    }

    init() {
        this.detectSuspiciousActivity();
        this.monitorConsoleAccess();
        this.trackUserActions();
        this.detectBruteForce();
        this.monitorDevTools();
    }

    async detectSuspiciousActivity() {
        // Monitor multiple failed auth attempts
        let failedAttempts = 0;
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const response = await originalFetch.apply(window, args);
            
            if (args[0].includes('auth.php')) {
                if (!response.ok) {
                    failedAttempts++;
                    if (failedAttempts >= 3) {
                        this.sendSecurityAlert('Brute Force Attack Detected', {
                            attempts: failedAttempts,
                            ip: await this.getClientIP(),
                            userAgent: navigator.userAgent
                        });
                    }
                } else {
                    failedAttempts = 0;
                }
            }
            
            return response;
        };
    }

    monitorConsoleAccess() {
        // Detect unauthorized script injection
        const originalEval = window.eval;
        window.eval = (...args) => {
            this.sendSecurityAlert('Script Injection Attempt', {
                user: this.getCurrentUser()?.robloxUsername || 'Anonymous',
                script: String(args[0]).substring(0, 200)
            });
            return originalEval.apply(window, args);
        };
    }

    trackUserActions() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('button[onclick*="delete"], button[onclick*="ban"], button[onclick*="suspend"], button[onclick*="approve"]')) {
                this.sendSecurityAlert('Critical Action Performed', {
                    action: e.target.textContent.trim(),
                    user: this.getCurrentUser()?.robloxUsername || 'Anonymous',
                    timestamp: new Date().toISOString()
                });
            }
        });
    }

    detectBruteForce() {
        let requestCount = 0;
        const startTime = Date.now();
        
        setInterval(() => {
            if (requestCount > 50 && (Date.now() - startTime) < 60000) {
                this.sendSecurityAlert('Potential DDoS Attack', {
                    requests: requestCount,
                    timeframe: '1 minute',
                    user: this.getCurrentUser()?.robloxUsername || 'Anonymous'
                });
            }
            requestCount = 0;
        }, 60000);
        
        const originalFetch = window.fetch;
        window.fetch = (...args) => {
            requestCount++;
            return originalFetch.apply(window, args);
        };
    }
    
    monitorDevTools() {
        let devtools = {open: false, orientation: null};
        const threshold = 160;
        
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > threshold || 
                window.outerWidth - window.innerWidth > threshold) {
                if (!devtools.open) {
                    devtools.open = true;
                    this.sendSecurityAlert('Developer Tools Opened', {
                        user: this.getCurrentUser()?.robloxUsername || 'Anonymous',
                        timestamp: new Date().toISOString()
                    });
                }
            } else {
                devtools.open = false;
            }
        }, 500);
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