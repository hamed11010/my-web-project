// Menu page functionality
(function() {
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        console.log('Menu page JavaScript initializing...');
        
        // Check if user is logged in
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || 'null');

        if (!token || !user) {
            window.location.href = '/login.html';
            return;
        }

        // Load menu items
        loadMenuItems();

        // Add event listeners to add to cart buttons
        document.addEventListener('click', async (e) => {
            if (e.target.classList.contains('add-to-cart-btn')) {
                const itemId = e.target.dataset.itemId;
                const itemName = e.target.dataset.itemName;
                const itemPrice = parseFloat(e.target.dataset.itemPrice);
                
                try {
                    const response = await fetch('http://localhost:5000/api/cart/add', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({
                            itemId,
                            quantity: 1
                        })
                    });

                    if (!response.ok) {
                        throw new Error('Failed to add item to cart');
                    }

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
                        text: 'Failed to add item to cart'
                    });
                }
            }
        });
    });

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

    // Get DOM elements
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const showCartBtn = document.getElementById('show-cart-btn');
    const cartCount = document.querySelector('.cart-count');

    // Check if required elements exist
    if (!menuToggle || !sidebar || !overlay) {
        console.error('Required elements not found:', {
            menuToggle: !!menuToggle,
            sidebar: !!sidebar,
            overlay: !!overlay
        });
        return;
    }

    // Menu toggle functionality
    menuToggle.addEventListener('click', function() {
        // Menu toggle functionality
        menuToggle.addEventListener('click', function() {
            console.log('Menu toggle clicked');
        sidebar.classList.toggle('active');
        overlay.style.display = sidebar.classList.contains('active') ? 'block' : 'none';
        document.body.classList.toggle('sidebar-open');
    });

        // Overlay click handler
        overlay.addEventListener('click', function() {
            console.log('Overlay clicked');
        sidebar.classList.remove('active');
        overlay.style.display = 'none';
        document.body.classList.remove('sidebar-open');
    });

        // Cart button functionality
        if (showCartBtn) {
            showCartBtn.addEventListener('click', function() {
                console.log('Cart button clicked');
                window.location.href = '/cart';
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
                const categoryId = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            scrollToCategory(categoryId);
        });
    });

        // Add to cart functionality
    document.querySelectorAll('.product').forEach(product => {
        const button = product.querySelector('button');
        if (!button) return;

        const id = product.dataset.id;
        const name = product.querySelector('h2').textContent.trim();
        const price = parseFloat(product.querySelector('.price').textContent.replace('LE ', ''));

        button.addEventListener('click', async function() {
            try {
                // Show loading state
                this.textContent = 'Adding...';
                this.disabled = true;

                // Prepare item data
                const item = {
                    productId: id,
                    name: name,
                    price: price,
                    quantity: 1
                };

                console.log('Adding item to cart:', item);

                // Add to cart
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

                const result = await response.json();
                console.log('Item added successfully:', result);

                // Update cart count
                if (cartCount) {
                    const totalItems = result.items.reduce((sum, item) => sum + item.quantity, 0);
                    cartCount.textContent = totalItems;
                    cartCount.style.display = totalItems > 0 ? 'block' : 'none';
                }

                // Show success message
                Swal.fire({
                    icon: 'success',
                    title: 'Added to Cart',
                    text: `${name} has been added to your cart`,
                    timer: 1500,
                    showConfirmButton: false
                });
            } catch (error) {
                console.error('Error adding item to cart:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message || 'Failed to add item to cart'
                });
            } finally {
                // Reset button state
                this.textContent = 'Add to Cart';
                this.disabled = false;
            }
        });
    });

        console.log('Menu page JavaScript initialized successfully');
    });
})();