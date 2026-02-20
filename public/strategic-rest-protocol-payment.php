<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'vendor/autoload.php';

// Stripe configuration
$stripe_secret_key = getenv('STRIPE_SECRET_KEY') ?: 'STRIPE_SECRET_KEY_PLACEHOLDER';
\Stripe\Stripe::setApiKey($stripe_secret_key);

// Log function
function logMessage($message) {
    $timestamp = date('Y-m-d H:i:s');
    error_log("[$timestamp] Strategic Rest Protocol Payment: $message");
}

try {
    // Get the request body
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data) {
        throw new Exception('Invalid JSON data received');
    }
    
    logMessage("Payment request received: " . json_encode($data));
    
    // Validate required fields
    $required_fields = ['customer_email', 'customer_name'];
    foreach ($required_fields as $field) {
        if (empty($data[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }
    
    // Product configuration
    $product_config = [
        'name' => 'The Strategic Rest Protocol',
        'description' => 'Military-Tested Recovery Science for Life Rebuilders - Complete 127-page guide with bonuses',
        'price' => 6700, // $67.00 in cents
        'currency' => 'usd'
    ];
    
    // Create or retrieve customer
    $customer_email = filter_var($data['customer_email'], FILTER_VALIDATE_EMAIL);
    if (!$customer_email) {
        throw new Exception('Invalid email address');
    }
    
    // Parse customer name
    $customer_name = trim($data['customer_name']);
    $name_parts = explode(' ', $customer_name, 2);
    $first_name = $name_parts[0];
    $last_name = isset($name_parts[1]) ? $name_parts[1] : '';
    
    // Check if customer already exists
    $existing_customers = \Stripe\Customer::all([
        'email' => $customer_email,
        'limit' => 1
    ]);
    
    if (count($existing_customers->data) > 0) {
        $customer = $existing_customers->data[0];
        logMessage("Using existing customer: " . $customer->id);
    } else {
        // Create new customer
        $customer = \Stripe\Customer::create([
            'email' => $customer_email,
            'name' => $customer_name,
            'metadata' => [
                'product' => 'strategic_rest_protocol',
                'source' => 'digitalgrandpa_store',
                'first_name' => $first_name,
                'last_name' => $last_name
            ]
        ]);
        logMessage("Created new customer: " . $customer->id);
    }
    
    // Create checkout session
    $checkout_session = \Stripe\Checkout\Session::create([
        'customer' => $customer->id,
        'payment_method_types' => ['card'],
        'line_items' => [[
            'price_data' => [
                'currency' => $product_config['currency'],
                'product_data' => [
                    'name' => $product_config['name'],
                    'description' => $product_config['description'],
                    'images' => ['https://digitalgrandpa.org/bob-profile-photo.jpg']
                ],
                'unit_amount' => $product_config['price'],
            ],
            'quantity' => 1,
        ]],
        'mode' => 'payment',
        'success_url' => 'https://liiuorgu.manus.space/success?session_id={CHECKOUT_SESSION_ID}',
        'cancel_url' => 'https://liiuorgu.manus.space',
        'metadata' => [
            'product_type' => 'strategic_rest_protocol',
            'customer_email' => $customer_email,
            'customer_name' => $customer_name,
            'first_name' => $first_name,
            'last_name' => $last_name,
            'source' => 'digitalgrandpa_store'
        ],
        'customer_update' => [
            'address' => 'auto',
            'name' => 'auto'
        ],
        'billing_address_collection' => 'auto',
        'shipping_address_collection' => [
            'allowed_countries' => ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI']
        ]
    ]);
    
    logMessage("Checkout session created: " . $checkout_session->id);
    
    // Return the checkout session URL
    echo json_encode([
        'success' => true,
        'checkout_url' => $checkout_session->url,
        'session_id' => $checkout_session->id,
        'customer_id' => $customer->id
    ]);
    
} catch (Exception $e) {
    logMessage("Error: " . $e->getMessage());
    
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>

