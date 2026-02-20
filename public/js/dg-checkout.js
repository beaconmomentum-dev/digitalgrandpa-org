// /home/greyobqa/digitalgrandpa.org/js/dg-checkout.js
// Digital Grandpa on-site Stripe Elements checkout

(function() {
    'use strict';

    // Product pricing in cents
    const PRODUCT_PRICING = {
        'starter-pack': 2497,
        'its-the-little-things': 1497,
        'strategic-rest-protocol': 6700,
        'your-next-chapter': 6700,
        'complete-bundle': 9700,
        'complete-transformation-bundle': 9700,
        'ultimate-collection': 14700
    };

    let stripe = null;
    let elements = null;
    let paymentElement = null;
    let clientSecret = null;

    // Initialize checkout overlay
    function createCheckoutOverlay() {
        if (document.getElementById('dg-checkout-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'dg-checkout-overlay';
        overlay.innerHTML = `
            <div class="dg-checkout-modal">
                <div class="dg-checkout-header">
                    <h3>Secure Checkout</h3>
                    <button class="dg-close-btn" onclick="closeDGCheckout()">&times;</button>
                </div>
                <div class="dg-checkout-content">
                    <div class="dg-customer-info">
                        <input type="email" id="dg-customer-email" placeholder="Email Address" required>
                    </div>
                    <div id="dg-payment-element"></div>
                    <div class="dg-checkout-actions">
                        <button id="dg-pay-button" disabled>Processing...</button>
                        <div id="dg-payment-status"></div>
                    </div>
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #dg-checkout-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                z-index: 10000;
                display: none;
                align-items: center;
                justify-content: center;
            }
            .dg-checkout-modal {
                background: white;
                border-radius: 12px;
                padding: 24px;
                width: 90%;
                max-width: 500px;
                max-height: 90vh;
                overflow-y: auto;
            }
            .dg-checkout-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                border-bottom: 1px solid #eee;
                padding-bottom: 16px;
            }
            .dg-checkout-header h3 {
                margin: 0;
                color: #1a365d;
            }
            .dg-close-btn {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
            }
            .dg-customer-info {
                margin-bottom: 20px;
            }
            #dg-customer-email {
                width: 100%;
                padding: 12px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 16px;
            }
            #dg-payment-element {
                margin-bottom: 20px;
            }
            .dg-checkout-actions {
                text-align: center;
            }
            #dg-pay-button {
                background: #1a365d;
                color: white;
                border: none;
                padding: 12px 32px;
                border-radius: 6px;
                font-size: 16px;
                cursor: pointer;
                width: 100%;
                margin-bottom: 12px;
            }
            #dg-pay-button:disabled {
                background: #ccc;
                cursor: not-allowed;
            }
            #dg-payment-status {
                font-size: 14px;
                margin-top: 8px;
            }
            .dg-status-error {
                color: #e53e3e;
            }
            .dg-status-success {
                color: #38a169;
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(overlay);
    }

    // Show status message
    function showStatus(message, isError = false) {
        const statusEl = document.getElementById('dg-payment-status');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = isError ? 'dg-status-error' : 'dg-status-success';
        }
    }

    // Create payment intent
    async function createPaymentIntent(productSlug, email) {
        const amount = PRODUCT_PRICING[productSlug];
        if (!amount) {
            throw new Error('Invalid product');
        }

        const payload = {
            amount: amount,
            currency: 'usd',
            email: email,
            product: productSlug,
            product_id: productSlug,
            action: 'create_payment_intent'
        };

        const response = await fetch('/api/create_intent.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        if (!data.clientSecret || !data.publishableKey) {
            throw new Error('Invalid response from payment API');
        }

        return data;
    }

    // Initialize Stripe Elements
    async function initializeStripeElements(clientSecret, publishableKey) {
        if (!window.Stripe) {
            throw new Error('Stripe.js not loaded');
        }

        stripe = window.Stripe(publishableKey);
        
        const appearance = {
            theme: 'stripe',
            variables: {
                colorPrimary: '#1a365d'
            }
        };

        elements = stripe.elements({
            clientSecret: clientSecret,
            appearance: appearance
        });

        paymentElement = elements.create('payment');
        paymentElement.mount('#dg-payment-element');

        // Enable pay button when ready
        paymentElement.on('ready', () => {
            const payButton = document.getElementById('dg-pay-button');
            if (payButton) {
                payButton.disabled = false;
                payButton.textContent = 'Complete Payment';
            }
        });

        return { stripe, elements, paymentElement };
    }

    // Process payment
    async function processPayment(productSlug) {
        if (!stripe || !elements) {
            throw new Error('Payment system not initialized');
        }

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/success.html?product=${productSlug}`
            },
            redirect: 'if_required'
        });

        if (error) {
            throw new Error(error.message);
        }

        // If we get here, payment succeeded without redirect
        showStatus('Payment successful! Redirecting...', false);
        setTimeout(() => {
            window.location.href = `/success.html?product=${productSlug}`;
        }, 1000);
    }

    // Main purchase function
    window.purchaseProduct = async function(productSlug) {
        try {
            createCheckoutOverlay();
            
            const overlay = document.getElementById('dg-checkout-overlay');
            overlay.style.display = 'flex';

            const emailInput = document.getElementById('dg-customer-email');
            const payButton = document.getElementById('dg-pay-button');

            // Reset state
            showStatus('Enter your email and payment details', false);
            payButton.disabled = true;
            payButton.textContent = 'Processing...';

            // Wait for email input
            emailInput.addEventListener('input', async function() {
                const email = emailInput.value.trim();
                if (email && email.includes('@')) {
                    try {
                        showStatus('Preparing secure checkout...', false);
                        
                        const { clientSecret, publishableKey } = await createPaymentIntent(productSlug, email);
                        await initializeStripeElements(clientSecret, publishableKey);
                        
                        showStatus('Enter your payment details below', false);
                        
                        // Set up pay button
                        payButton.onclick = async () => {
                            try {
                                payButton.disabled = true;
                                payButton.textContent = 'Processing...';
                                showStatus('Processing payment...', false);
                                
                                await processPayment(productSlug);
                            } catch (error) {
                                console.error('Payment error:', error);
                                showStatus(error.message, true);
                                payButton.disabled = false;
                                payButton.textContent = 'Complete Payment';
                            }
                        };
                    } catch (error) {
                        console.error('Setup error:', error);
                        showStatus(error.message, true);
                    }
                }
            }, { once: true });

        } catch (error) {
            console.error('Purchase error:', error);
            showStatus(error.message, true);
        }
    };

    // Close checkout
    window.closeDGCheckout = function() {
        const overlay = document.getElementById('dg-checkout-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    };

    // Auto-bind to buttons with data-product-id
    document.addEventListener('DOMContentLoaded', function() {
        const buyButtons = document.querySelectorAll('.btn-buy[data-product-id]');
        buyButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const productId = this.getAttribute('data-product-id');
                if (productId) {
                    window.purchaseProduct(productId);
                }
            });
        });
    });

})();

