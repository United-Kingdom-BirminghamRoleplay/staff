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
                this.displayUserResult(userData);
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
        // Method 1: Try CORS proxy with Roblox API
        try {
            const proxyUrl = 'https://api.allorigins.win/raw?url=';
            const targetUrl = `https://users.roblox.com/v1/usernames/users`;
            
            const response = await fetch(proxyUrl + encodeURIComponent(targetUrl), {
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
            console.log('Proxy method failed, trying direct...');
        }

        // Method 2: Try direct API (works in some browsers)
        try {
            const response = await fetch(`https://api.roblox.com/users/get-by-username?username=${encodeURIComponent(username)}`);
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
            console.log('Direct API failed...');
        }

        // Method 3: Alternative proxy
        try {
            const response = await fetch(`https://corsproxy.io/?https://api.roblox.com/users/get-by-username?username=${encodeURIComponent(username)}`);
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
            console.log('Alternative proxy failed...');
        }

        return null;
    }

    displayUserResult(user) {
        const avatarUrl = `https://www.roblox.com/headshot-thumbnail/image?userId=${user.id}&width=150&height=150&format=png`;
        const profileUrl = `https://www.roblox.com/users/${user.id}/profile`;
        const melonlyUrl = `https://melonly.xyz/user/${user.id}`;

        this.resultsContainer.innerHTML = `
            <div class="user-result">
                <div class="user-avatar-container">
                    <img src="${avatarUrl}" alt="${user.name}'s Avatar" class="user-avatar" 
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMzAiIGZpbGw9IiM0YjU1NjMiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIxOCIgeT0iMTgiPgo8cGF0aCBkPSJNMTIgMTJDMTQuMjA5MSAxMiAxNiAxMC4yMDkxIDE2IDhDMTYgNS43OTA5IDE0LjIwOTEgNCA1IDRDOS43OTA5IDQgOCA1Ljc5MDkgOCA4QzggMTAuMjA5MSA5Ljc5MDkgMTIgMTIgMTJaIiBmaWxsPSIjOWNhM2FmIi8+CjxwYXRoIGQ9Ik0xMiAxNEM5LjMzIDEzLjk5IDcuMDEgMTUuNjIgNiAxOEgxOEMxNi45OSAxNS42MiAxNC42NyAxMy45OSAxMiAxNFoiIGZpbGw9IiM5Y2EzYWYiLz4KPC9zdmc+Cjwvc3ZnPgo='">
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