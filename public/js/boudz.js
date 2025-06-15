// Menu page functionality
const API_BASE_URL = 'http://localhost:5000/api';

// Fetch data with authentication
async function fetchData(url, options = {}) {
    const defaultOptions = {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await fetch(url, { ...defaultOptions, ...options });
        if (!response.ok) {
            if (response.status === 401) {
                // Handle unauthorized access
                Swal.fire({
                    icon: 'error',
                    title: 'Session Expired',
                    text: 'Please log in again to continue'
                }).then(() => {
                    window.location.href = '/login';
                });
                return null;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to fetch data. Please try again.'
        });
        return null;
    }
}

// Check authentication
async function checkAuth() {
    try {
        const response = await fetchData(`${API_BASE_URL}/users/verify`);
        if (!response || !response.user) {
            throw new Error('Not authenticated');
        }
        return response.user;
    } catch (error) {
        console.error('Auth verification failed:', error);
        Swal.fire({
            icon: 'error',
            title: 'Session Expired',
            text: 'Please log in again'
        }).then(() => {
            window.location.href = '/login';
        });
        return null;
    }
}

// Load menu items
async function loadMenuItems() {
    try {
        const data = await fetchData(`${API_BASE_URL}/products`);
        if (!data) return;

        const menuContainer = document.getElementById('menu-items');
        if (!menuContainer) return;

        menuContainer.innerHTML = data.map(item => `
            <div class="menu-item">
                <img src="${item.image}" alt="${item.name}">
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <div class="price">LE ${item.price.toFixed(2)}</div>
                <button class="add-to-cart-btn" data-product-id="${item._id}">
                    Add to Cart
                </button>
            </div>
        `).join('');

        // Add event listeners for add to cart buttons
        const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
        addToCartButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const productId = button.getAttribute('data-product-id');
                if (!productId) {
                    console.error('No product ID found');
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Invalid product. Please try again.'
                    });
                    return;
                }

                try {
                    const response = await fetchData(`${API_BASE_URL}/cart/add`, {
                        method: 'POST',
                        body: JSON.stringify({ productId, quantity: 1 })
                    });

                    if (response) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Success',
                            text: 'Item added to cart successfully'
                        });
                    }
                } catch (error) {
                    console.error('Error adding item to cart:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Failed to add item to cart. Please try again.'
                    });
                }
            });
        });
    } catch (error) {
        console.error('Error loading menu items:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load menu items. Please try again.'
        });
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Menu toggle functionality - Initialize this first, before auth check
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');

        if (menuToggle && sidebar && overlay) {
            // Toggle sidebar
            menuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                sidebar.classList.toggle('active');
                overlay.style.display = sidebar.classList.contains('active') ? 'block' : 'none';
                document.body.classList.toggle('sidebar-open', sidebar.classList.contains('active'));
            });

            // Close sidebar when clicking overlay
            overlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                overlay.style.display = 'none';
                document.body.classList.remove('sidebar-open');
            });

            // Close sidebar when clicking outside
            document.addEventListener('click', (e) => {
                if (sidebar.classList.contains('active') && 
                    !sidebar.contains(e.target) && 
                    !menuToggle.contains(e.target)) {
                    sidebar.classList.remove('active');
                    overlay.style.display = 'none';
                    document.body.classList.remove('sidebar-open');
                }
            });
        }

        // Check authentication
        const user = await checkAuth();
        if (!user) return;

        // Show/hide cart button based on user role
        const sidebarCartBtn = document.getElementById('cartBtn');
        const showCartBtn = document.getElementById('show-cart-btn');
        
        if (sidebarCartBtn) {
            sidebarCartBtn.style.display = user.role !== 'admin' ? 'block' : 'none';
        }
        if (showCartBtn) {
            showCartBtn.style.display = user.role !== 'admin' ? 'block' : 'none';
        }

        // Navigation handlers
        const homeBtn = document.getElementById('homeBtn');
        const aboutBtn = document.getElementById('aboutBtn');

        if (homeBtn) {
            homeBtn.addEventListener('click', () => {
                window.location.href = '/';
            });
        }

        if (aboutBtn) {
            aboutBtn.addEventListener('click', () => {
                window.location.href = '/about-us';
            });
        }

        if (sidebarCartBtn) {
            sidebarCartBtn.addEventListener('click', () => {
                window.location.href = '/hatem';
            });
        }

        // Cart button functionality
        if (showCartBtn) {
            showCartBtn.addEventListener('click', () => {
                window.location.href = '/hatem';
            });
        }

        // Load menu items
        await loadMenuItems();
    } catch (error) {
        console.error('Error initializing page:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to initialize page. Please try again.'
        });
    }
});

// Category scroll functionality
function scrollToCategory(categoryId) {
    const element = document.getElementById(categoryId);
    if (element) {
        const headerHeight = document.querySelector('.navbar')?.offsetHeight || 0;
        const categoryNavHeight = document.querySelector('.category-nav')?.offsetHeight || 0;
        const offset = headerHeight + categoryNavHeight;
        
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

// Add click handlers to category buttons
document.querySelectorAll('.category-buttons button').forEach(button => {
    button.addEventListener('click', function() {
        const categoryId = this.getAttribute('onclick').match(/'([^']+)'/)[1];
        scrollToCategory(categoryId);
    });
});

console.log('Menu page JavaScript initialized successfully');