/**
 * Digital Grandpa Weekly Giveback - Stripe Payment Integration
 * Handles secure payment processing for supporter appreciation system
 */

class StripePaymentHandler {
    constructor(publishableKey) {
        this.stripe = null;
        this.elements = null;
        this.card = null;
        this.publishableKey = publishableKey;
        this.isProcessing = false;
        
        this.init();
    }

    async init() {
        try {
            // Initialize Stripe
            this.stripe = Stripe(this.publishableKey);
            console.log('💳 Stripe initialized successfully');
            
            // Setup payment elements if needed
            this.setupPaymentElements();
            
        } catch (error) {
            console.error('❌ Stripe initialization failed:', error);
            this.handleStripeError(error);
        }
    }

    setupPaymentElements() {
        // Create Elements instance
        this.elements = this.stripe.elements({
            appearance: {
                theme: 'stripe',
                variables: {
                    colorPrimary: '#ff6b35',
                    colorBackground: '#ffffff',
                    colorText: '#2c3e50',
                    colorDanger: '#dc3545',
                    fontFamily: 'system-ui, sans-serif',
                    spacingUnit: '4px',
                    borderRadius: '12px'
                },
                rules: {
                    '.Input': {
                        border: '2px solid #e0e0e0',
                        padding: '12px',
                        fontSize: '16px'
                    },
                    '.Input:focus': {
                        borderColor: '#ff6b35',
                        boxShadow: '0 0 0 3px rgba(255, 107, 53, 0.1)'
                    }
                }
            }
        });

        console.log('🎨 Stripe Elements configured');
    }

    /**
     * Create payment intent on the server
     */
    async createPaymentIntent(supportData) {
        try {
            const response = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    amount: supportData.amount * 100, // Convert to cents
                    currency: 'usd',
                    automatic_payment_methods: {
                        enabled: true,
                    },
                    metadata: {
                        supporter_name: supportData.name,
                        supporter_email: supportData.email,
                        include_in_drawing: supportData.includeInDrawing.toString(),
                        source: 'weekly_giveback',
                        timestamp: supportData.timestamp
                    },
                    description: `Digital Grandpa Weekly Giveback - $${supportData.amount} support from ${supportData.name}`,
                    receipt_email: supportData.email
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create payment intent');
            }

            const data = await response.json();
            console.log('✅ Payment intent created:', data.id);
            
            return data;

        } catch (error) {
            console.error('❌ Payment intent creation failed:', error);
            throw error;
        }
    }

    /**
     * Process payment using Stripe Payment Links (recommended for simplicity)
     */
    async processPaymentWithLink(supportData) {
        try {
            // Create payment link on server
            const response = await fetch('/api/create-payment-link', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: supportData.amount,
                    supporter_name: supportData.name,
                    supporter_email: supportData.email,
                    include_in_drawing: supportData.includeInDrawing,
                    return_url: `${window.location.origin}/thank-you.html?source=weekly_giveback&amount=${supportData.amount}`
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create payment link');
            }

            const { payment_link_url } = await response.json();
            
            // Redirect to Stripe payment page
            window.location.href = payment_link_url;
            
        } catch (error) {
            console.error('❌ Payment link creation failed:', error);
            throw error;
        }
    }

    /**
     * Process payment using Stripe Elements (for embedded experience)
     */
    async processPaymentWithElements(supportData, paymentIntent) {
        try {
            this.isProcessing = true;

            // Confirm payment with Stripe
            const { error, paymentIntent: confirmedPaymentIntent } = await this.stripe.confirmPayment({
                elements: this.elements,
                confirmParams: {
                    return_url: `${window.location.origin}/thank-you.html?source=weekly_giveback`,
                    payment_method_data: {
                        billing_details: {
                            name: supportData.name,
                            email: supportData.email,
                        }
                    }
                },
                redirect: 'if_required'
            });

            if (error) {
                console.error('❌ Payment confirmation failed:', error);
                throw error;
            }

            if (confirmedPaymentIntent.status === 'succeeded') {
                console.log('✅ Payment succeeded:', confirmedPaymentIntent.id);
                return {
                    success: true,
                    paymentIntent: confirmedPaymentIntent
                };
            } else {
                throw new Error(`Payment status: ${confirmedPaymentIntent.status}`);
            }

        } catch (error) {
            console.error('❌ Payment processing failed:', error);
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Handle one-time payment for weekly giveback
     */
    async processOneTimePayment(supportData) {
        try {
            console.log('🚀 Processing one-time payment:', supportData);

            // Validate support data
            this.validateSupportData(supportData);

            // For simplicity, use Payment Links (recommended by Stripe for one-time payments)
            await this.processPaymentWithLink(supportData);

        } catch (error) {
            console.error('❌ One-time payment failed:', error);
            this.handlePaymentError(error);
            throw error;
        }
    }

    /**
     * Validate support data before processing
     */
    validateSupportData(data) {
        const errors = [];

        if (!data.name || data.name.trim().length < 2) {
            errors.push('Valid name is required');
        }

        if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            errors.push('Valid email address is required');
        }

        if (!data.amount || data.amount < 25 || data.amount > 500) {
            errors.push('Support amount must be between $25 and $500');
        }

        if (errors.length > 0) {
            throw new Error(errors.join(', '));
        }
    }

    /**
     * Handle Stripe-specific errors
     */
    handleStripeError(error) {
        let message = 'An unexpected error occurred.';

        switch (error.type) {
            case 'card_error':
                message = error.message;
                break;
            case 'validation_error':
                message = error.message;
                break;
            case 'invalid_request_error':
                message = 'Invalid payment request. Please try again.';
                break;
            case 'api_connection_error':
                message = 'Network error. Please check your connection and try again.';
                break;
            case 'api_error':
                message = 'Payment service temporarily unavailable. Please try again later.';
                break;
            case 'authentication_error':
                message = 'Payment authentication failed. Please contact support.';
                break;
            case 'rate_limit_error':
                message = 'Too many requests. Please wait a moment and try again.';
                break;
            default:
                message = error.message || 'Payment processing failed. Please try again.';
        }

        console.error('💳 Stripe error:', error);
        return message;
    }

    /**
     * Handle payment errors with user-friendly messages
     */
    handlePaymentError(error) {
        const errorMessage = this.handleStripeError(error);
        
        // Show error to user
        this.showErrorNotification(errorMessage);
        
        // Track error for analytics
        this.trackPaymentError(error);
    }

    /**
     * Show error notification to user
     */
    showErrorNotification(message) {
        // Create error notification element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'payment-error-notification';
        errorDiv.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #dc3545, #c82333);
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 12px;
                margin: 1rem 0;
                text-align: center;
                box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
                animation: slideInDown 0.3s ease;
            ">
                <div style="font-weight: 700; margin-bottom: 0.5rem;">
                    ⚠️ Payment Error
                </div>
                <div style="font-size: 0.95rem;">
                    ${message}
                </div>
            </div>
        `;

        // Insert error before form
        const form = document.getElementById('supportForm');
        if (form) {
            form.insertBefore(errorDiv, form.firstChild);

            // Remove error after 8 seconds
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.remove();
                }
            }, 8000);
        }
    }

    /**
     * Track payment errors for analytics
     */
    trackPaymentError(error) {
        const errorData = {
            type: 'payment_error',
            error_type: error.type || 'unknown',
            error_code: error.code || 'unknown',
            error_message: error.message || 'Unknown error',
            timestamp: Date.now(),
            page: 'weekly_giveback'
        };

        console.log('📊 Payment error tracked:', errorData);

        // Send to analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'payment_error', {
                event_category: 'Weekly_Giveback',
                event_label: error.type || 'unknown',
                value: 0
            });
        }
    }

    /**
     * Track successful payment
     */
    trackPaymentSuccess(paymentData) {
        const successData = {
            type: 'payment_success',
            amount: paymentData.amount,
            payment_intent_id: paymentData.paymentIntent?.id,
            timestamp: Date.now(),
            page: 'weekly_giveback'
        };

        console.log('📊 Payment success tracked:', successData);

        // Send to analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'purchase', {
                transaction_id: paymentData.paymentIntent?.id,
                value: paymentData.amount,
                currency: 'USD',
                event_category: 'Weekly_Giveback'
            });
        }
    }

    /**
     * Get payment status from URL parameters (for return from Stripe)
     */
    getPaymentStatusFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            payment_intent: urlParams.get('payment_intent'),
            payment_intent_client_secret: urlParams.get('payment_intent_client_secret'),
            redirect_status: urlParams.get('redirect_status')
        };
    }

    /**
     * Handle return from Stripe payment page
     */
    async handlePaymentReturn() {
        const { payment_intent, payment_intent_client_secret, redirect_status } = this.getPaymentStatusFromURL();

        if (payment_intent && payment_intent_client_secret) {
            try {
                const { paymentIntent } = await this.stripe.retrievePaymentIntent(payment_intent_client_secret);
                
                switch (paymentIntent.status) {
                    case 'succeeded':
                        console.log('✅ Payment succeeded on return');
                        this.trackPaymentSuccess({ 
                            amount: paymentIntent.amount / 100,
                            paymentIntent 
                        });
                        break;
                    case 'processing':
                        console.log('⏳ Payment processing');
                        break;
                    case 'requires_payment_method':
                        console.log('❌ Payment failed');
                        this.handlePaymentError(new Error('Payment failed. Please try again.'));
                        break;
                    default:
                        console.log('❓ Unknown payment status:', paymentIntent.status);
                        break;
                }
            } catch (error) {
                console.error('❌ Error retrieving payment intent:', error);
                this.handlePaymentError(error);
            }
        }
    }
}

/**
 * Server-side API endpoints (Node.js/Express example)
 * These would be implemented on your backend
 */
const serverAPIExamples = {
    /**
     * Create Payment Intent endpoint
     */
    createPaymentIntent: `
        // POST /api/create-payment-intent
        app.post('/api/create-payment-intent', async (req, res) => {
            try {
                const { amount, currency, metadata, description, receipt_email } = req.body;
                
                const paymentIntent = await stripe.paymentIntents.create({
                    amount,
                    currency,
                    metadata,
                    description,
                    receipt_email,
                    automatic_payment_methods: {
                        enabled: true,
                    },
                });
                
                res.json({
                    id: paymentIntent.id,
                    client_secret: paymentIntent.client_secret,
                    amount: paymentIntent.amount,
                    status: paymentIntent.status
                });
                
            } catch (error) {
                console.error('Payment intent creation failed:', error);
                res.status(400).json({ error: error.message });
            }
        });
    `,

    /**
     * Create Payment Link endpoint
     */
    createPaymentLink: `
        // POST /api/create-payment-link
        app.post('/api/create-payment-link', async (req, res) => {
            try {
                const { amount, supporter_name, supporter_email, include_in_drawing, return_url } = req.body;
                
                const paymentLink = await stripe.paymentLinks.create({
                    line_items: [{
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: 'Digital Grandpa Weekly Giveback Support',
                                description: \`Support from \${supporter_name} - Weekly Giveback Program\`,
                            },
                            unit_amount: amount * 100,
                        },
                        quantity: 1,
                    }],
                    after_completion: {
                        type: 'redirect',
                        redirect: {
                            url: return_url
                        }
                    },
                    metadata: {
                        supporter_name,
                        supporter_email,
                        include_in_drawing: include_in_drawing.toString(),
                        source: 'weekly_giveback'
                    },
                    customer_creation: 'always',
                    invoice_creation: {
                        enabled: true,
                        invoice_data: {
                            description: 'Digital Grandpa Weekly Giveback Support',
                            metadata: {
                                supporter_name,
                                include_in_drawing: include_in_drawing.toString()
                            }
                        }
                    }
                });
                
                res.json({
                    payment_link_url: paymentLink.url,
                    payment_link_id: paymentLink.id
                });
                
            } catch (error) {
                console.error('Payment link creation failed:', error);
                res.status(400).json({ error: error.message });
            }
        });
    `,

    /**
     * Webhook handler for payment events
     */
    webhookHandler: `
        // POST /api/stripe-webhook
        app.post('/api/stripe-webhook', express.raw({type: 'application/json'}), (req, res) => {
            const sig = req.headers['stripe-signature'];
            let event;
            
            try {
                event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
            } catch (err) {
                console.error('Webhook signature verification failed:', err.message);
                return res.status(400).send(\`Webhook Error: \${err.message}\`);
            }
            
            // Handle the event
            switch (event.type) {
                case 'payment_intent.succeeded':
                    const paymentIntent = event.data.object;
                    console.log('Payment succeeded:', paymentIntent.id);
                    
                    // Send to GHL
                    sendToGHL({
                        email: paymentIntent.metadata.supporter_email,
                        name: paymentIntent.metadata.supporter_name,
                        amount: paymentIntent.amount / 100,
                        include_in_drawing: paymentIntent.metadata.include_in_drawing === 'true',
                        payment_id: paymentIntent.id
                    });
                    
                    break;
                    
                case 'payment_intent.payment_failed':
                    const failedPayment = event.data.object;
                    console.log('Payment failed:', failedPayment.id);
                    break;
                    
                default:
                    console.log(\`Unhandled event type \${event.type}\`);
            }
            
            res.json({received: true});
        });
    `
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StripePaymentHandler, serverAPIExamples };
} else {
    window.StripePaymentHandler = StripePaymentHandler;
}

console.log('💳 Stripe Payment Integration loaded');

