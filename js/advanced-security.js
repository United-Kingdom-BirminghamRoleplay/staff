// Advanced Security System
class AdvancedSecurity {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.lastActivity = Date.now();
        this.failedAttempts = 0;
        this.deviceFingerprint = this.generateFingerprint();
        this.init();
    }

    init() {
        this.startSessionMonitoring();
        this.detectDeviceChanges();
        this.monitorSuspiciousActivity();
        this.enforceCSP();
    }

    generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
    }

    generateFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Security fingerprint', 2, 2);
        
        return btoa(JSON.stringify({
            screen: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            platform: navigator.platform,
            canvas: canvas.toDataURL(),
            plugins: Array.from(navigator.plugins).map(p => p.name).join(','),
            webgl: this.getWebGLFingerprint()
        }));
    }

    getWebGLFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl');
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        } catch (e) {
            return 'unknown';
        }
    }

    async logSecurityEvent(type, data) {
        const event = {
            type,
            data,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            fingerprint: this.deviceFingerprint,
            ip: await this.getClientIP(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        try {
            await fetch('./api/save.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'security_event',
                    event
                })
            });
        } catch (e) {
            console.error('Security logging failed:', e);
        }
    }

    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (e) {
            return 'unknown';
        }
    }

    startSessionMonitoring() {
        // Session timeout (30 minutes)
        setInterval(() => {
            if (Date.now() - this.lastActivity > 1800000) {
                this.logSecurityEvent('SESSION_TIMEOUT', {});
                this.forceLogout('Session expired');
            }
        }, 60000);

        // Activity tracking
        ['click', 'keypress', 'mousemove'].forEach(event => {
            document.addEventListener(event, () => {
                this.lastActivity = Date.now();
            }, { passive: true });
        });
    }

    detectDeviceChanges() {
        const storedFingerprint = localStorage.getItem('device_fingerprint');
        if (storedFingerprint && storedFingerprint !== this.deviceFingerprint) {
            this.logSecurityEvent('DEVICE_CHANGE', {
                old: storedFingerprint,
                new: this.deviceFingerprint
            });
            this.forceLogout('Device change detected');
        }
        localStorage.setItem('device_fingerprint', this.deviceFingerprint);
    }

    monitorSuspiciousActivity() {
        // Detect rapid requests
        let requestCount = 0;
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            requestCount++;
            if (requestCount > 50) {
                this.logSecurityEvent('RATE_LIMIT_EXCEEDED', { count: requestCount });
                throw new Error('Rate limit exceeded');
            }
            setTimeout(() => requestCount--, 60000);
            return originalFetch.apply(this, args);
        };

        // Detect developer tools
        let devtools = { open: false };
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > 200 || 
                window.outerWidth - window.innerWidth > 200) {
                if (!devtools.open) {
                    devtools.open = true;
                    this.logSecurityEvent('DEVTOOLS_OPENED', {});
                }
            } else {
                devtools.open = false;
            }
        }, 1000);

        // Detect console access
        const originalLog = console.log;
        console.log = (...args) => {
            this.logSecurityEvent('CONSOLE_ACCESS', { args: args.toString() });
            return originalLog.apply(console, args);
        };
    }

    enforceCSP() {
        // Prevent inline scripts
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.tagName === 'SCRIPT' && !node.src) {
                        this.logSecurityEvent('INLINE_SCRIPT_BLOCKED', { content: node.innerHTML });
                        node.remove();
                    }
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    async validateSession() {
        try {
            const response = await fetch('./api/security.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'validate_session',
                    sessionId: this.sessionId,
                    fingerprint: this.deviceFingerprint
                })
            });
            
            const result = await response.json();
            if (!result.valid) {
                this.forceLogout('Invalid session');
            }
            return result.valid;
        } catch (e) {
            this.logSecurityEvent('SESSION_VALIDATION_ERROR', { error: e.message });
            return false;
        }
    }

    forceLogout(reason) {
        this.logSecurityEvent('FORCED_LOGOUT', { reason });
        localStorage.clear();
        sessionStorage.clear();
        alert(`Security Alert: ${reason}. You will be logged out.`);
        window.location.href = 'login.html';
    }

    // Two-Factor Authentication
    async generateTOTP() {
        const secret = this.generateSecret();
        const qrCode = await this.generateQRCode(secret);
        return { secret, qrCode };
    }

    generateSecret() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let secret = '';
        for (let i = 0; i < 32; i++) {
            secret += chars[Math.floor(Math.random() * chars.length)];
        }
        return secret;
    }

    async generateQRCode(secret) {
        const user = newAuthSystem.getCurrentUser();
        const issuer = 'UKBRUM Staff Portal';
        const otpauth = `otpauth://totp/${issuer}:${user.robloxUsername}?secret=${secret}&issuer=${issuer}`;
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}`;
    }

    // Encryption utilities
    async encrypt(data, key) {
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(key),
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );
        
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const derivedKey = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt']
        );
        
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            derivedKey,
            encoder.encode(data)
        );
        
        return btoa(String.fromCharCode(...salt, ...iv, ...new Uint8Array(encrypted)));
    }
}

// Initialize advanced security
const advancedSecurity = new AdvancedSecurity();
window.advancedSecurity = advancedSecurity;