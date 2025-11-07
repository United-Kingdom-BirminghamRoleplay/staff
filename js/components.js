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
        
        // Ensure sidebar is visible
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.style.display = 'flex';
        }
        
        // Show navigation based on user permissions
        setTimeout(() => {
            if (window.discordAuth && window.discordAuth.isAuthenticated()) {
                populateUserProfile();
                
                // Show navigation based on access level
                const user = window.discordAuth.getCurrentUser();
                const userLevel = user.level || 0;
                console.log('User level for navigation:', userLevel);
                
                const level2Groups = document.querySelectorAll('.level-2');
                const level5Groups = document.querySelectorAll('.level-5');
                
                if (userLevel >= 2) {
                    console.log('Showing level 2 groups');
                    level2Groups.forEach(group => group.style.display = 'block');
                }
                
                if (userLevel >= 5) {
                    console.log('Showing level 5 groups');
                    level5Groups.forEach(group => group.style.display = 'block');
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
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userLevel = document.getElementById('userLevel');
    
    if (discordUser) {
        if (userAvatar) {
            let avatarUrl;
            if (discordUser.avatar && discordUser.avatar.startsWith('http')) {
                avatarUrl = discordUser.avatar;
            } else if (discordUser.avatar) {
                avatarUrl = `https://cdn.discordapp.com/avatars/${discordUser.userId}/${discordUser.avatar}.png?size=128`;
            } else {
                avatarUrl = `https://cdn.discordapp.com/embed/avatars/${(discordUser.discriminator || 0) % 5}.png`;
            }
            
            userAvatar.src = avatarUrl;
            userAvatar.onerror = () => {
                userAvatar.src = `https://cdn.discordapp.com/embed/avatars/${(discordUser.discriminator || 0) % 5}.png`;
            };
        }
        
        if (userName) {
            userName.textContent = discordUser.username || 'User';
        }
        
        if (userLevel) {
            userLevel.textContent = `Level ${discordUser.level || 0}`;
        }
        
        // Show navigation groups based on access level
        const userAccessLevel = discordUser.level || 0;
        console.log('Populating profile, user level:', userAccessLevel);
        
        const level2Groups = document.querySelectorAll('.level-2');
        const level5Groups = document.querySelectorAll('.level-5');
        
        if (userAccessLevel >= 2) {
            console.log('User has level 2+ access, showing management');
            level2Groups.forEach(group => group.style.display = 'block');
        }
        
        if (userAccessLevel >= 5) {
            console.log('User has level 5+ access, showing leadership');
            level5Groups.forEach(group => group.style.display = 'block');
        }
    }
}

// Force page initialization on every load
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing page...');
    initializePage();
});

// Backup initialization
window.addEventListener('load', () => {
    console.log('Window loaded, checking sidebar...');
    if (!document.querySelector('.sidebar')) {
        console.log('Sidebar not found, re-initializing...');
        initializePage();
    } else {
        console.log('Sidebar found, page loaded successfully');
    }
});

async function initializePage() {
    try {
        // Always load sidebar first
        if (document.getElementById('sidebar-container')) {
            await loadComponent('sidebar-container', 'sidebar.html');
        }
        
        // Load footer
        if (document.getElementById('footer-container')) {
            await loadComponent('footer-container', 'footer.html');
        }
        
        // Ensure sidebar is visible
        setTimeout(() => {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.style.display = 'flex';
            }
        }, 100);
        
    } catch (error) {
        console.error('Page initialization failed:', error);
        // Fallback: try to load components again
        setTimeout(() => {
            if (document.getElementById('sidebar-container') && !document.querySelector('.sidebar')) {
                loadComponent('sidebar-container', 'sidebar.html');
            }
        }, 1000);
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
        meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https://cdn.discordapp.com; connect-src 'self' https://discord.com;";
        document.head.appendChild(meta);
    },
    
    validateSession() {
        // Disabled to prevent page clearing
        return;
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
// Sidebar toggle function
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
}