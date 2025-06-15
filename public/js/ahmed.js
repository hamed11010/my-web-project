const API_BASE_URL = 'http://localhost:5000/api';

async function fetchData(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            credentials: 'include', // Include cookies in the request
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
    aboutUsBtn.onclick = () => window.location.href = '/about-us';
    navButtons.appendChild(aboutUsBtn);

    // Fetch user data from the server
    try {
        const userData = await fetchData(`${API_BASE_URL}/users/verify`);
        const user = userData.user;

        if (user) {
            // Add Menu button
            const menuBtn = document.createElement('button');
            menuBtn.textContent = 'Menu';
            menuBtn.onclick = () => window.location.href = '/menu';
            navButtons.appendChild(menuBtn);

            // Show cart button in hero section for non-admin users
            const cartBtn = document.getElementById('cart-btn');
            if (cartBtn && user.role !== 'admin') {
                cartBtn.style.display = 'inline-block';
            }

            // Add Cart button to nav only if user is not admin
            if (user.role !== 'admin') {
                const cartBtn = document.createElement('button');
                cartBtn.textContent = 'Cart';
                cartBtn.onclick = () => window.location.href = '/cart';
                navButtons.appendChild(cartBtn);
            }

            // Add admin buttons if user is admin
            if (user.role === 'admin') {
                const adminDashboardBtn = document.createElement('button');
                adminDashboardBtn.textContent = 'Admin Dashboard';
                adminDashboardBtn.onclick = () => window.location.href = '/admin/dashboard';
                navButtons.appendChild(adminDashboardBtn);

                const storeOrderingBtn = document.createElement('button');
                storeOrderingBtn.textContent = 'Store Ordering';
                storeOrderingBtn.onclick = () => window.location.href = '/storeOrdering';
                navButtons.appendChild(storeOrderingBtn);

                const bannedAccountsBtn = document.createElement('button');
                bannedAccountsBtn.textContent = 'Banned Accounts';
                bannedAccountsBtn.onclick = () => window.location.href = '/banned-accounts';
                navButtons.appendChild(bannedAccountsBtn);
            }

            // Add Logout button
            const logoutBtn = document.createElement('button');
            logoutBtn.textContent = 'Logout';
            logoutBtn.onclick = async () => {
                try {
                    await fetchData(`${API_BASE_URL}/users/logout`, {
                        method: 'POST',
                        credentials: 'include'
                    });
                    window.location.href = '/';
                } catch (error) {
                    console.error('Error logging out:', error);
                }
            };
            navButtons.appendChild(logoutBtn);
        } else {
            // Add Signup button for non-logged in users
            const signupBtn = document.createElement('button');
            signupBtn.textContent = 'Sign Up';
            signupBtn.onclick = () => window.location.href = '/signup';
            navButtons.appendChild(signupBtn);
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
});


