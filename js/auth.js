/**
 * UKBRUM Staff Portal - Authentication System
 */

class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.authData = null;
        this.init();
    }

    async init() {
        await this.loadAuthData();
        this.checkExistingAuth();
    }

    async loadAuthData() {
        try {
            const response = await fetch('./data/auth.json?' + Date.now());
            this.authData = await response.json();
        } catch (error) {
            console.error('Failed to load auth data:', error);
        }
    }

    checkExistingAuth() {
        const stored = localStorage.getItem('ukbrum_auth');
        if (stored) {
            try {
                this.currentUser = JSON.parse(stored);
                this.showAuthenticatedContent();
            } catch (error) {
                localStorage.removeItem('ukbrum_auth');
            }
        } else {
            this.showLoginForm();
        }
    }

    showLoginForm() {
        const authContainer = document.createElement('div');
        authContainer.className = 'auth-overlay';
        authContainer.innerHTML = `
            <div class="auth-modal">
                <div class="auth-header">
                    <h2>Staff Sharepoint Login</h2>
                    <p>United Kingdom: Birmingham Roleplay</p>
                </div>
                <form id="authForm" class="auth-form">
                    <div class="form-group">
                        <label for="rankSelect">Select Your Rank:</label>
                        <div class="custom-select">
                            <div class="select-display" id="selectDisplay">
                                <span>Choose your rank...</span>
                                <i class="fas fa-chevron-down"></i>
                            </div>
                            <div class="select-options" id="selectOptions">
                                <div class="select-option" data-value="founder">
                                    <i class="fas fa-star"></i> Foundership 
                                </div>
                                <div class="select-option" data-value="senior_management">
                                    <i class="fas fa-crown"></i> Senior Leadership
                                </div>
                                <div class="select-option" data-value="management">
                                    <i class="fas fa-users-cog"></i> Management
                                </div>
                                <div class="select-option" data-value="staff">
                                    <i class="fas fa-user-shield"></i> Staff Member
                                </div>
                            </div>
                        </div>
                        <input type="hidden" id="rankSelect" required>
                    </div>
                    <div class="form-group">
                        <label for="accessCode">Access Code:</label>
                        <input type="password" id="accessCode" placeholder="Enter your access code" required>
                    </div>
                    <button type="submit" class="btn auth-btn">
                        <i class="fas fa-sign-in-alt"></i> Access Portal
                    </button>
                    <div id="authError" class="auth-error"></div>
                </form>
            </div>
        `;
        
        document.body.appendChild(authContainer);
        
        document.getElementById('authForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.authenticate();
        });
        
        this.setupCustomSelect();
    }

    setupCustomSelect() {
        const selectDisplay = document.getElementById('selectDisplay');
        const selectOptions = document.getElementById('selectOptions');
        const hiddenInput = document.getElementById('rankSelect');
        
        selectDisplay.addEventListener('click', () => {
            selectOptions.classList.toggle('active');
            selectDisplay.querySelector('i').classList.toggle('rotated');
        });
        
        document.querySelectorAll('.select-option').forEach(option => {
            option.addEventListener('click', () => {
                const value = option.getAttribute('data-value');
                const text = option.textContent.trim();
                
                selectDisplay.querySelector('span').textContent = text;
                hiddenInput.value = value;
                selectOptions.classList.remove('active');
                selectDisplay.querySelector('i').classList.remove('rotated');
            });
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.custom-select')) {
                selectOptions.classList.remove('active');
                selectDisplay.querySelector('i').classList.remove('rotated');
            }
        });
    }

    authenticate() {
        const rank = document.getElementById('rankSelect').value;
        const code = document.getElementById('accessCode').value;
        const errorDiv = document.getElementById('authError');

        // Prefer passwords from loaded auth.json when available. Fall back to
        // the hardcoded map for resilience during development.
        let passwords = null;
        if (this.authData && this.authData.ranks && typeof this.authData.ranks === 'object') {
            try {
                passwords = Object.fromEntries(Object.entries(this.authData.ranks).map(([k, v]) => [k, v.password]));
            } catch (e) {
                passwords = null;
            }
        }
        if (!passwords) {
            // Hardcoded passwords for immediate fallback
            passwords = {
                'founder': '6769',
                'senior_management': '4623',
                'management': '8835',
                'staff': '6748'
            };
        }

        if (!rank) {
            errorDiv.textContent = 'Please select a rank';
            return;
        }

        if (passwords[rank] === code) {
            this.currentUser = {
                rank: rank,
                level: rank === 'founder' ? 15 : rank === 'senior_management' ? 10 : rank === 'management' ? 5 : 3,
                access: rank === 'founder' ? ['all'] : rank === 'senior_management' ? ['all'] : rank === 'management' ? ['management', 'staff'] : ['staff'],
                loginTime: Date.now()
            };
            
            localStorage.setItem('ukbrum_auth', JSON.stringify(this.currentUser));
            document.querySelector('.auth-overlay').remove();
            this.showAuthenticatedContent();
            this.showImmediateNotice();
        } else {
            errorDiv.textContent = 'Invalid access code';
        }
    }

    showAuthenticatedContent() {
        document.body.classList.add('authenticated');
        this.updateUIForRank();
        this.showRankWelcome();
    }

    showRankWelcome() {
        const welcomeDiv = document.getElementById('rankWelcome');
        const messageEl = document.getElementById('welcomeMessage');
        const descEl = document.getElementById('rankDescription');
        
        if (welcomeDiv && messageEl && descEl) {
            messageEl.textContent = 'Welcome to Birmingham Roleplay Staff Sharepoint';
            
            // Trigger custom event for greeting update
            document.dispatchEvent(new CustomEvent('userLoggedIn'));
            
            const rankTitles = {
                'senior_management': 'Senior Management',
                'management': 'Management',
                'staff': 'Staff'
            };
            const rankName = rankTitles[this.currentUser.rank] || 'Staff';
            descEl.textContent = `You are currently logged on as ${rankName}`;
            welcomeDiv.style.display = 'block';
        }
    }

    updateUIForRank() {
        if (!this.currentUser) return;

        // Add user info to navbar
        const navbar = document.querySelector('.nav-container');
        if (navbar && !document.querySelector('.user-info')) {
            const userInfo = document.createElement('div');
            userInfo.className = 'user-info';
            userInfo.innerHTML = `
                <span class="user-rank">${this.currentUser.rank.replace('_', ' ').toUpperCase()}</span>
                <button onclick="authSystem.logout()" class="btn-logout">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            `;
            navbar.appendChild(userInfo);
        }

        // Show/hide content based on access level
        this.filterContentByAccess();
        
        // Show forms section for Senior Management
        if (this.currentUser.rank === 'senior_management') {
            const formsSection = document.getElementById('formsSection');
            if (formsSection) {
                formsSection.style.display = 'block';
            }
        }
    }

    filterContentByAccess() {
        const level = this.currentUser.level;
        const access = this.currentUser.access;

        // Hide Roblox search for Community Helpers
        if (level <= 2) {
            const robloxSearch = document.querySelector('.roblox-search');
            if (robloxSearch) robloxSearch.style.display = 'none';
            
            const quickLinks = document.querySelector('.quick-links');
            if (quickLinks) quickLinks.style.display = 'none';
            
            this.showBasicInfo();
            return;
        }

        // Show management+ content
        // if (level >= 5) {
            // this.showManagementContent();
        // }

        // Show executive content
        // if (access.includes('executive') || access.includes('all')) {
        //     this.showExecutiveContent();
        // }
    }

    showBasicInfo() {
        const basicSection = document.createElement('section');
        basicSection.className = 'basic-info-section guidelines-section';
        basicSection.innerHTML = `
            <h2><i class="fas fa-info-circle"></i> Server Information</h2>
            <div class="card-grid">
                <div class="card">
                    <i class="fas fa-server card-icon"></i>
                    <h3>Server Status</h3>
                    <p>Check the Discord server for current UKBRUM ERLC server status</p>
                </div>
                <div class="card">
                    <i class="fas fa-users card-icon"></i>
                    <h3>Community Stats</h3>
                    <p>Active community with 3000+ members and growing daily</p>
                </div>
                <div class="card">
                    <i class="fas fa-clock card-icon"></i>
                    <h3>SSU Schedule</h3>
                    <p>Weekends: 9AM-11PM | Weekdays: 4PM-11PM</p>
                </div>
            </div>
        `;
        
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.appendChild(basicSection);
        }
    }

    showManagementContent() {
        const managementSection = document.createElement('section');
        managementSection.className = 'management-section guidelines-section';
        managementSection.innerHTML = `
            <br>
            <h2><i class="fas fa-ticket-alt"></i> </h2>
            <div class="card-grid">
                <div class="card">
                    <i class="fas fa-ticket-alt card-icon"></i>
                    <h3>Ticket System</h3>
                    <p>Handle staff applications, appeals, and support tickets</p>
                    <button onclick="authSystem.openTickets()" class="btn">
                        <i class="fas fa-external-link-alt"></i> Open Tickets
                    </button>
                </div>
                <div class="card">
                    <i class="fas fa-chart-line card-icon"></i>
                    <h3>Analytics Dashboard</h3>
                    <p>View server statistics and staff performance metrics</p>
                    <button onclick="authSystem.openAnalytics()" class="btn">
                        <i class="fas fa-chart-bar"></i> View Analytics
                    </button>
                </div>
            </div>
        `;
        
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.appendChild(managementSection);
        }
    }

    showExecutiveContent() {
        const executiveSection = document.createElement('section');
        executiveSection.className = 'executive-section guidelines-section';
        executiveSection.innerHTML = `
            <h2><i class="fas fa-crown"></i> Executive Dashboard</h2>
            <div class="card-grid">
                <div class="card">
                    <i class="fas fa-users-cog card-icon"></i>
                    <h3>Staff Management</h3>
                    <p>Manage staff ranks, permissions, and access codes</p>
                    <button onclick="authSystem.openStaffManagement()" class="btn">
                        <i class="fas fa-cog"></i> Manage Staff
                    </button>
                </div>
                <div class="card">
                    <i class="fas fa-tools card-icon"></i>
                    <h3>Site Settings</h3>
                    <p>Control maintenance mode, announcements, and site features</p>
                    <button onclick="authSystem.openSiteSettings()" class="btn">
                        <i class="fas fa-tools"></i> Site Settings
                    </button>
                </div>

            </div>
        `;
        
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.appendChild(executiveSection);
        }
    }

    openTickets() {
        window.open('https://discord.com/channels/YOUR_SERVER_ID/tickets', '_blank');
    }

    async openAnalytics() {
        try {
            const response = await fetch('./data/analytics.json');
            const data = await response.json();
            this.showAnalyticsDashboard(data);
        } catch (error) {
            alert('Error loading analytics data');
        }
    }

    showAnalyticsDashboard(data) {
        const modal = document.createElement('div');
        modal.className = 'analytics-overlay';
        modal.innerHTML = `
            <div class="analytics-modal">
                <div class="analytics-header">
                    <h2><i class="fas fa-chart-line"></i> UKBRUM Analytics Dashboard</h2>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="close-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="analytics-content">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-users"></i></div>
                            <div class="stat-info">
                                <h3>${data.serverStats.totalMembers.toLocaleString()}</h3>
                                <p>Total Members</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-user-check"></i></div>
                            <div class="stat-info">
                                <h3>${data.serverStats.activeMembers.toLocaleString()}</h3>
                                <p>Active Members</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-shield-alt"></i></div>
                            <div class="stat-info">
                                <h3>${data.serverStats.staffCount}</h3>
                                <p>Staff Members</p>
                            </div>
                        </div>

                    </div>
                    
                    <div class="analytics-section">
                        <h3><i class="fas fa-chart-bar"></i> Activity Overview</h3>
                        <div class="activity-stats">
                            <p><strong>Peak Hours:</strong> ${data.activityData.peakHours}</p>
                            <p><strong>Daily Average:</strong> ${data.activityData.averageDaily} players</p>
                            <p><strong>Weekend Average:</strong> ${data.activityData.weekendAverage} players</p>
                            <p><strong>Weekday Average:</strong> ${data.activityData.weekdayAverage} players</p>
                        </div>
                    </div>
                    
                    <div class="analytics-section">
                        <h3><i class="fas fa-building"></i> Department Distribution</h3>
                        <div class="department-chart">
                            ${Object.entries(data.departmentStats).map(([dept, count]) => `
                                <div class="dept-bar">
                                    <span class="dept-name">${dept}</span>
                                    <div class="dept-progress">
                                        <div class="dept-fill" style="width: ${(count / Math.max(...Object.values(data.departmentStats))) * 100}%"></div>
                                    </div>
                                    <span class="dept-count">${count}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    openStaffManagement() {
        alert('Staff Management Panel\n\nFeatures:\n- Rank promotions/demotions\n- Access code management\n- Staff activity monitoring\n- Permission updates');
    }

    async openSiteSettings() {
        try {
            const response = await fetch('./data/site-settings.json');
            const settings = await response.json();
            this.showSiteSettingsModal(settings);
        } catch (error) {
            alert('Error loading site settings');
        }
    }

    showSiteSettingsModal(settings) {
        const modal = document.createElement('div');
        modal.className = 'settings-overlay';
        modal.innerHTML = `
            <div class="settings-modal">
                <div class="settings-header">
                    <h2><i class="fas fa-tools"></i> Site Settings</h2>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="close-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="settings-content">
                    <div class="setting-group">
                        <h3><i class="fas fa-wrench"></i> Maintenance Mode</h3>
                        <label class="toggle-switch">
                            <input type="checkbox" id="maintenanceToggle" ${settings.maintenance.enabled ? 'checked' : ''}>
                            <span class="slider"></span>
                            Enable Maintenance Mode
                        </label>
                        <textarea id="maintenanceMessage" placeholder="Maintenance message...">${settings.maintenance.message}</textarea>
                    </div>
                    <div class="setting-group">
                        <h3><i class="fas fa-bullhorn"></i> Announcements</h3>
                        <input type="text" id="priorityAnnouncement" placeholder="Priority announcement..." value="${settings.announcements.priority}">
                        <input type="text" id="secondaryAnnouncement" placeholder="Secondary announcement..." value="${settings.announcements.secondary}">
                    </div>
                    <div class="setting-group">
                        <h3><i class="fas fa-toggle-on"></i> Features</h3>
                        <label class="toggle-switch">
                            <input type="checkbox" id="robloxSearchToggle" ${settings.features.robloxSearch ? 'checked' : ''}>
                            <span class="slider"></span>
                            Roblox User Search
                        </label>
                        <label class="toggle-switch">
                            <input type="checkbox" id="ticketSystemToggle" ${settings.features.ticketSystem ? 'checked' : ''}>
                            <span class="slider"></span>
                            Ticket System
                        </label>
                    </div>
                    <div class="settings-actions">
                        <button onclick="authSystem.saveSettings()" class="btn">
                            <i class="fas fa-save"></i> Save Changes
                        </button>
                        <button onclick="authSystem.applyMaintenance()" class="btn btn-warning">
                            <i class="fas fa-exclamation-triangle"></i> Apply Maintenance
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    saveSettings() {
        const settings = {
            maintenance: {
                enabled: document.getElementById('maintenanceToggle').checked,
                message: document.getElementById('maintenanceMessage').value,
                allowedRanks: ['foundership', 'assistant_foundership']
            },
            announcements: {
                enabled: true,
                priority: document.getElementById('priorityAnnouncement').value,
                secondary: document.getElementById('secondaryAnnouncement').value
            },
            features: {
                robloxSearch: document.getElementById('robloxSearchToggle').checked,
                ticketSystem: document.getElementById('ticketSystemToggle').checked,
                analytics: true
            },
            theme: {
                primaryColor: '#3b82f6',
                siteName: 'UKBRUM Staff Portal'
            }
        };
        
        // In a real implementation, this would save to server
        localStorage.setItem('ukbrum_site_settings', JSON.stringify(settings));
        
        if (window.StaffPortal) {
            new window.StaffPortal().showToast('Settings saved successfully!', 'success');
        }
        
        document.querySelector('.settings-overlay').remove();
    }

    applyMaintenance() {
        const enabled = document.getElementById('maintenanceToggle').checked;
        if (enabled) {
            if (confirm('This will enable maintenance mode and restrict access. Continue?')) {
                document.body.innerHTML = `
                    <div class="maintenance-screen">
                        <div class="maintenance-content">
                            <i class="fas fa-tools maintenance-icon"></i>
                            <h1>Under Maintenance</h1>
                            <p>${document.getElementById('maintenanceMessage').value}</p>
                            <button onclick="location.reload()" class="btn">Refresh Page</button>
                        </div>
                    </div>
                `;
            }
        }
    }

    openSystemControls() {
        alert('System Controls\n\nAdvanced features:\n- Server configuration\n- Database management\n- Security settings\n- Backup systems');
    }

    showImmediateNotice() {
        const notice = document.createElement('div');
        notice.className = 'auth-overlay';
        notice.innerHTML = `
            <div class="auth-modal">
                <div class="auth-header">
                    <h2><i class="fas fa-exclamation-triangle"></i> Immediate Notice</h2>
                </div>
                <div class="auth-form">
                    <p style="color: #fca5a5; font-size: 1rem; line-height: 1.6; margin-bottom: 2rem;">Do not screen share or share Staff Sharepoint data as it will result in punishment.</p>
                    <button onclick="this.closest('.auth-overlay').remove()" class="btn auth-btn">
                        <i class="fas fa-check"></i> Understood
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(notice);
    }

    setupAuthUI() {
        // This method can be used for additional UI setup if needed
    }

    logout() {
        localStorage.removeItem('ukbrum_auth');
        location.reload();
    }

    hasAccess(requiredLevel) {
        return this.currentUser && this.currentUser.level >= requiredLevel;
    }

    hasPermission(permission) {
        return this.currentUser && (
            this.currentUser.access.includes(permission) || 
            this.currentUser.access.includes('all')
        );
    }
}

// Initialize auth system
let authSystem;
document.addEventListener('DOMContentLoaded', () => {
    authSystem = new AuthSystem();
});