// Digital Grandpa Stripe Checkout Integration - Final Version
// Gets publishable key dynamically from the API

class DigitalGrandpaCheckout {
    constructor() {
        this.stripe = null;
        this.elements = null;
        this.paymentElement = null;
        this.currentModal = null;
        this.publishableKey = null;
        this.init();
    }

    async init() {
        // Get publishable key from API
        try {
            const response = await fetch('/api/create_intent.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    price_id: 'dg_little_things',
                    email: 'test@example.com',
                    get_key_only: true
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.publishableKey = data.publishable_key;
            }
        } catch (error) {
            console.error('Failed to get publishable key:', error);
            // Fallback to hardcoded key if needed
            this.publishableKey = 'pk_live_51QzrpkH6KvLUAe7qYXXVhQ9S0gN2fa2bKaAhRA7ifGzPTMpSts2C74Phc5JwlK98Kd3XcVNMMCQrnWKFDP2w7XKu00qGk1aBv6';
        }

        if (this.publishableKey) {
            this.stripe = Stripe(this.publishableKey);
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        // Listen for purchase button clicks
        document.addEventListener('click', (e) => {
            // Handle buttons with data-price-id
            if (e.target.matches('[data-price-id]')) {
                e.preventDefault();
                const priceId = e.target.getAttribute('data-price-id');
                const productName = e.target.getAttribute('data-product-name') || 'Digital Grandpa Product';
                this.openCheckout(priceId, productName);
                return;
            }

            // Handle specific Digital Grandpa buttons by text content
            const buttonText = e.target.textContent.trim();
            let priceId = null;
            let productName = '';

            if (buttonText.includes('Start Small') || buttonText.includes('$14.97')) {
                priceId = 'dg_little_things';
                productName = "It's the Little Things";
            } else if (buttonText.includes('Rest First') || buttonText.includes('$67')) {
                priceId = 'dg_rest_protocol';
                productName = 'Strategic Rest Protocol';
            } else if (buttonText.includes('Rebuild Now') || buttonText.includes('Your Next Chapter')) {
                priceId = 'dg_next_chapter';
                productName = 'Your Next Chapter';
            } else if (buttonText.includes('Start Your Journey') || buttonText.includes('$24.97')) {
                priceId = 'dg_starter_pack';
                productName = 'Rise & Reclaim Starter Pack';
            } else if (buttonText.includes('Complete System') || buttonText.includes('$97')) {
                priceId = 'dg_complete_bundle';
                productName = 'Complete Transformation Bundle';
            } else if (buttonText.includes('Everything') || buttonText.includes('$147')) {
                priceId = 'dg_ultimate_collection';
                productName = 'Ultimate Rebuilder Collection';
            }

            if (priceId) {
                e.preventDefault();
                this.openCheckout(priceId, productName);
            }
        });
    }

    async openCheckout(priceId, productName) {
        // Create modal
        this.createModal(productName);
        
        try {
            // Show loading state
            this.showLoading();
            
            // Get email from any form on the page
            const email = this.getEmailFromPage();
            
            // Create payment intent
            const response = await fetch('/api/create_intent.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    price_id: priceId,
                    email: email
                })
            });

            if (!response.ok) {
                throw new Error('Payment setup failed');
            }

            const { client_secret, amount } = await response.json();
            
            // Create Stripe Elements
            this.elements = this.stripe.elements({
                clientSecret: client_secret,
                appearance: {
                    theme: 'stripe',
                    variables: {
                        colorPrimary: '#0570de',
                        colorBackground: '#ffffff',
                        colorText: '#30313d',
                        colorDanger: '#df1b41',
                        fontFamily: 'Ideal Sans, system-ui, sans-serif',
                        spacingUnit: '2px',
                        borderRadius: '4px',
                    }
                }
            });

            // Create payment element
            this.paymentElement = this.elements.create('payment');
            this.paymentElement.mount('#payment-element');

            // Show form
            this.showForm(amount);

        } catch (error) {
            console.error('Checkout error:', error);
            this.showError('Failed to initialize checkout. Please try again.');
        }
    }

    createModal(productName) {
        // Remove existing modal
        if (this.currentModal) {
            this.currentModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'dg-checkout-modal';
        modal.innerHTML = `
            <div class="dg-checkout-overlay">
                <div class="dg-checkout-content">
                    <div class="dg-checkout-header">
                        <h3>🔒 Secure Checkout</h3>
                        <button class="dg-close-btn" onclick="dgCheckout.closeModal()">&times;</button>
                    </div>
                    <div class="dg-checkout-body">
                        <div class="dg-product-info">
                            <h4>${productName}</h4>
                            <p>Digital Grandpa Transformation Guide</p>
                        </div>
                        <div id="dg-checkout-loading" class="dg-loading-state">
                            <div class="dg-spinner"></div>
                            <p>Setting up secure checkout...</p>
                        </div>
                        <div id="dg-checkout-form" class="dg-checkout-form" style="display: none;">
                            <div id="payment-element"></div>
                            <div class="dg-form-actions">
                                <button id="dg-submit-payment" class="dg-submit-btn">
                                    Complete Purchase
                                </button>
                            </div>
                        </div>
                        <div id="dg-checkout-error" class="dg-error-state" style="display: none;">
                            <p class="dg-error-message"></p>
                            <button onclick="dgCheckout.closeModal()" class="dg-retry-btn">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.currentModal = modal;

        // Setup form submission
        modal.querySelector('#dg-submit-payment').addEventListener('click', () => {
            this.submitPayment();
        });

        // Add styles if not already present
        if (!document.querySelector('#dg-checkout-styles')) {
            this.addStyles();
        }
    }

    addStyles() {
        const styles = document.createElement('style');
        styles.id = 'dg-checkout-styles';
        styles.textContent = `
            .dg-checkout-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
            }

            .dg-checkout-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }

            .dg-checkout-content {
                background: white;
                border-radius: 8px;
                max-width: 500px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            }

            .dg-checkout-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid #eee;
                background: #f8f9fa;
            }

            .dg-checkout-header h3 {
                margin: 0;
                color: #333;
                font-size: 18px;
            }

            .dg-close-btn {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .dg-checkout-body {
                padding: 20px;
            }

            .dg-product-info h4 {
                margin: 0 0 5px 0;
                color: #333;
                font-size: 16px;
            }

            .dg-product-info p {
                margin: 0 0 20px 0;
                color: #666;
                font-size: 14px;
            }

            .dg-loading-state {
                text-align: center;
                padding: 40px 20px;
            }

            .dg-spinner {
                border: 3px solid #f3f3f3;
                border-top: 3px solid #0570de;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                animation: dg-spin 1s linear infinite;
                margin: 0 auto 15px;
            }

            @keyframes dg-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .dg-checkout-form {
                margin-top: 20px;
            }

            #payment-element {
                margin-bottom: 20px;
            }

            .dg-form-actions {
                text-align: center;
            }

            .dg-submit-btn {
                background: #0570de;
                color: white;
                border: none;
                padding: 12px 30px;
                border-radius: 4px;
                font-size: 16px;
                cursor: pointer;
                width: 100%;
                font-weight: 600;
            }

            .dg-submit-btn:hover {
                background: #0461c7;
            }

            .dg-submit-btn:disabled {
                background: #ccc;
                cursor: not-allowed;
            }

            .dg-error-state {
                text-align: center;
                padding: 20px;
            }

            .dg-error-message {
                color: #df1b41;
                margin-bottom: 15px;
            }

            .dg-retry-btn {
                background: #666;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
            }
        `;
        document.head.appendChild(styles);
    }

    showLoading() {
        document.getElementById('dg-checkout-loading').style.display = 'block';
        document.getElementById('dg-checkout-form').style.display = 'none';
        document.getElementById('dg-checkout-error').style.display = 'none';
    }

    showForm(amount) {
        document.getElementById('dg-checkout-loading').style.display = 'none';
        document.getElementById('dg-checkout-form').style.display = 'block';
        document.getElementById('dg-checkout-error').style.display = 'none';
    }

    showError(message) {
        document.getElementById('dg-checkout-loading').style.display = 'none';
        document.getElementById('dg-checkout-form').style.display = 'none';
        document.getElementById('dg-checkout-error').style.display = 'block';
        document.querySelector('.dg-error-message').textContent = message;
    }

    async submitPayment() {
        const submitBtn = document.getElementById('dg-submit-payment');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';

        try {
            const { error } = await this.stripe.confirmPayment({
                elements: this.elements,
                confirmParams: {
                    return_url: window.location.origin + '/success.html',
                },
            });

            if (error) {
                this.showError(error.message);
            }
        } catch (err) {
            this.showError('Payment failed. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Complete Purchase';
        }
    }

    closeModal() {
        if (this.currentModal) {
            this.currentModal.remove();
            this.currentModal = null;
        }
    }

    getEmailFromPage() {
        // Try to get email from any form on the page
        const emailInputs = document.querySelectorAll('input[type="email"], input[name*="email"]');
        for (let input of emailInputs) {
            if (input.value) {
                return input.value;
            }
        }
        return 'customer@digitalgrandpa.org';
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dgCheckout = new DigitalGrandpaCheckout();
});

