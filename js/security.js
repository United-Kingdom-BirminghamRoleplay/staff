class SecuritySystem {
    constructor() {
        this.SECURITY_WEBHOOK = 'https://discord.com/api/webhooks/1425515405513855067/sf52yCMSFc6EZgHzJLWHheoUhCbKt12Nf7GF5sUhCRq26EyrClQbALK7neJQGCvjm37T';
        this.sessionId = this.generateSessionId();
        this.deviceFingerprint = this.generateDeviceFingerprint();
        this.threatLevel = 'LOW';
        this.blockedIPs = new Set();
        this.suspiciousPatterns = new Map();
        this.init();
    }

    init() {
        this.detectSuspiciousActivity();
        this.monitorConsoleAccess();
        this.trackUserActions();
        this.detectBruteForce();
        this.monitorDevTools();
        this.implementCSP();
        this.detectXSS();
        this.monitorNetworkRequests();
        this.detectSessionHijacking();
        this.implementRateLimiting();
        this.startThreatIntelligence();
    }

    generateSessionId() {
        return 'sec_' + Date.now() + '_' + crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
    }

    generateDeviceFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('UKBRUM Security', 2, 2);
        
        return btoa(JSON.stringify({
            screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            platform: navigator.platform,
            canvas: canvas.toDataURL(),
            webgl: this.getWebGLFingerprint(),
            audio: this.getAudioFingerprint(),
            fonts: this.getFontFingerprint()
        }));
    }

    getWebGLFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return 'unavailable';
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        } catch (e) {
            return 'error';
        }
    }

    getAudioFingerprint() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const analyser = audioContext.createAnalyser();
            const gainNode = audioContext.createGain();
            oscillator.connect(analyser);
            analyser.connect(gainNode);
            gainNode.connect(audioContext.destination);
            return audioContext.sampleRate.toString();
        } catch (e) {
            return 'unavailable';
        }
    }

    getFontFingerprint() {
        const testFonts = ['Arial', 'Helvetica', 'Times', 'Courier', 'Verdana', 'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS', 'Arial Black', 'Impact'];
        const testString = 'mmmmmmmmmmlli';
        const testSize = '72px';
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        context.textBaseline = 'top';
        context.font = testSize + ' monospace';
        const defaultWidth = context.measureText(testString).width;
        
        return testFonts.filter(font => {
            context.font = testSize + ' ' + font + ', monospace';
            return context.measureText(testString).width !== defaultWidth;
        }).join(',');
    }

    async detectSuspiciousActivity() {
        let failedAttempts = 0;
        let suspiciousRequests = 0;
        const clientIP = await this.getClientIP();
        
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const url = args[0];
            const startTime = Date.now();
            
            try {
                const response = await originalFetch.apply(window, args);
                const responseTime = Date.now() - startTime;
                
                // Monitor auth attempts
                if (url.includes('auth.php')) {
                    if (!response.ok) {
                        failedAttempts++;
                        this.logSecurityEvent('FAILED_LOGIN_ATTEMPT', {
                            attempts: failedAttempts,
                            ip: clientIP,
                            responseTime
                        });
                        
                        if (failedAttempts >= 5) {
                            this.escalateThreat('BRUTE_FORCE_DETECTED', {
                                totalAttempts: failedAttempts,
                                ip: clientIP
                            });
                            this.blockedIPs.add(clientIP);
                        }
                    } else {
                        failedAttempts = 0;
                    }
                }
                
                // Monitor API abuse
                if (url.includes('api/')) {
                    suspiciousRequests++;
                    if (suspiciousRequests > 100) {
                        this.escalateThreat('API_ABUSE_DETECTED', {
                            requests: suspiciousRequests,
                            timeframe: '5 minutes'
                        });
                    }
                }
                
                // Reset counters
                setTimeout(() => suspiciousRequests = Math.max(0, suspiciousRequests - 1), 3000);
                
                return response;
            } catch (error) {
                this.logSecurityEvent('NETWORK_ERROR', {
                    url: url,
                    error: error.message
                });
                throw error;
            }
        };
    }

    monitorConsoleAccess() {
        // Detect script injection
        const originalEval = window.eval;
        window.eval = (...args) => {
            this.escalateThreat('SCRIPT_INJECTION_ATTEMPT', {
                user: this.getCurrentUser()?.robloxUsername || 'Anonymous',
                script: String(args[0]).substring(0, 200),
                stackTrace: new Error().stack
            });
            throw new Error('Script execution blocked by security system');
        };
        
        // Monitor console commands
        const originalLog = console.log;
        console.log = (...args) => {
            this.logSecurityEvent('CONSOLE_ACCESS', {
                args: args.map(arg => String(arg).substring(0, 100)).join(', '),
                user: this.getCurrentUser()?.robloxUsername || 'Anonymous'
            });
            return originalLog.apply(console, args);
        };
        
        // Block dangerous functions
        ['alert', 'confirm', 'prompt'].forEach(func => {
            const original = window[func];
            window[func] = (...args) => {
                this.logSecurityEvent('DANGEROUS_FUNCTION_CALL', {
                    function: func,
                    args: args.join(', ')
                });
                return original.apply(window, args);
            };
        });
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

    implementRateLimiting() {
        const requestCounts = new Map();
        const RATE_LIMIT = 60; // requests per minute
        
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const endpoint = args[0];
            const now = Date.now();
            const minute = Math.floor(now / 60000);
            
            if (!requestCounts.has(minute)) {
                requestCounts.clear();
                requestCounts.set(minute, 0);
            }
            
            const count = requestCounts.get(minute) + 1;
            requestCounts.set(minute, count);
            
            if (count > RATE_LIMIT) {
                this.escalateThreat('RATE_LIMIT_EXCEEDED', {
                    requests: count,
                    limit: RATE_LIMIT,
                    endpoint: endpoint
                });
                throw new Error('Rate limit exceeded');
            }
            
            return originalFetch.apply(window, args);
        };
    }
    
    monitorDevTools() {
        let devtools = {open: false, orientation: null};
        const threshold = 160;
        
        setInterval(() => {
            const heightDiff = window.outerHeight - window.innerHeight;
            const widthDiff = window.outerWidth - window.innerWidth;
            
            if (heightDiff > threshold || widthDiff > threshold) {
                if (!devtools.open) {
                    devtools.open = true;
                    this.escalateThreat('DEVELOPER_TOOLS_DETECTED', {
                        user: this.getCurrentUser()?.robloxUsername || 'Anonymous',
                        heightDiff,
                        widthDiff,
                        userAgent: navigator.userAgent
                    });
                }
            } else {
                devtools.open = false;
            }
        }, 1000);
        
        // Detect debugger statements
        const originalDebugger = window.debugger;
        Object.defineProperty(window, 'debugger', {
            get: () => {
                this.escalateThreat('DEBUGGER_DETECTED', {
                    user: this.getCurrentUser()?.robloxUsername || 'Anonymous'
                });
                return originalDebugger;
            }
        });
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
            const discordAuth = localStorage.getItem('discord_auth');
            if (discordAuth) {
                const auth = JSON.parse(discordAuth);
                return {
                    userId: auth.userId,
                    robloxUsername: auth.username,
                    discordUsername: auth.username + '#' + auth.discriminator,
                    rank: auth.rank
                };
            }
            return null;
        } catch {
            return null;
        }
    }

    implementCSP() {
        // Content Security Policy enforcement
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.tagName === 'SCRIPT' && !node.src) {
                        this.escalateThreat('INLINE_SCRIPT_BLOCKED', {
                            content: node.innerHTML.substring(0, 200)
                        });
                        node.remove();
                    }
                    if (node.tagName === 'IFRAME' && !node.src.startsWith(window.location.origin)) {
                        this.escalateThreat('EXTERNAL_IFRAME_BLOCKED', {
                            src: node.src
                        });
                        node.remove();
                    }
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    detectXSS() {
        // Monitor for XSS patterns
        const xssPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<iframe[^>]*>/gi
        ];
        
        const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
        Object.defineProperty(Element.prototype, 'innerHTML', {
            set: function(value) {
                if (typeof value === 'string') {
                    for (const pattern of xssPatterns) {
                        if (pattern.test(value)) {
                            window.securitySystem.escalateThreat('XSS_ATTEMPT_BLOCKED', {
                                content: value.substring(0, 200),
                                element: this.tagName
                            });
                            return;
                        }
                    }
                }
                originalInnerHTML.set.call(this, value);
            },
            get: originalInnerHTML.get
        });
    }

    monitorNetworkRequests() {
        // Monitor XMLHttpRequest
        const originalXHR = window.XMLHttpRequest;
        window.XMLHttpRequest = function() {
            const xhr = new originalXHR();
            const originalOpen = xhr.open;
            
            xhr.open = function(method, url, ...args) {
                if (!url.startsWith(window.location.origin) && !url.startsWith('https://api.ipify.org')) {
                    window.securitySystem.logSecurityEvent('EXTERNAL_REQUEST', {
                        method,
                        url,
                        origin: window.location.origin
                    });
                }
                return originalOpen.apply(this, [method, url, ...args]);
            };
            
            return xhr;
        };
    }

    detectSessionHijacking() {
        const storedFingerprint = localStorage.getItem('device_fingerprint');
        if (storedFingerprint && storedFingerprint !== this.deviceFingerprint) {
            this.escalateThreat('SESSION_HIJACKING_DETECTED', {
                storedFingerprint: storedFingerprint.substring(0, 50),
                currentFingerprint: this.deviceFingerprint.substring(0, 50)
            });
            this.forceLogout('Session hijacking detected');
        }
        localStorage.setItem('device_fingerprint', this.deviceFingerprint);
    }

    startThreatIntelligence() {
        // Check threat intelligence every 5 minutes
        setInterval(async () => {
            try {
                const response = await fetch('./api/security.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'check_threats' })
                });
                
                const threats = await response.json();
                if (threats.risk_level === 'high') {
                    this.threatLevel = 'HIGH';
                    this.escalateThreat('HIGH_THREAT_LEVEL', threats);
                }
            } catch (e) {
                this.logSecurityEvent('THREAT_INTEL_ERROR', { error: e.message });
            }
        }, 300000);
    }

    logSecurityEvent(type, data) {
        const event = {
            type,
            data,
            sessionId: this.sessionId,
            fingerprint: this.deviceFingerprint,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        // Send to advanced security system
        if (window.advancedSecurity) {
            window.advancedSecurity.logSecurityEvent(type, data);
        }
        
        // Save to database
        this.saveToDatabase(type, event);
    }

    escalateThreat(type, data) {
        this.threatLevel = 'HIGH';
        this.logSecurityEvent(type, data);
        this.sendSecurityAlert(type, data);
        
        // Auto-ban for critical threats
        const criticalThreats = ['BRUTE_FORCE_DETECTED', 'SCRIPT_INJECTION_ATTEMPT', 'SESSION_HIJACKING_DETECTED'];
        if (criticalThreats.includes(type)) {
            this.autoban(data);
        }
    }

    async autoban(data) {
        const ip = await this.getClientIP();
        try {
            await fetch('./api/save.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'ban_ip',
                    ip: ip,
                    reason: 'Automated security ban - Critical threat detected',
                    bannedBy: 'Security System'
                })
            });
        } catch (e) {
            console.error('Auto-ban failed:', e);
        }
    }

    forceLogout(reason) {
        this.logSecurityEvent('FORCED_LOGOUT', { reason });
        localStorage.clear();
        sessionStorage.clear();
        alert(`Security Alert: ${reason}`);
        window.location.href = 'login.html';
    }

    sendSecurityAlert(type, data) {
        const embed = {
            title: `🚨 CRITICAL SECURITY ALERT: ${type}`,
            color: 0xff0000,
            fields: Object.entries(data).map(([key, value]) => ({
                name: key.charAt(0).toUpperCase() + key.slice(1),
                value: String(value).substring(0, 1024),
                inline: true
            })),
            timestamp: new Date().toISOString(),
            footer: { text: 'UKBRUM Advanced Security System' }
        };

        fetch(this.SECURITY_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] })
        }).catch(() => {});
    }

    async saveToDatabase(type, data) {
        try {
            await fetch('./api/save.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'security_event',
                    event: {
                        type,
                        data,
                        sessionId: this.sessionId,
                        fingerprint: this.deviceFingerprint,
                        ip: await this.getClientIP(),
                        userAgent: navigator.userAgent,
                        url: window.location.href
                    }
                })
            });
        } catch (error) {
            console.error('Failed to save security event:', error);
        }
    }
}

// Initialize security system
window.securitySystem = new SecuritySystem();