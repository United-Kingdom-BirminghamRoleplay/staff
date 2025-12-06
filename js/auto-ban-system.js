// Automatic Ban System - Tracks suspicious behavior and auto-bans users
class AutoBanSystem {
    constructor() {
        this.suspiciousActions = new Map();
        this.thresholds = {
            rapidClicks: { count: 50, timeWindow: 10000, severity: 'high' },
            rapidPageChanges: { count: 20, timeWindow: 5000, severity: 'medium' },
            suspiciousKeywords: { count: 5, timeWindow: 30000, severity: 'high' },
            failedActions: { count: 10, timeWindow: 60000, severity: 'medium' },
            unauthorizedAccess: { count: 3, timeWindow: 60000, severity: 'critical' }
        };
        this.init();
    }

    init() {
        this.trackClicks();
        this.trackPageChanges();
        this.trackFormSubmissions();
        this.trackConsoleUsage();
    }

    trackClicks() {
        let clickCount = 0;
        let clickTimer = null;

        document.addEventListener('click', () => {
            clickCount++;
            
            if (!clickTimer) {
                clickTimer = setTimeout(() => {
                    clickCount = 0;
                    clickTimer = null;
                }, this.thresholds.rapidClicks.timeWindow);
            }

            if (clickCount >= this.thresholds.rapidClicks.count) {
                this.logSuspiciousActivity('rapidClicks', 'Excessive clicking detected');
            }
        });
    }

    trackPageChanges() {
        let pageChangeCount = 0;
        let pageTimer = null;
        let lastPage = window.location.href;

        setInterval(() => {
            if (window.location.href !== lastPage) {
                pageChangeCount++;
                lastPage = window.location.href;

                if (!pageTimer) {
                    pageTimer = setTimeout(() => {
                        pageChangeCount = 0;
                        pageTimer = null;
                    }, this.thresholds.rapidPageChanges.timeWindow);
                }

                if (pageChangeCount >= this.thresholds.rapidPageChanges.count) {
                    this.logSuspiciousActivity('rapidPageChanges', 'Rapid page navigation detected');
                }
            }
        }, 100);
    }

    trackFormSubmissions() {
        document.addEventListener('submit', (e) => {
            const form = e.target;
            const inputs = form.querySelectorAll('input, textarea');
            
            inputs.forEach(input => {
                const value = input.value.toLowerCase();
                const suspiciousKeywords = ['<script', 'javascript:', 'onerror=', 'onclick=', 'eval(', 'alert(', 'drop table', 'union select', '../', 'etc/passwd'];
                
                if (suspiciousKeywords.some(keyword => value.includes(keyword))) {
                    this.logSuspiciousActivity('suspiciousKeywords', `Suspicious input detected: ${input.name}`);
                }
            });
        });
    }

    trackConsoleUsage() {
        const originalConsole = { ...console };
        let consoleUsageCount = 0;
        let consoleTimer = null;

        ['log', 'warn', 'error'].forEach(method => {
            console[method] = (...args) => {
                consoleUsageCount++;
                
                if (!consoleTimer) {
                    consoleTimer = setTimeout(() => {
                        consoleUsageCount = 0;
                        consoleTimer = null;
                    }, 30000);
                }

                if (consoleUsageCount > 50) {
                    this.logSuspiciousActivity('excessiveConsoleUsage', 'Excessive console usage detected');
                }

                originalConsole[method](...args);
            };
        });
    }

    async logSuspiciousActivity(type, description) {
        const user = window.discordAuth?.getCurrentUser();
        if (!user) return;

        const key = `${user.username}_${type}`;
        const existing = this.suspiciousActions.get(key) || { count: 0, firstSeen: Date.now() };
        existing.count++;

        this.suspiciousActions.set(key, existing);

        const threshold = this.thresholds[type];
        if (existing.count >= threshold.count) {
            await this.autoBan(user, type, description, threshold.severity);
        }
    }

    async autoBan(user, violationType, description, severity) {
        try {
            const banReason = `AUTO-BAN: ${violationType} - ${description}`;
            
            // Ban the user
            const banResponse = await fetch('./api/save.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'ban_user',
                    username: user.username,
                    reason: banReason,
                    bannedBy: 'Auto-Ban System',
                    anonymous: false
                })
            });

            const banResult = await banResponse.json();
            
            if (banResult.success) {
                // Send webhook notification
                await this.sendBanNotification(user, violationType, description, severity);
                
                // Redirect to blocked page
                window.location.href = `access-blocked.html?reason=${encodeURIComponent(banReason)}&bannedBy=Auto-Ban System`;
            }
        } catch (error) {
            console.error('Auto-ban error:', error);
        }
    }

    async sendBanNotification(user, violationType, description, severity) {
        const severityColors = {
            low: 0x3b82f6,
            medium: 0xfbbf24,
            high: 0xf97316,
            critical: 0xef4444
        };

        const webhookData = {
            embeds: [{
                title: '🤖 Automatic Ban Triggered',
                color: severityColors[severity] || 0xef4444,
                fields: [
                    { name: 'User', value: user.username, inline: true },
                    { name: 'User ID', value: user.userId, inline: true },
                    { name: 'Severity', value: severity.toUpperCase(), inline: true },
                    { name: 'Violation Type', value: violationType, inline: true },
                    { name: 'Description', value: description, inline: false },
                    { name: 'Action Required', value: 'Review this ban in the Admin Panel and decide whether to keep or remove it.', inline: false }
                ],
                footer: { text: 'Auto-Ban System' },
                timestamp: new Date().toISOString()
            }]
        };

        await fetch('https://discord.com/api/webhooks/1442957109896675590/2uKYJXKuTl0wPyMxk_BFLaTVf7gMW4lnfpH_tNVKDSyfMxteEo33QgpsqPP1Kq4MFfxH', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(webhookData)
        });
    }

    trackFailedAction(actionType) {
        const user = window.discordAuth?.getCurrentUser();
        if (!user) return;

        this.logSuspiciousActivity('failedActions', `Failed action: ${actionType}`);
    }

    trackUnauthorizedAccess(resource) {
        const user = window.discordAuth?.getCurrentUser();
        if (!user) return;

        this.logSuspiciousActivity('unauthorizedAccess', `Attempted to access: ${resource}`);
    }
}

// Initialize auto-ban system
window.autoBanSystem = new AutoBanSystem();
