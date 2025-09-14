/**
 * UKBRUM Staff Portal - Main JavaScript Module
 * Common functionality and enhancements for all pages
 */

class StaffPortal {
    constructor() {
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupAnimations();
        this.setupUtilities();
    }

    setupNavigation() {
        // Add mobile hamburger menu
        this.createMobileMenu();
        
        // Add active state management
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage || (currentPage === '' && href === 'index.html')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Add smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    createMobileMenu() {
        const navContainer = document.querySelector('.nav-container');
        if (!navContainer) return;
        
        // Create hamburger toggle
        const toggle = document.createElement('div');
        toggle.className = 'nav-toggle';
        toggle.innerHTML = '<span></span><span></span><span></span>';
        
        // Insert before nav menu
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu) {
            navContainer.insertBefore(toggle, navMenu);
            
            // Add click handler
            toggle.addEventListener('click', () => {
                toggle.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
            
            // Close menu when clicking links
            navMenu.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    toggle.classList.remove('active');
                    navMenu.classList.remove('active');
                });
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!navContainer.contains(e.target)) {
                    toggle.classList.remove('active');
                    navMenu.classList.remove('active');
                }
            });
        }
    }

    setupAnimations() {
        // Intersection Observer for fade-in animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe elements for animation
        const animatedElements = document.querySelectorAll('.card, .announcement, .punishment-level, .guidelines-section');
        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    setupUtilities() {
        // Add loading states to buttons
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', function() {
                if (!this.classList.contains('loading')) {
                    this.classList.add('loading');
                    setTimeout(() => {
                        this.classList.remove('loading');
                    }, 1000);
                }
            });
        });

        // Add copy functionality for code elements
        document.querySelectorAll('code').forEach(code => {
            code.style.cursor = 'pointer';
            code.title = 'Click to copy';
            code.addEventListener('click', () => {
                navigator.clipboard.writeText(code.textContent).then(() => {
                    this.showToast('Copied to clipboard!', 'success');
                });
            });
        });

        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K for search focus
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('robloxSearch');
                if (searchInput) {
                    searchInput.focus();
                }
            }
        });
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : 'info'}-circle"></i>
            <span>${message}</span>
        `;
        
        // Add toast styles if not already present
        if (!document.querySelector('#toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                .toast {
                    position: fixed;
                    top: 100px;
                    right: 20px;
                    background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
                    color: var(--text-primary);
                    padding: 1rem 1.5rem;
                    border-radius: 8px;
                    box-shadow: var(--shadow-lg);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    animation: slideInRight 0.3s ease;
                    border: 1px solid var(--border-color);
                    backdrop-filter: blur(10px);
                }
                .toast-success {
                    border-left: 4px solid var(--success-color);
                }
                .toast-success i {
                    color: var(--success-color);
                }
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    // Utility function to format timestamps
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Utility function to validate Roblox usernames
    validateRobloxUsername(username) {
        const regex = /^[a-zA-Z0-9_]{3,20}$/;
        return regex.test(username);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StaffPortal();
});

// Export for use in other modules
window.StaffPortal = StaffPortal;