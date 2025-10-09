// Simple Form System
class FormSystem {
    constructor() {
        this.forms = {};
        this.responses = {};
        this.announcements = { announcements: [] };
        this.WEBHOOK_URL = 'https://discord.com/api/webhooks/1425515405513855067/sf52yCMSFc6EZgHzJLWHheoUhCbKt12Nf7GF5sUhCRq26EyrClQbALK7neJQGCvjm37T';
        this.ANNOUNCEMENT_WEBHOOK = 'https://discord.com/api/webhooks/1425527865281085501/MlLK4__Ztp6tFDhER5S-Wa-HRo_es8jpgvT69VsfAbeCIicVVrtC-XZxXNX0t37Qts6I';
        this.loadData();
    }
    
    async loadData() {
        try {
            const [formsRes, responsesRes, announcementsRes] = await Promise.all([
                fetch('./api/load.php?type=forms'),
                fetch('./api/load.php?type=responses'),
                fetch('./api/load.php?type=announcements')
            ]);
            
            this.forms = await formsRes.json() || {};
            this.responses = await responsesRes.json() || {};
            this.announcements = await announcementsRes.json() || { announcements: [] };
        } catch (error) {
            console.log('Loading from localStorage as fallback');
            this.forms = JSON.parse(localStorage.getItem('staff_forms') || '{}');
            this.responses = JSON.parse(localStorage.getItem('staff_responses') || '{}');
            this.announcements = JSON.parse(localStorage.getItem('announcements') || '{"announcements": []}');
        }
    }

    async save() {
        localStorage.setItem('staff_forms', JSON.stringify(this.forms));
        localStorage.setItem('staff_responses', JSON.stringify(this.responses));
        localStorage.setItem('announcements', JSON.stringify(this.announcements));
        
        try {
            await fetch('./api/save.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'forms', data: this.forms })
            });
            
            await fetch('./api/save.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'responses', data: this.responses })
            });
            
            console.log('Data saved to server files');
        } catch (error) {
            console.error('Failed to save to server:', error);
        }
    }

    async createForm(title, description, fields) {
        const id = 'form_' + Date.now();
        const pin = Math.floor(1000 + Math.random() * 9000);
        
        this.forms[id] = {
            id, title, description, fields, pin,
            created: new Date().toISOString(),
            creator: this.getUser()
        };
        this.responses[id] = [];
        await this.save();
        
        this.logWebhook('FORM_CREATED', { title, fields: fields.length });
        return { id, pin };
    }

    getForm(id) {
        return this.forms[id];
    }

    async submitResponse(formId, data) {
        if (!this.forms[formId]) return false;
        
        const response = {
            id: Date.now(),
            data,
            submitted: new Date().toISOString()
        };
        
        this.responses[formId].push(response);
        await this.save();
        
        this.logWebhook('FORM_RESPONSE', { 
            form: this.forms[formId].title,
            response: data 
        });
        return true;
    }

    getResponses(formId, pin) {
        const form = this.forms[formId];
        if (!form || form.pin != pin) return null;
        return this.responses[formId] || [];
    }

    logWebhook(action, data) {
        let embed;
        
        if (action === 'GENERAL_REPORT') {
            embed = {
                title: '🚨 General Report Submitted',
                color: 0xff0000,
                fields: [
                    { name: 'Report Type', value: data.type, inline: true },
                    { name: 'Roblox Username', value: data.roblox, inline: true },
                    { name: 'Discord Username', value: data.discord, inline: true },
                    { name: 'Description', value: data.description, inline: false },
                    { name: 'Evidence Provided', value: data.evidence, inline: true }
                ],
                timestamp: new Date()
            };
        } else if (action === 'ANNOUNCEMENT_CREATED') {
            embed = {
                title: '📢 Staff Announcement Created',
                color: 0x00ff00,
                fields: [
                    { name: 'Title', value: data.title, inline: false },
                    { name: 'Content Preview', value: data.content, inline: false },
                    { name: 'Created By', value: data.creator, inline: true }
                ],
                timestamp: new Date()
            };
        } else {
            embed = {
                title: `📝 ${action}`,
                color: 0xff6b35,
                fields: Object.entries(data).map(([k, v]) => ({
                    name: k,
                    value: typeof v === 'object' ? JSON.stringify(v) : String(v),
                    inline: true
                })),
                timestamp: new Date()
            };
        }
        
        fetch(this.WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] })
        }).catch(console.error);
    }

    getUser() {
        const auth = localStorage.getItem('ukbrum_auth');
        return auth ? JSON.parse(auth).rank : 'unknown';
    }

    canViewPin() {
        const rank = this.getUser();
        return rank === 'senior_management' || rank === 'founder';
    }

    submitReport(data) {
        const report = {
            id: Date.now(),
            ...data,
            submitted: new Date().toISOString()
        };
        
        this.logWebhook('GENERAL_REPORT', {
            type: data.reportType,
            roblox: data.robloxUsername,
            discord: data.discordUsername,
            description: data.description.substring(0, 100) + '...',
            evidence: data.evidence ? 'Yes' : 'No'
        });
        
        return true;
    }

    createAnnouncement(title, content) {
        const announcement = {
            id: Math.random().toString(36).substr(2, 9),
            title,
            content,
            icon: 'fas fa-bullhorn',
            date: new Date().toLocaleDateString(),
            createdBy: this.getUser(),
            createdAt: new Date().toISOString()
        };
        
        this.announcements.announcements.unshift(announcement);
        this.save();
        
        setTimeout(() => {
            this.sendAnnouncementWebhook(announcement);
        }, 2000);
        
        return announcement;
    }
    
    sendAnnouncementWebhook(announcement) {
        const embed = {
            title: '📢 New Staff Notice Available',
            description: 'A new staff announcement has been posted on the website.',
            color: 0xff6b35,
            fields: [
                { name: 'Title', value: announcement.title, inline: false },
                { name: 'Posted By', value: announcement.createdBy, inline: true },
                { name: 'Date', value: announcement.date, inline: true }
            ],
            footer: { text: 'Check the staff website for full details' },
            timestamp: new Date()
        };
        
        fetch(this.ANNOUNCEMENT_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] })
        }).catch(console.error);
    }
}

window.formSystem = new FormSystem();