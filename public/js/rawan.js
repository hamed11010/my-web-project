console.log('rawan.js loaded');

// Helper function for making API calls
async function fetchData(url, options = {}) {
    const defaultOptions = {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    if (!response.ok) {
        if (response.status === 401) {
            // Redirect to login if unauthorized
            window.location.href = '/login';
            throw new Error('Unauthorized');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Verify admin access first
        const verifyResponse = await fetchData('http://localhost:5000/api/users/verify');
        const userData = await verifyResponse.json();
        
        if (userData.user.role !== 'admin') {
            Swal.fire({
                icon: 'error',
                title: 'Access Denied',
                text: 'You must be an admin to access this page'
            }).then(() => {
                window.location.href = '/';
            });
            return;
        }

        // Load orders
        const response = await fetchData('http://localhost:5000/api/orders?page=1&limit=10');
        const data = await response.json();
        const tableBody = document.querySelector('#Orders-table tbody');
        
        if (tableBody) {
            tableBody.innerHTML = data.orders.map(order => `
                <tr>
                    <td>${order._id}</td>
                    <td>${order.userId ? order.userId.name : 'N/A'}</td>
                    <td>
                        <ul class="order-items">
                            ${order.items ? order.items.map(item => `
                                <li>${item.name} x ${item.quantity}</li>
                            `).join('') : '<li>No items</li>'}
                        </ul>
                    </td>
                    <td>LE ${order.finalAmount ? order.finalAmount.toFixed(2) : '0.00'}</td>
                    <td>
                        <span class="badge ${order.status === 'completed' ? 'bg-success' : 
                                      order.status === 'preparing' ? 'bg-warning' : 
                                      order.status === 'in-transit' ? 'bg-info' : 
                                      'bg-danger'}">
                            ${order.status || 'pending'}
                        </span>
                    </td>
                    <td>${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn view" onclick="viewOrderFeedback('${order._id}')">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button class="action-btn delete" onclick="deleteOrder('${order._id}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');

            // Add load more button if there are more orders
            if (data.hasMore) {
                tableBody.innerHTML += `
                    <tr id="load-more-row">
                        <td colspan="7" class="text-center">
                            <button class="load-more-btn" onclick="loadMoreOrders()">
                                <i class="fas fa-chevron-down"></i> Load More Orders
                            </button>
                        </td>
                    </tr>
                `;
            }
        }

        // Initialize tabs
        initTabs();
        // Show default tab
        showTab('orders');
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load data'
        });
    }
});

async function viewOrderDetails(orderId) {
    try {
        const response = await fetchData(`http://localhost:5000/api/orders/${orderId}`);
        const order = await response.json();
        
        // Create order details HTML
        const detailsHtml = `
            <div class="order-details">
                <h3>Order #${order._id}</h3>
                <p><strong>Customer:</strong> ${order.userId ? order.userId.name : 'N/A'}</p>
                <p><strong>Total Amount:</strong> LE ${order.finalAmount ? order.finalAmount.toFixed(2) : '0.00'}</p>
                <p><strong>Status:</strong> ${order.status || 'pending'}</p>
                <p><strong>Date:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}</p>
                <h4>Items:</h4>
                <ul>
                    ${order.items ? order.items.map(item => `
                        <li>${item.name} - LE ${item.price} x ${item.quantity}</li>
                    `).join('') : '<li>No items</li>'}
                </ul>
            </div>
        `;

        Swal.fire({
            title: 'Order Details',
            html: detailsHtml,
            width: '600px'
        });
    } catch (error) {
        console.error('Error viewing order details:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load order details'
        });
    }
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
        const response = await fetchData(`http://localhost:5000/api/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'cancelled' })
        });

        if (!response.ok) {
            throw new Error('Failed to cancel order');
        }

        Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Order has been cancelled'
        });

        // Reload the page to update the orders list
        window.location.reload();
    } catch (error) {
        console.error('Error cancelling order:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to cancel order'
        });
    }
}

// Tab functionality
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            showTab(tabId);
        });
    });
}

function showTab(tabId) {
    // Hide all sections
    document.querySelectorAll('.tab-content').forEach(section => {
        section.style.display = 'none';
    });

    // Remove active class from all buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    // Show selected section
    const selectedSection = document.getElementById(`${tabId}-section`);
    if (selectedSection) {
        selectedSection.style.display = 'block';
    }

    // Add active class to selected button
    const selectedButton = document.querySelector(`[data-tab="${tabId}"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }
}

let id = 1000;

// Inventory search functionality
function setupInventorySearch() {
  const searchInput = document.querySelector('#warehouse input[type="text"]');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      searchInventory(this.value.toLowerCase());
    });
  }
}

function searchInventory(searchTerm) {
  const dataRows = document.querySelectorAll('.inventory-table tbody tr');
  
  if (dataRows.length === 0) return;
  
  searchTerm = searchTerm.toLowerCase().trim();
  
  dataRows.forEach(row => {
    const cells = row.querySelectorAll('td');
    let shouldShow = false;
    
    for (let i = 0; i < cells.length - 1; i++) {
      if (cells[i].textContent.toLowerCase().includes(searchTerm)) {
        shouldShow = true;
        break;
      }
    }
    
    row.style.display = shouldShow ? 'table-row' : 'none';
  });
}

function setupSupplierSearch() {
  const searchInput = document.querySelector('#suppliers input[type="search"]');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      searchSuppliers(this.value.toLowerCase());
    });
  }
}

function searchSuppliers(searchTerm) {
  const dataRows = document.querySelectorAll('#suppliers table tbody tr');
  
  if (dataRows.length === 0) return;
  
  searchTerm = searchTerm.toLowerCase().trim();
  
  dataRows.forEach(row => {
    const cells = row.querySelectorAll('td');
    let shouldShow = false;
    
    for (let i = 0; i < cells.length - 1; i++) {
      if (cells[i].textContent.toLowerCase().includes(searchTerm)) {
        shouldShow = true;
        break;
      }
    }
    
    row.style.display = shouldShow ? 'table-row' : 'none';
  });
}

// Product management functions
function AddProductToWarehouse() {
  const newProduct = {
    id: 'PRD' + id++, 
    name: document.getElementById('pname-field').value,
    category: document.getElementById('category').value,
    initialStock: parseInt(document.getElementById('text-stock').value),
    unitOfMeasure: document.getElementById('unitMeasure').value,
    reorderLevel: Math.max(5, Math.ceil(parseInt(document.getElementById('text-stock').value) * 0.2)), 
    supplier: document.getElementById('text-supplier').value,
    costPrice: document.getElementById('text-cost').value,
    lastUpdated: new Date().toLocaleDateString()
  };

  if (!newProduct.name || !newProduct.category || !newProduct.unitOfMeasure || 
      isNaN(newProduct.initialStock) || !newProduct.costPrice) {
    alert('Please fill in all required fields with valid values!');
    return;
  }

  const newRow = document.createElement('tr');
  newRow.innerHTML = `
    <td>${newProduct.id}</td>
    <td>${newProduct.name}</td>
    <td>${newProduct.category}</td>
    <td>${newProduct.initialStock}</td>
    <td>${newProduct.unitOfMeasure}</td>
    <td>${newProduct.reorderLevel}</td>
    <td>${newProduct.lastUpdated}</td>
    <td>
      <button id="restock-btn" onclick="restock(this)">Restock</button>
      <button id="remove-btn" onclick="removeRow(this)">Remove</button>
    </td>
  `;

  const table = document.querySelector('.inventory-table tbody');
  if (!table) {
    const inventoryTable = document.querySelector('.inventory-table');
    const tbody = document.createElement('tbody');
    inventoryTable.appendChild(tbody);
    tbody.appendChild(newRow);
  } else {
    table.appendChild(newRow);
  }
  
  // Add the new product to the select box
  addProductToSelectBox(newProduct.id, newProduct.name);
  
  alert("Product Added Successfully To The Warehouse!");
  
  // Clear form
  document.getElementById('pname-field').value = '';
  document.getElementById('text-stock').value = '';
  document.getElementById('text-supplier').value = '';
  document.getElementById('text-cost').value = '';
}

// Product select box functions
function addProductToSelectBox(productId, productName) {
  const selectBox = document.getElementById('product-select');
  const option = document.createElement('option');
  option.value = productId;
  option.textContent = productName;
  selectBox.appendChild(option);
}

function initializeProductSelectBox() {
  const selectBox = document.getElementById('product-select');
  // Clear existing options except the first one
  while (selectBox.options.length > 1) {
    selectBox.remove(1);
  }
  
  // Add existing products from inventory table
  const rows = document.querySelectorAll('.inventory-table tbody tr');
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 2) {
      const productId = cells[0].textContent;
      const productName = cells[1].textContent;
      addProductToSelectBox(productId, productName);
    }
  });
}

// Inventory row management
function restock(button) {
  const row = button.closest('tr');
  const cells = row.querySelectorAll('td');
  const stockCell = cells[3];
  const currentStock = parseInt(stockCell.textContent);
  
  const amountToAdd = prompt("Enter amount to add to current stock:", "10");
  
  if (amountToAdd !== null && !isNaN(amountToAdd)) {
    const newStock = currentStock + parseInt(amountToAdd);
    stockCell.textContent = newStock;
    alert(`Added ${amountToAdd} to stock. New total: ${newStock}`);
  } else {
    alert("Invalid amount entered. No changes made.");
  }
}

function removeRow(button) {
  if (confirm("Are you sure you want to remove this product?")) {
    const row = button.closest('tr');
    const productId = row.querySelector('td:first-child').textContent;
    
    // Remove from inventory table
    row.remove();
    
    // Remove from select box
    const selectBox = document.getElementById('product-select');
    const optionToRemove = Array.from(selectBox.options).find(option => option.value === productId);
    if (optionToRemove) {
      selectBox.remove(optionToRemove.index);
    }
    
    alert("Product Removed Successfully From The Warehouse!");
  }
}

// Low stock alert functionality
function showLowStockAlert() {
  const rows = document.querySelectorAll('.inventory-table tbody tr');
  
  rows.forEach(row => {
    const stockCell = row.querySelector('td:nth-child(4)');
    const reorderCell = row.querySelector('td:nth-child(6)');
    
    if (stockCell && reorderCell) {
      const currentStock = parseInt(stockCell.textContent);
      const reorderLevel = parseInt(reorderCell.textContent);
      
      if (currentStock <= reorderLevel) {
        row.style.backgroundColor = '#ffdddd';
        row.classList.add('low-stock');
      } else {
        row.style.backgroundColor = '';
        row.classList.remove('low-stock');
      }
    }
  });
}

function updateStock(event) {
  event.preventDefault();
  
  // Get form values
  const productId = document.getElementById('product-select').value;
  const action = document.getElementById('stock-action').value;
  const quantityInput = document.getElementById('quantity-change');
  const quantity = parseInt(quantityInput.value);
  
  // Validate inputs
  if (!productId) {
    alert('Please select a product!');
    quantityInput.focus();
    return false;
  }
  
  if (!action) {
    alert('Please select an action!');
    return false;
  }
  
  if (isNaN(quantity) || quantity <= 0) {
    alert('Please enter a valid positive quantity!');
    quantityInput.focus();
    return false;
  }

  // Find product row
  const productRow = Array.from(document.querySelectorAll('.inventory-table tr'))
    .find(row => row.querySelector('td:first-child')?.textContent === productId);
  
  if (!productRow) {
    alert('Product not found in inventory!');
    return false;
  }

  // Get current stock
  const stockCell = productRow.querySelector('td:nth-child(4)');
  let currentStock = parseInt(stockCell.textContent);
  let newStock = currentStock;

  // Perform action
  switch (action) {
    case 'add':
      newStock = currentStock + quantity;
      break;
    case 'remove':
      if (quantity > currentStock) {
        alert(`Cannot remove ${quantity} items. Only ${currentStock} available!`);
        return false;
      }
      newStock = currentStock - quantity;
      break;
    case 'set':
      newStock = quantity;
      break;
  }

  // Update display
  stockCell.textContent = newStock;
  productRow.querySelector('td:nth-child(7)').textContent = new Date().toLocaleDateString();
  
  alert(`Stock updated! New quantity: ${newStock}`);
  event.target.reset();
  return true;
}

// Supplier Modal Functions
function openSupplierModal() {
  populateProductOptions();
  document.getElementById('supplierModal').style.display = 'block';
}

function closeSupplierModal() {
  document.getElementById('supplierModal').style.display = 'none';
  document.getElementById('supplierForm').reset();
}

function populateProductOptions() {
  const select = document.getElementById('productsSupplied');
  select.innerHTML = '';
  
  const products = document.querySelectorAll('.inventory-table tbody tr');
  
  if (products.length === 0) {
    select.innerHTML = '<option value="">No products available</option>';
    return;
  }
  
  products.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 2) {
      const option = document.createElement('option');
      option.value = cells[0].textContent;
      option.textContent = `${cells[1].textContent} (${cells[0].textContent})`;
      select.appendChild(option);
    }
  });
}

function addNewSupplier(event) {
  event.preventDefault();
  
  const formData = {
    name: document.getElementById('supplierName').value.trim(),
    contact: document.getElementById('contactPerson').value.trim(),
    phone: document.getElementById('phoneNumber').value.trim(),
    email: document.getElementById('supplierEmail').value.trim()
  };

  // Validate inputs
  if (!formData.name || !formData.contact || !formData.phone || !formData.email.includes('@')) {
    alert('Please fill all required fields correctly');
    return;
  }

  // Get selected products
  const selectedProducts = Array.from(document.getElementById('productsSupplied').selectedOptions)
    .map(opt => opt.textContent).join(', ');

  // Add to table
  addSupplierToTable(formData, selectedProducts);
  
  // Close and reset
  closeSupplierModal();
  alert('Supplier added successfully!');
}

function addSupplierToTable(supplier, products) {
  const tbody = document.querySelector('#suppliers table tbody') || 
               document.querySelector('#suppliers table').createTBody();
  
  const newRow = document.createElement('tr');
  newRow.innerHTML = `
    <td>${supplier.name}</td>
    <td>${supplier.contact}</td>
    <td>${supplier.phone}</td>
    <td>${supplier.email}</td>
    <td>${products}</td>
    <td>${new Date().toLocaleDateString()}</td>
    <td>
      <button class="contact-btn" onclick="contactSupplier(this)">Contact</button>
      <button class="orders-btn" onclick="viewSupplierOrders(this)">Orders</button>
    </td>
  `;
  
  tbody.insertBefore(newRow, tbody.firstChild);
}

// Helper functions for buttons
function contactSupplier(button) {
  const supplierName = button.closest('tr').querySelector('td:first-child').textContent;
  alert(`Contacting ${supplierName}`);
}

function viewSupplierOrders(button) {
  const supplierName = button.closest('tr').querySelector('td:first-child').textContent;
  alert(`Viewing orders for ${supplierName}`);
}

// Global variables for pagination
let currentPage = 1;
const ordersPerPage = 10;
let hasMore = true;

// Load orders function
async function loadOrders(loadMore = false) {
    try {
        if (!loadMore) {
            // Reset pagination when loading fresh
            currentPage = 1;
            hasMore = true;
        }

        if (!hasMore) {
            return;
        }

        console.log('Loading orders...');
        const response = await fetchData(`http://localhost:5000/api/orders?page=${currentPage}&limit=${ordersPerPage}`);
        const data = await response.json();
        console.log('Orders loaded:', data);
        
        const tableBody = document.querySelector('#Orders-table tbody');
        if (!tableBody) {
            console.error('Orders table body not found');
            return;
        }

        if (data.orders.length === 0) {
            if (currentPage === 1) {
                tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No orders found</td></tr>';
            }
            return;
        }

        const ordersHtml = data.orders.map(order => `
            <tr>
                <td>${order._id}</td>
                <td>${order.userId ? order.userId.name : 'N/A'}</td>
                <td>
                    <ul class="order-items">
                        ${order.items && order.items.length > 0 
                            ? order.items.map(item => `
                                <li>${item.name} x ${item.quantity}</li>
                            `).join('')
                            : '<li>No items</li>'
                        }
                    </ul>
                </td>
                <td>LE ${order.finalAmount ? order.finalAmount.toFixed(2) : '0.00'}</td>
                <td>
                    <span class="badge ${order.status === 'completed' ? 'bg-success' : 
                                      order.status === 'preparing' ? 'bg-warning' : 
                                      order.status === 'in-transit' ? 'bg-info' : 
                                      'bg-danger'}">
                        ${order.status || 'pending'}
                    </span>
                </td>
                <td>${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" onclick="viewOrderFeedback('${order._id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="action-btn delete" onclick="deleteOrder('${order._id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Add load more button if there are more orders to show
        const loadMoreHtml = data.hasMore ? `
            <tr id="load-more-row">
                <td colspan="7" class="text-center">
                    <button class="load-more-btn" onclick="loadMoreOrders()">
                        <i class="fas fa-chevron-down"></i> Load More Orders
                    </button>
                </td>
            </tr>
        ` : '';

        if (loadMore) {
            // Append new orders to existing ones
            const existingContent = tableBody.innerHTML.replace(/<tr id="load-more-row">.*?<\/tr>/s, '');
            tableBody.innerHTML = existingContent + ordersHtml + loadMoreHtml;
        } else {
            // Replace all content
            tableBody.innerHTML = ordersHtml + loadMoreHtml;
        }

        hasMore = data.hasMore;
        console.log('Orders rendered successfully');
    } catch (error) {
        console.error('Error loading orders:', error);
        const tableBody = document.querySelector('#Orders-table tbody');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Error loading orders</td></tr>';
        }
    }
}

// Function to load more orders
function loadMoreOrders() {
    currentPage++;
    loadOrders(true);
}

async function viewOrderFeedback(orderId) {
    try {
        const response = await fetchData(`http://localhost:5000/api/orders/${orderId}`);
        const order = await response.json();
        
        // Create modal content
        const modalContent = `
            <div class="order-details">
                <h3>Order Details</h3>
                <p><strong>Order ID:</strong> ${order._id}</p>
                <p><strong>Customer:</strong> ${order.userId ? order.userId.name : 'N/A'}</p>
                <p><strong>Status:</strong> ${order.status || 'pending'}</p>
                <p><strong>Total Amount:</strong> LE ${order.finalAmount ? order.finalAmount.toFixed(2) : '0.00'}</p>
                <p><strong>Created At:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</p>
                
                <h4>Items:</h4>
                <ul>
                    ${order.items ? order.items.map(item => `
                        <li>${item.name} x ${item.quantity}</li>
                    `).join('') : '<li>No items</li>'}
                </ul>
                
                ${order.feedback ? `
                    <h4>Feedback:</h4>
                    <p>${order.feedback}</p>
                ` : '<p>No feedback provided</p>'}
            </div>
        `;

        // Show modal
        Swal.fire({
            title: 'Order Details',
            html: modalContent,
            width: '600px',
            showCloseButton: true,
            showConfirmButton: false
        });
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load order details'
        });
    }
}

async function deleteOrder(orderId) {
    try {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            const response = await fetchData(`http://localhost:5000/api/orders/${orderId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                Swal.fire(
                    'Deleted!',
                    'Order has been deleted.',
                    'success'
                ).then(() => {
                    // Reload the page to refresh the orders list
                    window.location.reload();
                });
            } else {
                throw new Error('Failed to delete order');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to delete order'
        });
    }
}

// Show section function
function showSection(sectionId, event) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show the selected section
    document.getElementById(sectionId).style.display = 'block';
    
    // Update active button
    document.querySelectorAll('.nav-buttons').forEach(button => {
        button.classList.remove('active');
    });

    // Find and activate the clicked button
    const clickedButton = document.querySelector(`.nav-buttons[onclick*="${sectionId}"]`);
    if (clickedButton) {
        clickedButton.classList.add('active');
    }

    // Load section-specific data
    if (sectionId === 'orders') {
        loadOrders();
    } else if (sectionId === 'warehouse') {
        loadCategoryTotals();
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Show orders section by default
    showSection('orders');
});

// --- Warehouse Table ---
async function loadWarehouseProducts(category = null) {
    try {
        console.log('Loading warehouse products for category:', category);
        let url = 'http://localhost:5000/api/products';
        if (category && category !== 'everything') {
            url += `?category=${encodeURIComponent(category)}`;
        }
        
        const res = await fetchData(url);
        if (!res.ok) {
            throw new Error('Failed to fetch products');
        }
        
        const products = await res.json();
        console.log('Products loaded:', products);
        
        // Filter products by category if needed
        let filteredProducts = products;
        if (category && category !== 'everything') {
            filteredProducts = products.filter(product => 
                product.category.toLowerCase() === category.toLowerCase()
            );
        }
        
        renderWarehouseTable(filteredProducts);
    } catch (err) {
        console.error('Error loading warehouse products:', err);
        Swal.fire({
            title: 'Error',
            text: 'Failed to load warehouse products',
            icon: 'error'
        });
    }
}

// Render warehouse table
function renderWarehouseTable(products) {
    const tbody = document.getElementById('warehouse-table-body');
    if (!tbody) {
        console.error('Warehouse table body not found');
        return;
    }

    tbody.innerHTML = '';
    
    if (!products || products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="no-products-message">
                    <i class="fas fa-box-open"></i>
                    <p>No products found in this category.</p>
                </td>
            </tr>
        `;
        return;
    }

    products.forEach(product => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${product._id.slice(-4)}</td>
            <td>${product.name}</td>
            <td>
                <span class="category-badge ${product.category.toLowerCase().replace(/\s+/g, '-')}">
                    ${product.category}
                </span>
            </td>
            <td class="${product.stock <= 10 ? 'low-stock' : ''}">
                ${product.stock}
                ${product.stock <= 10 ? '<i class="fas fa-exclamation-circle" title="Low Stock"></i>' : ''}
            </td>
            <td>${product.unit}</td>
            <td>${product.reorderLevel}</td>
            <td>${new Date(product.updatedAt).toLocaleDateString()}</td>
            <td>
                <button class="action-btn update" onclick="showUpdateStockModal('${product._id}', '${product.name}', ${product.stock})">
                    <i class="fas fa-edit"></i> Update
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Show update stock modal
function showUpdateStockModal(productId, productName, currentStock) {
    if (!productId || !productName) {
        console.error('Invalid product data:', { productId, productName });
        Swal.fire({
            title: 'Error',
            text: 'Invalid product data',
            icon: 'error'
        });
        return;
    }

    Swal.fire({
        title: `Update Stock - ${productName}`,
        html: `
            <div class="stock-update-form">
                <div class="form-group">
                    <label>Current Stock: ${currentStock}</label>
                </div>
                <div class="form-group">
                    <label for="stock-action">Action:</label>
                    <select id="stock-action" class="form-control">
                        <option value="add">Add Stock</option>
                        <option value="remove">Remove Stock</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="quantity-change">Quantity:</label>
                    <input type="number" id="quantity-change" class="form-control" min="1" required>
                </div>
                <div class="form-group">
                    <label for="reason">Reason:</label>
                    <select id="reason" class="form-control" required>
                        <option value="">Select a reason</option>
                        <option value="new_shipment">New Shipment Received</option>
                        <option value="damaged_items">Damaged Items</option>
                        <option value="expired_items">Expired Items</option>
                        <option value="inventory_adjustment">Inventory Adjustment</option>
                        <option value="returned_items">Returned Items</option>
                        <option value="quality_control">Quality Control Rejection</option>
                        <option value="promotional_items">Promotional Items</option>
                        <option value="seasonal_adjustment">Seasonal Stock Adjustment</option>
                    </select>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Update Stock',
        cancelButtonText: 'Cancel',
        preConfirm: () => {
            const action = document.getElementById('stock-action').value;
            const quantity = parseInt(document.getElementById('quantity-change').value);
            const reason = document.getElementById('reason').value;
            
            if (!quantity || quantity <= 0) {
                Swal.showValidationMessage('Please enter a valid quantity');
                return false;
            }
            if (!reason) {
                Swal.showValidationMessage('Please select a reason');
                return false;
            }
            
            return { action, quantity, reason };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            updateProductStock(productId, result.value);
        }
    });
}

// Update product stock
async function updateProductStock(productId, { action, quantity, reason }) {
    try {
        if (!productId) {
            throw new Error('Product ID is required');
        }

        const response = await fetchData(`http://localhost:5000/api/products/${productId}/stock`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action, quantity, reason })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update stock');
        }

        const result = await response.json();
        
        Swal.fire({
            title: 'Success',
            text: 'Stock updated successfully',
            icon: 'success'
        });

        // Refresh the warehouse table and category totals
        loadWarehouseProducts();
        loadCategoryTotals();
    } catch (error) {
        console.error('Error updating stock:', error);
        Swal.fire({
            title: 'Error',
            text: error.message || 'Failed to update stock',
            icon: 'error'
        });
    }
}

// Fetch and display category totals
async function loadCategoryTotals() {
    try {
        const response = await fetchData('http://localhost:5000/api/products/category/totals');
        const totals = await response.json();
        renderCategoryTotals(totals);
    } catch (err) {
        console.error('Error loading category totals:', err);
        Swal.fire({
            title: 'Error',
            text: err.message || 'Failed to load category totals',
            icon: 'error'
        });
    }
}

function renderCategoryTotals(totals) {
    let html = '<table class="category-totals"><tr><th>Category</th><th>Total Stock</th></tr>';
    totals.forEach(row => {
        html += `<tr><td>${row.category}</td><td>${row.totalStock}</td></tr>`;
    });
    html += '</table>';
    
    const section = document.getElementById('orders');
    let div = document.getElementById('category-totals-section');
    if (!div) {
        div = document.createElement('div');
        div.id = 'category-totals-section';
        section.insertBefore(div, section.firstChild);
    }
    div.innerHTML = html;
}

// Initialize warehouse functionality
document.addEventListener('DOMContentLoaded', function() {
    // Load initial warehouse data
    loadWarehouseProducts();
    loadCategoryTotals();

    // Setup category filter
    const categorySelect = document.getElementById('warehouse-category-filter');
    if (categorySelect) {
        categorySelect.addEventListener('change', function() {
            const selectedCategory = this.value;
            console.log('Category selected:', selectedCategory);
            loadWarehouseProducts(selectedCategory);
        });
    }
});

// product.js

document.getElementById('productForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  // Gather form values
  const name = document.getElementById('productName').value.trim();
  const category = document.getElementById('productCategory').value;
  const price = parseFloat(document.getElementById('productPrice').value);
  const stock = parseInt(document.getElementById('productStock').value);
  const reorderLevel = parseInt(document.getElementById('productMinStock').value);

  // Prepare payload
  const productData = {
    name,
    category,
    price,
    cost: price,          // Since you have no separate input for cost
    stock,
    reorderLevel,
    unit: 'pcs',          // default, since your schema requires it
    supplier: ''          // optional, default empty
  };

  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });

    const data = await res.json();

    if (res.ok) {
      alert('Product added successfully!');
      this.reset(); // Clear form
    } else {
      alert(`Error: ${data.message}`);
    }
  } catch (err) {
    console.error(err);
    alert('Something went wrong.');
  }
});

// Form submission handlers
document.getElementById('addProductForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const formData = new FormData(e.target);
        const productData = {
            name: formData.get('name'),
            price: parseFloat(formData.get('price')),
            description: formData.get('description'),
            category: formData.get('category'),
            image: formData.get('image')
        };

        const response = await fetchData('http://localhost:5000/api/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        });

        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Product added successfully'
            }).then(() => {
                e.target.reset();
            });
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to add product'
        });
    }
});

document.getElementById('addSupplierForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const formData = new FormData(e.target);
        const supplierData = {
            name: formData.get('name'),
            contact: formData.get('contact'),
            email: formData.get('email'),
            address: formData.get('address')
        };

        const response = await fetchData('http://localhost:5000/api/suppliers', {
            method: 'POST',
            body: JSON.stringify(supplierData)
        });

        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Supplier added successfully'
            }).then(() => {
                e.target.reset();
            });
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to add supplier'
        });
    }
});

// Image preview functionality
const imageSelect = document.getElementById('productImage');
const imagePreview = document.getElementById('imagePreview');

if (imageSelect && imagePreview) {
    imageSelect.addEventListener('change', function() {
        const selectedImage = this.value;
        if (selectedImage) {
            imagePreview.innerHTML = `<img src="/images/project-images/${selectedImage}" alt="Product Preview">`;
        } else {
            imagePreview.innerHTML = '';
        }
    });
}

// Function to load products
async function loadProducts() {
    try {
        const response = await fetch('/api/products', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (response.ok) {
            const warehouseTableBody = document.getElementById('warehouse-table-body');
            if (warehouseTableBody) {
                warehouseTableBody.innerHTML = data.map(product => `
                    <tr>
                        <td>${product._id}</td>
                        <td>${product.name}</td>
                        <td>${product.category}</td>
                        <td>${product.stock}</td>
                        <td>${product.unit}</td>
                        <td>${product.reorderLevel}</td>
                        <td>${new Date(product.updatedAt).toLocaleDateString()}</td>
                        <td>
                            <button class="action-btn edit" onclick="editProduct('${product._id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" onclick="deleteProduct('${product._id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Add Product Form Submission
const addProductForm = document.getElementById('productForm');
if (addProductForm) {
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation(); // Stop event propagation
        
        // Get form values
        const formData = {
            name: document.getElementById('productName').value.trim(),
            description: document.getElementById('productDescription').value.trim(),
            category: document.getElementById('productCategory').value,
            image: document.getElementById('productImage').value,
            price: parseFloat(document.getElementById('productPrice').value),
            initialStock: parseInt(document.getElementById('productStock').value),
            reorderLevel: parseInt(document.getElementById('productMinStock').value),
            unit: document.getElementById('productUnit').value
        };

        // Validate form data
        if (!formData.name || !formData.description || !formData.category || !formData.image || 
            isNaN(formData.price) || isNaN(formData.initialStock) || isNaN(formData.reorderLevel) || !formData.unit) {
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                text: 'Please fill in all required fields correctly'
            });
            return false; // Prevent form submission
        }

        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Product added successfully!',
                    timer: 2000,
                    showConfirmButton: false
                });
                addProductForm.reset();
                document.getElementById('imagePreview').innerHTML = '';
                loadProducts(); // Refresh the products list
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: data.message || 'Error adding product'
                });
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error adding product'
            });
        }
        return false; // Prevent form submission
    });
}

// Load products when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
});
