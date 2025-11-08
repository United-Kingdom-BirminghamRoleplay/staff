import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase-config.js";

export async function getStaffActions() {
  try {
    const staffActionsRef = collection(db, "staffActions");
    const querySnapshot = await getDocs(staffActionsRef);

    const actions = querySnapshot.docs.map((doc) => {
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

    console.log("Staff Actions:", actions);
    return actions;
  } catch (error) {
    console.error("Error fetching staff actions:", error);
    return [];
  }
}

export function getActionTypeColor(action) {
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

export function getActionTypeIcon(action) {
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

export function formatTimestamp(timestamp) {
  if (!timestamp) return 'Unknown';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString();
}