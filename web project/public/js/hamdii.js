document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    const userTypeSelect = document.getElementById('userType');
    const adminPrivileges = document.getElementById('adminPrivileges');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    const passwordMatch = document.getElementById('passwordMatch');
    const passwordMismatch = document.getElementById('passwordMismatch');
    const username = document.getElementById('username');
    const userType = document.getElementById('userType');
    const usernameFeedback = document.getElementById('usernameFeedback');
    const termsCheck = document.getElementById('termsCheck');
    const termsFeedback = document.getElementById('termsFeedback');
    
    const lengthReq = document.getElementById('lengthReq');
    const lowerReq = document.getElementById('lowerReq');
    const upperReq = document.getElementById('upperReq');
    const numberReq = document.getElementById('numberReq');
    const specialReq = document.getElementById('specialReq');
    
    const firstName = document.getElementById('firstName');
    const lastName = document.getElementById('lastName');
    const email = document.getElementById('email');
    const phone = document.getElementById('phone');

    // Show/hide admin privileges section
    userTypeSelect.addEventListener('change', () => {
        adminPrivileges.style.display = userTypeSelect.value === 'admin' ? 'block' : 'none';
    });

    // Password validation
    function validatePassword(password) {
        const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        const hasLength = re.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        document.getElementById('lengthReq').className = `requirement ${hasLength ? 'valid' : 'invalid'}`;
        document.getElementById('lowerReq').className = `requirement ${hasLower ? 'valid' : 'invalid'}`;
        document.getElementById('upperReq').className = `requirement ${hasUpper ? 'valid' : 'invalid'}`;
        document.getElementById('numberReq').className = `requirement ${hasNumber ? 'valid' : 'invalid'}`;
        document.getElementById('specialReq').className = `requirement ${hasSpecial ? 'valid' : 'invalid'}`;
        
        return hasLength && hasLower && hasUpper && hasNumber && hasSpecial;
    }

    // Password match validation
    function validatePasswordMatch() {
        if (confirmPassword.value === '') {
            passwordMatch.style.display = 'none';
            passwordMismatch.style.display = 'none';
            return false;
        }
        
        if (password.value === confirmPassword.value) {
            passwordMatch.style.display = 'block';
            passwordMismatch.style.display = 'none';
            return true;
        } else {
            passwordMatch.style.display = 'none';
            passwordMismatch.style.display = 'block';
            return false;
        }
    }

    password.addEventListener('input', () => {
        validatePassword(password.value);
        validatePasswordMatch();
    });

    confirmPassword.addEventListener('input', validatePasswordMatch);

    // Form submission
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const termsCheck = document.getElementById('termsCheck').checked;

        // Validate all fields
        if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
            alert('Please fill in all required fields');
            return;
        }

        if (!termsCheck) {
            alert('Please agree to the Terms of Service and Privacy Policy');
            return;
        }

        if (!validatePassword(password)) {
            alert('Password does not meet the requirements');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        if (!validatePhoneNumber(phone)) {
            // Show SweetAlert error
            Swal.fire({
                icon: 'error',
                title: 'Invalid Phone Number',
                text: 'Please enter a valid Egyptian phone number. It must be 11 digits, start with 01, the third digit must be 0, 1, 2, or 5, and contain only numbers.'
            });
            // Show red error message under the phone input
            let errorMessage = document.getElementById('phone-error-message');
            if (!errorMessage) {
                errorMessage = document.createElement('div');
                errorMessage.id = 'phone-error-message';
                errorMessage.className = 'error-message';
                phone.parentNode.insertBefore(errorMessage, phone.nextSibling);
            }
            errorMessage.textContent = 'Please enter a valid Egyptian phone number.';
            errorMessage.style.color = 'red';
            return;
        } else {
            // Clear error message if valid
            let errorMessage = document.getElementById('phone-error-message');
            if (errorMessage) {
                errorMessage.textContent = '';
            }
        }

        // Send signup data to backend
        try {
            const response = await fetch('http://localhost:5000/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: `${firstName} ${lastName}`,
                    email,
                    password,
                    phoneNumber: phone,
                    role: document.getElementById('userType').value
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                // Store token and user data
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                // Redirect to home page
                window.location.href = '/';
            } else {
                throw new Error(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Registration Failed',
                text: error.message || 'Please try again'
            });
        }
    });

    // Toggle password visibility
    function togglePasswordVisibility(inputId) {
        const input = document.getElementById(inputId);
        const icon = input.nextElementSibling.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }

    function checkUsername() {
        const usernameValue = username.value.trim();
        
        if (userType.value === 'admin') {
            if (usernameValue.toLowerCase().startsWith('admin')) {
                usernameFeedback.textContent = 'Valid admin username';
                usernameFeedback.className = 'feedback valid-feedback';
                usernameFeedback.style.display = 'block';
                return true;
            } else {
                usernameFeedback.textContent = 'Admin username must start with "admin"';
                usernameFeedback.className = 'feedback invalid-feedback';
                usernameFeedback.style.display = 'block';
                return false;
            }
        } else {
            if (usernameValue.length >= 3) {
                usernameFeedback.textContent = 'Valid username';
                usernameFeedback.className = 'feedback valid-feedback';
                usernameFeedback.style.display = 'block';
                return true;
            } else {
                usernameFeedback.textContent = 'Username must be at least 3 characters';
                usernameFeedback.className = 'feedback invalid-feedback';
                usernameFeedback.style.display = 'block';
                return false;
            }
        }
    }
    
    function checkTerms() {
        if (termsCheck.checked) {
            termsFeedback.style.display = 'none';
            return true;
        } else {
            termsFeedback.style.display = 'block';
            return false;
        }
    }
    
    function validateName(name) {
        return /^[A-Za-z\s]+$/.test(name);
    }

    function validatePhoneNumber(phone) {
        const phoneRegex = /^01[0125]\d{8}$/;
        return phoneRegex.test(phone);
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    username.addEventListener('input', checkUsername);
    userType.addEventListener('change', function() {
        checkUsername();
        toggleAdminPrivileges();
    });
    
    termsCheck.addEventListener('change', checkTerms);
    
    [firstName, lastName].forEach(input => {
        input.addEventListener('input', function() {
            const isValid = validateName(this.value);
            this.classList.toggle('error', !isValid);
            
            let errorMessage = this.nextElementSibling;
            if (!errorMessage || !errorMessage.classList.contains('error-message')) {
                errorMessage = document.createElement('div');
                errorMessage.className = 'error-message';
                this.parentNode.insertBefore(errorMessage, this.nextSibling);
            }
            
            if (!isValid) {
                errorMessage.textContent = 'Name should only contain letters and spaces';
            } else {
                errorMessage.textContent = '';
            }
        });
    });

    email.addEventListener('input', function() {
        const isValid = validateEmail(this.value);
        this.classList.toggle('error', !isValid);
        
        let errorMessage = this.nextElementSibling;
        if (!errorMessage || !errorMessage.classList.contains('error-message')) {
            errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            this.parentNode.insertBefore(errorMessage, this.nextSibling);
        }
        
        if (!isValid) {
            errorMessage.textContent = 'Please enter a valid email address';
        } else {
            errorMessage.textContent = '';
        }
    });
    
    // Strictly allow only numbers to be typed
    phone.addEventListener('keydown', function(e) {
        // Allow: backspace, delete, tab, escape, enter, arrows
        if (
            [46, 8, 9, 27, 13, 110, 190].includes(e.keyCode) ||
            // Allow: Ctrl/cmd+A
            (e.keyCode === 65 && (e.ctrlKey || e.metaKey)) ||
            // Allow: Ctrl/cmd+C
            (e.keyCode === 67 && (e.ctrlKey || e.metaKey)) ||
            // Allow: Ctrl/cmd+V
            (e.keyCode === 86 && (e.ctrlKey || e.metaKey)) ||
            // Allow: Ctrl/cmd+X
            (e.keyCode === 88 && (e.ctrlKey || e.metaKey)) ||
            // Allow: home, end, left, right
            (e.keyCode >= 35 && e.keyCode <= 39)
        ) {
            // let it happen, don't do anything
            return;
        }
        // Ensure that it is a number and stop the keypress
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    });
    
    phone.addEventListener('input', function(e) {
        // Remove all non-digit characters
        let value = e.target.value.replace(/\D/g, '');
        // Enforce max length of 11
        if (value.length > 11) {
            value = value.slice(0, 11);
        }
        // Enforce starting with 01
        if (value.length >= 1 && value[0] !== '0') {
            value = '';
        } else if (value.length >= 2 && value.slice(0, 2) !== '01') {
            value = value[0];
        } else if (value.length >= 3 && !['0', '1', '2', '5'].includes(value[2])) {
            value = value.slice(0, 2);
        }
        e.target.value = value;

        const isValid = validatePhoneNumber(value);
        this.classList.toggle('error', !isValid);

        let errorMessage = this.nextElementSibling;
        if (!errorMessage || !errorMessage.classList.contains('error-message')) {
            errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            this.parentNode.insertBefore(errorMessage, this.nextSibling);
        }

        if (!isValid) {
            errorMessage.textContent = 'Please enter a valid Egyptian phone number';
            errorMessage.style.color = 'red';
        } else {
            errorMessage.textContent = '';
        }
    });
    
    function toggleAdminPrivileges() {
        adminPrivileges.style.display = userTypeSelect.value === 'admin' ? 'block' : 'none';
    }

    // Initial call to set correct display on page load
    toggleAdminPrivileges();
});