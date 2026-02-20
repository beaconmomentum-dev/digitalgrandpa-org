<?php
// /api/diag.php — safe diagnostics (NO secrets printed)
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$out = [
  'php_version' => PHP_VERSION,
  'extensions' => [
    'curl'    => extension_loaded('curl'),
    'openssl' => extension_loaded('openssl'),
    'json'    => extension_loaded('json'),
  ],
];

// Absolute, per your server layout
$cfgPath = '/home/greyobqa/private/stripe_dg.php';
$out['config'] = [
  'found' => file_exists($cfgPath),
  'path'  => $cfgPath,
  'perms' => file_exists($cfgPath) ? substr(sprintf('%o', fileperms($cfgPath)), -3) : null,
];

if (file_exists($cfgPath) && is_readable($cfgPath)) {
  require $cfgPath; // expects $DG_STRIPE
  $mode = (isset($DG_STRIPE['mode']) && strtolower($DG_STRIPE['mode']) === 'live') ? 'live' : 'test';
  $out['keys'] = [
    'mode'       => $mode,
    'has_secret' => !empty($DG_STRIPE[$mode]['secret'] ?? ''),
    'has_pk'     => !empty($DG_STRIPE[$mode]['pk'] ?? ''),
  ];

  // Lightweight outbound check (doesn't leak secrets)
  if (!empty($DG_STRIPE[$mode]['secret']) && extension_loaded('curl')) {
    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL            => 'https://api.stripe.com/v1/charges?limit=1',
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_USERPWD        => ($DG_STRIPE[$mode]['secret'] . ':'),
      CURLOPT_HTTPAUTH       => CURLAUTH_BASIC,
      CURLOPT_TIMEOUT        => 10,
    ]);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err  = curl_error($ch);
    curl_close($ch);
    $out['outbound_https_to_stripe'] = [
      'ok'        => ($resp !== false),
      'http_code' => $code,
      'error'     => $err ?: null,
    ];
  }
}

$intentFile = '/home/greyobqa/digitalgrandpa.org/api/create_intent.php';
$out['intent_endpoint'] = [
  'file_found' => file_exists($intentFile),
  'file_path'  => $intentFile,
  'url'        => 'https://digitalgrandpa.org/api/create_intent.php',
];

echo json_encode($out, JSON_PRETTY_PRINT);
