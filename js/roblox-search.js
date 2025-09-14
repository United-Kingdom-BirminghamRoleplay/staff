/**
 * UKBRUM Staff Portal - Roblox User Search Module
 * Enhanced Roblox user search functionality with multiple API fallbacks
 */

class RobloxUserSearch {
    constructor() {
        this.searchInput = document.getElementById('robloxSearch');
        this.searchButton = document.querySelector('.roblox-search .btn');
        this.resultsContainer = document.getElementById('searchResults');
        this.init();
    }

    init() {
        if (this.searchInput) {
            this.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchUser();
                }
            });
        }
    }

    async searchUser() {
        const username = this.searchInput?.value.trim();
        if (!username) {
            this.showError('Please enter a username');
            return;
        }

        // Validate username format
        if (window.StaffPortal && !new window.StaffPortal().validateRobloxUsername(username)) {
            this.showError('Invalid username format. Usernames must be 3-20 characters and contain only letters, numbers, and underscores.');
            return;
        }

        this.showLoading();

        try {
            // Try multiple methods to get user data
            const userData = await this.fetchUserData(username);
            if (userData) {
                await this.displayUserResult(userData);
                // Show success toast
                if (window.StaffPortal) {
                    new window.StaffPortal().showToast(`Found user: ${userData.name}`, 'success');
                }
            } else {
                this.showError('User not found or may not exist');
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Error searching for user. This may be due to CORS restrictions or API limitations.');
        }
    }

    async fetchUserData(username) {
        // Method 1: Use RoProxy (most reliable for Roblox APIs)
        try {
            const response = await fetch(`https://users.roproxy.com/v1/usernames/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usernames: [username],
                    excludeBannedUsers: true
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.data && data.data.length > 0) {
                    return data.data[0];
                }
            }
        } catch (error) {
            console.log('RoProxy failed, trying alternative...');
        }

        // Method 2: Use RoProxy with legacy endpoint
        try {
            const response = await fetch(`https://api.roproxy.com/users/get-by-username?username=${encodeURIComponent(username)}`);
            if (response.ok) {
                const data = await response.json();
                if (data.Id && data.Username) {
                    return {
                        id: data.Id,
                        name: data.Username,
                        displayName: data.Username
                    };
                }
            }
        } catch (error) {
            console.log('Legacy RoProxy failed...');
        }

        // Method 3: Use AllOrigins as fallback
        try {
            const proxyUrl = 'https://api.allorigins.win/get?url=';
            const targetUrl = `https://api.roblox.com/users/get-by-username?username=${encodeURIComponent(username)}`;
            
            const response = await fetch(proxyUrl + encodeURIComponent(targetUrl));
            if (response.ok) {
                const proxyData = await response.json();
                const data = JSON.parse(proxyData.contents);
                if (data.Id && data.Username) {
                    return {
                        id: data.Id,
                        name: data.Username,
                        displayName: data.Username
                    };
                }
            }
        } catch (error) {
            console.log('AllOrigins proxy failed...');
        }

        return null;
    }

    async displayUserResult(user) {
        const profileUrl = `https://www.roblox.com/users/${user.id}/profile`;
        const melonlyUrl = `https://melonly.xyz/user/${user.id}`;
        
        // Get avatar using RoProxy
        let avatarUrl = `https://thumbnails.roproxy.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png&isCircular=false`;
        
        try {
            const avatarResponse = await fetch(avatarUrl);
            if (avatarResponse.ok) {
                const avatarData = await avatarResponse.json();
                if (avatarData.data && avatarData.data[0]) {
                    avatarUrl = avatarData.data[0].imageUrl;
                }
            }
        } catch (error) {
            // Fallback to direct Roblox URL
            avatarUrl = `https://www.roblox.com/headshot-thumbnail/image?userId=${user.id}&width=150&height=150&format=png`;
        }

        this.resultsContainer.innerHTML = `
            <div class="user-result">
                <div class="user-avatar-container">
                    <img src="${avatarUrl}" alt="${user.name}'s Avatar" class="user-avatar" 
                         onerror="this.src='https://www.roblox.com/headshot-thumbnail/image?userId=${user.id}&width=150&height=150&format=png'">
                </div>
                <div class="user-info">
                    <h4>${user.displayName || user.name}</h4>
                    ${user.displayName && user.displayName !== user.name ? `<p class="username">@${user.name}</p>` : ''}
                    <p class="user-id">User ID: ${user.id}</p>
                    <div class="user-actions">
                        <a href="${profileUrl}" target="_blank" class="btn btn-secondary">
                            <i class="fas fa-user"></i> Roblox Profile
                        </a>
                        <a href="${melonlyUrl}" target="_blank" class="btn">
                            <i class="fas fa-external-link-alt"></i> View on Melonly
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    showLoading() {
        this.resultsContainer.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Searching for user...</span>
            </div>
        `;
    }

    showError(message) {
        this.resultsContainer.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
            </div>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('robloxSearch')) {
        new RobloxUserSearch();
    }
});

// Global function for backward compatibility
function searchRobloxUser() {
    const searchInstance = new RobloxUserSearch();
    searchInstance.searchUser();
}