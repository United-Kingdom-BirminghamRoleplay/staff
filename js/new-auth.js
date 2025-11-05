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
        if (!window.discordAuth || !window.discordAuth.isAuthenticated()) {
            return false;
        }
        
        const user = window.discordAuth.getCurrentUser();
        const userRank = user.rank;
        
        const rankLevels = {
            'moderation': 1,
            'administration': 2, 
            'human_resources': 3,
            'oversight': 4,
            'advisory': 5,
            'assistant_founder': 6,
            'co_founder': 7,
            'founder': 8,
            'developer': 9
        };
        
        const requiredLevel = rankLevels[requiredRank] || 0;
        const userLevel = rankLevels[this.getRankKey(userRank)] || 0;
        
        // Special case: founder content only for founders and developers
        if (requiredRank === 'founder') {
            return userRank === 8 || userRank === 9;
        }
        
        return userLevel >= requiredLevel;
    }
    
    getRankKey(rankNumber) {
        const ranks = {
            1: 'moderation',
            2: 'administration',
            3: 'human_resources', 
            4: 'oversight',
            5: 'advisory',
            6: 'assistant_founder',
            7: 'co_founder',
            8: 'founder',
            9: 'developer'
        };
        return ranks[rankNumber] || 'moderation';
    }
    
    checkPagePermissions() {
        const currentPage = window.location.pathname.split('/').pop();
        const restrictedPages = {
            'staff-management.html': 'human_resources',
            'file-manager.html': 'human_resources',
            'founder-panel.html': 'founder',
            'admin-panel.html': 'co_founder',
            'security-dashboard.html': 'founder'
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