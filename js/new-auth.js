// New Authentication System
class NewAuthSystem {
    constructor() {
        this.init(); 
    }
    
    init() {
        // Check authentication on page load with delay to ensure Discord auth is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.performAuthCheck(), 100);
            });
        } else {
            setTimeout(() => this.performAuthCheck(), 100);
        }
    }
    
    performAuthCheck() {
        console.log('Performing auth check...');
        
        // Skip auth check if we're already authenticated
        if (this.isAuthenticated()) {
            console.log('User is authenticated, checking page permissions...');
            this.checkPagePermissions();
            return;
        }
        
        console.log('User not authenticated, checking if public page...');
        
        // Only redirect to login if not authenticated and not on public page
        if (!this.isPublicPage()) {
            console.log('Not a public page, redirecting to login...');
            this.redirectToLogin();
        } else {
            console.log('Public page, allowing access');
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
        if (!this.isAuthenticated()) {
            if (!this.isPublicPage()) {
                this.redirectToLogin();
            }
            return;
        }
        
        const currentPage = window.location.pathname.split('/').pop();
        const restrictedPages = {
            'staff-management.html': 'human_resources',
            'file-manager.html': 'human_resources',
            'founder-panel.html': 'assistant_founder',
            'admin-panel.html': 'assistant_founder',
            'security-dashboard.html': 'assistant_founder',
            'forms.html': 'moderation'
        };
        
        // Developers get access to everything
        if (window.discordAuth && window.discordAuth.getCurrentUser()?.rank === 'developer') {
            console.log('Developer access granted for:', currentPage);
            return;
        }
        
        if (restrictedPages[currentPage]) {
            const hasAccess = window.discordAuth && window.discordAuth.hasPermission(restrictedPages[currentPage]);
            console.log('Page access check:', currentPage, 'Required:', restrictedPages[currentPage], 'Has access:', hasAccess);
            if (!hasAccess) {
                alert('Access denied. Insufficient permissions for ' + currentPage);
                window.location.href = 'index.html';
                return;
            }
        }
        
        console.log('Page access granted for:', currentPage);
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

// Initialize authentication system with error handling
let newAuthSystem;
try {
    console.log('Initializing new auth system...');
    newAuthSystem = new NewAuthSystem();
    console.log('New auth system initialized successfully');
} catch (error) {
    console.error('Auth system failed to initialize:', error);
    newAuthSystem = { 
        isAuthenticated: () => false, 
        isPublicPage: () => true,
        checkPagePermissions: () => {},
        performAuthCheck: () => {}
    };
}

// Global logout function
function logout() {
    if (newAuthSystem && newAuthSystem.logout) {
        newAuthSystem.logout();
    } else {
        localStorage.clear();
        window.location.href = 'login.html';
    }
}

// Export for use in other scripts
window.newAuthSystem = newAuthSystem;
console.log('Auth system exported to window:', !!window.newAuthSystem);