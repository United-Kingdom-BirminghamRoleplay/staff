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
        // IP check disabled - pages should load normally
        console.log('IP check disabled for debugging');
        return;
    }
}

// Initialize IP ban checker
new IPBanChecker();