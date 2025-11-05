// Dynamic Component Loader with request optimization
let componentCache = new Map();
let loadingComponents = new Set();

async function loadComponent(elementId, componentPath) {
    try {
        // Prevent duplicate requests
        if (loadingComponents.has(componentPath)) {
            return;
        }
        
        // Check cache first
        if (componentCache.has(componentPath)) {
            document.getElementById(elementId).innerHTML = componentCache.get(componentPath);
            handleComponentLoaded(componentPath);
            return;
        }
        
        loadingComponents.add(componentPath);
        
        const response = await fetch(componentPath);
        const html = await response.text();
        
        // Cache the component
        componentCache.set(componentPath, html);
        
        document.getElementById(elementId).innerHTML = html;
        handleComponentLoaded(componentPath);
        
    } catch (error) {
        console.error('Failed to load component:', error);
    } finally {
        loadingComponents.delete(componentPath);
    }
}

function handleComponentLoaded(componentPath) {
    if (componentPath.includes('sidebar')) {
        setActiveNavLink();
        
        // Show navigation based on user permissions
        setTimeout(() => {
            if (window.discordAuth && window.discordAuth.isAuthenticated()) {
                populateUserProfile();
                
                const user = window.discordAuth.getCurrentUser();
                const userRank = user.rank;
                
                // Show founder-only links (rank 8 and 9 only)
                if (userRank === 8 || userRank === 9) {
                    const founderLinks = document.querySelectorAll('.founder-only');
                    founderLinks.forEach(link => link.style.display = 'block');
                }
                
                // Show HR+ links (rank 3+)
                if (userRank >= 3) {
                    const hrLinks = document.querySelectorAll('.hr-only');
                    hrLinks.forEach(link => link.style.display = 'block');
                }
            }
        }, 100);
    }
}

function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
}

function populateUserProfile() {
    if (!window.discordAuth || !window.discordAuth.isAuthenticated()) return;
    
    const discordUser = window.discordAuth.getCurrentUser();
    const sidebarUser = document.getElementById('sidebarUser');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userRank = document.getElementById('userRank');
    
    if (sidebarUser && discordUser) {
        sidebarUser.style.display = 'block';
        
        if (userAvatar) {
            const avatarUrl = discordUser.avatar || `https://cdn.discordapp.com/embed/avatars/${discordUser.discriminator % 5}.png`;
            userAvatar.src = avatarUrl;
            userAvatar.onerror = () => {
                userAvatar.src = `https://cdn.discordapp.com/embed/avatars/${discordUser.discriminator % 5}.png`;
            };
        }
        
        if (userName) {
            userName.textContent = discordUser.username;
        }
        
        if (userRank) {
            const rankNames = {
                1: 'Moderation',
                2: 'Administration', 
                3: 'Human Resources',
                4: 'Oversight & Enforcement',
                5: 'Advisory Board',
                6: 'Assistant Founder',
                7: 'Co-Founder',
                8: 'Founder',
                9: 'Developer'
            };
            userRank.textContent = rankNames[discordUser.rank] || 'Staff';
        }
    }
}

// Optimized page loading with request batching
let initializationPromise = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (initializationPromise) {
        return initializationPromise;
    }
    
    initializationPromise = initializePage();
    return initializationPromise;
});

async function initializePage() {
    try {
        // Batch component loading
        await Promise.all([
            loadComponent('sidebar-container', 'sidebar.html'),
            loadComponent('footer-container', 'footer.html')
        ]);
        
        // Batch API calls with delay to prevent overwhelming
        const apiCalls = [];
        
        // Track IP access (reduced frequency)
        if (!sessionStorage.getItem('ip_tracked_' + Date.now().toString().slice(0, -5))) {
            apiCalls.push(
                fetch('./api/ip-tracker.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user: window.newAuthSystem?.getCurrentUser()?.rank || null })
                }).then(() => {
                    sessionStorage.setItem('ip_tracked_' + Date.now().toString().slice(0, -5), 'true');
                }).catch(error => console.error('IP tracking failed:', error))
            );
        }
        
        // Check for party mode (cached for 5 minutes)
        const partyModeKey = 'party_mode_check';
        const lastCheck = localStorage.getItem(partyModeKey);
        const now = Date.now();
        
        if (!lastCheck || (now - parseInt(lastCheck)) > 300000) {
            apiCalls.push(
                fetch('./api/load_db.php?type=website_control')
                    .then(response => response.json())
                    .then(data => {
                        localStorage.setItem(partyModeKey, now.toString());
                        if (data.party_mode) {
                            activateGlobalPartyMode();
                        }
                    })
                    .catch(error => console.log('Party mode check failed'))
            );
        }
        
        // Execute API calls with staggered timing
        for (let i = 0; i < apiCalls.length; i++) {
            setTimeout(() => apiCalls[i], i * 200);
        }
        
        // Show navigation based on user permissions
        setTimeout(() => {
            if (window.discordAuth && window.discordAuth.isAuthenticated()) {
                populateUserProfile();
                
                const user = window.discordAuth.getCurrentUser();
                const userRank = user.rank;
                
                // Show founder-only links (rank 8 and 9 only)
                if (userRank === 8 || userRank === 9) {
                    const founderLinks = document.querySelectorAll('.founder-only');
                    founderLinks.forEach(link => link.style.display = 'block');
                }
                
                // Show HR+ links (rank 3+)
                if (userRank >= 3) {
                    const hrLinks = document.querySelectorAll('.hr-only');
                    hrLinks.forEach(link => link.style.display = 'block');
                }
            }
        }, 200);
        
    } catch (error) {
        console.error('Page initialization failed:', error);
    }
}

// Security measures
const Security = {
    init() {
        this.preventRightClick();
        this.preventDevTools();
        this.addCSP();
        this.validateSession();
    },
    
    preventRightClick() {
        // Disabled for better user experience
    },
    
    preventDevTools() {
        // Disabled for better user experience
    },
    
    addCSP() {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data:; connect-src 'self' https://discord.com;";
        document.head.appendChild(meta);
    },
    
    validateSession() {
        if (window.newAuthSystem && !newAuthSystem.isAuthenticated() && !newAuthSystem.isPublicPage()) {
            // Redirect to login if not authenticated
            console.log('Session validation required');
        }
    }
};

// Initialize security
Security.init();

// Global party mode function
function activateGlobalPartyMode() {
    const style = document.createElement('style');
    style.id = 'global-party-styles';
    style.textContent = `
        body {
            animation: rainbow 4s linear infinite !important;
        }
        @keyframes rainbow {
            0% { filter: hue-rotate(0deg) brightness(1.1); }
            25% { filter: hue-rotate(90deg) brightness(1.2); }
            50% { filter: hue-rotate(180deg) brightness(1.1); }
            75% { filter: hue-rotate(270deg) brightness(1.2); }
            100% { filter: hue-rotate(360deg) brightness(1.1); }
        }
        .confetti-global {
            position: fixed;
            width: 8px;
            height: 8px;
            background: #ff0;
            animation: confetti-fall 4s linear infinite;
            z-index: 9999;
            pointer-events: none;
        }
        @keyframes confetti-fall {
            0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .greeting-text {
            animation: party-bounce 2s ease-in-out infinite !important;
        }
        @keyframes party-bounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
    `;
    document.head.appendChild(style);
    
    // Create continuous confetti
    setInterval(() => {
        for (let i = 0; i < 3; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-global';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.background = `hsl(${Math.random() * 360}, 100%, 60%)`;
            confetti.style.animationDelay = Math.random() * 2 + 's';
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 4000);
        }
    }, 1000);
    
    // Show party notification
    setTimeout(() => {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; top: 100px; right: 20px; z-index: 10001;
            background: linear-gradient(45deg, #ff6b35, #f7931e);
            color: white; padding: 15px 20px; border-radius: 12px;
            font-weight: bold; animation: party-bounce 1s ease-in-out infinite;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        `;
        notification.innerHTML = '🎉 PARTY MODE ACTIVE! 🎉';
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 5000);
    }, 1000);
}