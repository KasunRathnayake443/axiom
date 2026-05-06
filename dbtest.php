<?php
// DELETE THIS FILE after testing

$host = 'localhost';
$name = 'beesxhxy_axiom_db';
$user = 'beesxhxy_axiom_db_user';
$pass = 'axgdbuser1234'; // paste exact password here

echo "<h2>Connection Test</h2>";
try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$name;charset=utf8mb4",
        $user,
        $pass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    echo "✅ Connected successfully!<br>";

    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "Tables: " . implode(', ', $tables) . "<br>";

} catch (PDOException $e) {
    echo "❌ Failed: " . $e->getMessage() . "<br>";
}