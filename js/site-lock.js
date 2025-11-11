// Site lock checker
async function checkSiteLock() {
    try {
        const response = await fetch('./api/load.php?type=website_control');
        const data = await response.json();
        
        if (data.site_locked) {
            // Redirect to lock page unless user is Level 5+
            if (window.discordAuth && window.discordAuth.isAuthenticated()) {
                const user = window.discordAuth.getCurrentUser();
                if (user.level >= 5) {
                    return; // Allow Level 5+ users
                }
            }
            window.location.href = 'locked.html';
        }
    } catch (error) {
        console.error('Site lock check failed:', error);
    }
}

// Check on page load
document.addEventListener('DOMContentLoaded', checkSiteLock);

// Check every 30 seconds
setInterval(checkSiteLock, 30000);