<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$passtxt = file('mysql_credentials.txt');
$dbname   = trim(substr($passtxt[1], 9));
$username = trim(substr($passtxt[2], 9));
$password = trim(substr($passtxt[3], 9));
$host = 'localhost';

$conn = mysqli_connect($host, $username, $password, $dbname);

if (!$conn) {
    die('Connection failed: ' . mysqli_connect_error());
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['catalog']) && isset($_POST['mid'])) {

    // Convert missing parameters to NULL
    $ra_mbcg = isset($_POST['ra_mbcg']) ? $_POST['ra_mbcg'] : null;
    $dec_mbcg = isset($_POST['dec_mbcg']) ? $_POST['dec_mbcg'] : null;
    $mid = $_POST['mid'];
    
    // Build the query based on whether ra_mbcg and dec_mbcg are NULL
    if (is_null($ra_mbcg) && is_null($dec_mbcg)) {
        // Both are NULL, so set them to NULL in the query
        $query = "UPDATE ${_POST['catalog']}CLUSTERS SET RA_MBCG = NULL, DEC_MBCG = NULL WHERE MEM_MATCH_ID = ?";
        $stmt = mysqli_prepare($conn, $query);
        mysqli_stmt_bind_param($stmt, 's', $mid);
    } else {
        // Both have values, so use placeholders
        $query = "UPDATE ${_POST['catalog']}CLUSTERS SET RA_MBCG = ?, DEC_MBCG = ? WHERE MEM_MATCH_ID = ?";
        $stmt = mysqli_prepare($conn, $query);
        mysqli_stmt_bind_param($stmt, 'dds', $ra_mbcg, $dec_mbcg, $mid);
    }

    // Execute the statement and return the response
    if (mysqli_stmt_execute($stmt)) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "error" => mysqli_error($conn)]);
    }

    mysqli_stmt_close($stmt);
} else {
    echo json_encode(["success" => false, "error" => "Invalid request"]);
}

mysqli_close($conn);
?>
