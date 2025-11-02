// New Authentication System
class NewAuthSystem {
    constructor() {
        this.init(); 
    }
    
    init() {
        // Simple auth check without blocking
        setTimeout(() => {
            if (window.discordAuth && !this.isAuthenticated() && !this.isPublicPage()) {
                window.location.href = 'login.html';
            }
        }, 1000);
    }
    
    performAuthCheck() {
        // Skip auth check if we're already authenticated
        if (this.isAuthenticated()) {
            this.checkPagePermissions();
            return;
        }
        
        // Only redirect to login if not authenticated and not on public page
        if (!this.isPublicPage()) {
            this.redirectToLogin();
        }
    }
    
    isAuthenticated() {
        // Discord auth only
        return window.discordAuth && window.discordAuth.isAuthenticated();
    }
    
    isPublicPage() {
        const publicPages = ['login.html', 'auth-callback.html', 'terms-of-service.html', 'privacy-policy.html'];
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
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