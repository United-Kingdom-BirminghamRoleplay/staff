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

        // Hide page content while checking
        document.body.style.visibility = 'hidden';

        const ip = await this.getUserIP();
        if (!ip) {
            document.body.style.visibility = 'visible';
            return;
        }

        try {
            const response = await fetch(`./api/load.php?type=check_ip_ban&ip=${ip}`);
            const banInfo = await response.json();

            if (banInfo.banned) {
                // Redirect to banned page immediately
                window.location.replace('banned.html');
                return;
            }
        } catch (error) {
            console.error('IP check failed:', error);
        }
        
        // Show page content if not banned
        document.body.style.visibility = 'visible';
    }
}

// Initialize IP ban checker
new IPBanChecker();