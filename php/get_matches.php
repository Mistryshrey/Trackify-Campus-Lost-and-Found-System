<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

// Get user identifier - email (from JS) or user_id
$email  = $_GET['email']   ?? null;
$userId = $_GET['user_id'] ?? 1;

// If email provided, look up user_id
if ($email) {
    try {
        $stmt = $pdo->prepare("SELECT user_id FROM users WHERE email = :email LIMIT 1");
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();
        if ($user) {
            $userId = $user['user_id'];
        }
    } catch (PDOException $e) {
        // users table may not exist yet — fall back to default userId
        error_log('User lookup error: ' . $e->getMessage());
    }
}

$response = [
    'lost_items'  => [],
    'found_items' => [],
    'matches'     => []
];

try {
    // ── 1. Lost items reported by this user ──────────────────────────────────
    $stmt = $pdo->prepare(
        "SELECT 
            item_id    AS id,
            category,
            item_name  AS itemName,
            description,
            color,
            brand,
            model,
            image_path AS image,
            location_lost AS location,
            lost_date  AS date,
            lost_time  AS time,
            verification_code AS verificationCode,
            contact_name,
            contact_email,
            contact_phone,
            additional_info,
            status,
            created_at AS dateReported
        FROM lost_items
        WHERE user_id = :user_id
        ORDER BY created_at DESC"
    );
    $stmt->execute([':user_id' => $userId]);
    $response['lost_items'] = $stmt->fetchAll();

    // ── 2. Found items reported by this user ─────────────────────────────────
    $stmt = $pdo->prepare(
        "SELECT 
            item_id       AS id,
            category,
            item_name     AS itemName,
            description,
            color,
            brand,
            model,
            image_path    AS image,
            location_found AS location,
            found_date    AS date,
            found_time    AS time,
            verification_code AS verificationCode,
            storage_location,
            contact_name,
            contact_email,
            contact_phone,
            additional_info,
            status,
            created_at    AS dateReported
        FROM found_items
        WHERE user_id = :user_id
        ORDER BY created_at DESC"
    );
    $stmt->execute([':user_id' => $userId]);
    $response['found_items'] = $stmt->fetchAll();

    // ── 3. Matches involving this user's items ───────────────────────────────
    $stmt = $pdo->prepare(
        "SELECT 
            m.match_id,
            m.match_score   AS matchScore,
            m.match_status  AS status,
            m.match_date    AS matchDate,
            m.failed_attempts,
            m.is_locked,

            li.item_id      AS lost_item_id,
            li.item_name    AS itemName,
            li.category,
            li.description,
            li.color,
            li.location_lost AS location,
            li.lost_date    AS date,
            li.verification_code AS verificationCode,

            fi.item_id      AS found_item_id,
            fi.item_name    AS found_item_name,
            fi.location_found,
            fi.found_date,
            fi.storage_location,
            fi.contact_name AS finder_name,
            fi.contact_email AS finder_email,
            fi.contact_phone AS finder_phone
        FROM matches m
        JOIN lost_items  li ON m.lost_item_id  = li.item_id
        JOIN found_items fi ON m.found_item_id = fi.item_id
        WHERE (li.user_id = :user_id OR fi.user_id = :user_id)
          AND m.match_status != 'dismissed'
        ORDER BY m.match_score DESC, m.match_date DESC"
    );
    $stmt->execute([':user_id' => $userId]);
    $matches = $stmt->fetchAll();

    // Shape matches to what dashboard.js expects
    foreach ($matches as &$match) {
        $match['id']      = $match['match_id'];
        $match['status']  = $match['status'] ?? 'matched';
    }

    $response['matches'] = $matches;

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    exit;
}

echo json_encode($response);
?>