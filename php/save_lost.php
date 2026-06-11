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
        ':user_id' => $_SESSION['user_id'] ?? 1, // Temp: get from session
        ':verification_code' => $verificationCode,
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
?>