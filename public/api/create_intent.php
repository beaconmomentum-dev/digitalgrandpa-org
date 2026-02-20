<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// EMBEDDED STRIPE KEYS - Digital Grandpa Live Keys
$STRIPE_SECRET_KEY = 'STRIPE_SECRET_KEY_PLACEHOLDER';
$STRIPE_PUBLISHABLE_KEY = 'pk_live_51QzrpkH6KvLUAe7qYXXVhQ9S0gN2fa2bKaAhRA7ifGzPTMpSts2C74Phc5JwlK98Kd3XcVNMMCQrnWKFDP2w7XKu00qGk1aBv6';

// Validate keys are present
if (empty($STRIPE_SECRET_KEY) || empty($STRIPE_PUBLISHABLE_KEY)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Stripe keys not configured']);
    exit;
}

try {
    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
        exit;
    }
    
    // Validate required fields
    if (!isset($input['product']) || !isset($input['email'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing required fields: product and email']);
        exit;
    }
    
    $product = $input['product'];
    $email = $input['email'];
    $firstName = $input['firstName'] ?? '';
    $lastName = $input['lastName'] ?? '';
    
    // Digital Grandpa product pricing (in cents)
    $product_prices = [
        'little-things' => 1497, // It's the Little Things $14.97
        'rest-protocol' => 6700, // Strategic Rest Protocol $67
        'next-chapter' => 6700, // Your Next Chapter $67
        'complete-bundle' => 9700, // Complete Bundle $97
        'starter-pack' => 2497, // Starter Pack $24.97
        'ultimate-collection' => 14700, // Ultimate Collection $147
    ];
    
    // Get amount for product
    $amount = $product_prices[$product] ?? 1497; // Default to $14.97
    
    // Product descriptions
    $product_descriptions = [
        'little-things' => "It's the Little Things - Digital Grandpa Guide",
        'rest-protocol' => 'Strategic Rest Protocol - Digital Grandpa Guide',
        'next-chapter' => 'Your Next Chapter - Digital Grandpa Guide',
        'complete-bundle' => 'Complete Transformation Bundle - Digital Grandpa',
        'starter-pack' => 'Starter Pack - Digital Grandpa',
        'ultimate-collection' => 'Ultimate Rebuilder Collection - Digital Grandpa',
    ];
    
    $description = $product_descriptions[$product] ?? 'Digital Grandpa Transformation Guide';
    
    // Create PaymentIntent using Stripe API via cURL
    $payment_data = [
        'amount' => $amount,
        'currency' => 'usd',
        'metadata[product]' => $product,
        'metadata[customer_email]' => $email,
        'metadata[customer_name]' => trim($firstName . ' ' . $lastName),
        'metadata[source]' => 'digitalgrandpa.org',
        'receipt_email' => $email,
        'description' => $description
    ];
    
    // Initialize cURL
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://api.stripe.com/v1/payment_intents');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($payment_data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $STRIPE_SECRET_KEY,
        'Content-Type: application/x-www-form-urlencoded'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    
    // Execute request
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);
    
    // Check for cURL errors
    if ($curl_error) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Network error: ' . $curl_error]);
        exit;
    }
    
    // Check HTTP response code
    if ($http_code !== 200) {
        $error_response = json_decode($response, true);
        $error_message = 'Payment processing failed';
        
        if ($error_response && isset($error_response['error']['message'])) {
            $error_message = $error_response['error']['message'];
        }
        
        http_response_code($http_code);
        echo json_encode(['success' => false, 'error' => $error_message]);
        exit;
    }
    
    // Parse successful response
    $intent = json_decode($response, true);
    
    if (!$intent || !isset($intent['client_secret'])) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Invalid response from payment processor']);
        exit;
    }
    
    // Return success response
    echo json_encode([
        'success' => true,
        'client_secret' => $intent['client_secret'],
        'amount' => $amount,
        'currency' => 'usd',
        'publishable_key' => $STRIPE_PUBLISHABLE_KEY,
        'product' => $product,
        'description' => $description
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Internal server error: ' . $e->getMessage()]);
}
?>

