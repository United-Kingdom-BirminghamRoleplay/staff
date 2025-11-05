// New Authentication System
class NewAuthSystem {
    constructor() {
        this.init(); 
    }
    
    init() {
        console.log('Auth system init - checks disabled');
        // Disable auth checks temporarily
        return;
    }
    
    performAuthCheck() {
        console.log('Auth check disabled - allowing all access');
        // Temporarily disable all auth checks to fix loading issues
        return;
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
        console.log('Permission checks disabled - allowing all access');
        // Temporarily disable all permission checks
        return;
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