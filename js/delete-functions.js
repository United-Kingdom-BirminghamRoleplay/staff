// Delete functions for all form types

async function deleteTrialLog(logId) {
    if (!confirm('Delete this trial log? This cannot be undone.')) return;
    
    try {
        const response = await fetch('./api/save.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                type: 'delete_trial_log', 
                logId: logId,
                deletedBy: window.discordAuth?.getCurrentUser()?.username || 'Unknown'
            })
        });
        
        const result = await response.json();
        if (result.success) {
            loadTrialLogs();
            alert('Trial log deleted successfully');
        } else {
            alert('Failed to delete trial log');
        }
    } catch (error) {
        alert('Error deleting trial log');
    }
}

async function editTraining(trainingId) {
    // For now, just show alert - can be expanded later
    alert('Edit training functionality coming soon');
}