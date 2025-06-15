// Order confirmation functionality
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

// Load order details
async function loadOrderDetails(orderId) {
    try {
        const order = await fetchData(`/api/orders/${orderId}`);
        displayOrderDetails(order);
    } catch (error) {
        console.error('Error loading order details:', error);
    }
}

// Display order details
function displayOrderDetails(order) {
    const orderContainer = document.getElementById('order-details');
    if (!orderContainer) return;

    orderContainer.innerHTML = `
        <h2>Order #${order._id}</h2>
        <p>Status: ${order.status}</p>
        <p>Total: $${order.total}</p>
        <h3>Items:</h3>
        <ul>
            ${order.items.map(item => `
                <li>
                    ${item.name} - Quantity: ${item.quantity} - Price: $${item.price}
                </li>
            `).join('')}
        </ul>
    `;
}

// Initialize order confirmation page
document.addEventListener('DOMContentLoaded', () => {
    const orderId = window.location.pathname.split('/').pop();
    if (orderId) {
        loadOrderDetails(orderId);
    }
});

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
        const response = await fetch(`http://localhost:5000/api/orders/${orderId}/cancel`, {
            method: 'POST'
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