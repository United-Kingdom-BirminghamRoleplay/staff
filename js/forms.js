class FormSystem {
    constructor() {
        this.forms = [];
        this.WEBHOOK_URL = 'https://discord.com/api/webhooks/1442944637139681291/YzrPvceSfIEeeGT17INGWPRjaYlr97vTxgx22r5STdTvDXvL2nAL2JE-sUL1Mvc2NOzo';
        this.TRAINING_WEBHOOK = 'https://discord.com/api/webhooks/1442944637139681291/YzrPvceSfIEeeGT17INGWPRjaYlr97vTxgx22r5STdTvDXvL2nAL2JE-sUL1Mvc2NOzo';
        this.TRIAL_LOG_WEBHOOK = 'https://discord.com/api/webhooks/1442944637139681291/YzrPvceSfIEeeGT17INGWPRjaYlr97vTxgx22r5STdTvDXvL2nAL2JE-sUL1Mvc2NOzo';
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
            console.log('Loading announcements...');
            const response = await fetch('./api/load.php?type=announcements');
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const text = await response.text();
            console.log('Raw response:', text);
            
            const data = JSON.parse(text);
            console.log('Parsed data:', data);
            
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

    async submitResponse(formId, data, submittedBy = 'Anonymous') {
        try {
            const response = await fetch('./api/save.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    type: 'response', 
                    formId, 
                    response: {
                        data,
                        submittedBy,
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

    async createAnnouncement(title, content, postedBy, roleId) {
        try {
            const announcement = { title, content, postedBy, roleId };
            const response = await fetch('./api/save.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'announcements', announcement })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Save failed');
            }
            
            const announcementUrl = `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, '')}announcement.html?id=${result.id}`;
            
            this.sendToDiscord({
                content: roleId ? `<@&${roleId}>` : '',
                embeds: [{
                    title: '📢 New Staff Announcement Posted!',
                    fields: [
                        { name: 'Title of Post:', value: title, inline: false },
                        { name: 'Posted by:', value: postedBy, inline: true },
                        { name: 'Link to view announcement:', value: `[Click here](${announcementUrl})`, inline: false }
                    ],
                    color: 0xff6b35,
                    timestamp: new Date().toISOString()
                }]
            });
            
            return announcement;
        } catch (error) {
            console.error('Announcement error:', error);
            throw error;
        }
    }

    canViewPin() {
        const auth = localStorage.getItem('staff_auth') || localStorage.getItem('ukbrum_auth');
        if (!auth) return false;
        try {
            const user = JSON.parse(auth);
            const rankHierarchy = {
                'moderation': 1,
                'administration': 2,
                'human_resources': 3,
                'oversight_enforcement': 4,
                'advisory_board': 5,
                'developer': 6,
                'assistant_founder': 7,
                'co_founder': 8,
                'founder': 9
            };
            return (rankHierarchy[user.rank] || 0) >= 3;
        } catch (e) {
            return false;
        }
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

    sendTrainingWebhook(training) {
        if (!this.TRAINING_WEBHOOK || this.TRAINING_WEBHOOK === 'YOUR_TRAINING_WEBHOOK_URL_HERE') return;
        
        const payload = {
            embeds: [{
                title: '📚 New Training Session Created',
                color: 0x00ff00,
                fields: [
                    { name: 'Training Title:', value: training.title, inline: false },
                    { name: 'Description:', value: training.description, inline: false },
                    { name: 'Date:', value: new Date(training.date).toLocaleDateString(), inline: true },
                    { name: 'Time:', value: training.time, inline: true },
                    { name: 'Posted by:', value: training.postedBy, inline: true }
                ],
                timestamp: new Date().toISOString(),
                footer: { text: 'Training Portal - Confirm your attendance!' }
            }]
        };
        
        fetch(this.TRAINING_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(() => {});
    }

    sendTrialLogWebhook(trialLog) {
        if (!this.TRIAL_LOG_WEBHOOK || this.TRIAL_LOG_WEBHOOK === 'YOUR_TRIAL_LOG_WEBHOOK_URL_HERE') return;
        
        const resultColor = trialLog.trialResult === 'Passed' ? 0x00ff00 : 
                           trialLog.trialResult === 'Failed' ? 0xff0000 : 0xff6b35;
        
        const payload = {
            embeds: [{
                title: '📋 Trial Log Submitted',
                color: resultColor,
                fields: [
                    { name: 'Trial Log #:', value: trialLog.trialLogNum, inline: true },
                    { name: 'Staff Member:', value: trialLog.staffMember, inline: true },
                    { name: 'Rank Change:', value: `${trialLog.oldRank} → ${trialLog.newRank}`, inline: true },
                    { name: 'Trial Period:', value: `${new Date(trialLog.trialStartDate).toLocaleDateString()} - ${new Date(trialLog.trialEndDate).toLocaleDateString()}`, inline: false },
                    { name: 'Result:', value: trialLog.trialResult, inline: true },
                    { name: 'Signed by:', value: trialLog.signedBy, inline: true }
                ],
                timestamp: new Date().toISOString(),
                footer: { text: 'Staff Trial System' }
            }]
        };
        
        fetch(this.TRIAL_LOG_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(() => {});
    }
}

window.formSystem = new FormSystem();