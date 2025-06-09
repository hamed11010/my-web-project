const API_BASE_URL = 'http://localhost:5000/api';

async function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!token || !user) {
        Swal.fire({
            icon: 'error',
            title: 'Access Denied',
            text: 'Please log in to access this page'
        }).then(() => {
            window.location.href = '/login';
        });
        return false;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Invalid token');
        }

        return true;
    } catch (error) {
        console.error('Auth verification failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        Swal.fire({
            icon: 'error',
            title: 'Session Expired',
            text: 'Please log in again'
        }).then(() => {
            window.location.href = '/login';
        });
        return false;
    }
}

// Initialize navigation
document.addEventListener('DOMContentLoaded', async () => {
    const navButtons = document.getElementById('nav-buttons');
    if (!navButtons) return;

    // Add Home button
    const homeBtn = document.createElement('button');
    homeBtn.textContent = 'Home';
    homeBtn.onclick = () => window.location.href = '/';
    navButtons.appendChild(homeBtn);

    // Add About Us button
    const aboutUsBtn = document.createElement('button');
    aboutUsBtn.textContent = 'About Us';
    aboutUsBtn.className = 'active';
    navButtons.appendChild(aboutUsBtn);

    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (token && user) {
        // Add Menu button
        const menuBtn = document.createElement('button');
        menuBtn.textContent = 'Menu';
        menuBtn.onclick = async () => {
            if (await checkAuth()) {
                window.location.href = '/menu';
            }
        };
        navButtons.appendChild(menuBtn);

        // Add Cart button
        const cartBtn = document.createElement('button');
        cartBtn.textContent = 'Cart';
        cartBtn.onclick = async () => {
            if (await checkAuth()) {
                window.location.href = '/cart';
            }
        };
        navButtons.appendChild(cartBtn);

        // Add admin buttons if user is admin
        if (user.role === 'admin') {
            const storeOrderingBtn = document.createElement('button');
            storeOrderingBtn.textContent = 'Store Ordering';
            storeOrderingBtn.onclick = async () => {
                if (await checkAuth('admin')) {
                    window.location.href = '/store-ordering';
                }
            };
            navButtons.appendChild(storeOrderingBtn);

            const bannedAccountsBtn = document.createElement('button');
            bannedAccountsBtn.textContent = 'Banned Accounts';
            bannedAccountsBtn.onclick = async () => {
                if (await checkAuth('admin')) {
                    window.location.href = '/admin/banned-accounts';
                }
            };
            navButtons.appendChild(bannedAccountsBtn);
        }

        // Add Logout button
        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = 'Logout';
        logoutBtn.onclick = () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        };
        navButtons.appendChild(logoutBtn);
    } else {
        // Add Login button
        const loginBtn = document.createElement('button');
        loginBtn.textContent = 'Login';
        loginBtn.onclick = () => window.location.href = '/login';
        navButtons.appendChild(loginBtn);

        // Add Sign up button
        const signupBtn = document.createElement('button');
        signupBtn.textContent = 'Sign up';
        signupBtn.onclick = () => window.location.href = '/signup';
        navButtons.appendChild(signupBtn);
    }
});


