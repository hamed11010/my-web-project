// Validation functions
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return re.test(password);
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const toggleForms = document.getElementById('toggle-forms');

    if (toggleForms) {
        toggleForms.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.classList.toggle('hidden');
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:5000/api/users/login', {
            method: 'POST',
            credentials: 'include', // Include cookies in the request
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        // Show success message
        Swal.fire({
            icon: 'success',
            title: 'Login Successful!',
            text: 'Welcome back!',
            timer: 1500,
            showConfirmButton: false
        }).then(() => {
            // Redirect to home page
            window.location.href = '/';
        });

    } catch (error) {
        console.error('Login error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Login Failed',
            text: error.message || 'Please check your credentials and try again'
        });
    }
}

// Forgot password function
function forgotPassword() {
    Swal.fire({
        title: 'Reset Password',
        input: 'email',
        inputLabel: 'Enter your email address',
        inputPlaceholder: 'Enter your email',
        showCancelButton: true,
        confirmButtonText: 'Send Reset Link',
        showLoaderOnConfirm: true,
        preConfirm: async (email) => {
            if (!validateEmail(email)) {
                Swal.showValidationMessage('Please enter a valid email address');
                return false;
            }
            try {
                const response = await fetch('http://localhost:5000/api/users/forgot-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to send reset link');
                }
                
                return await response.json();
            } catch (error) {
                Swal.showValidationMessage(`Request failed: ${error.message}`);
            }
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                icon: 'success',
                title: 'Reset Link Sent',
                text: 'Please check your email for password reset instructions'
            });
        }
    });
}

// Handle admin link clicks
async function handleAdminLink(event, href) {
    event.preventDefault();

    try {
        const response = await fetch(href, {
            credentials: 'include' // Include cookies in the request
        });

        if (response.ok) {
            window.location.href = href;
        } else {
            throw new Error('Not authorized');
        }
    } catch (error) {
        console.error('Navigation error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Access Denied',
            text: 'You are not authorized to access this page'
        });
    }
}

// Order management functionality
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

// Load orders
async function loadOrders() {
    try {
        const orders = await fetchData('/api/orders');
        displayOrders(orders);
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// Display orders
function displayOrders(orders) {
    const ordersContainer = document.getElementById('orders-container');
    if (!ordersContainer) return;

    ordersContainer.innerHTML = orders.map(order => `
        <div class="order-item">
            <h3>Order #${order._id}</h3>
            <p>Status: ${order.status}</p>
            <p>Total: $${order.total}</p>
            <button onclick="updateOrderStatus('${order._id}', 'completed')">Mark as Completed</button>
        </div>
    `).join('');
}

// Update order status
async function updateOrderStatus(orderId, status) {
    try {
        await fetchData(`/api/orders/${orderId}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        await loadOrders();
    } catch (error) {
        console.error('Error updating order:', error);
    }
}

// Initialize orders page
document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
}); 