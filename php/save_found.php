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

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON data']);
    exit;
}

// Validate required fields
$required = ['category', 'item_name', 'description', 'color', 'location', 'date', 'contact_name', 'contact_email'];
foreach ($required as $field) {
    if (empty($data[$field])) {
        http_response_code(400);
        echo json_encode(['error' => "Missing required field: $field"]);
        exit;
    }
}

// Handle image: if base64 is sent, save it as a file instead of storing in DB
$imagePath = null;
if (!empty($data['image']) && strpos($data['image'], 'data:image') === 0) {
    // Decode base64 image and save to uploads folder
    $imageData = $data['image'];
    $imageData = str_replace(' ', '+', $imageData);
    $imageParts = explode(';base64,', $imageData);
    $imageTypeAux = explode('image/', $imageParts[0]);
    $imageType = strtolower($imageTypeAux[1]); // jpg, png, etc.

    // FIX: Strict Whitelist to prevent Remote Code Execution (RCE)
    $allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (!in_array($imageType, $allowedTypes)) {
        http_response_code(400);
        echo json_encode(['error' => 'Security Error: Invalid image format. Only JPG, PNG, GIF, and WEBP are allowed.']);
        exit;
    }

    $imageBase64 = base64_decode($imageParts[1]);

    $uploadDir = '../uploads/found/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $fileName = 'found_' . time() . '_' . rand(1000, 9999) . '.' . $imageType;
    $filePath = $uploadDir . $fileName;

    if (file_put_contents($filePath, $imageBase64)) {
        $imagePath = 'uploads/found/' . $fileName;
    }
}

$verificationCode = strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));

// FIX: Look up or create user based on their contact email
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

$sql = "INSERT INTO found_items (
    user_id, verification_code, category, item_name, description, color,
    brand, model, image_path, location_found, found_date, found_time,
    storage_location, contact_name, contact_email, contact_phone,
    additional_info, status
) VALUES (
    :user_id, :verification_code, :category, :item_name, :description, :color,
    :brand, :model, :image_path, :location_found, :found_date, :found_time,
    :storage_location, :contact_name, :contact_email, :contact_phone,
    :additional_info, 'active'
)";

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':user_id'          => $userId,
        ':verification_code'=> $verificationCode,
        ':category'         => $data['category'],
        ':item_name'        => $data['item_name'],
        ':description'      => $data['description'],
        ':color'            => $data['color'],
        ':brand'            => $data['brand'] ?? null,
        ':model'            => $data['model'] ?? null,
        ':image_path'       => $imagePath,
        ':location_found'   => $data['location'],
        ':found_date'       => $data['date'],
        ':found_time'       => $data['time'] ?? null,
        ':storage_location' => $data['storage_location'] ?? null,
        ':contact_name'     => $data['contact_name'],
        ':contact_email'    => $data['contact_email'],
        ':contact_phone'    => $data['contact_phone'] ?? null,
        ':additional_info'  => $data['additional_info'] ?? null
    ]);

    $itemId = $pdo->lastInsertId();

    // Trigger automatic matching after saving
    triggerMatching($itemId, $pdo);

    echo json_encode([
        'success'           => true,
        'item_id'           => $itemId,
        'verification_code' => $verificationCode,
        'message'           => 'Found item reported successfully'
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}

// Auto-matching: compare new found item against all active lost items
function triggerMatching($foundItemId, $pdo) {
    try {
        // Get the found item
        $stmt = $pdo->prepare("SELECT * FROM found_items WHERE item_id = :id");
        $stmt->execute([':id' => $foundItemId]);
        $foundItem = $stmt->fetch();

        if (!$foundItem) return;

        // Get all active lost items
        $stmt = $pdo->prepare("SELECT * FROM lost_items WHERE status = 'active'");
        $stmt->execute();
        $lostItems = $stmt->fetchAll();

        foreach ($lostItems as $lostItem) {
            $score = calculateMatchScore($foundItem, $lostItem);

            // Only save if score is above threshold (e.g. 40%)
            if ($score >= 40) {
                // Check if match already exists
                $checkStmt = $pdo->prepare(
                    "SELECT match_id FROM matches 
                     WHERE lost_item_id = :lost_id AND found_item_id = :found_id"
                );
                $checkStmt->execute([
                    ':lost_id'  => $lostItem['item_id'],
                    ':found_id' => $foundItemId
                ]);

                if (!$checkStmt->fetch()) {
                    $insertStmt = $pdo->prepare(
                        "INSERT INTO matches (lost_item_id, found_item_id, match_score, match_status, match_date)
                         VALUES (:lost_id, :found_id, :score, 'pending', NOW())"
                    );
                    $insertStmt->execute([
                        ':lost_id'  => $lostItem['item_id'],
                        ':found_id' => $foundItemId,
                        ':score'    => $score
                    ]);
                }
            }
        }
    } catch (PDOException $e) {
        // Don't block the main response if matching fails
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