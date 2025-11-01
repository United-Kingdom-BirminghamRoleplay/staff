// IP Ban Check System
class IPBanChecker {
    constructor() {
        this.checkIP();
    }

    async getUserIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return null;
        }
    }

    async checkIP() {
        // Skip check for banned.html page
        if (window.location.pathname.includes('banned.html')) {
            return;
        }

        const ip = await this.getUserIP();
        if (!ip) return;

        try {
            const response = await fetch(`./api/load.php?type=check_ip_ban&ip=${ip}`);
            const banInfo = await response.json();

            if (banInfo.banned) {
                // Redirect to banned page
                window.location.href = 'banned.html';
            }
        } catch (error) {
            console.error('IP check failed:', error);
        }
    }
}

// Initialize IP ban checker
new IPBanChecker();