// Remove all authentication checks and token handling
// Keep only the core functionality

// Use API URL from window object or default to current origin
const API_BASE_URL = window.API_BASE_URL || '';

// Fetch data without authentication
async function fetchData(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch data');
        }

        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded');
    
    try {
        // Load cart
        const cartData = await Cart.getCart();
        if (cartData) {
            updateCartDisplay(cartData);
            initializeCartButtons();
        }

        // Initialize promo code functionality
        initializePromoCode();

        // Add checkout button functionality
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            console.log('Adding checkout button listener');
            checkoutBtn.addEventListener('click', () => {
                console.log('Checkout button clicked');
                window.location.href = '/hatem2';
            });
        }

        // Add continue shopping button functionality
        const continueBtn = document.getElementById('continue-btn');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                window.location.href = '/boudz';
            });
        }

        // Add browse menu button functionality
        const browseMenuBtn = document.getElementById('browse-menu-btn');
        if (browseMenuBtn) {
            browseMenuBtn.addEventListener('click', () => {
                window.location.href = '/boudz';
            });
        }
    } catch (error) {
        console.error('Error initializing page:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load cart. Please try again.'
        });
    }
});

// Define Cart object in global scope
window.Cart = {
    API_BASE_URL: 'http://localhost:5000/api/cart',

    async updateQuantity(productId, newQuantity) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/update/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ quantity: newQuantity })
            });

            if (!response.ok) {
                throw new Error('Failed to update quantity');
            }

            const data = await response.json();
            updateCartDisplay(data);
        } catch (error) {
            console.error('Error updating quantity:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Failed to update quantity. Please try again.'
            });
        }
    },

    async removeItem(productId) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/remove/${productId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to remove item');
            }

            const data = await response.json();
            updateCartDisplay(data);
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Item removed from cart'
            });
        } catch (error) {
            console.error('Error removing item:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Failed to remove item. Please try again.'
            });
        }
    },

    async getCart() {
        try {
            return await fetchData(`${API_BASE_URL}`);
        } catch (error) {
            console.error('Error getting cart:', error);
            return null;
        }
    },

    async clearCart() {
        try {
            return await fetchData(`${API_BASE_URL}/clear`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Error clearing cart:', error);
            throw error;
        }
    },

    async applyPromoCode(promoCode) {
        try {
            console.log('Applying promo code:', promoCode);
            const response = await fetchData(`${API_BASE_URL}/promo`, {
                method: 'POST',
                body: JSON.stringify({ promoCode })
            });

            if (response) {
                console.log('Promo code response:', response);
                // Update the display with new totals
                const cartData = await this.getCart();
                if (cartData) {
                    updateCartDisplay(cartData);
                }

                // Show success message
                const messageElement = document.getElementById('promo-message');
                if (messageElement) {
                    messageElement.textContent = 'Promo code applied successfully!';
                    messageElement.className = 'promo-message success';
                }

                // Clear input
                const promoInput = document.getElementById('promo-code');
                if (promoInput) {
                    promoInput.value = '';
                }
            }
        } catch (error) {
            console.error('Error applying promo code:', error);
            // Show error message
            const messageElement = document.getElementById('promo-message');
            if (messageElement) {
                messageElement.textContent = error.message || 'Failed to apply promo code';
                messageElement.className = 'promo-message error';
            }
        }
    },

    async updateCartDisplay() {
        try {
            const cartData = await this.getCart();
            if (cartData) {
                updateCartDisplay(cartData);
            }
        } catch (error) {
            console.error('Error updating cart display:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to update cart display. Please try again.'
            });
        }
    }
};

// Initialize cart buttons
function initializeCartButtons() {
    // Add event listeners for increment buttons
    document.querySelectorAll('.increment-btn').forEach(button => {
        button.addEventListener('click', async () => {
            const productId = button.dataset.productId;
            const quantitySpan = button.parentElement.querySelector('span');
            const currentQuantity = parseInt(quantitySpan.textContent);
            await window.Cart.updateQuantity(productId, currentQuantity + 1);
        });
    });

    // Add event listeners for decrement buttons
    document.querySelectorAll('.decrement-btn').forEach(button => {
        button.addEventListener('click', async () => {
            const productId = button.dataset.productId;
            const quantitySpan = button.parentElement.querySelector('span');
            const currentQuantity = parseInt(quantitySpan.textContent);
            if (currentQuantity > 1) {
                await window.Cart.updateQuantity(productId, currentQuantity - 1);
            }
        });
    });

    // Add event listeners for remove buttons
    document.querySelectorAll('.remove-btn').forEach(button => {
        button.addEventListener('click', async () => {
            const productId = button.dataset.productId;
            await window.Cart.removeItem(productId);
        });
    });
}

// Update cart display
function updateCartDisplay(cartData) {
    if (!cartData || !cartData.items) {
        window.location.reload();
        return;
    }

    const cartItemsContainer = document.getElementById('cart-items');
    const subtotalElement = document.getElementById('subtotal');
    const grandTotalElement = document.getElementById('grand-total');

    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = cartData.items.map((item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <div class="item-info">
                        <img src="/images/project-images/${item.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.jpg" 
                             onerror="this.onerror=null; this.src='/images/project-images/coffee.jpeg';" 
                             alt="${item.name}" 
                             loading="lazy">
                        <span>${item.name}</span>
                    </div>
                </td>
                <td>LE ${item.price.toFixed(2)}</td>
                <td>
                    <div class="quantity-controls">
                        <button class="decrement-btn" data-product-id="${item.productId}">-</button>
                        <span>${item.quantity}</span>
                        <button class="increment-btn" data-product-id="${item.productId}">+</button>
                    </div>
                </td>
                <td>LE ${(item.price * item.quantity).toFixed(2)}</td>
                <td>
                    <button class="remove-btn" data-product-id="${item.productId}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    if (subtotalElement) {
        subtotalElement.textContent = `LE ${cartData.subtotal.toFixed(2)}`;
    }

    if (grandTotalElement) {
        grandTotalElement.textContent = `LE ${cartData.total.toFixed(2)}`;
    }

    // Reinitialize buttons after updating the display
    initializeCartButtons();
}

// Initialize promo code functionality
function initializePromoCode() {
    const applyPromoBtn = document.getElementById('apply-promo');
    const promoInput = document.getElementById('promo-code');

    if (applyPromoBtn && promoInput) {
        applyPromoBtn.addEventListener('click', async () => {
            const promoCode = promoInput.value.trim();
            if (!promoCode) {
                const messageElement = document.getElementById('promo-message');
                if (messageElement) {
                    messageElement.textContent = 'Please enter a promo code';
                    messageElement.className = 'promo-message error';
                }
                return;
            }

            await Cart.applyPromoCode(promoCode);
        });
    }
}

// Initialize cart display when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Only initialize cart display on pages that have a cart display
        const cartItemsContainer = document.getElementById('cart-items');
        if (cartItemsContainer) {
            console.log('Initializing cart display...');
            await Cart.updateCartDisplay();
        } else {
            console.log('No cart display on this page - skipping initialization');
        }
    } catch (error) {
        console.log('Error initializing cart display:', error);
        // Don't show error to user since this is expected on some pages
    }
});

// Initialize cart page
document.addEventListener('DOMContentLoaded', async () => {
    const clearCartBtn = document.getElementById('clear-cart-btn');
    const checkoutBtn = document.getElementById('checkout-btn');
    const updateBtn = document.getElementById('update-btn');

    // Check if we're in edit mode
    const orderEditId = localStorage.getItem('orderEditId');
    if (orderEditId) {
        // Hide checkout button and show update button
        if (checkoutBtn) checkoutBtn.style.display = 'none';
        if (updateBtn) updateBtn.style.display = 'block';
    } else {
        // Show checkout button and hide update button
        if (checkoutBtn) checkoutBtn.style.display = 'block';
        if (updateBtn) updateBtn.style.display = 'none';
    }

    // Clear cart button handler
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', async (e) => {
            e.preventDefault(); // Prevent default button behavior
            try {
                const result = await Swal.fire({
                    title: 'Clear Cart',
                    text: 'Are you sure you want to clear your cart?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Yes, clear it',
                    cancelButtonText: 'No, keep items'
                });

                if (result.isConfirmed) {
                    await Cart.clearCart();
                    await Cart.updateCartDisplay();
                    Swal.fire('Cleared!', 'Your cart has been cleared.', 'success');
                }
            } catch (error) {
                console.error('Error clearing cart:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to clear cart. Please try again.',
                    icon: 'error'
                });
            }
        });
    }

    // Update button handler
    if (updateBtn) {
        updateBtn.addEventListener('click', async () => {
            const orderEditId = localStorage.getItem('orderEditId');
            if (!orderEditId) {
                Swal.fire({
                    title: 'Error',
                    text: 'No order selected for editing',
                    icon: 'error'
                });
                return;
            }

            try {
                const cartData = await Cart.getCart();
                if (!cartData || !cartData.items || cartData.items.length === 0) {
                    throw new Error('Cart is empty');
                }

                const specialInstructions = document.getElementById('special-instructions')?.value.trim() || '';

                const response = await fetch(`/api/orders/${orderEditId}/items`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        items: cartData.items,
                        specialInstructions
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Failed to update order');
                }

                // Clear edit mode
                localStorage.removeItem('orderEditId');
                localStorage.removeItem('orderEditTimeLeft');

                // Show success message and redirect back to order confirmation
                Swal.fire({
                    title: 'Order Updated',
                    text: 'Your order has been updated successfully',
                    icon: 'success',
                    confirmButtonColor: '#6F4E37'
                }).then(() => {
                    window.location.href = `/order-confirmation/${orderEditId}`
                });
            } catch (error) {
                console.error('Error updating order:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to update order. Please try again.',
                    icon: 'error'
                });
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // Initialize cart
    const cart = {
        items: [],
        subtotal: 0,
        discount: 0,
        total: 0
    };

    // DOM Elements
    const cartItemsContainer = document.getElementById('cart-items');
    const subtotalElement = document.getElementById('subtotal');
    const grandTotalElement = document.getElementById('grand-total');
    const continueBtn = document.getElementById('continue-btn');
    const checkoutBtn = document.getElementById('checkout-btn');
    const browseMenuBtn = document.getElementById('browse-menu-btn');
    const applyPromoBtn = document.getElementById('apply-promo');
    const promoInput = document.getElementById('promo-code');
    const promoMessage = document.getElementById('promo-message');

    // Event Listeners
    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            window.location.href = '/boudz';
        });
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            window.location.href = '/hatem2';
        });
    }

    if (browseMenuBtn) {
        browseMenuBtn.addEventListener('click', () => {
            window.location.href = '/boudz';
        });
    }

    // Cart Item Event Listeners
    function setupCartItemListeners() {
        // Increment buttons
        document.querySelectorAll('.increment-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const productId = e.target.dataset.productId;
                try {
                    const response = await fetch(`${window.API_BASE_URL}/increment/${productId}`, {
                        method: 'POST',
                        credentials: 'include'
                    });
                    if (response.ok) {
                        const data = await response.json();
                        updateCartUI(data.cart);
                    } else {
                        throw new Error('Failed to update cart');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Failed to update cart. Please try again.'
                    });
                }
            });
        });

        // Decrement buttons
        document.querySelectorAll('.decrement-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const productId = e.target.dataset.productId;
                try {
                    const response = await fetch(`${window.API_BASE_URL}/decrement/${productId}`, {
                        method: 'POST',
                        credentials: 'include'
                    });
                    if (response.ok) {
                        const data = await response.json();
                        updateCartUI(data.cart);
                    } else {
                        throw new Error('Failed to update cart');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Failed to update cart. Please try again.'
                    });
                }
            });
        });

        // Remove buttons
        document.querySelectorAll('.remove-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const productId = e.target.dataset.productId;
                try {
                    const response = await fetch(`${window.API_BASE_URL}/remove/${productId}`, {
                        method: 'POST',
                        credentials: 'include'
                    });
                    if (response.ok) {
                        const data = await response.json();
                        updateCartUI(data.cart);
                    } else {
                        throw new Error('Failed to remove item');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Failed to remove item. Please try again.'
                    });
                }
            });
        });
    }

    // Update Cart UI
    function updateCartUI(cartData) {
        if (!cartData || !cartData.items) {
            window.location.reload();
            return;
        }

        // Update cart items
        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = cartData.items.map((item, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>
                        <div class="item-info">
                            <img src="/images/project-images/${item.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.jpg" 
                                 onerror="this.onerror=null; this.src='/images/project-images/coffee.jpeg';" 
                                 alt="${item.name}" 
                                 loading="lazy">
                            <span>${item.name}</span>
                        </div>
                    </td>
                    <td>LE ${item.price.toFixed(2)}</td>
                    <td>
                        <div class="quantity-controls">
                            <button class="decrement-btn" data-product-id="${item.productId}">-</button>
                            <span>${item.quantity}</span>
                            <button class="increment-btn" data-product-id="${item.productId}">+</button>
                        </div>
                    </td>
                    <td>LE ${(item.price * item.quantity).toFixed(2)}</td>
                    <td>
                        <button class="remove-btn" data-product-id="${item.productId}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        // Update totals
        if (subtotalElement) {
            subtotalElement.textContent = `LE ${cartData.subtotal.toFixed(2)}`;
        }
        if (grandTotalElement) {
            grandTotalElement.textContent = `LE ${cartData.total.toFixed(2)}`;
        }

        // Reattach event listeners
        setupCartItemListeners();
    }

    // Promo Code Handler
    if (applyPromoBtn && promoInput) {
        applyPromoBtn.addEventListener('click', async () => {
            const promoCode = promoInput.value.trim();
            if (!promoCode) {
                promoMessage.textContent = 'Please enter a promo code';
                promoMessage.className = 'promo-message error';
                return;
            }

            try {
                const response = await fetch(`${window.API_BASE_URL}/apply-promo`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ promoCode })
                });

                const data = await response.json();
                if (response.ok) {
                    promoMessage.textContent = 'Promo code applied successfully!';
                    promoMessage.className = 'promo-message success';
                    updateCartUI(data.cart);
                } else {
                    promoMessage.textContent = data.message || 'Invalid promo code';
                    promoMessage.className = 'promo-message error';
                }
            } catch (error) {
                console.error('Error:', error);
                promoMessage.textContent = 'Failed to apply promo code';
                promoMessage.className = 'promo-message error';
            }
        });
    }

    // Initial setup
    setupCartItemListeners();
});