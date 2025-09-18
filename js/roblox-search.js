/**
 * UKBRUM Staff Portal - Roblox User Search Module
 * RoProxy API version
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
                if (e.key === 'Enter') this.searchUser();
            });
        }

        if (this.searchButton) {
            this.searchButton.addEventListener('click', () => this.searchUser());
        }
    }

    async searchUser() {
        const username = this.searchInput?.value.trim();
        if (!username) {
            this.showError('Please enter a username');
            return;
        }

        // Optional Roblox username validation
        if (window.StaffPortal && !new window.StaffPortal().validateRobloxUsername(username)) {
            this.showError('Invalid username format. Usernames must be 3-20 characters and contain only letters, numbers, and underscores.');
            return;
        }

        this.showLoading();

        try {
            const userData = await this.fetchUserData(username);
            if (userData) {
                await this.displayUserResult(userData);
                if (window.StaffPortal) {
                    new window.StaffPortal().showToast(`Found user: ${userData.name}`, 'success');
                }
            } else {
                this.showError('User not found.');
            }
        } catch (err) {
            console.error('Search error:', err);
            this.showError('Error searching for user via RoProxy.');
        }
    }

    async fetchUserData(username) {
        try {
            // Primary RoProxy endpoint (POST)
            const response = await fetch('https://users.roproxy.com/v1/usernames/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usernames: [username], excludeBannedUsers: true })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.data && data.data.length > 0) {
                    return data.data[0]; // returns {id, name, displayName}
                }
            }
        } catch (err) {
            console.error('RoProxy primary endpoint failed', err);
        }

        // Optional fallback (legacy GET endpoint)
        try {
            const response = await fetch(`https://api.roproxy.com/users/get-by-username?username=${encodeURIComponent(username)}`);
            if (response.ok) {
                const data = await response.json();
                if (data.Id && data.Username) {
                    return { id: data.Id, name: data.Username, displayName: data.Username };
                }
            }
        } catch (err) {
            console.error('RoProxy legacy endpoint failed', err);
        }

        return null;
    }

    async displayUserResult(user) {
        const profileUrl = `https://www.roblox.com/users/${user.id}/profile`;
        const avatarUrl = `https://thumbnails.roproxy.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png&isCircular=false`;

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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('robloxSearch')) new RobloxUserSearch();
});

// Global function for backward compatibility
function searchRobloxUser() {
    const searchInstance = new RobloxUserSearch();
    searchInstance.searchUser();
}
