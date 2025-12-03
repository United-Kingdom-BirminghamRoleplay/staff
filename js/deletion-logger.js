// Global deletion logging system
window.DeletionLogger = {
    async logDeletion(type, itemId, itemName, additionalData = {}) {
        try {
            const user = window.discordAuth?.getCurrentUser();
            if (!user) return;

            const logData = {
                type: 'security_event',
                event: {
                    type: `DELETE_${type.toUpperCase()}`,
                    data: {
                        action: `delete_${type}`,
                        itemType: type,
                        itemId: itemId,
                        itemName: itemName,
                        admin: user.username,
                        userId: user.userId,
                        timestamp: new Date().toISOString(),
                        ...additionalData
                    },
                    sessionId: 'deletion_action',
                    fingerprint: 'delete_action',
                    ip: 'website',
                    userAgent: navigator.userAgent,
                    url: window.location.href
                }
            };

            // Log to security events
            await fetch('./api/save.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(logData)
            });

            // Send Discord webhook for critical deletions
            const criticalTypes = ['form', 'assessment', 'announcement', 'file', 'training', 'touchpoint', 'trial_log'];
            if (criticalTypes.includes(type)) {
                await fetch('https://discord.com/api/webhooks/1442957109896675590/2uKYJXKuTl0wPyMxk_BFLaTVf7gMW4lnfpH_tNVKDSyfMxteEo33QgpsqPP1Kq4MFfxH', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        embeds: [{
                            title: `🗑️ ${type.charAt(0).toUpperCase() + type.slice(1)} Deleted`,
                            color: 0xff6600,
                            fields: [
                                { name: 'Item', value: itemName, inline: true },
                                { name: 'Admin', value: user.username, inline: true },
                                { name: 'Type', value: type, inline: true },
                                { name: 'ID', value: itemId, inline: false },
                                { name: 'Timestamp', value: new Date().toISOString(), inline: false }
                            ],
                            timestamp: new Date().toISOString()
                        }]
                    })
                });
            }
        } catch (error) {
            console.error('Failed to log deletion:', error);
        }
    }
};