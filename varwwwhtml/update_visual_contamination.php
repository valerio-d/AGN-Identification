<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$passtxt = file('mysql_credentials.txt');
$dbname   = trim(substr($passtxt[1],9));
$username = trim(substr($passtxt[2],9));
$password = trim(substr($passtxt[3],9));
$host = 'localhost';

$conn = mysqli_connect($host, $username, $password, $dbname);

if (!$conn) {
    die('Connection failed: ' . mysqli_connect_error());
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['catalog']) && isset($_POST['visual_contamination']) && isset($_POST['mid']) ) {

    $query = "UPDATE ${_POST['catalog']}CLUSTERS SET VISUAL_CONTAMINATION = ? WHERE MEM_MATCH_ID = ?";
    $stmt = mysqli_prepare($conn, $query);

    mysqli_stmt_bind_param($stmt, 'is', $_POST['visual_contamination'], $_POST['mid']);

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