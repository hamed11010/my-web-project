// Banned accounts management functionality
async function fetchData(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Load banned accounts
async function loadBannedAccounts() {
    try {
        const accounts = await fetchData('/api/users/banned');
        displayBannedAccounts(accounts);
    } catch (error) {
        console.error('Error loading banned accounts:', error);
    }
}

// Display banned accounts
function displayBannedAccounts(accounts) {
    const accountsContainer = document.getElementById('banned-accounts');
    if (!accountsContainer) return;

    accountsContainer.innerHTML = accounts.map(account => `
        <div class="account-item">
            <h3>${account.username}</h3>
            <p>Email: ${account.email}</p>
            <p>Banned on: ${new Date(account.bannedAt).toLocaleDateString()}</p>
            <button onclick="unbanUser('${account._id}')">Unban User</button>
        </div>
    `).join('');
}

// Unban user
async function unbanUser(userId) {
    if (!confirm('Are you sure you want to unban this user?')) return;

    try {
        await fetchData(`/api/users/${userId}/unban`, {
            method: 'PUT'
        });
        await loadBannedAccounts();
    } catch (error) {
        console.error('Error unbanning user:', error);
    }
}

// Initialize banned accounts page
document.addEventListener('DOMContentLoaded', () => {
    loadBannedAccounts();
}); 