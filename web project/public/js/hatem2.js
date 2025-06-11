console.log('hatem2.js loaded');

// Cart object to handle all cart operations
window.Cart = {
    // ... existing Cart methods ...
};

// Log when Cart object is initialized
console.log('Cart object initialized');

const API_BASE_URL = 'http://localhost:5000/api';
    
// Card validation functions
function validateCardName(input) {
    // Only letters, no numbers or special characters
    input.value = input.value.replace(/[^a-zA-Z\s]/g, '');
}

function validateCardNumber(input) {
    // Remove any non-digit characters
    let value = input.value.replace(/\D/g, '');
    
    // Add space after every 4 digits
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    
    // Limit to 16 digits
    value = value.substring(0, 19); // 16 digits + 3 spaces
    
    input.value = value;
}

function validateExpiryDate(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length >= 2) {
        let month = parseInt(value.substring(0, 2));
        if (month > 12) {
            month = 12;
        }
        if (month < 1) {
            month = 1;
        }
        // Format month with leading zero if needed
        value = month.toString().padStart(2, '0') + value.substring(2);
        
        // Add slash after month
        if (value.length > 2) {
            value = value.substring(0, 2) + '/' + value.substring(2);
        }
    }
    
    // Limit to 5 characters (MM/YY)
    value = value.substring(0, 5);
    
    // Validate year (must be 25 or above)
    if (value.length === 5) {
        let year = parseInt(value.substring(3));
        if (year < 25) {
            value = value.substring(0, 3) + '25';
        }
    }
    
    input.value = value;
}

function validateCVV(input) {
    // Only allow 3 digits
    input.value = input.value.replace(/\D/g, '').substring(0, 3);
}

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

    // Function to update order summary
    async function updateOrderSummary() {
        try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/cart`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

        if (!response.ok) {
                throw new Error('Failed to fetch cart');
            }

        const cartData = await response.json();
        console.log('Cart data:', cartData);

            if (!cartData || !cartData.items || cartData.items.length === 0) {
                Swal.fire({
                    title: 'Empty Cart',
                    text: 'Your cart is empty. Please add items before checkout.',
                    icon: 'warning'
                }).then(() => {
                window.location.href = '/hatem?token=' + token;
                });
                return;
            }
            
        // Update order items
            const orderItems = document.getElementById('order-items');
        orderItems.innerHTML = cartData.items.map(item => `
            <div class="summary-item">
                    <span>${item.name} x ${item.quantity}</span>
                    <span>LE ${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `).join('');
            
            // Update totals
        document.getElementById('subtotal').textContent = `LE ${cartData.subtotal.toFixed(2)}`;
        const discountRow = document.getElementById('discount-row');
            if (cartData.discount > 0) {
                discountRow.style.display = 'flex';
            document.getElementById('discount').textContent = `-LE ${cartData.discount.toFixed(2)}`;
            } else {
                discountRow.style.display = 'none';
            }
        document.getElementById('order-total').textContent = `LE ${cartData.total.toFixed(2)}`;

            return cartData;
        } catch (error) {
            console.error('Error updating order summary:', error);
            Swal.fire({
                title: 'Error',
                text: 'Failed to load cart data. Please try again.',
                icon: 'error'
            });
            return null;
        }
    }

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    if (!await checkAuth()) return;
    
    // Update order summary
    const cartData = await updateOrderSummary();
    if (!cartData) return;

    // Add input validation listeners
    document.getElementById('card-name').addEventListener('input', (e) => validateCardName(e.target));
    document.getElementById('card-number').addEventListener('input', (e) => validateCardNumber(e.target));
    document.getElementById('expiry').addEventListener('input', (e) => validateExpiryDate(e.target));
    document.getElementById('cvv').addEventListener('input', (e) => validateCVV(e.target));

    // Handle payment method selection
    const cardRadio = document.querySelector('input[value="card"]');
    const cashRadio = document.querySelector('input[value="cash"]');
    const cardDetails = document.getElementById('card-details');

    function handlePaymentMethodSelection() {
        if (cardRadio.checked) {
            cardDetails.style.display = 'block';
            // Make card fields required when card payment is selected
            document.getElementById('card-name').required = true;
            document.getElementById('card-number').required = true;
            document.getElementById('expiry').required = true;
            document.getElementById('cvv').required = true;
            // Show SweetAlert for card payment
            Swal.fire({
                title: 'Thank You for Choosing Card Payment! 💳',
                html: `
                    <div style="text-align: left; padding: 10px;">
                        <p>We're delighted to serve you! Here are some important details about your order:</p>
                        <ul style="list-style-type: none; padding-left: 0;">
                            <li>✓ No order editing is allowed after payment</li>
                            <li>✓ Cancellations within 1 minute: Full refund</li>
                            <li>✓ Late cancellations: 25% cancellation fee, 75% refund</li>
                        </ul>
                        <p style="margin-top: 15px;">Your order will be prepared with care and delivered to your doorstep.</p>
                    </div>
                `,
                icon: 'info',
                confirmButtonText: 'I Understand',
                confirmButtonColor: '#6F4E37'
            });
        } else {
            cardDetails.style.display = 'none';
            // Remove required attribute when cash payment is selected
            document.getElementById('card-name').required = false;
            document.getElementById('card-number').required = false;
            document.getElementById('expiry').required = false;
            document.getElementById('cvv').required = false;
            // Show SweetAlert for cash on delivery
            Swal.fire({
                title: 'Thank You for Choosing Our Coffee! ☕',
                html: `
                    <div style="text-align: left; padding: 10px;">
                        <p>We're delighted to serve you! Here are some important details about your order:</p>
                        <ul style="list-style-type: none; padding-left: 0;">
                            <li>✓ You can edit your order within 1 minute of placing it</li>
                            <li>✓ Cancellations are only allowed within 1 minute</li>
                            <li>✓ Late cancellations may result in account restrictions</li>
                        </ul>
                        <p style="margin-top: 15px;">Your order will be prepared with care and delivered to your doorstep.</p>
                    </div>
                `,
                icon: 'info',
                confirmButtonText: 'I Understand',
                confirmButtonColor: '#6F4E37'
            });
        }
    }

        cardRadio.addEventListener('change', handlePaymentMethodSelection);
        cashRadio.addEventListener('change', handlePaymentMethodSelection);

    // Initial payment method setup
    handlePaymentMethodSelection();

    // Handle form submission
    const checkoutForm = document.getElementById('checkout-form');
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Form submitted'); // Debug log

        const formData = new FormData(checkoutForm);
        const paymentMethod = formData.get('payment');

        if (!paymentMethod) {
            Swal.fire({
                title: 'Error',
                text: 'Please select a payment method',
                icon: 'error'
            });
            return;
        }

        if (paymentMethod === 'card') {
            const cardNumber = formData.get('card-number');
            const expiryDate = formData.get('expiry');
            const cvv = formData.get('cvv');

            if (!cardNumber || !expiryDate || !cvv) {
                Swal.fire({
                    title: 'Error',
                    text: 'Please fill in all card details',
                    icon: 'error'
                });
                return;
            }
        }

        try {
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
                    name: formData.get('full-name'),
                    email: formData.get('email'),
                    phone: formData.get('phone'),
                    address: formData.get('address')
                }
            };

            console.log('Sending order data:', orderData); // Debug log

            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderData)
            });

            const responseData = await response.json();
            console.log('Server response:', responseData); // Debug log

            if (!response.ok) {
                throw new Error(responseData.message || 'Failed to place order');
            }

            // Only clear cart if payment method is card (since it's paid immediately)
            if (paymentMethod === 'card') {
                await fetch(`${API_BASE_URL}/cart/clear`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            }

            Swal.fire({
                title: 'Order Placed!',
                text: 'Your order has been placed successfully.',
                icon: 'success'
            }).then(() => {
                const orderId = responseData.orderId;
                const token = localStorage.getItem('token');
                // Store order ID in localStorage before redirecting
                localStorage.setItem('pendingOrderId', orderId);
                console.log('Redirecting to order confirmation:', orderId); // Debug log
                window.location.href = `/order-confirmation?orderId=${orderId}&token=${token}`;
            });
        } catch (error) {
            console.error('Error placing order:', error);
            Swal.fire({
                title: 'Error',
                text: error.message || 'Failed to place order. Please try again.',
                icon: 'error'
            });
        }
    });

    // Handle back button
    const backBtn = document.getElementById('back-btn');
    backBtn.addEventListener('click', () => {
        const token = localStorage.getItem('token');
        window.location.href = `/hatem?token=${token}`;
                    });
});

