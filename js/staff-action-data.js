import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase-config.js";

// Staff Action Data Handler
class StaffActionData {
    constructor() {
        this.actions = [];
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        this.initialized = true;
        await this.loadStaffActions();
    }

    async loadStaffActions() {
        try {
            const staffActionsRef = collection(db, "staffActions");
            const querySnapshot = await getDocs(staffActionsRef);
            
            this.actions = querySnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    action: data.action,
                    targetId: data.targetId,
                    reason: data.reason,
                    timestamp: data.timestamp,
                    ...data
                };
            });
            
            console.log(`Loaded ${this.actions.length} staff actions`);
        } catch (error) {
            console.error('Error loading staff actions:', error);
        }
    }

    getActionsForUser(discordId) {
        return this.actions.filter(action => 
            action.targetId === discordId || 
            action.target_id === discordId ||
            action.targetDiscordId === discordId
        );
    }

    getActionsByType(action) {
        return this.actions.filter(actionData => actionData.action === action);
    }

    getActionsByDateRange(startDate, endDate) {
        return this.actions.filter(action => {
            const actionDate = new Date(action.timestamp?.toDate ? action.timestamp.toDate() : action.timestamp);
            return actionDate >= startDate && actionDate <= endDate;
        });
    }

    searchActions(searchTerm) {
        const term = searchTerm.toLowerCase();
        return this.actions.filter(actionData => 
            actionData.reason?.toLowerCase().includes(term) ||
            actionData.action?.toLowerCase().includes(term)
        );
    }

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
    }

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
    }

    formatTimestamp(timestamp) {
        if (!timestamp) return 'Unknown';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString();
    }
}

// Create global instance
window.staffActionData = new StaffActionData();