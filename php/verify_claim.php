<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$matchId = $data['match_id'];
$verificationCode = $data['verification_code'];
$secretAnswer = $data['secret_answer'];

// Log this attempt
$logSql = "INSERT INTO verification_attempts (match_id, user_email, verification_code_entered, secret_answer_entered, ip_address, user_agent)
           VALUES (:match_id, :email, :code, :answer, :ip, :agent)";

$ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'];
$agent = $_SERVER['HTTP_USER_AGENT'];

$stmt = $pdo->prepare($logSql);
$stmt->execute([
    ':match_id' => $matchId,
    ':email' => $data['email'],
    ':code' => $verificationCode,
    ':answer' => $secretAnswer,
    ':ip' => $ip,
    ':agent' => $agent
]);

// Get match details
$matchSql = "SELECT m.*, li.verification_code, li.verification_answer_hash, li.contact_email 
             FROM matches m
             JOIN lost_items li ON m.lost_item_id = li.item_id
             WHERE m.match_id = :match_id";

$stmt = $pdo->prepare($matchSql);
$stmt->execute([':match_id' => $matchId]);
$match = $stmt->fetch();

if (!$match) {
    echo json_encode(['success' => false, 'error' => 'Match not found']);
    exit;
}

// Check verification code
if ($verificationCode !== $match['verification_code']) {
    // Increment failed attempts
    $updateSql = "UPDATE matches SET failed_attempts = failed_attempts + 1 
                  WHERE match_id = :match_id";
    $stmt = $pdo->prepare($updateSql);
    $stmt->execute([':match_id' => $matchId]);
    
    echo json_encode(['success' => false, 'error' => 'Invalid verification code']);
    exit;
}

// Check secret answer
if (!password_verify($secretAnswer, $match['verification_answer_hash'])) {
    $updateSql = "UPDATE matches SET failed_attempts = failed_attempts + 1 
                  WHERE match_id = :match_id";
    $stmt = $pdo->prepare($updateSql);
    $stmt->execute([':match_id' => $matchId]);
    
    // Lock after 3 failures
    $failCount = $match['failed_attempts'] + 1;
    if ($failCount >= 3) {
        $lockSql = "UPDATE matches SET is_locked = TRUE, locked_reason = 'Too many failed attempts' 
                    WHERE match_id = :match_id";
        $stmt = $pdo->prepare($lockSql);
        $stmt->execute([':match_id' => $matchId]);
        echo json_encode(['success' => false, 'error' => 'Claim locked due to too many failures']);
        exit;
    }
    
    echo json_encode(['success' => false, 'error' => 'Invalid secret answer', 'attempts_left' => 3 - $failCount]);
    exit;
}

// Success! Update match status
$updateSql = "UPDATE matches SET match_status = 'claimed', claim_date = NOW() 
              WHERE match_id = :match_id";
$stmt = $pdo->prepare($updateSql);
$stmt->execute([':match_id' => $matchId]);

// FIX: Prevent Zombie Items by resolving the original lost and found records
$updateLost = "UPDATE lost_items SET status = 'resolved' WHERE item_id = :lost_id";
$stmtLost = $pdo->prepare($updateLost);
$stmtLost->execute([':lost_id' => $match['lost_item_id']]);

$updateFound = "UPDATE found_items SET status = 'resolved' WHERE item_id = :found_id";
$stmtFound = $pdo->prepare($updateFound);
$stmtFound->execute([':found_id' => $match['found_item_id']]);

// Update this log as successful
$successSql = "UPDATE verification_attempts SET was_successful = TRUE 
               WHERE match_id = :match_id ORDER BY attempt_id DESC LIMIT 1";
$stmt = $pdo->prepare($successSql);
$stmt->execute([':match_id' => $matchId]);

// Get finder contact info
$finderSql = "SELECT fi.contact_name, fi.contact_email, fi.contact_phone, fi.storage_location
              FROM found_items fi
              JOIN matches m ON m.found_item_id = fi.item_id
              WHERE m.match_id = :match_id";
$stmt = $pdo->prepare($finderSql);
$stmt->execute([':match_id' => $matchId]);
$finder = $stmt->fetch();

echo json_encode([
    'success' => true,
    'message' => 'Verification successful!',
    'finder_info' => $finder
]);
?>