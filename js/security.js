class SecuritySystem {
    constructor() {
        this.SECURITY_WEBHOOK = 'https://discord.com/api/webhooks/1425515405513855067/sf52yCMSFc6EZgHzJLWHheoUhCbKt12Nf7GF5sUhCRq26EyrClQbALK7neJQGCvjm37T';
        this.sessionId = this.generateSessionId();
        this.deviceFingerprint = this.generateDeviceFingerprint();
        this.threatLevel = 'LOW';
        this.blockedIPs = new Set();
        this.suspiciousPatterns = new Map();
        this.attackPatterns = new Map();
        this.locationData = null;
        this.init();
        this.getLocationData();
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
        let requestCounts = new Map();
        let sqlInjectionAttempts = 0;
        let xssAttempts = 0;
        const clientIP = await this.getClientIP();
        
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const url = args[0];
            const startTime = Date.now();
            const minute = Math.floor(startTime / 60000);
            
            // Track requests per minute
            if (!requestCounts.has(minute)) {
                requestCounts.clear();
                requestCounts.set(minute, 0);
            }
            
            const count = requestCounts.get(minute) + 1;
            requestCounts.set(minute, count);
            
            // DDoS Detection - Multiple thresholds
            if (count > 200) {
                this.detectCyberAttack('DDOS_ATTACK', {
                    requests: count,
                    timeframe: '1 minute',
                    severity: 'CRITICAL'
                });
                this.temporaryBlock(clientIP, 'DDoS Attack Detected');
                throw new Error('DDoS attack detected - IP temporarily blocked');
            } else if (count > 100) {
                this.detectCyberAttack('POTENTIAL_DDOS', {
                    requests: count,
                    timeframe: '1 minute',
                    severity: 'HIGH'
                });
            }
            
            // Check request body for attack patterns
            if (args[1] && args[1].body) {
                const body = typeof args[1].body === 'string' ? args[1].body : JSON.stringify(args[1].body);
                
                // SQL Injection Detection
                const sqlPatterns = [/union.*select/i, /drop.*table/i, /insert.*into/i, /delete.*from/i, /update.*set/i, /exec.*xp_/i];
                if (sqlPatterns.some(pattern => pattern.test(body))) {
                    sqlInjectionAttempts++;
                    this.detectCyberAttack('SQL_INJECTION_ATTEMPT', {
                        attempts: sqlInjectionAttempts,
                        payload: body.substring(0, 200),
                        severity: 'CRITICAL'
                    });
                    if (sqlInjectionAttempts >= 3) {
                        this.temporaryBlock(clientIP, 'SQL Injection Attempts');
                    }
                }
                
                // XSS Detection
                const xssPatterns = [/<script/i, /javascript:/i, /onerror=/i, /onload=/i, /eval\(/i];
                if (xssPatterns.some(pattern => pattern.test(body))) {
                    xssAttempts++;
                    this.detectCyberAttack('XSS_ATTACK_ATTEMPT', {
                        attempts: xssAttempts,
                        payload: body.substring(0, 200),
                        severity: 'HIGH'
                    });
                    if (xssAttempts >= 3) {
                        this.temporaryBlock(clientIP, 'XSS Attack Attempts');
                    }
                }
            }
            
            try {
                const response = await originalFetch.apply(window, args);
                const responseTime = Date.now() - startTime;
                
                // Monitor auth attempts
                if (url.includes('auth.php')) {
                    if (!response.ok) {
                        failedAttempts++;
                        if (failedAttempts >= 5) {
                            this.detectCyberAttack('BRUTE_FORCE_ATTACK', {
                                totalAttempts: failedAttempts,
                                targetEndpoint: 'Authentication',
                                severity: 'HIGH'
                            });
                            this.temporaryBlock(clientIP, 'Brute Force Attack');
                        }
                    } else {
                        failedAttempts = 0;
                    }
                }
                
                // Monitor for suspicious response patterns
                if (response.status === 429) {
                    this.detectCyberAttack('RATE_LIMIT_ABUSE', {
                        endpoint: url,
                        severity: 'MEDIUM'
                    });
                }
                
                return response;
            } catch (error) {
                if (error.message.includes('blocked')) {
                    throw error;
                }
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
        // Client-side rate limiting is now handled in detectSuspiciousActivity
        // Server-side rate limiting is handled by rate-limiter.php
        
        // Add request queuing to prevent overwhelming the server
        this.requestQueue = [];
        this.processingQueue = false;
        
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            return new Promise((resolve, reject) => {
                this.requestQueue.push({ args, resolve, reject });
                this.processQueue();
            });
        };
    }
    
    async processQueue() {
        if (this.processingQueue || this.requestQueue.length === 0) return;
        
        this.processingQueue = true;
        
        while (this.requestQueue.length > 0) {
            const { args, resolve, reject } = this.requestQueue.shift();
            
            try {
                const response = await fetch.apply(window, args);
                resolve(response);
            } catch (error) {
                reject(error);
            }
            
            // Add small delay between requests to prevent overwhelming
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        this.processingQueue = false;
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
        return 'hidden';
    }
    
    async getLocationData() {
        this.locationData = { city: 'Hidden', region: 'Hidden', country: 'Hidden' };
    }

    getCurrentUser() {
        try {
            if (window.discordAuth && window.discordAuth.isAuthenticated()) {
                const user = window.discordAuth.getCurrentUser();
                return {
                    userId: user.userId,
                    robloxUsername: user.username,
                    discordUsername: user.username + '#' + user.discriminator,
                    rank: user.rank
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
        // Disabled to prevent fetch errors
        return;
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

    detectCyberAttack(attackType, data) {
        const attackData = {
            ...data,
            page: window.location.pathname,
            fullUrl: window.location.href,
            ip: this.getClientIP(),
            location: this.locationData ? `${this.locationData.city}, ${this.locationData.region}, ${this.locationData.country}` : 'Unknown',
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };
        
        this.threatLevel = 'HIGH';
        this.logSecurityEvent(attackType, attackData);
        this.sendCyberAttackAlert(attackType, attackData);
        
        // Auto-block for critical attacks
        const criticalAttacks = ['DDOS_ATTACK', 'SQL_INJECTION_ATTEMPT', 'BRUTE_FORCE_ATTACK'];
        if (criticalAttacks.includes(attackType)) {
            this.temporaryBlock(attackData.ip, attackType);
        }
    }
    
    async temporaryBlock(ip, reason) {
        this.blockedIPs.add(ip);
        
        // Save temporary block to server (non-blocking)
        fetch('./api/save.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'temporary_block',
                ip: ip,
                reason: reason,
                duration: 1800
            })
        }).catch(() => {});
        
        this.showBlockMessage(reason);
    }
    
    showBlockMessage(reason) {
        window.location.href = 'banned.html';
    }
    
    escalateThreat(type, data) {
        this.detectCyberAttack(type, data);
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

    sendCyberAttackAlert(attackType, data) {
        const alertKey = `attack_${attackType}`;
        const lastAlert = this.lastAlerts?.get(alertKey) || 0;
        const now = Date.now();
        
        if (!this.lastAlerts) {
            this.lastAlerts = new Map();
        }
        
        if (now - lastAlert < 180000) { // 3 minutes for cyber attacks
            return;
        }
        
        this.lastAlerts.set(alertKey, now);
        
        const embed = {
            title: `🚨 CYBER ATTACK DETECTED: ${attackType}`,
            color: attackType.includes('DDOS') ? 0xff0000 : attackType.includes('SQL') ? 0xff6600 : 0xffaa00,
            fields: [
                { name: '🌐 Page', value: data.page || 'Unknown', inline: true },
                { name: '🌍 Location', value: data.location || 'Unknown', inline: true },
                { name: '📍 IP Address', value: data.ip || 'Unknown', inline: true },
                { name: '⚠️ Severity', value: data.severity || 'UNKNOWN', inline: true },
                { name: '🔗 Full URL', value: data.fullUrl || 'Unknown', inline: false },
                { name: '📊 Attack Data', value: JSON.stringify(data).substring(0, 500), inline: false }
            ],
            timestamp: new Date().toISOString(),
            footer: { text: 'UKBRUM Advanced Cyber Security' }
        };

        fetch(this.SECURITY_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] })
        }).catch(() => {});
    }
    
    sendSecurityAlert(type, data) {
        this.sendCyberAttackAlert(type, data);
    }

    async saveToDatabase(type, data) {
        // Batch security events to reduce requests
        if (!this.eventBatch) {
            this.eventBatch = [];
        }
        
        this.eventBatch.push({
            type,
            data,
            sessionId: this.sessionId,
            fingerprint: this.deviceFingerprint,
            timestamp: Date.now(),
            url: window.location.href
        });
        
        // Send batch every 30 seconds or when it reaches 10 events
        if (this.eventBatch.length >= 10 || !this.batchTimer) {
            this.sendEventBatch();
        }
        
        if (!this.batchTimer) {
            this.batchTimer = setTimeout(() => {
                this.sendEventBatch();
            }, 30000);
        }
    }
    
    async sendEventBatch() {
        if (!this.eventBatch || this.eventBatch.length === 0) return;
        
        const batch = [...this.eventBatch];
        this.eventBatch = [];
        
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = null;
        }
        
        // Non-blocking send
        fetch('./api/save.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'security_event_batch',
                events: batch,
                ip: await this.getClientIP(),
                userAgent: navigator.userAgent
            })
        }).catch(() => {});
    }
}

// Initialize security system
window.securitySystem = new SecuritySystem();