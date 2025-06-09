document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!token || !user) {
        window.location.href = '/login.html';
        return;
    }

    // Load order details
    const orderId = new URLSearchParams(window.location.search).get('orderId');
    if (orderId) {
        loadOrderDetails(orderId);
    } else {
        window.location.href = '/index.html';
    }
});

async function loadOrderDetails(orderId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch order details');
        }

        const order = await response.json();
        displayOrderDetails(order);
    } catch (error) {
        console.error('Error loading order details:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load order details'
        });
    }
}

function displayOrderDetails(order) {
    const orderDetailsContainer = document.querySelector('.order-details');
    if (!orderDetailsContainer) return;

    orderDetailsContainer.innerHTML = `
        <h2>Order #${order._id}</h2>
        <div class="order-info">
            <p><strong>Status:</strong> ${order.status}</p>
            <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
            <p><strong>Total Amount:</strong> $${order.totalAmount.toFixed(2)}</p>
        </div>
        <div class="order-items">
            <h3>Items</h3>
            <ul>
                ${order.items.map(item => `
                    <li>
                        ${item.name} - $${item.price.toFixed(2)} x ${item.quantity}
                        <span class="item-total">$${(item.price * item.quantity).toFixed(2)}</span>
                    </li>
                `).join('')}
            </ul>
        </div>
        ${order.status === 'pending' ? `
            <button class="cancel-order-btn" onclick="cancelOrder('${order._id}')">
                Cancel Order
            </button>
        ` : ''}
    `;
}

async function cancelOrder(orderId) {
    const result = await Swal.fire({
        title: 'Confirm Cancellation',
        text: 'Are you sure you want to cancel this order?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, cancel order',
        cancelButtonText: 'No, keep order'
    });

    if (!result.isConfirmed) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/orders/${orderId}/cancel`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to cancel order');
        }

        Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Order has been cancelled'
        }).then(() => {
            window.location.href = '/index.html';
        });
    } catch (error) {
        console.error('Error cancelling order:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to cancel order'
        });
    }
} 