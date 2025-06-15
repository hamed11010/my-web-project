document.addEventListener('DOMContentLoaded', function() {
    // Initialize charts
    initializeCharts();
    
    // Load initial data
    loadUsers();
    loadSalesData();

    // Event Listeners
    document.querySelectorAll('.sidebar-menu li').forEach(item => {
        item.addEventListener('click', function() {
            const section = this.dataset.section;
            switchSection(section);
        });
    });

    document.getElementById('userSearch').addEventListener('input', function(e) {
        filterUsers(e.target.value);
    });

    document.getElementById('salesPeriod').addEventListener('change', function(e) {
        loadSalesData(e.target.value);
    });
});

// Switch between sections
function switchSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');

    document.querySelectorAll('.sidebar-menu li').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
}

// Load and display users
async function loadUsers() {
    try {
        const response = await fetch('/admin/users');
        const users = await response.json();
        displayUsers(users);
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('Error loading users', 'error');
    }
}

// Display users in the table
function displayUsers(users) {
    const tbody = document.querySelector('#usersTable tbody');
    tbody.innerHTML = '';

    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.orderCount}</td>
            <td>$${user.totalSpent.toFixed(2)}</td>
            <td>$${user.totalProfit.toFixed(2)}</td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
            <td>
                <button class="action-btn view-btn" onclick="viewUserDetails('${user._id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteUser('${user._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Filter users based on search input
function filterUsers(searchTerm) {
    const rows = document.querySelectorAll('#usersTable tbody tr');
    searchTerm = searchTerm.toLowerCase();

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// View user details
async function viewUserDetails(userId) {
    try {
        const response = await fetch(`/admin/users/${userId}`);
        const data = await response.json();
        
        const modalBody = document.querySelector('#userDetailsModal .modal-body');
        modalBody.innerHTML = `
            <div class="user-info">
                <h4>${data.user.name}</h4>
                <p><strong>Email:</strong> ${data.user.email}</p>
                <p><strong>Joined:</strong> ${new Date(data.user.createdAt).toLocaleDateString()}</p>
            </div>
            <div class="user-orders mt-4">
                <h5>Order History</h5>
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.orders.map(order => `
                                <tr>
                                    <td>#${order._id.toString().slice(-6)}</td>
                                    <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                                    <td>$${order.totalAmount.toFixed(2)}</td>
                                    <td><span class="status-badge ${order.status}">${order.status}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        const modal = new bootstrap.Modal(document.getElementById('userDetailsModal'));
        modal.show();
    } catch (error) {
        console.error('Error loading user details:', error);
        showNotification('Error loading user details', 'error');
    }
}

// Delete user
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
        const response = await fetch(`/admin/users/${userId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showNotification('User deleted successfully', 'success');
            loadUsers();
        } else {
            const data = await response.json();
            showNotification(data.error || 'Error deleting user', 'error');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showNotification('Error deleting user', 'error');
    }
}

// Load sales data
async function loadSalesData(period = 30) {
    try {
        const response = await fetch(`/admin/sales?period=${period}`);
        const data = await response.json();
        updateSalesCharts(data);
        updateTopProducts(data.productSales);
    } catch (error) {
        console.error('Error loading sales data:', error);
        showNotification('Error loading sales data', 'error');
    }
}

// Initialize charts
function initializeCharts() {
    // Sales Chart
    const salesCtx = document.getElementById('salesChart').getContext('2d');
    window.salesChart = new Chart(salesCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Sales',
                data: [],
                borderColor: '#3498db',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Products Chart
    const productsCtx = document.getElementById('productsChart').getContext('2d');
    window.productsChart = new Chart(productsCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#3498db',
                    '#2ecc71',
                    '#e74c3c',
                    '#f1c40f',
                    '#9b59b6'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// Update sales charts with new data
function updateSalesCharts(data) {
    const { salesData } = data;
    
    // Update Sales Chart
    const labels = salesData.map(item => `${item._id.month}/${item._id.day}/${item._id.year}`);
    const salesValues = salesData.map(item => item.totalSales);
    const profitValues = salesData.map(item => item.totalProfit);

    window.salesChart.data.labels = labels;
    window.salesChart.data.datasets = [
        {
            label: 'Sales',
            data: salesValues,
            borderColor: '#3498db',
            tension: 0.4
        },
        {
            label: 'Profit',
            data: profitValues,
            borderColor: '#2ecc71',
            tension: 0.4
        }
    ];
    window.salesChart.update();

    // Update Products Chart
    const productLabels = data.productSales.map(item => item.productDetails.name);
    const productValues = data.productSales.map(item => item.totalProfit);

    window.productsChart.data.labels = productLabels;
    window.productsChart.data.datasets[0].data = productValues;
    window.productsChart.update();
}

// Update top products table
function updateTopProducts(products) {
    const tbody = document.querySelector('#topProductsTable tbody');
    tbody.innerHTML = '';

    products.slice(0, 5).forEach(product => {
        const margin = ((product.totalProfit / product.totalRevenue) * 100).toFixed(1);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${product.productDetails.name}</td>
            <td>${product.totalSold}</td>
            <td>$${product.totalRevenue.toFixed(2)}</td>
            <td>$${product.totalCost.toFixed(2)}</td>
            <td>$${product.totalProfit.toFixed(2)}</td>
            <td>${margin}%</td>
        `;
        tbody.appendChild(tr);
    });
}

// Show notification
function showNotification(message, type = 'success') {
    Swal.fire({
        text: message,
        icon: type,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
    });
} 