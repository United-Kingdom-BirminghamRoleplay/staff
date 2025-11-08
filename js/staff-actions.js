// Staff Actions Handler - Non-module version
window.StaffActions = {
    actions: [],
    
    async loadActions() {
        try {
            // Assuming firebase-config.js sets up window.db
            if (!window.db) {
                console.error('Firebase not initialized');
                return [];
            }
            
            const snapshot = await window.db.collection('staffActions').get();
            this.actions = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                this.actions.push({
                    id: doc.id,
                    action: data.action,
                    targetId: data.targetId,
                    reason: data.reason,
                    timestamp: data.timestamp,
                    ...data
                });
            });
            
            return this.actions;
        } catch (error) {
            console.error('Error loading staff actions:', error);
            return [];
        }
    },
    
    getActionTypeColor(action) {
        const colors = {
            'promotions': '#22c55e',
            'terminations': '#dc2626',
            'quota strikes': '#f59e0b',
            'promotion points': '#3b82f6',
            'consequences': '#ef4444',
            'under investigation': '#f97316',
            'demotion': '#ef4444',
            'retrain': '#8b5cf6'
        };
        return colors[action?.toLowerCase()] || '#6b7280';
    },
    
    getActionTypeIcon(action) {
        const icons = {
            'promotions': 'fas fa-arrow-up',
            'terminations': 'fas fa-times-circle',
            'quota strikes': 'fas fa-exclamation-triangle',
            'promotion points': 'fas fa-star',
            'consequences': 'fas fa-gavel',
            'under investigation': 'fas fa-search',
            'demotion': 'fas fa-arrow-down',
            'retrain': 'fas fa-graduation-cap'
        };
        return icons[action?.toLowerCase()] || 'fas fa-file-alt';
    },
    
    formatTimestamp(timestamp) {
        if (!timestamp) return 'Unknown';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString();
    }
};