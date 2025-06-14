// Cart object to handle all cart operations
window.Cart = {
    async getCart() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('Fetching cart...');
            const response = await fetch('http://localhost:5000/api/cart', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                throw new Error('Authentication required');
            }

            if (!response.ok) {
                throw new Error('Failed to fetch cart');
            }

            const data = await response.json();
            console.log('Cart fetched successfully:', data);
            return data;
        } catch (error) {
            console.error('Error fetching cart:', error);
            throw error;
        }
    },

    async addItem(item) {
        try {
            console.log('Adding item to cart:', item);
            const response = await fetch('http://localhost:5000/api/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(item)
            });

            if (!response.ok) {
                throw new Error('Failed to add item to cart');
            }

            const data = await response.json();
            console.log('Item added successfully:', data);
            return data;
        } catch (error) {
            console.error('Error adding item to cart:', error);
            throw error;
        }
    },

    async updateItemQuantity(productId, quantity) {
        try {
            console.log('Updating item quantity:', { productId, quantity });
            const response = await fetch('http://localhost:5000/api/cart/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ productId, quantity })
            });

            if (!response.ok) {
                throw new Error('Failed to update item quantity');
            }

            const data = await response.json();
            console.log('Quantity updated successfully:', data);
            return data;
        } catch (error) {
            console.error('Error updating item quantity:', error);
            throw error;
        }
    },

    async removeItem(productId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('Removing item:', productId);
            const response = await fetch('http://localhost:5000/api/cart/remove', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productId })
            });

            if (response.status === 401) {
                throw new Error('Authentication required');
            }

            if (!response.ok) {
                throw new Error('Failed to remove item from cart');
            }

            const data = await response.json();
            console.log('Item removed successfully:', data);
            await this.updateCartDisplay(); // Update the display after removing item
            return data;
        } catch (error) {
            console.error('Error removing item from cart:', error);
            if (error.message === 'Authentication required') {
                Swal.fire({
                    title: 'Session Expired',
                    text: 'Please log in again to continue',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Login',
                    cancelButtonText: 'Cancel'
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.href = '/login';
                    }
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message || 'Failed to remove item from cart'
                });
            }
            throw error;
        }
    },

    async clearCart() {
        try {
            console.log('Clearing cart...');
            const response = await fetch('http://localhost:5000/api/cart/clear', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to clear cart');
            }

            const data = await response.json();
            console.log('Cart cleared successfully:', data);
            return data;
        } catch (error) {
            console.error('Error clearing cart:', error);
            throw error;
        }
    },

    // Add updateCartDisplay to the Cart object
    async updateCartDisplay() {
        try {
            const cartData = await this.getCart();
            console.log('Cart data received:', cartData);
            
            const cartItemsContainer = document.getElementById('cart-items');
            if (!cartItemsContainer) {
                console.log('Cart items container not found - this is normal on pages without a cart display');
                return;
            }

            if (!cartData || !cartData.items || cartData.items.length === 0) {
                cartItemsContainer.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center">Your cart is empty</td>
                    </tr>
                `;
                // Reset totals to zero
                const subtotalElement = document.getElementById('subtotal');
                const discountElement = document.getElementById('discount');
                const totalElement = document.getElementById('grand-total');
                const discountRow = document.querySelector('.discount-row');

                if (subtotalElement) subtotalElement.textContent = 'LE 0.00';
                if (discountElement) discountElement.textContent = 'LE 0.00';
                if (totalElement) totalElement.textContent = 'LE 0.00';
                if (discountRow) discountRow.style.display = 'none';
                return;
            }

            // Calculate totals
            const subtotal = cartData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const discount = cartData.discount || 0;
            const total = subtotal - discount;

            // Update cart items display
            cartItemsContainer.innerHTML = cartData.items.map((item, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.name}</td>
                    <td>LE ${item.price.toFixed(2)}</td>
                    <td>
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="Cart.updateItemQuantity('${item.productId}', ${item.quantity - 1})">-</button>
                            <span>${item.quantity}</span>
                            <button class="quantity-btn" onclick="Cart.updateItemQuantity('${item.productId}', ${item.quantity + 1})">+</button>
                        </div>
                    </td>
                    <td>LE ${(item.price * item.quantity).toFixed(2)}</td>
                    <td>
                        <button class="remove-btn" onclick="Cart.removeItem('${item.productId}')">Remove</button>
                    </td>
                </tr>
            `).join('');

            // Update totals display
            const subtotalElement = document.getElementById('subtotal');
            const discountElement = document.getElementById('discount');
            const totalElement = document.getElementById('grand-total');
            const discountRow = document.querySelector('.discount-row');

            if (subtotalElement) subtotalElement.textContent = `LE ${subtotal.toFixed(2)}`;
            if (discountElement) discountElement.textContent = `-LE ${discount.toFixed(2)}`;
            if (totalElement) totalElement.textContent = `LE ${total.toFixed(2)}`;
            if (discountRow) {
                discountRow.style.display = discount > 0 ? 'table-row' : 'none';
            }

            console.log('Cart display updated with totals:', {
                subtotal,
                discount,
                total
            });
        } catch (error) {
            console.error('Error updating cart display:', error);
        }
    }
};

// Log when Cart object is initialized
console.log('Cart object initialized');

// Initialize cart display when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Only initialize cart display on pages that have a cart display
        const cartItemsContainer = document.getElementById('cart-items');
        if (cartItemsContainer) {
            console.log('Initializing cart display...');
            await window.Cart.updateCartDisplay();
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
    const fromOrderConfirmation = localStorage.getItem('fromOrderConfirmation');
    const orderStartTime = localStorage.getItem('orderEditStartTime');
    
    if (orderEditId && fromOrderConfirmation === 'true') {
        // Check if we're within the 1-minute window
        const timeElapsed = Date.now() - parseInt(orderStartTime);
        if (timeElapsed <= 60000) {
            // Show edit mode indicator
            const editModeIndicator = document.getElementById('editModeIndicator');
            if (editModeIndicator) {
                editModeIndicator.style.display = 'block';
                document.getElementById('editOrderNumber').textContent = orderEditId;
                document.body.classList.add('edit-mode-active');
            }

            // Hide checkout button and show update button
            if (checkoutBtn) checkoutBtn.style.display = 'none';
            if (updateBtn) updateBtn.style.display = 'block';

            // Load the original order items into cart
            try {
                const response = await fetch(`/api/orders/${orderEditId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to load order details');
                }

                const order = await response.json();
                await window.Cart.clearCart();
                for (const item of order.items) {
                    await window.Cart.addItem(item);
                }
                await window.Cart.updateCartDisplay();
            } catch (error) {
                console.error('Error loading order items:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to load order items. Please try again.'
                });
            }
        } else {
            // Clear edit mode if time has expired
            localStorage.removeItem('orderEditId');
            localStorage.removeItem('fromOrderConfirmation');
            localStorage.removeItem('orderEditTimeLeft');
            localStorage.removeItem('orderEditStartTime');
            
            // Redirect back to order confirmation
            window.location.href = '/order-confirmation/' + orderEditId;
        }
    } else {
        // Show checkout button and hide update button
        if (checkoutBtn) checkoutBtn.style.display = 'block';
        if (updateBtn) updateBtn.style.display = 'none';
    }

    // Clear cart button handler
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', async (e) => {
            e.preventDefault();
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
                    await window.Cart.clearCart();
                    await window.Cart.updateCartDisplay();
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
                const cartData = await window.Cart.getCart();
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
                localStorage.removeItem('fromOrderConfirmation');
                localStorage.removeItem('orderEditTimeLeft');
                localStorage.removeItem('orderEditStartTime');

                // Show success message and redirect back to order confirmation
                Swal.fire({
                    title: 'Order Updated',
                    text: 'Your order has been updated successfully',
                    icon: 'success',
                    confirmButtonColor: '#6F4E37'
                }).then(() => {
                    window.location.href = `/order-confirmation/${orderEditId}`;
                });
            } catch (error) {
                console.error('Error updating order:', error);
                Swal.fire({
                    title: 'Error',
                    text: error.message || 'Failed to update order. Please try again.',
                    icon: 'error'
                });
            }
        });
    }

    // Handle promo code application
    document.getElementById('apply-promo')?.addEventListener('click', async () => {
        const promoCode = document.getElementById('promo-code')?.value.trim();
        if (!promoCode) {
            Swal.fire({
                title: 'Error',
                text: 'Please enter a promo code',
                icon: 'error'
            });
            return;
        }

        try {
            await window.Cart.applyPromoCode(promoCode);
            Swal.fire({
                title: 'Success',
                text: 'Promo code applied successfully',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: error.message || 'Failed to apply promo code',
                icon: 'error'
            });
        }
    });
});
