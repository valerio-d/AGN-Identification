<?php
  if (count($_GET) > 0){
  
    $objname = $_GET['objname'] ?? null;
    $sra = $_GET['sra'] ?? null;
    $sde = $_GET['sde'] ?? null;
    if(isset($_GET['dist'])){
      $dist = $_GET['dist'];
    }elseif($objname || ($sra && $sde)){
      $dist = 20.;
    }
    $name = $_GET['name'] ?? null;
    $name = rawurldecode($name);
    $bestzmin = $_GET['bestzmin'] ?? null;
    $bestzmax = $_GET['bestzmax'] ?? null;
    $extlikemin = $_GET['extlikemin'] ?? null;
    $extlikemax = $_GET['extlikemax'] ?? null;
    $extlikemin = $_GET['extlikemin'] ?? null;
    $extlikemax = $_GET['extlikemax'] ?? null;
    $extlikemin = $_GET['extlikemin'] ?? null;
    $extlikemax = $_GET['extlikemax'] ?? null;
    $pcontmin = $_GET['pcontmin'] ?? null;
    $pcontmax = $_GET['pcontmax'] ?? null;
    $catalog = $_GET['catalog'] ?? 'ERASS1A';
    $in_footprint = intval($_GET['in_footprint'] ?? 2);
    $in_zvlim = intval($_GET['in_zvlim'] ?? 2);
    $in_xgood = intval($_GET['in_xgood'] ?? 2);
    $split_cleaned = intval($_GET['split_cleaned'] ?? 2);
    $visual_contamination = intval($_GET['visual_contamination'] ?? 2);
    $cosmo = intval($_GET['cosmo'] ?? 2);
    $day_mode = intval($_GET['day_mode'] ?? 0);
    $survey = $_GET['survey'] ?? "LS";
    $members = intval($_GET['members'] ?? 1);
    $sz = intval($_GET['sz'] ?? 0);
    $xray = intval($_GET['xray'] ?? 1);
  
  }elseif(isset($_POST['submit'])) {
    $sra  = $_POST['sra'];
    $sde  = $_POST['sde'];
    $dist = $_POST['dist'];
    $bestzmin = $_POST['bestzmin'];
    $bestzmax = $_POST['bestzmax'];
    $extlikemin = $_POST['extlikemin'];
    $extlikemax = $_POST['extlikemax'];
    $extlikemin = $_POST['extlikemin'];
    $extlikemax = $_POST['extlikemax'];
    $name  = $_POST['name'];
    $catalog = $_POST['catalog'];
    $day_mode = $_POST['day_mode'];
    $survey = $_POST['survey'];
    $members = $_POST['members'];
    $xray = $_POST['xray'];
    $sz = $_POST['sz'];


    if (empty($_POST['extlikemin'])) {
       $extlikemin = false;}
    else{
        $extlikemin = $_POST['extlikemin'];
    }
    if (empty($_POST['extlikemax'])) {
       $extlikemax = false;}
    else{
        $extlikemax = $_POST['extlikemax'];
    }
  
    if (empty($_POST['pcontmin'])) {
       $pcontmin = false;}
    else{
        $pcontmin = $_POST['pcontmin'];
    }
    if (empty($_POST['pcontmax'])) {
       $pcontmax = false;}
    else{
        $pcontmax = $_POST['pcontmax'];
    }
    
    if (!isset($_POST['in_footprint'])) {
        $in_footprint = 2;
    } elseif ($_POST['in_footprint'] === "1") {
        $in_footprint = 1;
    } elseif ($_POST['in_footprint'] === "0") {
        $in_footprint = 0;
    } else {
        $in_footprint = 2;
    }

    /*if (empty($_POST['in_footprint'])) {
       $in_footprint = false;}
    else{
       $in_footprint = true;
    }
    if (empty($_POST['not_in_footprint'])) {
       $not_in_footprint = false;}
    else{
       $not_in_footprint = true;
    }*/
  
    //if (empty($_POST['in_zvlim'])) {
    //   $in_zvlim = false;}
    //else{
    //   $in_zvlim = true;
    //}
    //if (empty($_POST['not_in_zvlim'])) {
    //   $not_in_zvlim = false;}
    //else{
    //   $not_in_zvlim = true;
    //}
  
    /*if (empty($_POST['in_xgood'])) {
       $in_xgood = false;}
    else{
       $in_xgood = true;
    }
    if (empty($_POST['split_cleaned'])) {
       $split_cleaned = false;}
    else{
       $split_cleaned = true;
    }*/
    
    if (!isset($_POST['in_xgood'])) {
        $in_xgood = 2;
    } elseif ($_POST['in_xgood'] === "1") {
        $in_xgood = 1;
    } elseif ($_POST['in_xgood'] === "0") {
        $in_xgood = 0;
    } else {
        $in_xgood = 2;
    }

    if (!isset($_POST['split_cleaned'])) {
        $split_cleaned = 2;
    } elseif ($_POST['split_cleaned'] === "1") {
        $split_cleaned = 1;
    } elseif ($_POST['split_cleaned'] === "0") {
        $split_cleaned = 0;
    } else {
        $split_cleaned = 2;
    }

    if (!isset($_POST['in_zvlim'])) {
        $in_zvlim = 2;
    } elseif ($_POST['in_zvlim'] === "1") {
        $in_zvlim = 1;
    } elseif ($_POST['in_zvlim'] === "0") {
        $in_zvlim = 0;
    } else {
        $in_zvlim = 2;
    }

    if (!isset($_POST['visual_contamination'])) {
        $visual_contamination = 2;
    } elseif ($_POST['visual_contamination'] === "1") {
        $visual_contamination = 1;
    } elseif ($_POST['visual_contamination'] === "0") {
        $visual_contamination = 0;
    } else {
        $visual_contamination = 2;
    }

    if (!isset($_POST['cosmo'])) {
        $cosmo = 2;
    } elseif ($_POST['cosmo'] === "1") {
        $cosmo = 1;
    } elseif ($_POST['cosmo'] === "0") {
        $cosmo = 0;
    } else {
        $cosmo = 2;
    }

  
    //$in_footprint = $_POST['in_footprint'];
    //$not_in_footprint = $_POST['not_in_footprint'];
    //$in_zvlim = $_POST['in_zvlim'];
    //$not_in_zvlim = $_POST['not_in_zvlim'];
    $objname = $_POST['objname'];
  }else{
    $objname = "";
    $survey = "LS";
  }
  
  // replace dashes (long -) with hyphens (short -)
  $objname = str_replace(["\xE2\x80\x93","\xE2\x88\x92"], "-", $objname);
  $objname = trim(str_replace(',', ' ', $objname));

  // read $sra and $sde from strings like J124849.7-411839
  if (preg_match("/^(?:1eRASS\s*)?J([0-9]{2})([0-9]{2})([0-9]{2}\.?[0-9]?)([+|-])([0-9]{2})([0-9]{2})([0-9]{2})/", $objname, $matches)) {
    $sra = $matches[1] . ':' . $matches[2] . ':' . $matches[3];
    $sde = $matches[5] . ':' . $matches[6] . ':' . $matches[7];
    $sde = $matches[4] == '-' ? '-' . $sde : $sde;
  // or 09 13 45 +40 56 28 or 09:13:45 +40:56:28
  //}elseif (preg_match("/^([0-9]{2})\s+([0-9]{2})\s+([0-9]{2}\.?[0-9]*)\s*([+-])\s*([0-9]{2})\s+([0-9]{2})\s+([0-9]{2}\.?[0-9]*)$/", $objname, $matches)) {
  }elseif (preg_match("/^([0-9]{2})[:\s]?([0-9]{2})[:\s]?([0-9]{2}\.?[0-9]*)\s*([+-]?)([0-9]{2})[:\s]?([0-9]{2})[:\s]?([0-9]{2}\.?[0-9]*)$/", $objname, $matches)) {
    $sra = $matches[1] . ':' . $matches[2] . ':' . $matches[3];
    $sde = $matches[5] . ':' . $matches[6] . ':' . $matches[7];
    $sde = $matches[4] == '-' ? '-' . $sde : $sde;
  } elseif (preg_match("/^([0-9]+(?:\.[0-9]+)?)\s+([+-]?[0-9]+(?:\.[0-9]+)?)$/", $objname, $matches)) {
    $sra = $matches[1];
    $sde = $matches[2];
  }elseif( count($_GET) > 0 || isset($_POST['submit']) ){
  
    if($objname != ""){
      $qobjname = urlencode($objname);
      $url = "http://simbad.u-strasbg.fr/simbad/sim-tap/sync?request=doQuery&lang=adql&format=tsv&query=SELECT%20RA,%20DEC%20FROM%20basic%20JOIN%20ident%20ON%20oidref%20=%20oid%20WHERE%20id='$qobjname';";
      $coordinates = file_get_contents($url);
      echo "<script>document.getElementById('coordinates').innerHTML = '$coordinates';</script>";
      $coordinates = explode("\n", $coordinates)[1];
      $coordinates = explode("\t", $coordinates);
      
      $sra = $coordinates[0];
      $sde = $coordinates[1];
      
      if (empty($sra)) {
        $sra = "None";
        $sde = "None";
      }
    }
  
  }else{
     $objname = "";
     $name  = "";
     $bestzmin= "";
     $bestzmax= "";
     $extlikemin = "";
     $extlikemax = "";
     $extlikemin = "";
     $extlikemax = "";
     $pcontmin = "";
     $pcontmax = "";
     $catalog = "ERASS1A";
  	 $dist = "20";
     //$sra = 3.5834583333333;
     //$sde = -30.388277777778;
     $sra = "";
     $sde = "";
  	 $in_footprint = 2;
  	 //$not_in_footprint = 1;
  	 $in_zvlim = 2;
  	 //$not_in_zvlim = 1;
  	 $in_xgood = 2;
  	 $split_cleaned = 2;
  	 $visual_contamination = 2;
  	 $cosmo = 2;
  	 $day_mode = 0;
     $survey = "LS";
  	 $members = 1;
  	 $xray = 1;
     $sz = 0;
  }
  
  $sra = trim($sra);
  $sde = trim($sde);
  $sde = str_replace("\xE2\x80\x93", "-", $sde);
  if (str_contains($sra, ":")){
    list($hh, $mm, $ss) = explode(':', $sra);
    $sra = ($hh + ($mm/60) + ($ss/3600)) * 15;
  }elseif (str_contains($sra, " ")){
    list($hh, $mm, $ss) = explode(' ', $sra);
    $sra = ($hh + ($mm/60) + ($ss/3600)) * 15;
  }
  
  if (str_contains($sde, ":")){
    list($dd, $mm, $ss) = explode(':', $sde);
    $sign = ($sde[0] === '-') ? -1 : 1;
    $sde = ltrim($sde, '+-');
    list($dd, $mm, $ss) = explode(':', $sde);
    $sde = $sign * ((float)$dd + ($mm/60) + ($ss/3600));
  }elseif (str_contains($sde, " ")){
    list($dd, $mm, $ss) = explode(' ', $sde);
    $sign = ($sde[0] === '-') ? -1 : 1;
    $sde = ltrim($sde, '+-');
    list($dd, $mm, $ss) = explode(' ', $sde);
    $sde = $sign * ((float)$dd + ($mm/60) + ($ss/3600));
  }
?>