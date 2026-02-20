<?php
header('Content-Type: application/json');

require_once 'vendor/autoload.php';

// Configuration
$stripe_secret_key = getenv('STRIPE_SECRET_KEY') ?: 'STRIPE_SECRET_KEY_PLACEHOLDER';
$stripe_webhook_secret = getenv('STRIPE_WEBHOOK_SECRET') ?: 'whsec_your_webhook_secret_here';
$ghl_api_key = getenv('GHL_API_KEY') ?: 'your_ghl_api_key_here';
$ghl_location_id = getenv('GHL_LOCATION_ID') ?: 'your_ghl_location_id_here';

\Stripe\Stripe::setApiKey($stripe_secret_key);

// Log function
function logMessage($message) {
    $timestamp = date('Y-m-d H:i:s');
    error_log("[$timestamp] Strategic Rest Protocol Webhook: $message");
    
    // Also log to file for debugging
    $log_file = __DIR__ . '/strategic_rest_protocol_webhook.log';
    file_put_contents($log_file, "[$timestamp] $message\n", FILE_APPEND | LOCK_EX);
}

// GHL API function
function createGHLContact($customer_data) {
    global $ghl_api_key, $ghl_location_id;
    
    $ghl_endpoint = "https://rest.gohighlevel.com/v1/contacts/";
    
    $contact_data = [
        'email' => $customer_data['email'],
        'firstName' => $customer_data['first_name'],
        'lastName' => $customer_data['last_name'],
        'name' => $customer_data['name'],
        'locationId' => $ghl_location_id,
        'tags' => [
            'Strategic Rest Protocol Customer',
            'Digital Grandpa Store',
            'Paid Customer',
            'Product: Strategic Rest Protocol'
        ],
        'customFields' => [
            'source' => 'Strategic Rest Protocol Purchase',
            'product_purchased' => 'Strategic Rest Protocol',
            'purchase_amount' => '$67',
            'purchase_date' => date('Y-m-d H:i:s'),
            'customer_type' => 'Digital Product Customer'
        ]
    ];
    
    $headers = [
        'Authorization: Bearer ' . $ghl_api_key,
        'Content-Type: application/json'
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $ghl_endpoint);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($contact_data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    logMessage("GHL API Response (HTTP $http_code): $response");
    
    if ($http_code >= 200 && $http_code < 300) {
        return json_decode($response, true);
    } else {
        throw new Exception("GHL API Error (HTTP $http_code): $response");
    }
}

// Send admin notification
function sendAdminNotification($customer_data, $payment_data) {
    $admin_email = 'jarvis@joinriseandreclaim.com';
    $subject = 'New Strategic Rest Protocol Purchase - ' . $customer_data['name'];
    
    $message = "
New Strategic Rest Protocol Purchase!

Customer Details:
- Name: {$customer_data['name']}
- Email: {$customer_data['email']}
- Purchase Amount: \${$payment_data['amount']}
- Payment ID: {$payment_data['payment_intent_id']}
- Purchase Date: " . date('Y-m-d H:i:s') . "

The customer has been added to GHL and should receive their welcome email sequence automatically.

Product Details:
- The Strategic Rest Protocol (Digital Download)
- 127-page comprehensive guide
- Audio version bonus
- Quick reference cards bonus
- 30-day email support bonus

Next Steps:
1. Customer will receive immediate download link
2. Welcome email sequence will begin
3. 30-day support sequence will activate

Best regards,
Digital Grandpa Store Automation
";
    
    $headers = [
        'From: Digital Grandpa Store <noreply@digitalgrandpa.org>',
        'Reply-To: director@digitalgrandpa.org',
        'Content-Type: text/plain; charset=UTF-8'
    ];
    
    mail($admin_email, $subject, $message, implode("\r\n", $headers));
    logMessage("Admin notification sent to $admin_email");
}

try {
    // Get the request body and signature
    $payload = file_get_contents('php://input');
    $sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
    
    logMessage("Webhook received with signature: " . substr($sig_header, 0, 50) . "...");
    
    // Verify the webhook signature
    try {
        $event = \Stripe\Webhook::constructEvent($payload, $sig_header, $stripe_webhook_secret);
        logMessage("Webhook signature verified successfully");
    } catch (\Stripe\Exception\SignatureVerificationException $e) {
        logMessage("Webhook signature verification failed: " . $e->getMessage());
        http_response_code(400);
        echo json_encode(['error' => 'Invalid signature']);
        exit;
    }
    
    logMessage("Processing event: " . $event['type']);
    
    // Handle the event
    switch ($event['type']) {
        case 'checkout.session.completed':
            $session = $event['data']['object'];
            
            logMessage("Checkout session completed: " . $session['id']);
            
            // Check if this is for Strategic Rest Protocol
            if (isset($session['metadata']['product_type']) && 
                $session['metadata']['product_type'] === 'strategic_rest_protocol') {
                
                // Extract customer information
                $customer_data = [
                    'email' => $session['customer_details']['email'] ?? $session['metadata']['customer_email'],
                    'name' => $session['customer_details']['name'] ?? $session['metadata']['customer_name'],
                    'first_name' => $session['metadata']['first_name'] ?? '',
                    'last_name' => $session['metadata']['last_name'] ?? '',
                    'customer_id' => $session['customer']
                ];
                
                $payment_data = [
                    'amount' => number_format($session['amount_total'] / 100, 2),
                    'currency' => strtoupper($session['currency']),
                    'payment_intent_id' => $session['payment_intent'],
                    'session_id' => $session['id']
                ];
                
                logMessage("Processing Strategic Rest Protocol purchase for: " . $customer_data['email']);
                
                try {
                    // Create GHL contact
                    $ghl_response = createGHLContact($customer_data);
                    logMessage("GHL contact created successfully: " . json_encode($ghl_response));
                    
                    // Send admin notification
                    sendAdminNotification($customer_data, $payment_data);
                    
                    logMessage("Strategic Rest Protocol purchase processed successfully for " . $customer_data['email']);
                    
                } catch (Exception $e) {
                    logMessage("Error processing Strategic Rest Protocol purchase: " . $e->getMessage());
                    
                    // Send error notification to admin
                    $error_subject = 'ERROR: Strategic Rest Protocol Purchase Processing Failed';
                    $error_message = "
Failed to process Strategic Rest Protocol purchase!

Customer: {$customer_data['name']} ({$customer_data['email']})
Error: {$e->getMessage()}
Session ID: {$session['id']}
Time: " . date('Y-m-d H:i:s') . "

Please manually process this customer and add them to GHL.
";
                    mail('jarvis@joinriseandreclaim.com', $error_subject, $error_message);
                }
            }
            break;
            
        case 'payment_intent.succeeded':
            $payment_intent = $event['data']['object'];
            logMessage("Payment intent succeeded: " . $payment_intent['id']);
            break;
            
        case 'payment_intent.payment_failed':
            $payment_intent = $event['data']['object'];
            logMessage("Payment intent failed: " . $payment_intent['id'] . " - " . ($payment_intent['last_payment_error']['message'] ?? 'Unknown error'));
            break;
            
        default:
            logMessage("Unhandled event type: " . $event['type']);
    }
    
    // Return success response
    http_response_code(200);
    echo json_encode(['status' => 'success']);
    
} catch (Exception $e) {
    logMessage("Webhook error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>

