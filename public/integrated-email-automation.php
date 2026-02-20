<?php
// Integrated Email Automation for Digital Grandpa Store
// Handles lead capture, customer onboarding, and email sequences

// Set CORS headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Email configuration
$emailConfig = [
    'smtp_host' => 'smtp.gmail.com',
    'smtp_port' => 587,
    'smtp_username' => 'jarvis@joinriseandreclaim.com',
    'smtp_password' => '', // Set in production
    'from_email' => 'jarvis@joinriseandreclaim.com',
    'from_name' => 'Digital Grandpa - Bob Burr'
];

// Email sequences configuration
$emailSequences = [
    'rise_reclaim_lead_magnet' => [
        'name' => 'Rise & Reclaim Lead Magnet Sequence',
        'emails' => [
            [
                'delay_hours' => 0,
                'subject' => 'Your FREE Rise & Reclaim Guide is Here! 📖',
                'template' => 'rise_reclaim_welcome'
            ],
            [
                'delay_hours' => 72,
                'subject' => 'How are you doing with your Rise & Reclaim journey?',
                'template' => 'rise_reclaim_checkin'
            ],
            [
                'delay_hours' => 168, // 7 days
                'subject' => 'Ready for deeper transformation? Strategic Rest Protocol',
                'template' => 'strategic_rest_offer'
            ],
            [
                'delay_hours' => 336, // 14 days
                'subject' => 'Your Next Chapter awaits...',
                'template' => 'next_chapter_intro'
            ],
            [
                'delay_hours' => 504, // 21 days
                'subject' => 'Complete Transformation Bundle - Save $37!',
                'template' => 'bundle_offer'
            ]
        ]
    ],
    'premium_customer_onboarding' => [
        'name' => 'Premium Customer Onboarding',
        'emails' => [
            [
                'delay_hours' => 0,
                'subject' => 'Welcome to your transformation journey! 🎯',
                'template' => 'premium_welcome'
            ],
            [
                'delay_hours' => 24,
                'subject' => 'Getting started with your new guide',
                'template' => 'premium_getting_started'
            ],
            [
                'delay_hours' => 168, // 7 days
                'subject' => 'How\'s your progress? Need support?',
                'template' => 'premium_checkin'
            ],
            [
                'delay_hours' => 720, // 30 days
                'subject' => 'Join the Rise & Reclaim Community',
                'template' => 'community_invitation'
            ]
        ]
    ]
];

// Email templates
$emailTemplates = [
    'rise_reclaim_welcome' => [
        'subject' => 'Your FREE Rise & Reclaim Guide is Here! 📖',
        'html' => '
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #2c3e50;">Welcome to Your Transformation Journey!</h1>
                
                <p>Hi {first_name},</p>
                
                <p>Thank you for downloading the <strong>Rise & Reclaim</strong> guide! You\'ve just taken the first step toward transforming your setbacks into comebacks.</p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <h3 style="color: #d4af37;">📖 Your Free Guide Includes:</h3>
                    <ul>
                        <li>60 pages of battle-tested strategies</li>
                        <li>Rock bottom foundation framework</li>
                        <li>Healing and becoming process</li>
                        <li>Purpose-driven action plans</li>
                        <li>Real transformation stories</li>
                    </ul>
                </div>
                
                <p style="text-align: center;">
                    <a href="https://ipjbpwkc.manus.space" style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                        📥 Download Your Guide Now
                    </a>
                </p>
                
                <p>This isn\'t about comfortable lifestyle adjustments. It\'s for warriors who\'ve been through the fire and are ready to rebuild stronger.</p>
                
                <p>I\'ll be checking in with you over the next few weeks to see how you\'re doing and share additional resources that can help accelerate your transformation.</p>
                
                <p>Your worst moment isn\'t your final chapter—it\'s your turning page.</p>
                
                <p>Stay strong,<br>
                Bob "Digital Grandpa" Burr<br>
                <em>U.S. Navy Veteran | Presidential Recognition Winner</em></p>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #666;">
                    You\'re receiving this because you downloaded the Rise & Reclaim guide from Digital Grandpa.
                    <a href="{unsubscribe_url}">Unsubscribe</a>
                </p>
            </div>
        </body>
        </html>'
    ],
    
    'strategic_rest_offer' => [
        'subject' => 'Ready for deeper transformation? Strategic Rest Protocol',
        'html' => '
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #2c3e50;">Are You Running on Empty?</h1>
                
                <p>Hi {first_name},</p>
                
                <p>I hope the Rise & Reclaim guide has been helpful in your journey. I wanted to reach out because I see this pattern all the time...</p>
                
                <p><strong>People try to rebuild their lives while running on fumes.</strong></p>
                
                <p>They push through exhaustion, ignore burnout, and wonder why they can\'t make progress. Here\'s what I\'ve learned in 30+ years of helping people rebuild:</p>
                
                <div style="background: #fff3cd; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #d4af37;">
                    <p style="margin: 0; font-weight: bold; color: #856404;">
                        "You can\'t build a new life on an empty tank. Rest isn\'t weakness—it\'s strategy."
                    </p>
                </div>
                
                <p>That\'s why I created the <strong>Strategic Rest Protocol</strong>—a military-tested system that teaches you the 9 types of rest and how to restore your energy BEFORE taking on new challenges.</p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <h3 style="color: #d4af37;">💤 What You\'ll Learn:</h3>
                    <ul>
                        <li>The 9 Types of Rest Framework</li>
                        <li>Recovery assessment tools</li>
                        <li>Energy management system</li>
                        <li>Burnout prevention strategies</li>
                        <li>Military-tested protocols</li>
                    </ul>
                </div>
                
                <p style="text-align: center;">
                    <a href="https://digitalgrandpa.org/store" style="background: #d4af37; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                        💤 Get Strategic Rest Protocol - $67
                    </a>
                </p>
                
                <p>This isn\'t about being lazy. It\'s about being strategic. Rest first, then rebuild.</p>
                
                <p>Your transformation journey deserves a solid foundation.</p>
                
                <p>Stay strong,<br>
                Bob "Digital Grandpa" Burr</p>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #666;">
                    <a href="{unsubscribe_url}">Unsubscribe</a>
                </p>
            </div>
        </body>
        </html>'
    ],
    
    'bundle_offer' => [
        'subject' => 'Complete Transformation Bundle - Save $37!',
        'html' => '
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #2c3e50;">Ready for Complete Transformation?</h1>
                
                <p>Hi {first_name},</p>
                
                <p>Over the past few weeks, I\'ve shared resources to help you on your transformation journey. Today, I want to offer you something special.</p>
                
                <div style="background: linear-gradient(45deg, #ffd700, #059669); padding: 2px; border-radius: 12px; margin: 20px 0;">
                    <div style="background: white; padding: 20px; border-radius: 10px;">
                        <h2 style="color: #2c3e50; text-align: center; margin-top: 0;">🎯 Complete Transformation Bundle</h2>
                        <p style="text-align: center; font-size: 18px; margin: 10px 0;">
                            <span style="text-decoration: line-through; color: #999;">$134</span>
                            <strong style="color: #059669; font-size: 24px;">$97</strong>
                        </p>
                        <p style="text-align: center; background: #059669; color: white; padding: 10px; border-radius: 20px; display: inline-block; margin: 0 auto; font-weight: bold;">
                            Save $37!
                        </p>
                    </div>
                </div>
                
                <p><strong>Here\'s what you get:</strong></p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <h3 style="color: #d4af37;">📦 Bundle Includes:</h3>
                    <ul>
                        <li><strong>Strategic Rest Protocol</strong> - Learn to rest strategically ($67 value)</li>
                        <li><strong>Your Next Chapter</strong> - Purpose-driven reinvention guide ($67 value)</li>
                        <li><strong>Sequential System</strong> - Rest first, then rebuild methodology</li>
                        <li><strong>90-Day Journey</strong> - Complete transformation timeline</li>
                        <li><strong>Email Support</strong> - Direct access to guidance</li>
                    </ul>
                </div>
                
                <p>This is the complete system: <strong>rest first, then rebuild</strong>. No overwhelm, just a proven path forward.</p>
                
                <p style="text-align: center;">
                    <a href="https://rfxfjnki.manus.space" style="background: linear-gradient(45deg, #ffd700, #059669); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                        🎯 Get Complete Bundle - $97
                    </a>
                </p>
                
                <p>Your transformation doesn\'t have to be complicated. It just needs to be complete.</p>
                
                <p>Stay strong,<br>
                Bob "Digital Grandpa" Burr</p>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #666;">
                    <a href="{unsubscribe_url}">Unsubscribe</a>
                </p>
            </div>
        </body>
        </html>'
    ],
    
    'premium_welcome' => [
        'subject' => 'Welcome to your transformation journey! 🎯',
        'html' => '
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #2c3e50;">Welcome to Your Transformation!</h1>
                
                <p>Hi {first_name},</p>
                
                <p>Thank you for investing in your transformation with <strong>{product_name}</strong>. You\'ve just made a decision that thousands of others have made before you—and they\'ve seen incredible results.</p>
                
                <div style="background: #d4edda; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #28a745;">
                    <h3 style="color: #155724; margin-top: 0;">🎯 Your Next Steps:</h3>
                    <ol style="color: #155724;">
                        <li>Download your guide using the link below</li>
                        <li>Set aside 30 minutes to review the introduction</li>
                        <li>Identify your starting point using the assessment tools</li>
                        <li>Begin implementing the strategies at your own pace</li>
                    </ol>
                </div>
                
                <p style="text-align: center;">
                    <a href="{download_url}" style="background: #d4af37; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                        📥 Access Your Guide
                    </a>
                </p>
                
                <p>Remember: transformation isn\'t about perfection—it\'s about progress. Take this one step at a time.</p>
                
                <p>I\'ll be checking in with you to see how you\'re doing and provide additional support along the way.</p>
                
                <p>Your journey starts now.</p>
                
                <p>Stay strong,<br>
                Bob "Digital Grandpa" Burr</p>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #666;">
                    <a href="{unsubscribe_url}">Unsubscribe</a>
                </p>
            </div>
        </body>
        </html>'
    ]
];

// Database simulation (in production, use actual database)
$subscribersFile = 'subscribers.json';
$emailQueueFile = 'email_queue.json';

function loadSubscribers() {
    global $subscribersFile;
    if (file_exists($subscribersFile)) {
        return json_decode(file_get_contents($subscribersFile), true) ?: [];
    }
    return [];
}

function saveSubscribers($subscribers) {
    global $subscribersFile;
    file_put_contents($subscribersFile, json_encode($subscribers, JSON_PRETTY_PRINT));
}

function loadEmailQueue() {
    global $emailQueueFile;
    if (file_exists($emailQueueFile)) {
        return json_decode(file_get_contents($emailQueueFile), true) ?: [];
    }
    return [];
}

function saveEmailQueue($queue) {
    global $emailQueueFile;
    file_put_contents($emailQueueFile, json_encode($queue, JSON_PRETTY_PRINT));
}

function addToEmailSequence($email, $firstName, $sequenceType, $productData = null) {
    global $emailSequences;
    
    $subscribers = loadSubscribers();
    $emailQueue = loadEmailQueue();
    
    // Add or update subscriber
    $subscriberId = md5($email);
    $subscribers[$subscriberId] = [
        'email' => $email,
        'first_name' => $firstName,
        'subscribed_at' => date('Y-m-d H:i:s'),
        'source' => $sequenceType,
        'product_data' => $productData,
        'status' => 'active'
    ];
    
    // Add emails to queue
    if (isset($emailSequences[$sequenceType])) {
        $sequence = $emailSequences[$sequenceType];
        
        foreach ($sequence['emails'] as $emailConfig) {
            $sendTime = time() + ($emailConfig['delay_hours'] * 3600);
            
            $emailQueue[] = [
                'subscriber_id' => $subscriberId,
                'email' => $email,
                'first_name' => $firstName,
                'template' => $emailConfig['template'],
                'subject' => $emailConfig['subject'],
                'send_time' => $sendTime,
                'sequence_type' => $sequenceType,
                'product_data' => $productData,
                'status' => 'pending'
            ];
        }
    }
    
    saveSubscribers($subscribers);
    saveEmailQueue($emailQueue);
    
    return true;
}

function processEmailTemplate($template, $data) {
    global $emailTemplates;
    
    if (!isset($emailTemplates[$template])) {
        return false;
    }
    
    $emailTemplate = $emailTemplates[$template];
    $html = $emailTemplate['html'];
    
    // Replace placeholders
    $html = str_replace('{first_name}', $data['first_name'], $html);
    $html = str_replace('{email}', $data['email'], $html);
    $html = str_replace('{unsubscribe_url}', 'https://digitalgrandpa.org/unsubscribe?email=' . urlencode($data['email']), $html);
    
    if (isset($data['product_data'])) {
        $html = str_replace('{product_name}', $data['product_data']['name'] ?? '', $html);
        $html = str_replace('{download_url}', $data['product_data']['download_url'] ?? '#', $html);
    }
    
    return [
        'subject' => $emailTemplate['subject'],
        'html' => $html
    ];
}

try {
    // Get the request body
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data) {
        throw new Exception('Invalid JSON data');
    }
    
    $action = isset($data['action']) ? $data['action'] : '';
    
    switch ($action) {
        case 'subscribe_lead_magnet':
            if (!isset($data['email']) || !isset($data['first_name'])) {
                throw new Exception('Email and first name are required');
            }
            
            $email = filter_var($data['email'], FILTER_VALIDATE_EMAIL);
            if (!$email) {
                throw new Exception('Invalid email address');
            }
            
            $firstName = trim($data['first_name']);
            $source = isset($data['source']) ? $data['source'] : 'rise_reclaim';
            
            // Add to lead magnet sequence
            addToEmailSequence($email, $firstName, 'rise_reclaim_lead_magnet');
            
            // Log the subscription
            error_log("New lead subscription: $email, $firstName, source: $source");
            
            echo json_encode([
                'success' => true,
                'message' => 'Successfully subscribed to email sequence',
                'redirect_url' => 'https://ipjbpwkc.manus.space'
            ]);
            break;
            
        case 'customer_onboarding':
            if (!isset($data['email']) || !isset($data['product_data'])) {
                throw new Exception('Email and product data are required');
            }
            
            $email = filter_var($data['email'], FILTER_VALIDATE_EMAIL);
            if (!$email) {
                throw new Exception('Invalid email address');
            }
            
            $firstName = isset($data['first_name']) ? trim($data['first_name']) : '';
            $productData = $data['product_data'];
            
            // Add to premium customer sequence
            addToEmailSequence($email, $firstName, 'premium_customer_onboarding', $productData);
            
            // Log the customer onboarding
            error_log("Customer onboarding: $email, product: " . $productData['name']);
            
            echo json_encode([
                'success' => true,
                'message' => 'Customer onboarding sequence started'
            ]);
            break;
            
        case 'process_queue':
            // Process pending emails (this would typically be called by a cron job)
            $emailQueue = loadEmailQueue();
            $processed = 0;
            $currentTime = time();
            
            foreach ($emailQueue as $index => $queueItem) {
                if ($queueItem['status'] === 'pending' && $queueItem['send_time'] <= $currentTime) {
                    // Process email
                    $emailData = processEmailTemplate($queueItem['template'], $queueItem);
                    
                    if ($emailData) {
                        // In production, send actual email here
                        error_log("Would send email: " . $queueItem['subject'] . " to " . $queueItem['email']);
                        
                        // Mark as sent
                        $emailQueue[$index]['status'] = 'sent';
                        $emailQueue[$index]['sent_at'] = date('Y-m-d H:i:s');
                        $processed++;
                    }
                }
            }
            
            saveEmailQueue($emailQueue);
            
            echo json_encode([
                'success' => true,
                'processed' => $processed,
                'message' => "Processed $processed emails"
            ]);
            break;
            
        default:
            throw new Exception('Invalid action');
    }
    
} catch (Exception $e) {
    error_log('Email automation error: ' . $e->getMessage());
    
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>

