<?php
  $passtxt = file('mysql_credentials.txt');
  $dbname   = trim(substr($passtxt[1],9));
  $username = trim(substr($passtxt[2],9));
  $password = trim(substr($passtxt[3],9));
  $host = 'localhost';

  $conn = mysqli_connect($host, $username, $password, $dbname);

  if (!$conn) {
    die('Connection failed: ' . mysqli_connect_error());
  }
  $query = $_POST['query'];
  $result = mysqli_query($conn, $query);
  //$res = mysqli_fetch_all($result);

  if ($result){
    while ($row = mysqli_fetch_assoc($result))
    {
      printf("%.5f %.5f %.2f %.2f %b %.5f %s %s <br>", $row['RA'], $row['DE'], $row['PMEM'], $row['REFMAG'], $row['CG'], $row['ZSPEC'], $row['ZSPEC_REF'], $row['BCG_SCORE']);
    }
  } else {
    echo "Query error: " . mysqli_error($conn);
  }
  
  mysqli_close($conn);
?>