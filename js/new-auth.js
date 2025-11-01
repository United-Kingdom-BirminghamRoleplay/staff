// New Authentication System
class NewAuthSystem {
    constructor() {
        this.init(); 
    }
    
    init() {
        // Wait for Discord auth to load before checking authentication
        if (window.discordAuth) {
            this.performAuthCheck();
        } else {
            // Wait for Discord auth to initialize
            setTimeout(() => this.init(), 100);
        }
    }
    
    performAuthCheck() {
        // Check authentication on page load
        if (!this.isAuthenticated() && !this.isPublicPage()) {
            this.redirectToLogin();
            return;
        }
        
        // Check permissions for restricted pages
        if (this.isAuthenticated()) {
            this.checkPagePermissions();
        }
    }
    
    isAuthenticated() {
        // Discord auth only
        return window.discordAuth && window.discordAuth.isAuthenticated();
    }
    
    isPublicPage() {
        const publicPages = ['login.html', 'register.html', 'auth-callback.html', 'terms-of-service.html', 'privacy-policy.html'];
        const currentPage = window.location.pathname.split('/').pop();
        return publicPages.includes(currentPage) || currentPage.startsWith('trainees/');
    }
    
    getCurrentUser() {
        if (!this.isAuthenticated()) return null;
        
        const discordUser = window.discordAuth.getCurrentUser();
        return {
            userId: discordUser.userId,
            robloxUsername: discordUser.username,
            discordUsername: discordUser.username + '#' + discordUser.discriminator,
            rank: discordUser.rank
        };
    }
    
    hasPermission(requiredRank) {
        return window.discordAuth && window.discordAuth.hasPermission(requiredRank);
    }
    
    checkPagePermissions() {
        const currentPage = window.location.pathname.split('/').pop();
        const restrictedPages = {
            'staff-management.html': 'human_resources',
            'file-manager.html': 'human_resources',
            'founder-panel.html': 'co_founder',
            'admin-panel.html': 'co_founder'
        };
        
        if (restrictedPages[currentPage]) {
            if (!this.hasPermission(restrictedPages[currentPage])) {
                alert('Access denied. Insufficient permissions.');
                window.location.href = 'index.html';
            }
        }
    }
    
    redirectToLogin() {
        if (window.location.pathname.includes('trainees/')) {
            return; // Allow trainee section
        }
        window.location.href = 'login.html';
    }
    
    logout() {
        if (window.discordAuth) {
            window.discordAuth.logout();
        }
    }
    
    updateUserInfo(newInfo) {
        const current = this.getCurrentUser();
        if (current) {
            const updated = { ...current, ...newInfo };
            localStorage.setItem('staff_auth', JSON.stringify(updated));
            localStorage.setItem('ukbrum_auth', JSON.stringify(updated));
        }
    }
}

// Initialize authentication system
const newAuthSystem = new NewAuthSystem();

// Global logout function
function logout() {
    newAuthSystem.logout();
}

// Export for use in other scripts
window.newAuthSystem = newAuthSystem;