class FormSystem {
    constructor() {
        this.forms = [];
        this.announcements = [];
        this.WEBHOOK_URL = 'https://discord.com/api/webhooks/1425515405513855067/sf52yCMSFc6EZgHzJLWHheoUhCbKt12Nf7GF5sUhCRq26EyrClQbALK7neJQGCvjm37T';
        this.ANNOUNCEMENT_WEBHOOK = 'https://discord.com/api/webhooks/1425527865281085501/MlLK4__Ztp6tFDhER5S-Wa-HRo_es8jpgvT69VsfAbeCIicVVrtC-XZxXNX0t37Qts6I';
    }
    
    async loadForms() {
        try {
            const response = await fetch('./api/load.php?type=forms');
            console.log('Load response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const text = await response.text();
            console.log('Raw response:', text);
            
            const data = JSON.parse(text);
            console.log('Parsed data:', data);
            
            // Ensure we always return an array
            this.forms = Array.isArray(data) ? data : [];
            console.log('Final forms array:', this.forms);
            return this.forms;
        } catch (error) {
            console.error('Error loading forms:', error);
            this.forms = [];
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
        
        console.log('Creating form:', form);
        
        try {
            const response = await fetch('./api/save.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'forms', form })
            });
            
            console.log('Save response status:', response.status);
            
            const text = await response.text();
            console.log('Save response text:', text);
            
            const result = JSON.parse(text);
            if (!result.success) throw new Error(result.error);
            
            form.id = result.id;
            return form;
        } catch (error) {
            console.error('Error creating form:', error);
            throw error;
        }
    }

    getForm(id) {
        return this.forms.find(form => form.id === id);
    }

    async createAnnouncement(title, content) {
        const announcement = { title, content };
        
        try {
            const response = await fetch('./api/save.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'announcements', announcement })
            });
            
            const result = await response.json();
            if (!result.success) throw new Error(result.error);
            
            this.sendToDiscord({
                embeds: [{
                    title: '📢 New Announcement',
                    description: `**${title}**\n\n${content}`,
                    color: 0xff6b35,
                    timestamp: new Date().toISOString(),
                    footer: { text: 'UK Birmingham Staff Portal' }
                }]
            });
            
            return announcement;
        } catch (error) {
            console.error('Error creating announcement:', error);
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
                title: '🚨 General Report Submitted',
                color: 0xff0000,
                fields: [
                    { name: 'Report Type', value: data.reportType, inline: true },
                    { name: 'Roblox Username', value: data.robloxUsername, inline: true },
                    { name: 'Discord Username', value: data.discordUsername, inline: true },
                    { name: 'Description', value: data.description, inline: false },
                    { name: 'Evidence', value: data.evidence || 'None provided', inline: true }
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
        }).catch(console.error);
    }
}

window.formSystem = new FormSystem();