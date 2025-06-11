document.addEventListener('DOMContentLoaded', () => {
    const requestResetForm = document.getElementById('requestResetForm');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const emailInput = document.getElementById('email');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmNewPasswordInput = document.getElementById('confirmNewPassword');

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    // Show appropriate form based on token presence
    if (token) {
        requestResetForm.style.display = 'none';
        resetPasswordForm.style.display = 'block';
    } else {
        requestResetForm.style.display = 'block';
        resetPasswordForm.style.display = 'none';
    }

    // Handle Request Reset Form submission
    requestResetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();

        if (!email) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Please enter your email address.'
            });
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/users/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Email Sent',
                    text: data.message || 'If an account with that email exists, a password reset link has been sent to it.'
                });
            } else {
                throw new Error(data.message || 'Failed to send reset link.');
            }
        } catch (error) {
            console.error('Forgot password request error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Request Failed',
                text: error.message || 'Something went wrong. Please try again later.'
            });
        }
    });

    // Handle Reset Password Form submission
    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = newPasswordInput.value;
        const confirmNewPassword = confirmNewPasswordInput.value;

        if (!newPassword || !confirmNewPassword) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Please enter and confirm your new password.'
            });
            return;
        }

        if (newPassword !== confirmNewPassword) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Passwords do not match.'
            });
            return;
        }

        if (newPassword.length < 8) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'New password must be at least 8 characters long.'
            });
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/users/reset-password/${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password: newPassword })
            });

            const data = await response.json();

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Password Reset!',
                    text: data.message || 'Your password has been successfully reset. You can now log in with your new password.'
                }).then(() => {
                    window.location.href = '/login'; // Redirect to login page
                });
            } else {
                throw new Error(data.message || 'Failed to reset password.');
            }
        } catch (error) {
            console.error('Reset password error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Reset Failed',
                text: error.message || 'Something went wrong. Please try again.'
            });
        }
    });
}); 