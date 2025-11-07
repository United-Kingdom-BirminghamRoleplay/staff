// Discord OAuth Authentication System
class DiscordAuth {
    constructor() {
        this.CLIENT_ID = '1340376847732707380';
        this.REDIRECT_URI = window.location.origin + window.location.pathname.replace(/[^/]*$/, '') + 'auth-callback.html';
        this.SCOPES = 'identify guilds.members.read';
        this.GUILD_ID = '1152677388543598749'; 
    }

    // Initiate Discord OAuth flow
    login() {
        const state = this.generateState();
        localStorage.setItem('discord_oauth_state', state);
        
        const authURL = `https://discord.com/oauth2/authorize?` +
            `client_id=${this.CLIENT_ID}&` +
            `response_type=code&` +
            `redirect_uri=${encodeURIComponent(this.REDIRECT_URI)}&` +
            `scope=${encodeURIComponent(this.SCOPES)}&` +
            `state=${state}`;
        
        window.location.href = authURL;
    }

    // Generate secure state parameter
    generateState() {
        return btoa(crypto.getRandomValues(new Uint8Array(32)).join(''));
    }

    // Handle OAuth callback
    async handleCallback(code, state) {
        // Verify state parameter
        const storedState = localStorage.getItem('discord_oauth_state');
        if (state !== storedState) {
            throw new Error('Invalid state parameter');
        }
        localStorage.removeItem('discord_oauth_state');

        try {
            // Exchange code for access token
            const tokenResponse = await fetch('./api/discord-auth.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'exchange_code',
                    code: code
                })
            });

            const tokenData = await tokenResponse.json();
            if (!tokenData.success) {
                throw new Error(tokenData.error || 'Token exchange failed');
            }

            // Get user info and guild membership
            const userResponse = await fetch('./api/discord-auth.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'get_user_info',
                    access_token: tokenData.access_token
                })
            });

            const userData = await userResponse.json();
            if (!userData.success) {
                throw new Error(userData.error || 'Failed to get user info');
            }

            // Store authentication data
            const authData = {
                userId: userData.user.id,
                username: userData.user.username,
                discriminator: userData.user.discriminator,
                avatar: userData.user.avatar ? `https://cdn.discordapp.com/avatars/${userData.user.id}/${userData.user.avatar}.png?size=128` : `https://cdn.discordapp.com/embed/avatars/${userData.user.discriminator % 5}.png`,
                guildMember: userData.guildMember,
                rank: userData.guildMember?.rank || 'pending',
                level: userData.guildMember?.level || 0,
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
                expiresAt: Date.now() + (tokenData.expires_in * 1000)
            };
            
            console.log('Discord Auth Data:', authData); // Debug log
            console.log('User level from API:', authData.level);
            console.log('Guild member data:', authData.guildMember);

            localStorage.setItem('discord_auth', JSON.stringify(authData));
            
            // Log security event
            if (window.securitySystem) {
                window.securitySystem.logSecurityEvent('DISCORD_LOGIN_SUCCESS', {
                    userId: userData.user.id,
                    username: userData.user.username
                });
            }

            return authData;

        } catch (error) {
            if (window.securitySystem) {
                window.securitySystem.escalateThreat('DISCORD_LOGIN_FAILED', {
                    error: error.message,
                    code: code.substring(0, 10) + '...'
                });
            }
            throw error;
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        const auth = this.getAuthData();
        if (!auth) return false;
        
        // Check if token is expired (but don't auto-logout)
        if (Date.now() >= auth.expiresAt) {
            return false;
        }
        
        return true;
    }

    // Get current auth data
    getAuthData() {
        try {
            const auth = localStorage.getItem('discord_auth');
            return auth ? JSON.parse(auth) : null;
        } catch (e) {
            return null;
        }
    }

    // Get current user
    getCurrentUser() {
        return this.getAuthData();
    }

    // Check permissions based on access levels (1-6)
    hasPermission(requiredLevel) {
        const user = this.getCurrentUser();
        if (!user || !user.guildMember) {
            console.log('Permission denied: No user or guild member');
            return false;
        }

        const userLevel = this.getUserLevel(user.rank);
        const required = typeof requiredLevel === 'number' ? requiredLevel : this.getLevelFromRank(requiredLevel);
        
        console.log('Permission check: Level', userLevel, 'vs required', required);
        return userLevel >= required;
    }

    // Get user's access level (1-6)
    getUserLevel(rank) {
        const levelMap = {
            'level_1': 1,
            'level_2': 2,
            'level_3': 3,
            'level_4': 4,
            'level_5': 5,
            'level_6': 6
        };
        return levelMap[rank] || 0;
    }

    // Convert old rank names to levels for compatibility
    getLevelFromRank(rankName) {
        const rankToLevel = {
            'moderation': 1,
            'administration': 1,
            'human_resources': 2,
            'oversight_enforcement': 3,
            'advisory_board': 4,
            'assistant_founder': 5,
            'founder': 5
        };
        return rankToLevel[rankName] || 0;
    }

    // Refresh access token
    async refreshToken() {
        const auth = this.getAuthData();
        if (!auth || !auth.refreshToken) {
            this.logout();
            return false;
        }

        try {
            const response = await fetch('./api/discord-auth.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'refresh_token',
                    refresh_token: auth.refreshToken
                })
            });

            const data = await response.json();
            if (data.success) {
                auth.accessToken = data.access_token;
                auth.expiresAt = Date.now() + (data.expires_in * 1000);
                if (data.refresh_token) {
                    auth.refreshToken = data.refresh_token;
                }
                localStorage.setItem('discord_auth', JSON.stringify(auth));
                return true;
            } else {
                this.logout();
                return false;
            }
        } catch (error) {
            this.logout();
            return false;
        }
    }

    // Logout user
    logout() {
        if (window.securitySystem) {
            const user = this.getCurrentUser();
            window.securitySystem.logSecurityEvent('DISCORD_LOGOUT', {
                userId: user?.userId || 'unknown',
                username: user?.username || 'unknown'
            });
        }
        
        localStorage.removeItem('discord_auth');
        localStorage.removeItem('discord_oauth_state');
        window.location.href = 'login.html';
    }

    // Auto-refresh token before expiry
    startTokenRefresh() {
        setInterval(async () => {
            const auth = this.getAuthData();
            if (auth && Date.now() >= (auth.expiresAt - 300000)) { // Refresh 5 minutes before expiry
                await this.refreshToken();
            }
        }, 60000); // Check every minute
    }
}

// Initialize Discord auth
window.discordAuth = new DiscordAuth();

// Start token refresh if authenticated
if (window.discordAuth.isAuthenticated()) {
    window.discordAuth.startTokenRefresh();
}