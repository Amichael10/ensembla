const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'src/pages/admin');
const scrapingPath = path.join(adminDir, 'AdminCinemaScraping.jsx');

if (fs.existsSync(scrapingPath)) {
    let content = fs.readFileSync(scrapingPath, 'utf8');
    
    // Header & Titles
    content = content.replace(/Automation Matrix/g, 'Cinema Scrapers');
    content = content.replace(/Showtime Intelligence/g, 'Manage Showtimes');
    content = content.replace(/Protocol Response Stream/g, 'Sync Details');
    content = content.replace(/Entire Matrix/g, 'All Cinemas');
    content = content.replace(/Active Signals/g, 'Enabled');
    content = content.replace(/Offline Nodes/g, 'Disabled');
    content = content.replace(/Conflict Log/g, 'Errors');
    
    // Table Headers
    content = content.replace(/Operational Node/g, 'Cinema Location');
    content = content.replace(/Relay Adapter/g, 'Sync Method');
    content = content.replace(/Node Controls/g, 'Actions');
    
    // Tooltips/Statuses
    content = content.replace(/Conflict Identified/g, 'Error');
    content = content.replace(/Operational Integrity Confirmed/g, 'Healthy');
    content = content.replace(/Matrix manipulation failed/g, 'Failed to update cinema');
    content = content.replace(/Facility re-initialized/g, 'Errors cleared');
    content = content.replace(/Sync sequence initiated/g, 'Starting sync...');
    content = content.replace(/Sync protocol failure/g, 'Sync failed to start');
    content = content.replace(/Connecting to Intelligence Matrix\.\.\./g, 'Loading cinemas...');
    content = content.replace(/No signals detected/g, 'No cinemas found');
    content = content.replace(/Isolate Node/g, 'Turn Off');
    content = content.replace(/Initialize Node/g, 'Turn On');
    content = content.replace(/View Infrastructure/g, 'Edit Details');
    
    // Buttons
    content = content.replace(/Command Manual Sync/g, 'Start Manual Sync');

    fs.writeFileSync(scrapingPath, content);
    console.log('Updated AdminCinemaScraping.jsx with simple English');
}

// Fix AdminLayout Logout
const layoutPath = path.join(adminDir, 'AdminLayout.jsx');
if (fs.existsSync(layoutPath)) {
    let layout = fs.readFileSync(layoutPath, 'utf8');
    
    // Add logout from useAuth
    if (!layout.includes('const { user, logout } = useAuth();')) {
        layout = layout.replace('const { user } = useAuth();', 'const { user, logout } = useAuth();');
    }
    
    // Improve Logout Button (Replace Exit or Add beside it)
    const logoutBtn = `
            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={logout}
                className="w-full text-center py-3 text-[10px] bg-red-500/10 rounded-md text-red-500 hover:text-white hover:bg-red-500 transition-all font-black uppercase tracking-wider flex items-center justify-center gap-2 border border-red-500/20"
              >
                <span>🚪</span> Sign Out
              </button>
              <Link
                to="/"
                className="w-full text-center py-2 text-[10px] bg-surface-2 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-3 transition-all font-medium uppercase tracking-wider"
              >
                Go to Website
              </Link>
            </div>`;

    const exitLinkPattern = /<div className="mt-4 flex gap-2">[\s\S]*?<\/Link>\s*<\/div>/;
    layout = layout.replace(exitLinkPattern, logoutBtn);
    
    fs.writeFileSync(layoutPath, layout);
    console.log('Updated AdminLayout.jsx with prominent Logout button');
}
