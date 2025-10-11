// Dynamic Component Loader
async function loadComponent(elementId, componentPath) {
    try {
        const response = await fetch(componentPath);
        const html = await response.text();
        document.getElementById(elementId).innerHTML = html;
        
        // Set active nav link and show founder panel
        if (componentPath.includes('sidebar')) {
            setActiveNavLink();
            
            // Show founder panel for founders
            const auth = localStorage.getItem('ukbrum_auth');
            if (auth) {
                const user = JSON.parse(auth);
                if (user.rank === 'founder') {
                    setTimeout(() => {
                        const founderLink = document.querySelector('.founder-only');
                        if (founderLink) founderLink.style.display = 'block';
                    }, 100);
                }
            }
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
    await loadComponent('sidebar-container', 'sidebar.html');
    await loadComponent('footer-container', 'footer.html');
    
    // Show founder panel for founders
    const auth = localStorage.getItem('ukbrum_auth');
    if (auth) {
        const user = JSON.parse(auth);
        if (user.rank === 'founder') {
            const founderLink = document.querySelector('.founder-only');
            if (founderLink) founderLink.style.display = 'block';
        }
    }
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
        const auth = localStorage.getItem('ukbrum_auth');
        if (!auth && !window.location.pathname.includes('login')) {
            // Redirect to login if not authenticated
            console.log('Session validation required');
        }
    }
};

// Initialize security
Security.init();