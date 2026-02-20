// ===== DIGITAL GRANDPA STRIPE CHECKOUT =====

// Initialize Stripe with your publishable key
const stripe = Stripe('pk_live_51RjtIrDFEVzZYTxcyp4Jua9LazdFqJrf8zAT9vJGbb3zAlrCrtlk9KDmaKNpotOTB2gRg3yk29vjOBj75W0lubWk00GahhAOFr');

// Create an instance of Elements
const elements = stripe.elements({
    appearance: {
        theme: 'stripe',
        variables: {
            colorPrimary: '#d4af37',
            colorBackground: '#ffffff',
            colorText: '#1a2332',
            colorDanger: '#dc2626',
            fontFamily: 'Georgia, serif',
            spacingUnit: '4px',
            borderRadius: '8px'
        }
    }
});

// Create and mount the card element
const cardElement = elements.create('card', {
    style: {
        base: {
            fontSize: '16px',
            color: '#1a2332',
            fontFamily: 'Georgia, serif',
            '::placeholder': {
                color: '#6b7280',
            },
        },
        invalid: {
            color: '#dc2626',
            iconColor: '#dc2626'
        }
    }
});

// Product configuration - easily expandable for multiple products
const PRODUCTS = {
    'power-pack': {
        name: 'The Power Pack',
        description: 'Hard-won wisdom from a life lived fully. Digital download with lifetime access to frameworks that actually work.',
        price: 9700, // Price in cents
        displayPrice: '$97.00'
    },
    'life-navigation': {
        name: 'Life Navigation System',
        description: 'Complete guidance system for life\'s toughest challenges. Step-by-step roadmap from breakdown to breakthrough.',
        price: 19700,
        displayPrice: '$197.00'
    },
    'rebuilding-tools': {
        name: 'Rebuilding Toolkit',
        description: 'Practical tools for starting over when starting over seems impossible. Real methods for real problems.',
        price: 14700,
        displayPrice: '$147.00'
    },
    'fellowship-access': {
        name: 'Rise & Reclaim Fellowship',
        description: 'Monthly access to our private fellowship of rebuilders. Connect with others who understand the journey.',
        price: 4700,
        displayPrice: '$47.00'
    },
    'one-on-one': {
        name: '1-on-1 Mentoring Session',
        description: 'Personal guidance session with Digital Grandpa. 90 minutes of focused attention on your specific situation.',
        price: 29700,
        displayPrice: '$297.00'
    },
    'from-ashes-book': {
        name: 'From Ashes to Wisdom (Digital)',
        description: 'The complete story of falling from success to starting over, and the wisdom learned along the way.',
        price: 2900,
        displayPrice: '$29.00'
    }
};

// Global variables
let currentProduct = null;
let paymentForm = null;
let submitButton = null;

// Initialize the checkout page
document.addEventListener('DOMContentLoaded', function() {
    initializeCheckout();
    setupEventListeners();
});

function initializeCheckout() {
    // Get product from URL parameter or default to power-pack
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('product') || 'power-pack';
    
    // Set current product
    currentProduct = PRODUCTS[productId] || PRODUCTS['power-pack'];
    
    // Display product information
    displayProductInfo();
    
    // Mount Stripe card element
    cardElement.mount('#card-element');
    
    // Get form references
    paymentForm = document.getElementById('payment-form');
    submitButton = document.getElementById('submit-button');
    
    // Handle real-time validation errors from the card Element
    cardElement.on('change', ({error}) => {
        const displayError = document.getElementById('card-errors');
        if (error) {
            displayError.textContent = error.message;
        } else {
            displayError.textContent = '';
        }
    });
}

function displayProductInfo() {
    const productItem = document.getElementById('productItem');
    const subtotal = document.getElementById('subtotal');
    const total = document.getElementById('total');
    
    if (productItem && currentProduct) {
        productItem.innerHTML = `
            <div class="product-name">${currentProduct.name}</div>
            <div class="product-description">${currentProduct.description}</div>
            <div class="product-price">${currentProduct.displayPrice}</div>
        `;
        
        subtotal.textContent = currentProduct.displayPrice;
        total.textContent = currentProduct.displayPrice;
    }
}

function setupEventListeners() {
    // Handle form submission
    if (paymentForm) {
        paymentForm.addEventListener('submit', handleSubmit);
    }
    
    // Handle success modal actions
    window.goToProduct = function() {
        // Redirect to product access page or download
        window.location.href = '/access?product=' + getProductSlug(currentProduct.name);
    };
    
    window.goHome = function() {
        window.location.href = '/';
    };
}

async function handleSubmit(event) {
    event.preventDefault();
    
    // Validate form fields
    if (!validateForm()) {
        return;
    }
    
    // Show loading state
    setLoading(true);
    
    try {
        // Get customer information
        const customerName = document.getElementById('customer-name').value.trim();
        const customerEmail = document.getElementById('customer-email').value.trim();
        
        // Create payment intent on the server
        const response = await fetch('/create-payment-intent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                productId: getProductIdFromName(currentProduct.name),
                productName: currentProduct.name,
                amount: currentProduct.price,
                customerName: customerName,
                customerEmail: customerEmail
            }),
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const { clientSecret, paymentIntentId } = await response.json();
        
        // Confirm the payment with Stripe
        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardElement,
                billing_details: {
                    name: customerName,
                    email: customerEmail,
                },
            }
        });
        
        if (error) {
            // Show error to customer
            showError(error.message);
            setLoading(false);
        } else if (paymentIntent.status === 'succeeded') {
            //