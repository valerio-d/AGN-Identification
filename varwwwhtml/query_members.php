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
      printf("%s %s %s %s %s %s %s %s %s %s %s %s %s %s %s <br>", $row['MEM_MATCH_ID'], $row['RA'], $row['DE'], $row['g'], $row['r'], $row['z'], $row['w1'], $row['w2'], $row['Xray_proba'], $row['NWAY_bias_Xray_proba'], $row['NWAY_Separation_ERO'], $row['NWAY_p_single'], $row['NWAY_p_any'], $row['NWAY_p_i'], $row['NWAY_match_flag']);
      
    }
  } else {
    echo "Query error: " . mysqli_error($conn);
  }
  
  mysqli_close($conn);
?>