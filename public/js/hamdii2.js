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
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
            _id: data._id,
            name: data.name,
            email: data.email,
            role: data.role
        }));

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
    const token = localStorage.getItem('token');
    
    if (!token) {
        Swal.fire({
            icon: 'error',
            title: 'Access Denied',
            text: 'Please log in to access this page'
        });
        return;
    }

    try {
        const response = await fetch(href, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
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