// ===== DIGITAL GRANDPA STRIPE BACKEND (Node.js) =====

const express = require('express');
const stripe = require('stripe')('STRIPE_SECRET_KEY_PLACEHOLDER');
const cors = require('cors');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://js.stripe.com"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.stripe.com"],
            frameSrc: ["https://js.stripe.com", "https://hooks.stripe.com"]
        }
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Stricter rate limiting for payment endpoints
const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 payment attempts per windowMs
    message: 'Too many payment attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'https://digitalgrandpa.org'],
    credentials: true
}));

// Body parsing middleware
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// GoHighLevel webhook configuration
const GHL_WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/xiByhBN0HkemBQ3gLZxB/webhook-trigger/710239a7-39fa-4367-b0e8-096ef4c0341c';

// Product configuration (must match frontend)
const PRODUCTS = {
    'power-pack': {
        name: 'The Power Pack',
        price: 9700, // Price in cents
        description: 'Hard-won wisdom from a life lived fully'
    },
    'life-navigation': {
        name: 'Life Navigation System',
        price: 19700,
        description: 'Complete guidance system for life\'s challenges'
    },
    'rebuilding-tools': {
        name: 'Rebuilding Toolkit',
        price: 14700,
        description: 'Practical tools for starting over'
    },
    'fellowship-access': {
        name: 'Rise & Reclaim Fellowship',
        price: 4700,
        description: 'Monthly access to rebuilder fellowship'
    },
    'one-on-one': {
        name: '1-on-1 Mentoring Session',
        price: 29700,
        description: 'Personal guidance with Digital Grandpa'
    },
    'from-ashes-book': {
        name: 'From Ashes to Wisdom (Digital)',
        price: 2900,
        description: 'Digital book - the complete story'
    }
};

// ===== ROUTES =====

// Serve checkout page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Create payment intent
app.post('/create-payment-intent', paymentLimiter, async (req, res) => {
    try {
        const { productId, productName, amount, customerName, customerEmail } = req.body;
        
        // Validate input
        if (!productId || !customerName || !customerEmail || !amount) {
            return res.status(400).json({ 
                error: 'Missing required fields: productId, customerName, customerEmail, amount' 
            });
        }
        
        // Validate product exists and amount matches
        const product = PRODUCTS[productId];
        if (!product) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }
        
        if (product.price !== amount) {
            return res.status(400).json({ error: 'Amount mismatch' });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customerEmail)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        
        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'usd',
            metadata: {
                productId: productId,
                productName: productName || product.name,
                customerName: customerName,
                customerEmail: customerEmail,
                source: 'digitalgrandpa_checkout'
            },
            receipt_email: customerEmail,
            description: `Digital Grandpa - ${product.name}`,
            statement_descriptor: 'DIGITAL GRANDPA',
            statement_descriptor_suffix: productId.toUpperCase().substring(0, 10)
        });
        
        console.log(`Payment intent created: ${paymentIntent.id} for ${customerEmail}`);
        
        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
        
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ 
            error: 'Failed to create payment intent',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Handle successful payment and trigger webhook
app.post('/payment-success', async (req, res) => {
    try {
        const { 
            paymentIntentId, 
            transactionId, 
            customerName, 
            customerEmail, 
            productName, 
            amount,
            currency = 'usd'
        } = req.body;
        
        // Validate required fields
        if (!paymentIntentId || !customerName || !customerEmail || !productName) {
            return res.status(400).json({ 
                error: 'Missing required fields for payment success processing' 
            });
        }
        
        // Verify payment intent with Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({ 
                error: 'Payment not confirmed as successful' 
            });
        }
        
        // Prepare webhook data for GoHighLevel
        const webhookData = {
            customerName: customerName,
            customerEmail: customerEmail,
            transactionId: transactionId || paymentIntentId,
            productName: productName,
            amount: formatCurrency(amount, currency),
            amountCents: amount,
            currency: currency.toUpperCase(),
            paymentDate: new Date().toISOString(),
            source: 'digitalgrandpa_stripe',
            paymentStatus: 'completed',
            metadata: {
                stripePaymentIntentId: paymentIntentId,
                customerIP: req.ip,
                userAgent: req.get('User-Agent'),
                timestamp: Date.now()
            }
        };
        
        console.log(`Processing successful payment: ${paymentIntentId} for ${customerEmail}`);
        
        // Send webhook to GoHighLevel
        try {
            const webhookResponse = await sendGHLWebhook(webhookData);
            console.log(`GHL webhook sent successfully for ${paymentIntentId}`);
            
            res.json({
                success: true,
                message: 'Payment processed successfully',
                transactionId: paymentIntentId,
                webhookStatus: 'sent'
            });
            
        } catch (webhookError) {
            console.error('GHL webhook failed:', webhookError.message);
            
            // Still return success since payment went through
            res.json({
                success: true,
                message: 'Payment processed successfully',
                transactionId: paymentIntentId,
                webhookStatus: 'failed',
                note: 'Payment completed but notification delivery failed'
            });
        }
        
    } catch (error) {
        console.error('Error processing payment success:', error);
        res.status(500).json({ 
            error: 'Failed to process payment success',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Stripe webhook endpoint for additional verification
app.post('/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    
    try {
        // Verify webhook signature (add your webhook secret if using)
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (webhookSecret) {
            event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } else {
            event = JSON.parse(req.body.toString());
        }
        
        console.log(`Stripe webhook received: ${event.type}`);
        
        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                console.log(`Payment succeeded: ${paymentIntent.id}`);
                
                // Additional processing if needed
                await handlePaymentIntentSucceeded(paymentIntent);
                break;
                
            case 'payment_intent.payment_failed':
                const failedPayment = event.data.object;
                console.log(`Payment failed: ${failedPayment.id}`);
                break;
                
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
        
        res.json({ received: true });
        
    } catch (error) {
        console.error('Webhook error:', error.message);
        res.status(400).send(`Webhook Error: ${error.message}`);
    }
});

// ===== HELPER FUNCTIONS =====

async function sendGHLWebhook(data) {
    const maxRetries = 3;
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await axios.post(GHL_WEBHOOK_URL, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'DigitalGrandpa-Stripe/1.0'
                },
                timeout: 10000 // 10 second timeout
            });
            
            if (response.status >= 200 && response.status < 300) {
                console.log(`GHL webhook successful on attempt ${attempt}`);
                return response.data;
            }
            
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            
        } catch (error) {
            lastError = error;
            console.error(`GHL webhook attempt ${attempt} failed:`, error.message);
            
            if (attempt < maxRetries) {
                // Exponential backoff: 1s, 2s, 4s
                const delay = Math.pow(2, attempt - 1) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw new Error(`GHL webhook failed after ${maxRetries} attempts: ${lastError.message}`);
}

async function handlePaymentIntentSucceeded(paymentIntent) {
    // Additional processing for successful payments
    // This runs on Stripe webhook, separate from frontend-triggered success
    
    try {
        const metadata = paymentIntent.metadata;
        
        console.log('Processing payment intent succeeded webhook:', {
            id: paymentIntent.id,
            amount: paymentIntent.amount,
            customer: metadata.customerEmail,
            product: metadata.productName
        });
        
        // You could add additional logic here like:
        // - Send confirmation email
        // - Update internal database
        // - Trigger additional automations
        
    } catch (error) {
        console.error('Error in handlePaymentIntentSucceeded:', error);
    }
}

function formatCurrency(amountInCents, currency = 'usd') {
    const amount = amountInCents / 100;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase()
    }).format(amount);
}

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// ===== SERVER STARTUP =====

app.listen(PORT, () => {
    console.log(`🏮 Digital Grandpa Stripe server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`GHL Webhook URL: ${GHL_WEBHOOK_URL}`);
    
    // Test Stripe connection
    stripe.customers.list({ limit: 1 })
        .then(() => console.log('✅ Stripe connection verified'))
        .catch(err => console.error('❌ Stripe connection failed:', err.message));
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

module.exports = app;