<?php
// ===== DIGITAL GRANDPA STRIPE BACKEND (PHP) =====
// Alternative backend for shared hosting environments

// Security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');

// CORS headers
header('Access-Control-Allow-Origin: https://digitalgrandpa.org');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include Stripe PHP library
require_once 'vendor/autoload.php';

use Stripe\Stripe;
use Stripe\PaymentIntent;
use Stripe\Webhook;

// Configuration
const STRIPE_SECRET_KEY = 'STRIPE_SECRET_KEY_PLACEHOLDER';
const GHL_WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/xiByhBN0HkemBQ3gLZxB/webhook-trigger/710239a7-39fa-4367-b0e8-096ef4c0341c';
const STRIPE_WEBHOOK_SECRET = ''; // Add if using webhook verification

// Initialize Stripe
Stripe::setApiKey(STRIPE_SECRET_KEY);

// Product configuration (must match frontend)
const PRODUCTS = [
    'power-pack' => [
        'name' => 'The Power Pack',
        'price' => 9700, // Price in cents
        'description' => 'Hard-won wisdom from a life lived fully'
    ],
    'life-navigation' => [
        'name' => 'Life Navigation System',
        'price' => 19700,
        'description' => 'Complete guidance system for life\'s challenges'
    ],
    'rebuilding-tools' => [
        'name' => 'Rebuilding Toolkit',
        'price' => 14700,
        'description' => 'Practical tools for starting over'
    ],
    'fellowship-access' => [
        'name' => 'Rise & Reclaim Fellowship',
        'price' => 4700,
        'description' => 'Monthly access to rebuilder fellowship'
    ],
    'one-on-one' => [
        'name' => '1-on-1 Mentoring Session',
        'price' => 29700,
        'description' => 'Personal guidance with Digital Grandpa'
    ],
    'from-ashes-book' => [
        'name' => 'From Ashes to Wisdom (Digital)',
        'price' => 2900,
        'description' => 'Digital book - the complete story'
    ]
];

// Rate limiting (simple implementation)
session_start();
$current_time = time();
$rate_limit_key = 'payment_attempts_' . $_SERVER['REMOTE_ADDR'];

if (!isset($_SESSION[$rate_limit_key])) {
    $_SESSION[$rate_limit_key] = ['count' => 0, 'reset_time' => $current_time + 900]; // 15 minutes
}

$rate_data = $_SESSION[$rate_limit_key];

if ($current_time > $rate_data['reset_time']) {
    $_SESSION[$rate_limit_key] = ['count' => 0, 'reset_time' => $current_time + 900];
    $rate_data = $_SESSION[$rate_limit_key];
}

// Route handling
$request_uri = $_SERVER['REQUEST_URI'];
$request_method = $_SERVER['REQUEST_METHOD'];

try {
    // Parse the request path
    $path = parse_url($request_uri, PHP_URL_PATH);
    
    // Route handling
    if ($request_method === 'POST' && strpos($path, '/create-payment-intent') !== false) {
        handleCreatePaymentIntent();
    } elseif ($request_method === 'POST' && strpos($path, '/payment-success') !== false) {
        handlePaymentSuccess();
    } elseif ($request_method === 'POST' && strpos($path, '/webhook') !== false) {
        handleStripeWebhook();
    } elseif ($request_method === 'GET' && strpos($path, '/health') !== false) {
        handleHealthCheck();
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Not found']);
    }

} catch (Exception $e) {
    error_log('Digital Grandpa Stripe Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Internal server error',
        'message' => 'Something went wrong'
    ]);
}

// ===== ROUTE HANDLERS =====

function handleCreatePaymentIntent() {
    global $rate_data, $rate_limit_key;
    
    // Check rate limit
    if ($rate_data['count'] >= 10) {
        http_response_code(429);
        echo json_encode(['error' => 'Too many payment attempts, please try again later']);
        return;
    }
    
    // Increment rate limit counter
    $_SESSION[$rate_limit_key]['count']++;
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input']);
        return;
    }
    
    // Validate required fields
    $required_fields = ['productId', 'customerName', 'customerEmail', 'amount'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            http_response_code(400);
            echo json_encode(['error' => "Missing required field: {$field}"]);
            return;
        }
    }
    
    $product_id = $input['productId'];
    $customer_name = trim($input['customerName']);
    $customer_email = trim($input['customerEmail']);
    $amount = intval($input['amount']);
    $product_name = $input['productName'] ?? '';
    
    // Validate product
    if (!isset(PRODUCTS[$product_id])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid product ID']);
        return;
    }
    
    $product = PRODUCTS[$product_id];
    
    // Validate amount matches product price
    if ($product['price'] !== $amount) {
        http_response_code(400);
        echo json_encode(['error' => 'Amount mismatch']);
        return;
    }
    
    // Validate email
    if (!filter_var($customer_email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email format']);
        return;
    }
    
    try {
        // Create payment intent
        $payment_intent = PaymentIntent::create([
            'amount' => $amount,
            'currency' => 'usd',
            'metadata' => [
                'productId' => $product_id,
                'productName' => $product_name ?: $product['name'],
                'customerName' => $customer_name,
                'customerEmail' => $customer_email,
                'source' => 'digitalgrandpa_checkout'
            ],
            'receipt_email' => $customer_email,
            'description' => "Digital Grandpa - {$product['name']}",
            'statement_descriptor' => 'DIGITAL GRANDPA',
            'statement_descriptor_suffix' => strtoupper(substr($product_id, 0, 10))
        ]);
        
        error_log("Payment intent created: {$payment_intent->id} for {$customer_email}");
        
        header('Content-Type: application/json');
        echo json_encode([
            'clientSecret' => $payment_intent->client_secret,
            'paymentIntentId' => $payment_intent->id
        ]);
        
    } catch (Exception $e) {
        error_log('Stripe payment intent error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'error' => 'Failed to create payment intent',
            'message' => 'Internal server error'
        ]);
    }
}

function handlePaymentSuccess() {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input']);
        return;
    }
    
    // Validate required fields
    $required_fields = ['paymentIntentId', 'customerName', 'customerEmail', 'productName'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            http_response_code(400);
            echo json_encode(['error' => "Missing required field: {$field}"]);
            return;
        }
    }
    
    $payment_intent_id = $input['paymentIntentId'];
    $transaction_id = $input['transactionId'] ?? $payment_intent_id;
    $customer_name = $input['customerName'];
    $customer_email = $input['customerEmail'];
    $product_name = $input['productName'];
    $amount = $input['amount'] ?? 0;
    $currency = $input['currency'] ?? 'usd';
    
    try {
        // Verify payment intent with Stripe
        $payment_intent = PaymentIntent::retrieve($payment_intent_id);
        
        if ($payment_intent->status !== 'succeeded') {
            http_response_code(400);
            echo json_encode(['error' => 'Payment not confirmed as successful']);
            return;
        }
        
        // Prepare webhook data for GoHighLevel
        $webhook_data = [
            'customerName' => $customer_name,
            'customerEmail' => $customer_email,
            'transactionId' => $transaction_id,
            'productName' => $product_name,
            'amount' => formatCurrency($amount, $currency),
            'amountCents' => $amount,
            'currency' => strtoupper($currency),
            'paymentDate' => date('c'), // ISO 8601 format
            'source' => 'digitalgrandpa_stripe',
            'paymentStatus' => 'completed',
            'metadata' => [
                'stripePaymentIntentId' => $payment_intent_id,
                'customerIP' => $_SERVER['REMOTE_ADDR'],
                'userAgent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'timestamp' => time()
            ]
        ];
        
        error_log("Processing successful payment: {$payment_intent_id} for {$customer_email}");
        
        // Send webhook to GoHighLevel
        $webhook_result = sendGHLWebhook($webhook_data);
        
        if ($webhook_result['success']) {
            error_log("GHL webhook sent successfully for {$payment_intent_id}");
            
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Payment processed successfully',
                'transactionId' => $payment_intent_id,
                'webhookStatus' => 'sent'
            ]);
        } else {
            error_log("GHL webhook failed: " . $webhook_result['error']);
            
            // Still return success since payment went through
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Payment processed successfully',
                'transactionId' => $payment_intent_id,
                'webhookStatus' => 'failed',
                'note' => 'Payment completed but notification delivery failed'
            ]);
        }
        
    } catch (Exception $e) {
        error_log('Payment success processing error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'error' => 'Failed to process payment success',
            'message' => 'Internal server error'
        ]);
    }
}

function handleStripeWebhook() {
    $payload = file_get_contents('php://input');
    $sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
    
    try {
        if (STRIPE_WEBHOOK_SECRET) {
            $event = Webhook::constructEvent($payload, $sig_header, STRIPE_WEBHOOK_SECRET);
        } else {
            $event = json_decode($payload, true);
        }
        
        error_log("Stripe webhook received: {$event['type']}");
        
        // Handle the event
        switch ($event['type']) {
            case 'payment_intent.succeeded':
                $payment_intent = $event['data']['object'];
                error_log("Payment succeeded: {$payment_intent['id']}");
                handlePaymentIntentSucceeded($payment_intent);
                break;
                
            case 'payment_intent.payment_failed':
                $failed_payment = $event['data']['object'];
                error_log("Payment failed: {$failed_payment['id']}");
                break;
                
            default:
                error_log("Unhandled event type: {$event['type']}");
        }
        
        header('Content-Type: application/json');
        echo json_encode(['received' => true]);
        
    } catch (Exception $e) {
        error_log('Webhook error: ' . $e->getMessage());
        http_response_code(400);
        echo "Webhook Error: " . $e->getMessage();
    }
}

function handleHealthCheck() {
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'healthy',
        'timestamp' => date('c'),
        'environment' => 'production'
    ]);
}

// ===== HELPER FUNCTIONS =====

function sendGHLWebhook($data) {
    $max_retries = 3;
    $last_error = '';
    
    for ($attempt = 1; $attempt <= $max_retries; $attempt++) {
        $ch = curl_init();
        
        curl_setopt_array($ch, [
            CURLOPT_URL => GHL_WEBHOOK_URL,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'User-Agent: DigitalGrandpa-Stripe/1.0'
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_FOLLOWLOCATION => false
        ]);
        
        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            $last_error = "cURL error: {$error}";
        } elseif ($http_code >= 200 && $http_code < 300) {
            error_log("GHL webhook successful on attempt {$attempt}");
            return ['success' => true, 'response' => $response];
        } else {
            $last_error = "HTTP {$http_code}: {$response}";
        }
        
        error_log("GHL webhook attempt {$attempt} failed: {$last_error}");
        
        if ($attempt < $max_retries) {
            // Exponential backoff: 1s, 2s, 4s
            $delay = pow(2, $attempt - 1);
            sleep($delay);
        }
    }
    
    return [
        'success' => false,
        'error' => "GHL webhook failed after {$max_retries} attempts: {$last_error}"
    ];
}

function handlePaymentIntentSucceeded($payment_intent) {
    // Additional processing for successful payments
    try {
        $metadata = $payment_intent['metadata'];
        
        error_log('Processing payment intent succeeded webhook: ' . json_encode([
            'id' => $payment_intent['id'],
            'amount' => $payment_intent['amount'],
            'customer' => $metadata['customerEmail'] ?? 'unknown',
            'product' => $metadata['productName'] ?? 'unknown'
        ]));
        
        // Add additional logic here like:
        // - Send confirmation email
        // - Update database
        // - Trigger additional automations
        
    } catch (Exception $e) {
        error_log('Error in handlePaymentIntentSucceeded: ' . $e->getMessage());
    }
}

function formatCurrency($amount_in_cents, $currency = 'usd') {
    $amount = $amount_in_cents / 100;
    
    // Simple currency formatting
    switch (strtoupper($currency)) {
        case 'USD':
            return ' . number_format($amount, 2);
        case 'EUR':
            return '€' . number_format($amount, 2);
        case 'GBP':
            return '£' . number_format($amount, 2);
        default:
            return strtoupper($currency) . ' ' . number_format($amount, 2);
    }
}

?>