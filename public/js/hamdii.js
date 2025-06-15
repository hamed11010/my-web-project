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

    // Function to toggle admin privileges section
    function toggleAdminPrivileges() {
        if (userTypeSelect.value === 'admin') {
            adminPrivileges.style.display = 'block';
        } else {
            adminPrivileges.style.display = 'none';
        }
    }

    // Show/hide admin privileges section
    userTypeSelect.addEventListener('change', toggleAdminPrivileges);

    // Password validation
    function validatePassword(password) {
        const hasLength = password.length >= 8;
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[@$!%*?&]/.test(password);
        
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
        
        const passwordsMatch = password.value === confirmPassword.value;
        passwordMatch.style.display = passwordsMatch ? 'block' : 'none';
        passwordMismatch.style.display = passwordsMatch ? 'none' : 'block';
        return passwordsMatch;
    }

    password.addEventListener('input', () => {
        validatePassword(password.value);
        if (confirmPassword.value) {
            validatePasswordMatch();
        }
    });

    confirmPassword.addEventListener('input', () => {
        if (password.value) {
            validatePasswordMatch();
        }
    });

    // Form submission
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const termsCheck = document.getElementById('termsCheck').checked;
        const userType = document.getElementById('userType').value;

        // Validate all fields
        if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Please fill in all required fields'
            });
            return;
        }

        if (!termsCheck) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Please agree to the Terms of Service and Privacy Policy'
            });
            return;
        }

        if (!validatePassword(password)) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Password does not meet the requirements'
            });
            return;
        }

        if (password !== confirmPassword) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Passwords do not match'
            });
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: `${firstName} ${lastName}`,
                    email,
                    password,
                    phoneNumber: phone,
                    role: userType
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Registration failed');
            }

            const data = await response.json();
            
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Account created successfully!'
            }).then(() => {
                // Redirect to login page
                window.location.href = '/login';
            });
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
    
    phone.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) {
            value = value.slice(0, 11);
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
        } else {
            errorMessage.textContent = '';
        }
    });
    
    // Initialize admin privileges section
    toggleAdminPrivileges();
});