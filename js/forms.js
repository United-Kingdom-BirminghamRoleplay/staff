class FormSystem {
    constructor() {
        this.forms = [];
        this.WEBHOOK_URL = 'https://discord.com/api/webhooks/1425515405513855067/sf52yCMSFc6EZgHzJLWHheoUhCbKt12Nf7GF5sUhCRq26EyrClQbALK7neJQGCvjm37T';
    }
    
    async loadForms() {
        try {
            const response = await fetch('./api/load.php?type=forms');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            this.forms = Array.isArray(data) ? data : [];
            return this.forms;
        } catch (error) {
            console.error('Load error:', error);
            this.forms = [];
            return [];
        }
    }

    async loadAnnouncements() {
        try {
            const response = await fetch('./api/load.php?type=announcements');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Announcement load error:', error);
            return [];
        }
    }

    async createForm(title, description, fields) {
        const form = {
            pin: Math.floor(1000 + Math.random() * 9000),
            title,
            description,
            fields,
            responses: []
        };
        
        try {
            const response = await fetch('./api/save.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'forms', form })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Save failed');
            }
            
            form.id = result.id;
            return form;
        } catch (error) {
            console.error('Create error:', error);
            throw error;
        }
    }

    async submitResponse(formId, data) {
        try {
            const response = await fetch('./api/save.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    type: 'response', 
                    formId, 
                    response: {
                        data,
                        submitted: new Date().toISOString()
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Response error:', error);
            return false;
        }
    }

    async deleteForm(formId) {
        try {
            const response = await fetch('./api/save.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'delete_form', formId })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Delete error:', error);
            return false;
        }
    }

    async updateForm(formId, updates) {
        try {
            const response = await fetch('./api/save.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'update_form', formId, updates })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Update error:', error);
            return false;
        }
    }

    getForm(id) {
        return this.forms.find(form => form.id === id);
    }

    async createAnnouncement(title, content) {
        try {
            const response = await fetch('./api/save.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'announcements', announcement: { title, content } })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Save failed');
            }
            
            this.sendToDiscord({
                embeds: [{
                    title: '📢 New Announcement',
                    description: `**${title}**\n\n${content}`,
                    color: 0xff6b35,
                    timestamp: new Date().toISOString()
                }]
            });
            
            return { title, content };
        } catch (error) {
            console.error('Announcement error:', error);
            throw error;
        }
    }

    canViewPin() {
        const auth = localStorage.getItem('ukbrum_auth');
        if (!auth) return false;
        const user = JSON.parse(auth);
        return user.rank === 'senior_management' || user.rank === 'founder';
    }

    submitReport(data) {
        this.sendToDiscord({
            embeds: [{
                title: '🚨 General Report',
                color: 0xff0000,
                fields: [
                    { name: 'Type', value: data.reportType, inline: true },
                    { name: 'Roblox', value: data.robloxUsername, inline: true },
                    { name: 'Discord', value: data.discordUsername, inline: true },
                    { name: 'Description', value: data.description.substring(0, 500), inline: false }
                ],
                timestamp: new Date().toISOString()
            }]
        });
    }

    sendToDiscord(payload) {
        fetch(this.WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(() => {});
    }
}

window.formSystem = new FormSystem();