const teamMembers = [
    {
        name: "Ahmed Hamed",
        role: "Lead Developer",
        bio: "Responsible for the home page and seamless navigation between all sections of our digital coffee house.",
        contributions: [
            "Designed and implemented the main website architecture",
            "Created smooth transitions between all pages",
            "Developed this interactive about us page",
            "Ensured consistent user experience across all devices"
        ]
    },
    {
        name: "Yousif Hamdy",
        role: "Authentication Specialist",
        bio: "Built the secure login and signup system that protects your Coffee House account.",
        contributions: [
            "Implemented secure user authentication",
            "Designed the registration workflow",
            "Created password recovery system",
            "Ensured data privacy compliance"
        ]
    },
    {
        name: "Abdelrahman Tarek",
        role: "Menu Architect",
        bio: "Crafted our digital menu to showcase our offerings as beautifully as our baristas present your coffee.",
        contributions: [
            "Designed the interactive menu interface",
            "Implemented category filtering",
            "Created the product detail views",
            "Optimized for fast browsing"
        ]
    },
    {
        name: "Hatem Hussien",
        role: "Cart System Engineer",
        bio: "Developed the shopping cart that makes ordering your favorites as easy as sipping your morning brew.",
        contributions: [
            "Built the cart functionality",
            "Implemented item customization",
            "Created the checkout process",
            "Added order summary features"
        ]
    },
    {
        name: "Rawan Yasser",
        role: "Order Management",
        bio: "Designed the store ordering system that connects your digital order to our physical locations.",
        contributions: [
            "Developed store location services",
            "Created order tracking system",
            "Implemented pickup scheduling",
            "Built order status notifications"
        ]
    }
];

document.addEventListener('DOMContentLoaded', function() {
    const teamGrid = document.querySelector('.team-grid');
    
    teamMembers.forEach(member => {
        const memberElement = document.createElement('div');
        memberElement.className = 'team-member';
        memberElement.innerHTML = `
            <div class="member-header">
                <h3 class="member-name">${member.name}</h3>
                <span class="member-role">${member.role}</span>
            </div>
            <div class="member-details">
                <p>${member.bio}</p>
                <div class="member-contribution">
                    <h4>Key Contributions:</h4>
                    <ul>
                        ${member.contributions.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
        
        memberElement.addEventListener('click', function() {
            toggleMember(this);
        });
        
        memberElement.addEventListener('mouseenter', function() {
            if (!this.classList.contains('active')) {
                this.style.transform = 'scale(1.02)';
                this.style.boxShadow = '0 5px 20px rgba(0,0,0,0.15)';
            }
        });
        
        memberElement.addEventListener('mouseleave', function() {
            if (!this.classList.contains('active')) {
                this.style.transform = 'scale(1)';
                this.style.boxShadow = '0 3px 10px rgba(0,0,0,0.1)';
            }
        });
        
        teamGrid.appendChild(memberElement);
    });
});

function toggleMember(element) {
    const isActive = element.classList.contains('active');
    
    document.querySelectorAll('.team-member').forEach(member => {
        member.classList.remove('active');
        member.style.transform = 'scale(1)';
        member.style.boxShadow = '0 3px 10px rgba(0,0,0,0.1)';
    });
    
    if (!isActive) {
        element.classList.add('active');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userType = localStorage.getItem('userType');
    const navButtons = document.querySelector('.nav-buttons');
    
    // Clear existing buttons
    navButtons.innerHTML = '';

    // Add Home button
    const homeBtn = document.createElement('button');
    homeBtn.textContent = 'Home';
    homeBtn.onclick = () => window.location.href = '/';
    navButtons.appendChild(homeBtn);

    // Add About Us button
    const aboutUsBtn = document.createElement('button');
    aboutUsBtn.textContent = 'About Us';
    aboutUsBtn.className = 'active';
    aboutUsBtn.onclick = () => window.location.href = '/about-us';
    navButtons.appendChild(aboutUsBtn);

    if (isLoggedIn) {
        // Add Menu button
        const menuBtn = document.createElement('button');
        menuBtn.textContent = 'Menu';
        menuBtn.onclick = () => window.location.href = '/boudz';
        navButtons.appendChild(menuBtn);

        // Add Cart button
        const cartBtn = document.createElement('button');
        cartBtn.textContent = 'Cart';
        cartBtn.onclick = () => window.location.href = '/hatem';
        navButtons.appendChild(cartBtn);

        // Add Logout button
        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = 'Logout';
        logoutBtn.onclick = () => {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userType');
            window.location.href = '/';
        };
        navButtons.appendChild(logoutBtn);

        // Add Store Ordering button for admin
        if (userType === 'admin') {
            const storeOrderingBtn = document.createElement('button');
            storeOrderingBtn.textContent = 'Store Ordering';
            storeOrderingBtn.onclick = () => window.location.href = '/storeOrdering';
            navButtons.appendChild(storeOrderingBtn);
        }
    } else {
        // Add Login button
        const loginBtn = document.createElement('button');
        loginBtn.textContent = 'Login';
        loginBtn.onclick = () => window.location.href = '/login';
        navButtons.appendChild(loginBtn);

        // Add Sign up button
        const signupBtn = document.createElement('button');
        signupBtn.textContent = 'Sign up';
        signupBtn.onclick = () => window.location.href = '/signup';
        navButtons.appendChild(signupBtn);
    }
});

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