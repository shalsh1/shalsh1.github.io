let loginTimeString = null;
let updateInterval = null;
let shiftEndNotified = false;
let currentTimeUpdateInterval = null;
let dailyLogsData = [];

function startTracking() {
    const loginInput = document.getElementById('loginTime').value;
    
    if (!loginInput) {
        alert('Please enter your login time');
        return;
    }
    
    loginTimeString = loginInput;
    // Save to localStorage
    localStorage.setItem('workTrackerLoginTime', loginInput);
    localStorage.setItem('workTrackerStartDate', new Date().toDateString());
    
    // Stop updating the current time when tracking starts
    if (currentTimeUpdateInterval) clearInterval(currentTimeUpdateInterval);
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    displayTracking();
    
    // Start updating immediately and then every second
    updateStats();
    if (updateInterval) clearInterval(updateInterval);
    updateInterval = setInterval(updateStats, 1000);
}

function displayTracking() {
    document.getElementById('statsSection').style.display = 'grid';
    document.getElementById('progressBar').style.display = 'block';
    document.getElementById('resetBtn').style.display = 'block';
    document.getElementById('inputSection').style.display = 'none';
    document.getElementById('activitySection').style.display = 'none';
    document.getElementById('activityToggleBtn').style.display = 'block';
}

function updateStats() {
    const now = new Date();
    const [hours, minutes] = loginTimeString.split(':').map(Number);
    
    // Create login time for today
    const loginTime = new Date();
    loginTime.setHours(hours, minutes, 0, 0);
    
    // Calculate logout time (login + 9 hours)
    const logoutTime = new Date(loginTime);
    logoutTime.setHours(logoutTime.getHours() + 9);
    
    // Calculate elapsed time
    const elapsedMs = now - loginTime;
    const elapsedHours = Math.floor(elapsedMs / (1000 * 60 * 60));
    const elapsedMinutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
    
    // Calculate remaining time
    const remainingMs = logoutTime - now;
    const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
    const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    
    // Format logout time in 12-hour format
    let logoutHours = logoutTime.getHours();
    const logoutMinutes = String(logoutTime.getMinutes()).padStart(2, '0');
    const ampm = logoutHours >= 12 ? 'PM' : 'AM';
    logoutHours = logoutHours % 12 || 12;
    const logoutTimeFormatted = `${String(logoutHours).padStart(2, '0')}:${logoutMinutes} ${ampm}`;
    
    // Format login time in 12-hour format
    let loginHours = loginTime.getHours();
    const loginMinutes = String(loginTime.getMinutes()).padStart(2, '0');
    const loginAmpm = loginHours >= 12 ? 'PM' : 'AM';
    loginHours = loginHours % 12 || 12;
    const loginTimeFormatted = `${String(loginHours).padStart(2, '0')}:${loginMinutes} ${loginAmpm}`;
    
    // Update display
    document.getElementById('elapsed').textContent = 
        `${elapsedHours}h ${elapsedMinutes}m`;
    document.getElementById('loginTimeDisplay').textContent = loginTimeFormatted;
    document.getElementById('logoutTime').textContent = logoutTimeFormatted;
    document.getElementById('remaining').textContent = 
        remainingMs > 0 ? `${remainingHours}h ${remainingMinutes}m` : 'Go Home!';
    
    // Update progress bars
    const totalMs = 9 * 60 * 60 * 1000; // 9 hours in milliseconds
    const progressPercentage = Math.min((elapsedMs / totalMs) * 100, 100);
    const remainingPercentage = Math.max(((remainingMs / totalMs) * 100), 0);
    
    // Overall progress (time elapsed)
    document.getElementById('progressFill').style.width = progressPercentage + '%';
    
    // Elapsed progress bar
    document.getElementById('elapsedFill').style.width = progressPercentage + '%';
    
    // Remaining progress bar
    document.getElementById('remainingFill').style.width = remainingPercentage + '%';
    
    // Change stat cards color when work shift ends
    const statsCards = document.querySelectorAll('.stat-card');
    if (remainingMs <= 0) {
        statsCards.forEach(card => {
            card.style.background = 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)';
        });
        
        // Show activity section when time remaining is 0
        document.getElementById('activitySection').style.display = 'block';
        
        // Send notification once when shift ends
        if (!shiftEndNotified && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Work Shift Ended! 🎉', {
                body: 'Your 9-hour work shift is complete. Time to logout!',
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="75" font-size="75">🎉</text></svg>'
            });
            shiftEndNotified = true;
        }
    }
}

function resetTracker() {
    loginTimeString = null;
    shiftEndNotified = false;
    if (updateInterval) clearInterval(updateInterval);
    if (currentTimeUpdateInterval) clearInterval(currentTimeUpdateInterval);
    
    // Clear localStorage
    localStorage.removeItem('workTrackerLoginTime');
    localStorage.removeItem('workTrackerStartDate');
    
    document.getElementById('statsSection').style.display = 'none';
    document.getElementById('progressBar').style.display = 'none';
    document.getElementById('resetBtn').style.display = 'none';
    document.getElementById('activitySection').style.display = 'none';
    document.getElementById('activityToggleBtn').style.display = 'none';
    document.getElementById('inputSection').style.display = 'flex';
    document.getElementById('loginTime').value = '';
    document.getElementById('loginTime').disabled = false;
    
    // Reset button state
    const startBtn = document.querySelector('.input-section button');
    startBtn.disabled = false;
    startBtn.style.opacity = '1';
    
    // Reset stat card backgrounds
    const statsCards = document.querySelectorAll('.stat-card');
    statsCards.forEach(card => {
        card.style.background = 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)';
    });
    
    // Restart updating current time
    setCurrentTime();
    currentTimeUpdateInterval = setInterval(setCurrentTime, 60000);
}

function logActivityFromInput() {
    const activityInput = document.getElementById('activityInput');
    const activity = activityInput.value.trim();
    
    if (!activity) {
        alert('Please enter an activity before logging.');
        return;
    }
    
    const logEntry = {
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString(),
        activity: activity
    };
    
    // Get existing logs
    const existingLogs = JSON.parse(localStorage.getItem('dailyLogs') || '[]');
    existingLogs.push(logEntry);
    localStorage.setItem('dailyLogs', JSON.stringify(existingLogs));
    
    alert('Activity logged successfully!');
    dailyLogsData = existingLogs;
    activityInput.value = '';
    activityInput.focus();
}

function handleActivityKeypress(event) {
    if (event.key === 'Enter') {
        logActivityFromInput();
    }
}

function showDailyLogPopup() {
    // Legacy function - kept for compatibility
    logActivityFromInput();
}

function toggleActivitySection() {
    const activitySection = document.getElementById('activitySection');
    const toggleBtn = document.getElementById('activityToggleBtn');
    
    if (activitySection.style.display === 'none') {
        activitySection.style.display = 'block';
        toggleBtn.style.display = 'none';
    } else {
        activitySection.style.display = 'none';
        toggleBtn.style.display = 'block';
    }
}

function exportToExcel() {
    const logs = JSON.parse(localStorage.getItem('dailyLogs') || '[]');
    
    if (logs.length === 0) {
        alert('No logs to export. Start logging activities first!');
        return;
    }
    
    // Create CSV content
    let csvContent = 'Date,Time,Activity\n';
    logs.forEach(log => {
        const date = log.date || '';
        const time = log.time || '';
        const activity = `"${log.activity.replace(/"/g, '""')}"`;
        csvContent += `${date},${time},${activity}\n`;
    });
    
    // Create Blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `daily-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('Logs exported successfully!');
}

function resetActivities() {
    const confirmReset = confirm('Are you sure you want to clear all logged activities? This cannot be undone.');
    
    if (confirmReset) {
        localStorage.removeItem('dailyLogs');
        dailyLogsData = [];
        alert('All activities have been cleared!');
    }
}

function setCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('loginTime').value = `${hours}:${minutes}`;
}

// Initialize app on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if there's a saved login time
    const savedLoginTime = localStorage.getItem('workTrackerLoginTime');
    const savedStartDate = localStorage.getItem('workTrackerStartDate');
    const currentDate = new Date().toDateString();
    
    // Resume tracking if login was from today
    if (savedLoginTime && savedStartDate === currentDate) {
        loginTimeString = savedLoginTime;
        document.getElementById('loginTime').value = savedLoginTime;
        shiftEndNotified = false; // Reset notification flag
        displayTracking();
        
        // Start updating immediately and then every second
        updateStats();
        if (updateInterval) clearInterval(updateInterval);
        updateInterval = setInterval(updateStats, 1000);
    } else {
        // Only show and update current time if tracking hasn't started
        setCurrentTime();
        currentTimeUpdateInterval = setInterval(setCurrentTime, 60000);
    }
    
    // Allow Enter key to start tracking
    document.getElementById('loginTime').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            startTracking();
        }
    });
});
