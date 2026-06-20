<?php
require_once 'db_connect.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

// Generate verification code
$verificationCode = strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));

// Hash the secret answer for security
$hashedAnswer = password_hash($data['verification_answer'], PASSWORD_DEFAULT);
$userEmail = $data['contact_email'];
$stmt = $pdo->prepare("SELECT user_id FROM users WHERE email = :email");
$stmt->execute([':email' => $userEmail]);
$user = $stmt->fetch();

if ($user) {
    $userId = $user['user_id'];
} else {
    $stmt = $pdo->prepare("INSERT INTO users (email) VALUES (:email)");
    $stmt->execute([':email' => $userEmail]);
    $userId = $pdo->lastInsertId();
}

$sql = "INSERT INTO lost_items (
    user_id, verification_code, category, item_name, description, color, 
    brand, model, image_path, location_lost, lost_date, lost_time,
    verification_type, verification_question, verification_answer_hash,
    contact_name, contact_email, contact_phone, additional_info, status
) VALUES (
    :user_id, :verification_code, :category, :item_name, :description, :color,
    :brand, :model, :image_path, :location_lost, :lost_date, :lost_time,
    :verification_type, :verification_question, :verification_answer_hash,
    :contact_name, :contact_email, :contact_phone, :additional_info, 'active'
)";

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':user_id' => $userId, 
        ':category' => $data['category'],
        ':item_name' => $data['item_name'],
        ':description' => $data['description'],
        ':color' => $data['color'],
        ':brand' => $data['brand'] ?? null,
        ':model' => $data['model'] ?? null,
        ':image_path' => $data['image_path'] ?? null,
        ':location_lost' => $data['location'],
        ':lost_date' => $data['date'],
        ':lost_time' => $data['time'],
        ':verification_type' => $data['verification_type'],
        ':verification_question' => $data['verification_question'],
        ':verification_answer_hash' => $hashedAnswer,
        ':contact_name' => $data['contact_name'],
        ':contact_email' => $data['contact_email'],
        ':contact_phone' => $data['contact_phone'] ?? null,
        ':additional_info' => $data['additional_info'] ?? null
    ]);
    
    $itemId = $pdo->lastInsertId();
    triggerMatching($itemId, $pdo);
    echo json_encode([
        'success' => true,
        'item_id' => $itemId,
        'verification_code' => $verificationCode,
        'message' => 'Lost item reported successfully'
    ]);
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
function triggerMatching($lostItemId, $pdo) {
    try {
        // Get the new lost item
        $stmt = $pdo->prepare("SELECT * FROM lost_items WHERE item_id = :id");
        $stmt->execute([':id' => $lostItemId]);
        $lostItem = $stmt->fetch();

        if (!$lostItem) return;

        // Get all active found items
        $stmt = $pdo->prepare("SELECT * FROM found_items WHERE status = 'active'");
        $stmt->execute();
        $foundItems = $stmt->fetchAll();

        foreach ($foundItems as $foundItem) {
            $score = calculateMatchScore($foundItem, $lostItem);

            // Only save if score is above threshold (e.g. 40%)
            if ($score >= 40) {
                // Check if match already exists
                $checkStmt = $pdo->prepare(
                    "SELECT match_id FROM matches 
                     WHERE lost_item_id = :lost_id AND found_item_id = :found_id"
                );
                $checkStmt->execute([
                    ':lost_id'  => $lostItemId,
                    ':found_id' => $foundItem['item_id']
                ]);

                if (!$checkStmt->fetch()) {
                    $insertStmt = $pdo->prepare(
                        "INSERT INTO matches (lost_item_id, found_item_id, match_score, match_status, match_date)
                         VALUES (:lost_id, :found_id, :score, 'pending', NOW())"
                    );
                    $insertStmt->execute([
                        ':lost_id'  => $lostItemId,
                        ':found_id' => $foundItem['item_id'],
                        ':score'    => $score
                    ]);
                }
            }
        }
    } catch (PDOException $e) {
        error_log('Matching error: ' . $e->getMessage());
    }
}

function calculateMatchScore($foundItem, $lostItem) {
    $score = 0;

    // Category match (most important - 40 pts)
    if (strtolower($foundItem['category']) === strtolower($lostItem['category'])) {
        $score += 40;
    }

    // Color match (20 pts)
    if (!empty($foundItem['color']) && !empty($lostItem['color'])) {
        if (strtolower($foundItem['color']) === strtolower($lostItem['color'])) {
            $score += 20;
        }
    }

    // Brand match (15 pts)
    if (!empty($foundItem['brand']) && !empty($lostItem['brand'])) {
        if (strtolower($foundItem['brand']) === strtolower($lostItem['brand'])) {
            $score += 15;
        }
    }

    // Location proximity (15 pts) - simple keyword match
    if (!empty($foundItem['location_found']) && !empty($lostItem['location_lost'])) {
        $foundLoc = strtolower($foundItem['location_found']);
        $lostLoc  = strtolower($lostItem['location_lost']);
        if (strpos($foundLoc, $lostLoc) !== false || strpos($lostLoc, $foundLoc) !== false) {
            $score += 15;
        }
    }

    // Item name similarity (10 pts)
    if (!empty($foundItem['item_name']) && !empty($lostItem['item_name'])) {
        similar_text(
            strtolower($foundItem['item_name']),
            strtolower($lostItem['item_name']),
            $percent
        );
        if ($percent >= 70) {
            $score += 10;
        }
    }

    return min($score, 100); // Cap at 100
}
?>
