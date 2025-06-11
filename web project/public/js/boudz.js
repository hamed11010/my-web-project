// Menu page functionality
(function() {
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        console.log('Menu page JavaScript initializing...');
        
        // Get token and user info (but don't redirect if missing)
        let token = localStorage.getItem('token');
        let user = JSON.parse(localStorage.getItem('user') || 'null');
        console.log('DOM Ready - Token status:', token ? 'exists' : 'not found');
        console.log('DOM Ready - User status:', user ? 'logged in' : 'not logged in');

        // Load menu items (no auth required)
        loadMenuItems();
        
        // Add event listeners to add to cart buttons (delegated)
        document.addEventListener('click', async (e) => {
            if (e.target.classList.contains('add-to-cart-btn')) {
                // Check authentication before adding to cart
                if (!token || !user) {
                    console.log('User not logged in, redirecting to login');
                    window.location.href = '/login';
                    return;
                }

                const itemId = e.target.dataset.itemId;
                const itemName = e.target.dataset.itemName;
                const itemPrice = parseFloat(e.target.dataset.itemPrice);
                
                try {
                    const response = await fetch('http://localhost:5000/api/cart/add', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            productId: itemId,
                            quantity: 1
                        })
                    });

                    if (!response.ok) {
                        console.error('Add to Cart API response NOT OK. Status:', response.status);
                        if (response.status === 401 || response.status === 403) {
                            console.error('Authentication failed for Add to Cart. Redirecting to login.');
                            window.location.href = '/login';
                            return;
                        }
                        throw new Error('Failed to add item to cart: ' + (await response.text()));
                    }

                    // Update cart count after successful add
                    updateCartCount();

                    Swal.fire({
                        icon: 'success',
                        title: 'Added to Cart!',
                        text: `${itemName} has been added to your cart`,
                        timer: 1500,
                        showConfirmButton: false
                    });
                } catch (error) {
                    console.error('Error adding to cart:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: error.message || 'Failed to add item to cart'
                    });
                }
            }
        });

        // Function to load menu items (no auth required)
        async function loadMenuItems() {
            try {
                const response = await fetch('http://localhost:5000/api/products');
                if (!response.ok) {
                    throw new Error('Failed to fetch menu items');
                }

                const items = await response.json();
                const menuContainer = document.querySelector('.menu-items');

                if (menuContainer) {
                    menuContainer.innerHTML = items.map(item => `
                        <div class="menu-item">
                            <img src="${item.image}" alt="${item.name}">
                            <h3>${item.name}</h3>
                            <p>${item.description}</p>
                            <p class="price">$${item.price.toFixed(2)}</p>
                            <button class="add-to-cart-btn" 
                                    data-item-id="${item._id}"
                                    data-item-name="${item.name}"
                                    data-item-price="${item.price}">
                                Add to Cart
                            </button>
                        </div>
                    `).join('');
                }
            } catch (error) {
                console.error('Error loading menu items:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to load menu items'
                });
            }
        }

        // Function to update cart count (will fetch from backend)
        async function updateCartCount() {
            const token = localStorage.getItem('token');
            if (!token) {
                if (cartCount) cartCount.style.display = 'none';
                return;
            }
            try {
                const response = await fetch('http://localhost:5000/api/cart', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    console.error('Failed to fetch cart data for count update. Status:', response.status);
                    // Do NOT redirect here, as it's a background update.
                    if (cartCount) cartCount.style.display = 'none'; // Hide count if unauthorized
                    return;
                }

                const cart = await response.json();
                const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
                if (cartCount) {
                    cartCount.textContent = totalItems;
                    cartCount.style.display = totalItems > 0 ? 'block' : 'none';
                }
            } catch (error) {
                console.error('Error updating cart count:', error);
                if (cartCount) cartCount.style.display = 'none';
            }
        }

        // Initial cart count load
        updateCartCount();

        // Get DOM elements (moved inside DOMContentLoaded)
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        const showCartBtn = document.getElementById('show-cart-btn');
        const cartCount = document.querySelector('.cart-count');

        // Check if required elements exist (only sidebar related)
        if (!menuToggle || !sidebar || !overlay) {
            console.error('Required elements for sidebar functionality not found:', {
                menuToggle: !!menuToggle,
                sidebar: !!sidebar,
                overlay: !!overlay
            });
        }

        // Menu toggle functionality
        if (menuToggle) { 
            menuToggle.addEventListener('click', function() {
                console.log('Menu toggle clicked');
                sidebar.classList.toggle('active');
                overlay.style.display = sidebar.classList.contains('active') ? 'block' : 'none';
                document.body.classList.toggle('sidebar-open');
            });
        }

        // Overlay click handler
        if (overlay) { 
            overlay.addEventListener('click', function() {
                console.log('Overlay clicked');
                sidebar.classList.remove('active');
                overlay.style.display = 'none';
                document.body.classList.remove('sidebar-open');
            });
        }

        // Cart button functionality
        if (showCartBtn) {
            showCartBtn.addEventListener('click', function() {
                console.log('Cart button clicked');
                window.location.href = '/hatem'; // Assuming /hatem is your cart page.
            });
        }

        // Category scroll functionality
        function scrollToCategory(categoryId) {
            console.log('Scrolling to category:', categoryId);
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
                const categoryId = this.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
                if (categoryId) {
                    scrollToCategory(categoryId);
                } else {
                    console.warn('Category ID not found for button:', this);
                }
            });
        });

        console.log('Menu page JavaScript initialized successfully');
    }); // End of DOMContentLoaded
})();