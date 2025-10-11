// Dynamic Component Loader
async function loadComponent(elementId, componentPath) {
    try {
        const response = await fetch(componentPath);
        const html = await response.text();
        document.getElementById(elementId).innerHTML = html;
        
        // Set active nav link and show founder panel
        if (componentPath.includes('sidebar')) {
            setActiveNavLink();
            
            // Show navigation based on user permissions
            setTimeout(() => {
                if (window.newAuthSystem && newAuthSystem.isAuthenticated()) {
                    const user = newAuthSystem.getCurrentUser();
                    
                    // Show founder-only links
                    if (newAuthSystem.hasPermission('founder')) {
                        const founderLinks = document.querySelectorAll('.founder-only');
                        founderLinks.forEach(link => link.style.display = 'block');
                    }
                    
                    // Show HR+ links
                    if (newAuthSystem.hasPermission('human_resources')) {
                        const hrLinks = document.querySelectorAll('.hr-only');
                        hrLinks.forEach(link => link.style.display = 'block');
                    }
                }
            }, 100);
        }
    } catch (error) {
        console.error('Failed to load component:', error);
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

// Load components on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Track IP access
    try {
        const user = window.newAuthSystem ? newAuthSystem.getCurrentUser() : null;
        await fetch('./api/ip-tracker.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: user?.rank || null })
        });
    } catch (error) {
        console.error('IP tracking failed:', error);
    }
    
    await loadComponent('sidebar-container', 'sidebar.html');
    await loadComponent('footer-container', 'footer.html');
    
    // Check for party mode
    try {
        const response = await fetch('./api/load.php?type=party_mode');
        const partyData = await response.json();
        if (partyData.active) {
            activateGlobalPartyMode();
        }
    } catch (error) {
        console.log('Party mode check failed');
    }
    
    // Show navigation based on user permissions
    setTimeout(() => {
        if (window.newAuthSystem && newAuthSystem.isAuthenticated()) {
            // Show founder-only links
            if (newAuthSystem.hasPermission('founder')) {
                const founderLinks = document.querySelectorAll('.founder-only');
                founderLinks.forEach(link => link.style.display = 'block');
            }
            
            // Show HR+ links
            if (newAuthSystem.hasPermission('human_resources')) {
                const hrLinks = document.querySelectorAll('.hr-only');
                hrLinks.forEach(link => link.style.display = 'block');
            }
        }
    }, 200);
});

// Security measures
const Security = {
    init() {
        this.preventRightClick();
        this.preventDevTools();
        this.addCSP();
        this.validateSession();
    },
    
    preventRightClick() {
        document.addEventListener('contextmenu', e => e.preventDefault());
    },
    
    preventDevTools() {
        document.addEventListener('keydown', e => {
            if (e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.shiftKey && e.key === 'C') ||
                (e.ctrlKey && e.key === 'U')) {
                e.preventDefault();
            }
        });
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