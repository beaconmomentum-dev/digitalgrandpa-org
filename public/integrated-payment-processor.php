<?php
// /integrated-payment-processor.php — DG Stripe Checkout (Fail-Safe v3)

// ---------- Fatal catcher so we never get an empty response ----------
register_shutdown_function(function () {
  $e = error_get_last();
  if ($e && in_array($e['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
    if (!headers_sent()) {
      header('Content-Type: application/json');
      http_response_code(500);
    }
    echo json_encode([
      'success' => false,
      'fatal'   => true,
      'message' => $e['message'],
      'file'    => $e['file'],
      'line'    => $e['line'],
    ], JSON_UNESCAPED_SLASHES);
  }
});

// ---------- Logging & hardening ----------
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// Pick a writable log dir with safe fallbacks (shared hosting friendly)
$LOG_DIRS = [
  '/home/greyobqa/logs',
  '/home/greyobqa/digitalgrandpa.org/.logs',
  '/home/greyobqa/digitalgrandpa.org/logs',
];
$LOG_DIR = null;
foreach ($LOG_DIRS as $d) {
  if (is_dir($d) || @mkdir($d, 0700, true)) { $LOG_DIR = $d; break; }
}
if ($LOG_DIR) ini_set('error_log', $LOG_DIR . '/php_error.log');

function json_out($data, $code = 200) {
  http_response_code($code);
  header('Content-Type: application/json');
  echo json_encode($data, JSON_UNESCAPED_SLASHES);
  exit;
}

// ---------- CORS (same-origin) ----------
$origin = 'https://' . ($_SERVER['HTTP_HOST'] ?? 'digitalgrandpa.org');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
  header('Access-Control-Allow-Origin: ' . $origin);
  header('Access-Control-Allow-Methods: POST, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type');
  exit;
}
header('Access-Control-Allow-Origin: ' . $origin);

// ---------- Secure keys ----------
$cfgPath = '/home/greyobqa/private/stripe_dg.php'; // you already created this
if (!file_exists($cfgPath) || !is_readable($cfgPath)) {
  json_out(['success'=>false,'error'=>'Config file missing: '.$cfgPath], 500);
}
require $cfgPath; // expects $DG_STRIPE = ['mode'=>'live|test','live'=>['secret','pk'],'test'=>['secret','pk']]
$mode   = (isset($DG_STRIPE['mode']) && strtolower($DG_STRIPE['mode']) === 'live') ? 'live' : 'test';
$secret = $DG_STRIPE[$mode]['secret'] ?? '';
if (!$secret) json_out(['success'=>false,'error'=>'Stripe secret key not set'], 500);

// ---------- Parse input (JSON or form) ----------
$ct = $_SERVER['CONTENT_TYPE'] ?? '';
$payload = [];
if (stripos($ct, 'application/json') !== false) {
  $raw = file_get_contents('php://input');
  $payload = json_decode($raw, true) ?: [];
} else {
  $payload = $_POST ?: [];
}

$action      = $payload['action']      ?? '';
$product_id  = $payload['product_id']  ?? '';
$success_url = $payload['success_url'] ?? ('https://' . ($_SERVER['HTTP_HOST'] ?? 'digitalgrandpa.org') . '/success.html');
$cancel_url  = $payload['cancel_url']  ?? ('https://' . ($_SERVER['HTTP_HOST'] ?? 'digitalgrandpa.org') . '/store.html');
$email       = $payload['email']       ?? '';

// ---------- Quick diagnostics ----------
if ($action === 'ping') {
  json_out(['success'=>true,'pong'=>true,'ts'=>date('c')]);
}

// ---------- Product catalog (current + legacy slugs) ----------
$productCatalog = [
  // New Funnel Products
  'strategic-rest-protocol' => [
    'name' => 'Strategic Rest Protocol',
    'description' => 'Military-Tested Recovery Science',
    'price' => 6700, 'currency' => 'usd', 'type' => 'digital_guide',
    'download_url' => 'https://digitalgrandpa.org/downloads/strategic-rest-protocol.pdf',
    'success_url'  => 'https://digitalgrandpa.org/success?product=strategic-rest-protocol',
    'cancel_url'   => 'https://digitalgrandpa.org/store',
  ],
  'your-next-chapter' => [
    'name' => 'Your Next Chapter',
    'description' => 'Purpose-Driven Reinvention Guide',
    'price' => 6700, 'currency' => 'usd', 'type' => 'digital_guide',
    'download_url' => 'https://digitalgrandpa.org/downloads/your-next-chapter.pdf',
    'success_url'  => 'https://digitalgrandpa.org/success?product=your-next-chapter',
    'cancel_url'   => 'https://digitalgrandpa.org/store',
  ],
  'complete-transformation-bundle' => [
    'name' => 'Complete Transformation Bundle',
    'description' => 'Strategic Rest + Your Next Chapter',
    'price' => 9700, 'currency' => 'usd', 'type' => 'bundle',
    'download_url' => 'https://digitalgrandpa.org/downloads/complete-bundle.zip',
    'success_url'  => 'https://digitalgrandpa.org/success?product=complete-bundle',
    'cancel_url'   => 'https://digitalgrandpa.org/store',
  ],
  // Existing Products
  'complete-transformation-course' => [
    'name' => 'The Complete Transformation Course',
    'description' => '12-module video course',
    'price' => 19700, 'currency' => 'usd', 'type' => 'video_course',
    'download_url' => 'https://digitalgrandpa.org/course-access',
    'success_url'  => 'https://digitalgrandpa.org/success?product=transformation-course',
    'cancel_url'   => 'https://digitalgrandpa.org/store',
  ],
  'voices-of-resilience' => [
    'name' => 'Voices of Resilience Podcast Series',
    'description' => '12 intimate conversations',
    'price' => 9700, 'currency' => 'usd', 'type' => 'podcast_series',
    'download_url' => 'https://digitalgrandpa.org/podcast-access',
    'success_url'  => 'https://digitalgrandpa.org/success?product=podcast-series',
    'cancel_url'   => 'https://digitalgrandpa.org/store',
  ],
  'complete-digital-library' => [
    'name' => 'The Complete Digital Library',
    'description' => 'Every book, guide, and resource',
    'price' => 19700, 'currency' => 'usd', 'type' => 'digital_library',
    'download_url' => 'https://digitalgrandpa.org/library-access',
    'success_url'  => 'https://digitalgrandpa.org/success?product=digital-library',
    'cancel_url'   => 'https://digitalgrandpa.org/store',
  ],
  // Legacy front-end slugs still in use by buttons
  'its-the-little-things' => [
    'name' => "It's the Little Things",
    'description' => 'Micro-habits that compound',
    'price' => 1497, 'currency' => 'usd', 'type' => 'digital_guide',
    'download_url' => 'https://digitalgrandpa.org/downloads/its-the-little-things.pdf',
    'success_url'  => 'https://digitalgrandpa.org/success?product=its-the-little-things',
    'cancel_url'   => 'https://digitalgrandpa.org/store',
  ],
  'starter-pack' => [
    'name' => 'Rise & Reclaim Starter Pack',
    'description' => 'Quick-start resources',
    'price' => 2497, 'currency' => 'usd', 'type' => 'bundle',
    'download_url' => 'https://digitalgrandpa.org/downloads/starter-pack.zip',
    'success_url'  => 'https://digitalgrandpa.org/success?product=starter-pack',
    'cancel_url'   => 'https://digitalgrandpa.org/store',
  ],
  'complete-bundle' => [
    'name' => 'Complete Transformation Bundle',
    'description' => 'Legacy slug mapping',
    'price' => 9700, 'currency' => 'usd', 'type' => 'bundle',
    'download_url' => 'https://digitalgrandpa.org/downloads/complete-bundle.zip',
    'success_url'  => 'https://digitalgrandpa.org/success?product=complete-bundle',
    'cancel_url'   => 'https://digitalgrandpa.org/store',
  ],
  'ultimate-collection' => [
    'name' => 'Ultimate Rebuilder Collection',
    'description' => 'All assets, one pack',
    'price' => 14700, 'currency' => 'usd', 'type' => 'bundle',
    'download_url' => 'https://digitalgrandpa.org/downloads/ultimate-collection.zip',
    'success_url'  => 'https://digitalgrandpa.org/success?product=ultimate-collection',
    'cancel_url'   => 'https://digitalgrandpa.org/store',
  ],
];

// Optional listing
if ($action === 'list_products') {
  json_out(['success'=>true, 'products'=>array_keys($productCatalog)]);
}

// Aliases
$ALIASES = [
  'complete-bundle' => 'complete-transformation-bundle',
];

// ---------- Normalize product ----------
if (!$product_id) json_out(['success'=>false,'error'=>'Missing product_id'], 400);
if (isset($ALIASES[$product_id])) $product_id = $ALIASES[$product_id];
if (!isset($productCatalog[$product_id])) {
  json_out(['success'=>false,'error'=>'Product not found','hint'=>$product_id], 404);
}
$prod = $productCatalog[$product_id];

// Prefer per-product URLs if caller didn’t pass
if (empty($payload['success_url']) && !empty($prod['success_url'])) $success_url = $prod['success_url'];
if (empty($payload['cancel_url'])  && !empty($prod['cancel_url']))  $cancel_url  = $prod['cancel_url'];

// ---------- Only action we support for now ----------
if ($action !== 'create_checkout_session') {
  json_out(['success'=>false,'error'=>'Unsupported action'], 400);
}

// ---------- Build Stripe Checkout Session ----------
$fields = [
  'mode'                   => 'payment',
  'success_url'            => $success_url . (strpos($success_url,'?')!==false ? '&' : '?') . 'product=' . rawurlencode($product_id) . '&session_id={CHECKOUT_SESSION_ID}',
  'cancel_url'             => $cancel_url,
  'payment_method_types[]' => 'card',
  'metadata[product_id]'   => $product_id,
];
if ($email) $fields['customer_email'] = $email;

// Inline price data
$amountCents = (int)($prod['amount_cents'] ?? $prod['price'] ?? 0);
if ($amountCents <= 0) json_out(['success'=>false,'error'=>'Invalid amount for product'], 400);
$fields['line_items[0][price_data][currency]']              = $prod['currency'] ?? 'usd';
$fields['line_items[0][price_data][unit_amount]']           = $amountCents;
$fields['line_items[0][price_data][product_data][name]']    = $prod['name'];
$fields['line_items[0][quantity]']                          = 1;

// ---------- Call Stripe ----------
$ch = curl_init('https://api.stripe.com/v1/checkout/sessions');
curl_setopt_array($ch, [
  CURLOPT_POST            => true,
  CURLOPT_POSTFIELDS      => http_build_query($fields),
  CURLOPT_RETURNTRANSFER  => true,
  CURLOPT_USERPWD         => $secret . ':',
  CURLOPT_HTTPAUTH        => CURLAUTH_BASIC,
  CURLOPT_TIMEOUT         => 20,
  CURLOPT_HTTPHEADER      => ['Stripe-Version: 2020-08-27'],
]);
$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err  = curl_error($ch);
curl_close($ch);

if ($resp === false) json_out(['success'=>false,'error'=>'Stripe request failed','detail'=>$err], 502);

$data = json_decode($resp, true);
if ($code < 200 || $code >= 300) {
  $msg = $data['error']['message'] ?? ('Stripe error (HTTP '.$code.')');
  json_out(['success'=>false,'error'=>$msg,'stripe_http'=>$code], 502);
}

$url = $data['url'] ?? '';
if (!$url) json_out(['success'=>false,'error'=>'Stripe did not return a checkout URL'], 502);

json_out(['success'=>true,'checkout_url'=>$url]);
