document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in and is admin
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!token || !user || user.role !== 'admin') {
        window.location.href = '/login.html';
        return;
    }

    // Load banned users
    try {
        const response = await fetch('http://localhost:5000/api/users/banned', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch banned users');
        }

        const bannedUsers = await response.json();
        const tableBody = document.querySelector('#bannedUsersTable tbody');
        
        if (tableBody) {
            tableBody.innerHTML = bannedUsers.map(user => `
                <tr>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.banReason || 'No reason provided'}</td>
                    <td>${new Date(user.bannedAt).toLocaleString()}</td>
                    <td>
                        <button class="unban-btn" data-user-id="${user._id}">Unban User</button>
                    </td>
                </tr>
            `).join('');

            // Add event listeners to unban buttons
            document.querySelectorAll('.unban-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const userId = e.target.dataset.userId;
                    if (await unbanUser(userId)) {
                        e.target.closest('tr').remove();
                    }
                });
            });
        }
    } catch (error) {
        console.error('Error loading banned users:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load banned users'
        });
    }
});

async function unbanUser(userId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/users/unban/${userId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to unban user');
        }

        Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'User has been unbanned'
        });

        return true;
    } catch (error) {
        console.error('Error unbanning user:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to unban user'
        });
        return false;
    }
} 