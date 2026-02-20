<?php
/**
 * Email Queue Processor for Digital Grandpa
 * 
 * This script processes pending emails in the automation queue.
 * Should be run via cron job every 15 minutes.
 * 
 * Usage: php process-email-queue.php
 * Cron: */15 * * * * /usr/bin/php /path/to/web/root/process-email-queue.php
 */

// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Set timezone
date_default_timezone_set('America/New_York');

// Include the email automation system
require_once 'integrated-email-automation.php';

// Log start of processing
error_log('Email queue processing started at ' . date('Y-m-d H:i:s'));

try {
    // Simulate the POST request to process the queue
    $_SERVER['REQUEST_METHOD'] = 'POST';
    
    // Create the request data
    $requestData = json_encode([
        'action' => 'process_queue'
    ]);
    
    // Simulate the input stream
    $tempFile = tmpfile();
    fwrite($tempFile, $requestData);
    rewind($tempFile);
    
    // Override the input stream
    $originalInput = 'php://input';
    stream_wrapper_unregister('php');
    stream_wrapper_register('php', 'MockPhpInputStream');
    MockPhpInputStream::$data = $requestData;
    
    // Process the queue by including the automation script
    ob_start();
    include 'integrated-email-automation.php';
    $output = ob_get_clean();
    
    // Restore the original input stream
    stream_wrapper_restore('php');
    
    // Parse the response
    $response = json_decode($output, true);
    
    if ($response && isset($response['processed'])) {
        error_log('Email queue processing completed. Processed: ' . $response['processed'] . ' emails');
    } else {
        error_log('Email queue processing completed with unknown result: ' . $output);
    }
    
} catch (Exception $e) {
    error_log('Email queue processing error: ' . $e->getMessage());
} catch (Error $e) {
    error_log('Email queue processing fatal error: ' . $e->getMessage());
}

// Log end of processing
error_log('Email queue processing finished at ' . date('Y-m-d H:i:s'));

/**
 * Mock class to simulate php://input for cron job processing
 */
class MockPhpInputStream {
    public static $data = '';
    private $position = 0;
    
    public function stream_open($path, $mode, $options, &$opened_path) {
        $this->position = 0;
        return true;
    }
    
    public function stream_read($count) {
        $ret = substr(self::$data, $this->position, $count);
        $this->position += strlen($ret);
        return $ret;
    }
    
    public function stream_eof() {
        return $this->position >= strlen(self::$data);
    }
    
    public function stream_stat() {
        return array();
    }
    
    public function stream_tell() {
        return $this->position;
    }
    
    public function stream_seek($offset, $whence) {
        switch ($whence) {
            case SEEK_SET:
                $this->position = $offset;
                break;
            case SEEK_CUR:
                $this->position += $offset;
                break;
            case SEEK_END:
                $this->position = strlen(self::$data) + $offset;
                break;
        }
        return true;
    }
}
?>

