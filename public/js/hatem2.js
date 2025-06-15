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
    
    // Function to update order summary
    async function updateOrderSummary() {
        try {
            console.log('Fetching cart data...');
            // Get cart data from backend
            const cartResponse = await fetch('/api/cart');

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
        console.log('Found form:', checkoutForm);
        
        checkoutForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Form submitted');
            
            try {
                // Get form elements
                const fullNameInput = document.getElementById('full-name');
                const emailInput = document.getElementById('email');
                const phoneInput = document.getElementById('phone');
                const addressInput = document.getElementById('address');
                const paymentMethodInput = document.querySelector('input[name="payment"]:checked');

                // Get and validate delivery info
                const fullName = fullNameInput?.value?.trim() || '';
                const email = emailInput?.value?.trim() || '';
                const phone = phoneInput?.value?.trim() || '';
                const address = addressInput?.value?.trim() || '';
                const paymentMethod = paymentMethodInput?.value;

                // Debug logging
                console.log('Form values:', {
                    fullName,
                    email,
                    phone,
                    address,
                    paymentMethod
                });

                // Validate all required fields
                const errors = [];
                if (!fullName) errors.push('Full name is required');
                if (!email) errors.push('Email is required');
                if (!phone) errors.push('Phone number is required');
                if (!address) errors.push('Address is required');
                if (!paymentMethod) errors.push('Payment method is required');

                if (errors.length > 0) {
                    throw new Error(errors.join('\n'));
                }

                // Verify cart data is available
                if (!cartData || !cartData.items || cartData.items.length === 0) {
                    console.error('Cart data not available, fetching again...');
                    cartData = await updateOrderSummary();
                    if (!cartData || !cartData.items || cartData.items.length === 0) {
                        throw new Error('Cart is empty. Please add items before checkout.');
                    }
                }

                // Prepare order data with cart items
                const orderData = {
                    deliveryInfo: {
                        fullName,
                        email,
                        phone,
                        address
                    },
                    paymentMethod,
                    items: cartData.items.map(item => ({
                        product: item.product,
                        name: item.name,
                        quantity: item.quantity,
                        price: item.price
                    })),
                    subtotal: cartData.subtotal,
                    discount: cartData.discount || 0,
                    total: cartData.total
                };

                // Add card details if card payment is selected
                if (paymentMethod === 'card') {
                    const cardName = document.getElementById('card-name')?.value?.trim();
                    const cardNumber = document.getElementById('card-number')?.value?.trim();
                    const expiry = document.getElementById('expiry')?.value?.trim();
                    const cvv = document.getElementById('cvv')?.value?.trim();

                    // Validate card details
                    const cardErrors = [];
                    if (!cardName) cardErrors.push('Card name is required');
                    if (!cardNumber) cardErrors.push('Card number is required');
                    if (!expiry) cardErrors.push('Expiry date is required');
                    if (!cvv) cardErrors.push('CVV is required');

                    if (cardErrors.length > 0) {
                        throw new Error(cardErrors.join('\n'));
                    }

                    orderData.cardDetails = {
                        cardName,
                        cardNumber,
                        expiry,
                        cvv
                    };
                }

                // Debug logging
                console.log('Order data before submission:', orderData);

                // Show loading state
                Swal.fire({
                    title: 'Processing Order',
                    text: 'Please wait while we process your order...',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                const response = await fetch('/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(orderData)
                });

                const data = await response.json();
                console.log('Server response:', data);

                if (!response.ok) {
                    throw new Error(data.message || 'Error placing order');
                }

                // Clear cart and show success message
                await window.Cart.clearCart();
                Swal.fire({
                    title: 'Success!',
                    text: 'Your order has been placed successfully.',
                    icon: 'success',
                    confirmButtonColor: '#3498db'
                }).then(() => {
                    window.location.href = '/';
                });
            } catch (error) {
                console.error('Error placing order:', error);
                Swal.fire({
                    title: 'Error',
                    text: error.message || 'There was an error processing your order. Please try again.',
                    icon: 'error',
                    confirmButtonColor: '#3498db'
                });
            }
        });
    } else {
        console.error('Checkout form not found');
    }
});

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

