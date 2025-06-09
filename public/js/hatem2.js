console.log('hatem2.js loaded');

// Cart object to handle all cart operations
window.Cart = {
    // ... existing Cart methods ...
};

// Log when Cart object is initialized
console.log('Cart object initialized');

// Initialize checkout page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded');
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // Function to update order summary
    async function updateOrderSummary() {
        try {
            console.log('Fetching cart data...');
            // Get cart data from backend
            const cartResponse = await fetch('/api/cart', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!cartResponse.ok) {
                throw new Error('Failed to fetch cart');
            }

            const cartData = await cartResponse.json();
            console.log('Cart data received:', cartData);

            if (!cartData || !cartData.items || cartData.items.length === 0) {
                console.error('Empty cart data');
                Swal.fire({
                    title: 'Empty Cart',
                    text: 'Your cart is empty. Please add items before checkout.',
                    icon: 'warning'
                }).then(() => {
                    window.location.href = '/cart';
                });
                return;
            }
            
            // Update order summary
            const orderItems = document.getElementById('order-items');
            const subtotalElement = document.getElementById('subtotal');
            const discountElement = document.getElementById('discount');
            const orderTotal = document.getElementById('order-total');
            const discountRow = document.getElementById('discount-row');
            
            // Clear existing items
            orderItems.innerHTML = '';
            
            // Add items to summary
            cartData.items.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'summary-item';
                itemElement.innerHTML = `
                    <span>${item.name} x ${item.quantity}</span>
                    <span>LE ${(item.price * item.quantity).toFixed(2)}</span>
                `;
                orderItems.appendChild(itemElement);
            });
            
            // Update totals
            subtotalElement.textContent = `LE ${cartData.subtotal.toFixed(2)}`;
            if (cartData.discount > 0) {
                discountRow.style.display = 'flex';
                discountElement.textContent = `-LE ${cartData.discount.toFixed(2)}`;
            } else {
                discountRow.style.display = 'none';
            }
            orderTotal.textContent = `LE ${cartData.total.toFixed(2)}`;

            return cartData;
        } catch (error) {
            console.error('Error updating order summary:', error);
            Swal.fire({
                title: 'Error',
                text: 'Failed to load cart data. Please try again.',
                icon: 'error'
            }).then(() => {
                window.location.href = '/cart';
            });
            return null;
        }
    }

    // Initial update of order summary
    let cartData = await updateOrderSummary();

    // Get the back button and form elements
    const backBtn = document.getElementById('back-btn');
    const checkoutForm = document.getElementById('checkout-form');
    const cardRadio = document.querySelector('input[value="card"]');
    const cashRadio = document.querySelector('input[value="cash"]');
    const cardDetails = document.getElementById('card-details');

    // Handle back button click
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Back button clicked');
            window.location.href = '/cart';
        });
    }

    // Handle payment method selection
    function handlePaymentMethodSelection() {
        if (cardRadio && cardRadio.checked) {
            cardDetails.style.display = 'block';
        } else {
            cardDetails.style.display = 'none';
        }
    }

    if (cardRadio && cashRadio) {
        cardRadio.addEventListener('change', handlePaymentMethodSelection);
        cashRadio.addEventListener('change', handlePaymentMethodSelection);
    }

    // Handle form submission
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Form submitted');

            // Get form data
            const formData = new FormData(checkoutForm);
            const paymentMethod = formData.get('payment');

            // Validate payment method
            if (!paymentMethod) {
                Swal.fire({
                    title: 'Error',
                    text: 'Please select a payment method',
                    icon: 'error',
                    confirmButtonColor: '#6F4E37'
                });
                return;
            }

            // Validate card details if card payment is selected
            if (paymentMethod === 'card') {
                const cardNumber = formData.get('card-number');
                const expiryDate = formData.get('expiry-date');
                const cvv = formData.get('cvv');

                if (!cardNumber || !expiryDate || !cvv) {
                    Swal.fire({
                        title: 'Error',
                        text: 'Please fill in all card details',
                        icon: 'error',
                        confirmButtonColor: '#6F4E37'
                    });
                    return;
                }
            }

            try {
                // Show loading state
                Swal.fire({
                    title: 'Processing Order',
                    text: 'Please wait while we process your order...',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                const orderData = {
                    items: cartData.items,
                    totalAmount: cartData.subtotal,
                    discountApplied: cartData.discount || 0,
                    promoCodeUsed: cartData.appliedPromoCode || null,
                    finalAmount: cartData.total,
                    paymentMethod: paymentMethod,
                    customerDetails: {
                        name: formData.get('name'),
                        email: formData.get('email'),
                        phone: formData.get('phone'),
                        address: formData.get('address')
                    }
                };

                // Submit order
                const response = await fetch('http://localhost:5000/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem(config.AUTH.TOKEN_KEY)}`
                    },
                    body: JSON.stringify(orderData)
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Failed to place order');
                }

                const data = await response.json();
                console.log('Order created successfully:', data);

                if (!data.success || !data.orderId) {
                    throw new Error('Invalid response from server');
                }

                // Clear cart after successful order
                try {
                    await fetch('http://localhost:5000/api/cart/clear', {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem(config.AUTH.TOKEN_KEY)}`
                        }
                    });
                } catch (error) {
                    console.error('Error clearing cart:', error);
                }

                // Show success message and redirect
                Swal.fire({
                    title: 'Order Placed Successfully!',
                    text: 'Thank you for your order. Redirecting to order confirmation...',
                    icon: 'success',
                    confirmButtonColor: '#6F4E37',
                    timer: 2000,
                    showConfirmButton: false
                }).then(() => {
                    // Redirect to order confirmation page
                    window.location.href = `/order-confirmation/${data.orderId}`;
                });
            } catch (error) {
                console.error('Error placing order:', error);
                Swal.fire({
                    title: 'Error',
                    text: error.message || 'Failed to place order. Please try again.',
                    icon: 'error',
                    confirmButtonColor: '#6F4E37'
                });
            }
        });
    }

    // Function to show error message
    function showError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.color = '#dc3545';
        errorDiv.style.fontSize = '0.875rem';
        errorDiv.style.marginTop = '0.25rem';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
        field.style.borderColor = '#dc3545';
    }

    // Add input event listeners to clear errors on input
    document.getElementById('card-name').addEventListener('input', function() {
        this.style.borderColor = '';
        const error = this.parentNode.querySelector('.error-message');
        if (error) error.remove();
    });

    document.getElementById('card-number').addEventListener('input', function() {
        this.style.borderColor = '';
        const error = this.parentNode.querySelector('.error-message');
        if (error) error.remove();
    });

    document.getElementById('expiry').addEventListener('input', function() {
        this.style.borderColor = '';
        const error = this.parentNode.querySelector('.error-message');
        if (error) error.remove();
    });

    document.getElementById('cvv').addEventListener('input', function() {
        this.style.borderColor = '';
        const error = this.parentNode.querySelector('.error-message');
        if (error) error.remove();
    });

    // Handle form submission
    const form = document.getElementById('checkout-form');
    const phoneInput = document.getElementById('phone');
    const cardNumberInput = document.getElementById('card-number');
    const expiryInput = document.getElementById('expiry');
    const cvvInput = document.getElementById('cvv');
    const fullNameInput = document.getElementById('full-name');
    const emailInput = document.getElementById('email');
    const addressInput = document.getElementById('address');

    console.log('Form element:', form);
    console.log('Form elements found:', {
        cashRadio,
        cardRadio,
        cardDetails,
        phoneInput,
        cardNumberInput,
        expiryInput,
        cvvInput,
        fullNameInput,
        emailInput,
        addressInput,
        backBtn
    });

    function formatPhoneDisplay(value) {
        return value.replace(/\D/g, '').substring(0, 10);
    }

    function formatPhoneSubmission(value) {
        return phonePrefix + value.replace(/\D/g, '');
    }

    function validatePhoneNumber(phone) {
        // Check if phone starts with 12 or 5 and is exactly 10 digits
        return /^(12|5)\d{8}$/.test(phone);
    }

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function validateAddress(address) {
        return address.trim().length >= 10;
    }

    function validateCardNumber(cardNumber) {
        return /^\d{16}$/.test(cardNumber.replace(/\s/g, ''));
    }

    function validateExpiryDate(expiryDate) {
        const [month, year] = expiryDate.split('/');
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear() % 100;
        const currentMonth = currentDate.getMonth() + 1;
        
        const expMonth = parseInt(month);
        const expYear = parseInt(year);
        
        // Check if year is less than 25
        if (expYear < 25) {
            return false;
        }
        
        // Check if card is expired
        if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
            return false;
        }
        
        return expMonth >= 1 && expMonth <= 12;
    }

    function validateCVV(cvv) {
        // Check if CVV is exactly 3 digits
        return /^\d{3}$/.test(cvv);
    }

    // Cardholder name validation: only letters and spaces
    function validateCardName() {
        const cardNameInput = document.getElementById('card-name');
        const value = cardNameInput.value.trim();
        clearError('card-name');
        if (!cardRadio.checked) return true;
        if (!/^[A-Za-z ]+$/.test(value)) {
            showError('card-name', 'Name must contain only letters and spaces');
            return false;
        }
        return true;
    }

    // Update validateCardDetails to include cardholder name validation
    function validateCardDetails() {
        if (!cardRadio.checked) return true;
        let isValid = true;
        const cardNumber = cardNumberInput.value.replace(/\s/g, '');
        if (!validateCardName()) isValid = false;
        if (!validateCardNumber(cardNumber)) {
            showError('card-number', 'Invalid card number (16 digits)');
            isValid = false;
        } else {
            clearError('card-number');
        }
        if (!/^\d{2}\/\d{2}$/.test(expiryInput.value)) {
            showError('expiry', 'Invalid format (MM/YY)');
            isValid = false;
        } else {
            clearError('expiry');
        }
        // MM 01-12, YY 25-35
        const [mm, yy] = expiryInput.value.split('/');
        if (mm && (parseInt(mm) < 1 || parseInt(mm) > 12)) {
            showError('expiry', 'Month must be 01-12');
            isValid = false;
        }
        if (yy && (parseInt(yy) < 25 || parseInt(yy) > 35)) {
            showError('expiry', 'Year must be 25-35');
            isValid = false;
        }
        if (!validateExpiryDate(expiryInput.value)) {
            showError('expiry', 'Expiry date must be valid and not expired');
            isValid = false;
        }
        if (!/^\d{3}$/.test(cvvInput.value)) {
            showError('cvv', 'Invalid CVV (3 digits)');
            isValid = false;
        } else {
            clearError('cvv');
        }
        return isValid;
    }

    function validateName() {
        const name = fullNameInput.value.trim();
        clearError('full-name');

        if (!name) {
            showError('full-name', 'Full name is required');
            return false;
        }

        if (name.split(/\s+/).length < 2) {
            showError('full-name', 'Please enter your full name (first and last)');
            return false;
        }

        if (name.length < 4) {
            showError('full-name', 'Name must be at least 4 characters long');
            return false;
        }

        return true;
    }

    function showError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.add('invalid');
            let errorElement = document.getElementById(`${fieldId}-error`);
            if (!errorElement) {
                errorElement = document.createElement('span');
                errorElement.id = `${fieldId}-error`;
                errorElement.className = 'error';
                field.parentNode.appendChild(errorElement);
            }
            errorElement.textContent = message;
        }
    }

    function clearError(fieldId) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.remove('invalid');
            const errorElement = document.getElementById(`${fieldId}-error`);
            if (errorElement) {
                errorElement.textContent = '';
            }
        }
    }

    // Initialize phone input
    if (phoneInput) {
        phoneInput.dataset.originalValue = '';
        phoneInput.addEventListener('input', function () {
            // Only allow numbers and limit to 10 digits
            this.value = this.value.replace(/\D/g, '').substring(0, 10);
            this.dataset.originalValue = this.value;
        });

        phoneInput.addEventListener('blur', function () {
            if (!validatePhoneNumber(this.value)) {
                showError('phone', 'Phone number must start with 12 or 5 and be 10 digits long');
            } else {
                clearError('phone');
            }
        });
    }

    // Initialize card number input
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, '');
            value = value.substring(0, 16);
            let formatted = '';
            for (let i = 0; i < value.length; i++) {
                if (i > 0 && i % 4 === 0) formatted += ' ';
                formatted += value[i];
            }
            e.target.value = formatted;
        });
    }

    // Initialize expiry input
    if (expiryInput) {
        expiryInput.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value.substring(0, 5);
        });

        expiryInput.addEventListener('blur', function() {
            if (!validateExpiryDate(this.value)) {
                showError('expiry', 'Card is expired or invalid date');
            } else {
                clearError('expiry');
            }
        });
    }

    // Initialize CVV input
    if (cvvInput) {
        cvvInput.addEventListener('input', function (e) {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 3);
        });

        cvvInput.addEventListener('blur', function() {
            if (!validateCVV(this.value)) {
                showError('cvv', 'CVV must be exactly 3 digits');
            } else {
                clearError('cvv');
            }
        });
    }

    // Initialize form submission
    if (form) {
        const placeOrderBtn = document.getElementById('place-order-btn');
        
        if (placeOrderBtn) {
            placeOrderBtn.addEventListener('click', async function(e) {
                e.preventDefault();
                console.log('Place Order button clicked');

                // Get payment method
                const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;
                console.log('Payment method:', paymentMethod);

                if (!paymentMethod) {
                    Swal.fire({
                        title: 'Oops! 😅',
                        text: 'Please select a payment method to continue.',
                        icon: 'warning',
                        confirmButtonColor: '#3498db'
                    });
                    return;
                }

                // Validate all fields
                const isNameValid = validateName();
                const isEmailValid = validateEmail(emailInput.value.trim());
                const isPhoneValid = validatePhoneNumber(phoneInput.value);
                const isAddressValid = validateAddress(addressInput.value.trim());
                const isCardValid = paymentMethod === 'card' ? validateCardDetails() : true;

                if (!isNameValid || !isEmailValid || !isPhoneValid || !isAddressValid || !isCardValid) {
                    return;
                }

                try {
                    // Show loading state
                    Swal.fire({
                        title: 'Processing Order',
                        text: 'Please wait while we process your order...',
                        allowOutsideClick: false,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });

                    // Prepare order data
                    const orderData = {
                        items: cartData.items,
                        totalAmount: cartData.subtotal,
                        discountApplied: cartData.discount || 0,
                        promoCodeUsed: cartData.appliedPromoCode || null,
                        finalAmount: cartData.total,
                        paymentMethod,
                        deliveryAddress: {
                            street: formData.get('street'),
                            city: formData.get('city'),
                            state: formData.get('state'),
                            zipCode: formData.get('zip-code')
                        },
                        specialInstructions: formData.get('special-instructions') || ''
                    };

                    console.log('Sending order data:', orderData);

                    const response = await fetch('http://localhost:5000/api/orders', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem(config.AUTH.TOKEN_KEY)}`
                        },
                        body: JSON.stringify(orderData)
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to place order');
                    }

                    const order = await response.json();
                    console.log('Order placed successfully:', order);

                    // Clear cart after successful order
                    await window.Cart.clearCart();

                    // Show success message and redirect
                    Swal.fire({
                        title: 'Order Placed Successfully! 🎉',
                        text: 'Your order has been received and is being processed.',
                        icon: 'success',
                        confirmButtonColor: '#3498db'
                    }).then(() => {
                        // Redirect to order confirmation page with orderId as query parameter
                        window.location.href = `/order-confirmation?orderId=${order._id}`;
                    });
                } catch (error) {
                    console.error('Order placement error:', error);
                    Swal.fire({
                        title: 'Error',
                        text: error.message || 'There was an error processing your order. Please try again.',
                        icon: 'error',
                        confirmButtonColor: '#3498db'
                    });
                }
            });
        }
    }

    // Initialize back button
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = '/cart';
        });
    }

    // Add event listeners for payment method selection
    document.querySelectorAll('input[name="payment"]').forEach(radio => {
        radio.addEventListener('change', function() {
            handlePaymentMethodSelection();
        });
    });

    // Initialize payment method state on page load
    handlePaymentMethodSelection();

    // Remove duplicate order submission handlers
    const placeOrderBtn = document.getElementById('place-order-btn');
    if (placeOrderBtn) {
        placeOrderBtn.onclick = null; // Remove any existing click handlers
    }
});

