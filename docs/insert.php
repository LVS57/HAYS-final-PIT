<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
date_default_timezone_set('Asia/Manila');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit();

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['list'])) {
    $conn = new mysqli("localhost", "root", "", "4r6_hays");
    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(["error" => "DB connection failed: " . $conn->connect_error]);
        exit();
    }

    if ($_GET['list'] === 'registered') {
        $res = $conn->query("SELECT rfid_tag, status, last_update FROM rfid_registered ORDER BY last_update DESC");
        $rows = [];
        if ($res) while ($r = $res->fetch_assoc()) $rows[] = $r;
        echo json_encode(["rfids" => $rows]);
        $conn->close();
        exit();
    }

    if ($_GET['list'] === 'logs') {
        $res = $conn->query("SELECT id, rfid_tag, status, timestamp FROM rfid_logs ORDER BY timestamp DESC LIMIT 100");
        $rows = [];
        if ($res) while ($r = $res->fetch_assoc()) $rows[] = $r;
        echo json_encode(["logs" => $rows]);
        $conn->close();
        exit();
    }

    http_response_code(400);
    echo json_encode(["error" => "Unknown list"]);
    exit();
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data || !isset($data['rfid_data'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing rfid_data"]);
    exit();
}

$rfid = trim($data['rfid_data']);
if ($rfid === '') {
    http_response_code(400);
    echo json_encode(["error" => "Empty RFID"]);
    exit();
}

$conn = new mysqli("localhost", "root", "", "4r6_hays");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "DB connection failed"]);
    exit();
}

$res = $conn->query("SELECT status FROM rfid_registered WHERE rfid_tag='$rfid'");

if ($res && $res->num_rows) {
    $row = $res->fetch_assoc();
    $current_status = (int)$row['status'];
    $new_status = $current_status ? 0 : 1;

    $conn->query("UPDATE rfid_registered SET status=$new_status, last_update=NOW() WHERE rfid_tag='$rfid'");

    echo json_encode([
        "rfid_tag" => $rfid,
        "rfid_status" => $new_status,
        "message" => "RFID updated successfully"
    ]);
} else {
    $conn->query("INSERT INTO rfid_logs (rfid_tag, status, timestamp) VALUES ('$rfid', NULL, NOW())");

    echo json_encode([
        "rfid_tag" => $rfid,
        "message" => "RFID NOT FOUND"
    ]);
}

$conn->close();
?>
