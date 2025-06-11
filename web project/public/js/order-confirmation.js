document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    // Get order ID from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId') || localStorage.getItem('pendingOrderId');

    if (!token || !user) {
        // Store the current URL before redirecting
        localStorage.setItem('returnTo', `/order-confirmation?orderId=${orderId}`);
        window.location.href = '/login';
        return;
    }

    if (!orderId) {
        window.location.href = '/boudz';
        return;
    }

    // Store the order ID in currentOrderId for consistency
    localStorage.setItem('currentOrderId', orderId);

    // Initialize timers
    initializeTimers();

    // Load order details
    loadOrderDetails(orderId);

    // Add button event listeners
    document.getElementById('edit-order-btn')?.addEventListener('click', handleEditOrder);
    document.getElementById('cancel-order-btn')?.addEventListener('click', () => cancelOrder(orderId));
    document.getElementById('wait-time-btn')?.addEventListener('click', toggleWaitTime);
});

// Timer functionality
let deliveryTimer;
let waitTimer;
let isWaitTimeVisible = false;
let isEditMode = false;

function initializeTimers() {
    // Set initial time (3 minutes)
    let timeLeft = 3 * 60;
    
    // Update both timers
    function updateTimers() {
        if (isEditMode) return; // Pause timer in edit mode
        
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Update both timer displays
        document.getElementById('delivery-timer').textContent = timeString;
        document.getElementById('wait-time').textContent = timeString;
        
        if (timeLeft <= 0) {
            clearInterval(deliveryTimer);
            showOrderDelivered();
        } else {
            timeLeft--;
        }
    }

    // Start the delivery timer
    updateTimers();
    deliveryTimer = setInterval(updateTimers, 1000);
}

function toggleWaitTime() {
    const waitTimeBtn = document.getElementById('wait-time-btn');
    if (!waitTimeBtn) return;

    isWaitTimeVisible = !isWaitTimeVisible;
    waitTimeBtn.style.display = isWaitTimeVisible ? 'block' : 'none';
}

async function handleEditOrder() {
    const orderId = localStorage.getItem('currentOrderId');
    if (!orderId) return;

    try {
        const response = await fetch(`/api/orders/${orderId}/edit`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to check edit eligibility');
        }

        const data = await response.json();
        if (data.canEdit) {
            // Store edit mode info
            localStorage.setItem('orderEditId', orderId);
            localStorage.setItem('orderEditStartTime', Date.now().toString());
            localStorage.setItem('fromOrderConfirmation', 'true');
            
            // Pause timer
            isEditMode = true;
            
            // Redirect to menu
            window.location.href = '/hatem';
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Cannot Edit Order',
                text: data.message || 'Order can only be edited within 1 minute of placing it.'
            });
        }
    } catch (error) {
        console.error('Error checking edit eligibility:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to check if order can be edited. Please try again.'
        });
    }
}

async function loadOrderDetails(orderId) {
    try {
        const response = await fetch(`/api/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }
            throw new Error('Failed to load order details');
        }

        const data = await response.json();
        
        // Check if we have a valid response with order data
        if (!data.success || !data.order) {
            throw new Error('Invalid order data received');
        }

        const order = data.order;
        
        // Update order details display
        const orderDetailsDiv = document.querySelector('.order-details');
        if (orderDetailsDiv) {
            const itemsList = order.items.map(item => {
                const itemName = item.name || 'Unknown Item';
                const quantity = item.quantity || 1;
                const price = item.price || 0;
                return `${itemName} (${quantity}) - LE ${(price * quantity).toFixed(2)}`;
            }).join('<br>');

            orderDetailsDiv.innerHTML = `
                <h2>Order Details</h2>
                <div class="detail-row">
                    <span>Order ID:</span>
                    <span>${order._id || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span>Status:</span>
                    <span>${order.status || 'pending'}</span>
                </div>
                <div class="detail-row">
                    <span>Payment Method:</span>
                    <span>${order.paymentMethod || 'N/A'}</span>
                </div>
                <div class="detail-row items">
                    <span>Items:</span>
                    <div class="items-list">
                        ${itemsList}
                    </div>
                </div>
                <div class="detail-row total">
                    <span>Total Amount:</span>
                    <span>LE ${(order.finalAmount || order.totalAmount || 0).toFixed(2)}</span>
                </div>
            `;
        }

        // Update status dots
        const statusDots = document.querySelectorAll('.status-dot');
        if (statusDots) {
            statusDots.forEach((dot, index) => {
                if (index <= getStatusIndex(order.status)) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }

        // Show/hide edit button based on payment method and time
        const editBtn = document.getElementById('edit-order-btn');
        if (editBtn) {
            const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
            const timeElapsed = Date.now() - orderDate.getTime();
            const canEdit = order.paymentMethod === 'cash' && 
                          timeElapsed <= 60000 && 
                          order.status !== 'completed' && 
                          order.status !== 'cancelled';
            
            editBtn.style.display = canEdit ? 'block' : 'none';
            
            // Add click handler for edit button
            editBtn.onclick = () => handleEditOrder();
        }

        // Show/hide cancel button based on order status
        const cancelBtn = document.getElementById('cancel-order-btn');
        if (cancelBtn) {
            const canCancel = order.status !== 'completed' && 
                            order.status !== 'cancelled' && 
                            timeElapsed <= 60000;
            
            cancelBtn.style.display = canCancel ? 'block' : 'none';
            
            // Add click handler for cancel button
            cancelBtn.onclick = () => cancelOrder(orderId);
        }

    } catch (error) {
        console.error('Error loading order details:', error);
        const orderDetailsDiv = document.querySelector('.order-details');
        if (orderDetailsDiv) {
            orderDetailsDiv.innerHTML = `
                <h2>Order Details</h2>
                <div class="error-message">
                    Failed to load order details. Please try refreshing the page.
                </div>
            `;
        }
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load order details. Please try again.'
        });
    }
}

function getStatusIndex(status) {
    switch (status) {
        case 'pending': return 0;
        case 'preparing': return 1;
        case 'ready': return 2;
        case 'completed': return 3;
        default: return 0;
    }
}

async function cancelOrder(orderId) {
    try {
        const result = await Swal.fire({
            title: 'Cancel Order',
            text: 'Are you sure you want to cancel this order?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, cancel it',
            cancelButtonText: 'No, keep it'
        });

        if (result.isConfirmed) {
            const response = await fetch(`/api/orders/${orderId}/cancel`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to cancel order');
            }

            // Clear any stored order IDs
            localStorage.removeItem('currentOrderId');
            localStorage.removeItem('pendingOrderId');

            Swal.fire({
                icon: 'success',
                title: 'Order Cancelled',
                text: 'Your order has been cancelled successfully'
            }).then(() => {
                window.location.href = '/boudz';
            });
        }
    } catch (error) {
        console.error('Error cancelling order:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Failed to cancel order. Please try again.'
        });
    }
}

function showOrderDelivered() {
    const thankYouSection = document.createElement('div');
    thankYouSection.className = 'thank-you-section';
    thankYouSection.innerHTML = `
        <h2>Thank You!</h2>
        <p>Your order has been delivered. We hope you enjoy your coffee!</p>
        <div class="rating-section">
            <h3>Rate Your Experience</h3>
            <div class="stars-container">
                ${Array(5).fill().map((_, i) => `
                    <i class="fas fa-star star" data-rating="${i + 1}"></i>
                `).join('')}
            </div>
            <div class="rating-comment-container" style="display: none;">
                <textarea placeholder="Tell us about your experience (optional)"></textarea>
                <button class="submit-rating-btn">Submit Rating</button>
            </div>
        </div>
    `;

    document.querySelector('.container').appendChild(thankYouSection);
    initializeRating();
}

function initializeRating() {
    const stars = document.querySelectorAll('.star');
    const commentContainer = document.querySelector('.rating-comment-container');
    const submitBtn = document.querySelector('.submit-rating-btn');

    stars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.rating);
            stars.forEach(s => {
                s.style.color = parseInt(s.dataset.rating) <= rating ? '#ffd700' : '#ccc';
            });
            
            if (rating <= 3) {
                commentContainer.style.display = 'block';
            } else {
                commentContainer.style.display = 'none';
            }
        });
    });

    submitBtn?.addEventListener('click', submitRating);
}

async function submitRating() {
    const rating = document.querySelectorAll('.star[style*="gold"]').length;
    const comment = document.querySelector('.rating-comment-container textarea')?.value;
    const orderId = localStorage.getItem('currentOrderId');

    try {
        const response = await fetch(`/api/orders/${orderId}/rate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ rating, comment })
        });

        if (!response.ok) {
            throw new Error('Failed to submit rating');
        }

        Swal.fire({
            icon: 'success',
            title: 'Thank You!',
            text: 'Your rating has been submitted successfully'
        }).then(() => {
            window.location.href = '/boudz';
        });
    } catch (error) {
        console.error('Error submitting rating:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to submit rating. Please try again.'
        });
    }
} 