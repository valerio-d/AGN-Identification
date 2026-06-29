<!DOCTYPE html>
<html>
  <head>
    <title>Euclid Cluster Inspector (private)</title>

    <link rel="icon" href="favicon.png" type="image/x-icon">

    <?php include 'read_url_params.php'; ?>

    <link rel="stylesheet" type="text/css" href="styles.css">
    
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <link rel="stylesheet" href="https://aladin.cds.unistra.fr/AladinLite/api/v3/latest/aladin.min.css">
    <script src="https://aladin.cds.unistra.fr/AladinLite/api/v3/latest/aladin.js"></script>

    <script>
      // define global variables
      imagesize = 1560;
      scale = 0.5;
      scale_before = 0.5;
      ic = 0;
      ic_before = 0;
      im = -1;
      im_before = -1;
      im_mark = -1;
      lock_coordinates = false;
      pxscale = 1.;
      sra = <?= json_encode($sra) ?>;
      sde = <?= json_encode($sde) ?>;
      legacylink = "https://www.legacysurvey.org/viewer/?ra=" + sra + "&dec=" + sde + "&zoom=12&layer=ls-dr10-grz";
      esaskylink = "https://sky.esa.int/esasky/?projection=TAN&cooframe=J2000&sci=true&lang=en&target=" + sra + "," + sde + "&hips=Euclid+VIS&fov=" + pxscale*imagesize/3600.;
      aladinlink = "https://aladin.cds.unistra.fr/AladinLite/?target=" + sra + "%20" + sde + "&fov=" + pxscale*imagesize/3600. + "&survey=CDS%2FP%2FEuclid%2FQ1%2FVIS";
      catalog = <?= json_encode($catalog) ?>;
      survey = <?= json_encode($survey) ?>;
      if (survey === 'EUCDECAM' && !['EUCPZWAV1', 'EUCRR2V2', 'EUCSPT3G', 'EUCV0M80', 'EUCV0M99', 'EUCV1M80', 'EUCV1M99', 'EUCRR2AMICOHISNR', 'EUCTR1CAMICO', 'EUCTR1CPZWAV', 'EUCTR1DPZWAV','EUCTR1ERICHOUTAMICO','EUCTR1ERICHOUTPZWAV','EUCTR1ERICHOUTFPZWAV','EUCTR1FAMICOCORNERS'].includes(catalog)) {
        survey = 'LS';
      }
      if (['EUCTR1DAMICO'].includes(catalog)) {
        survey = 'LS';
      }
      day_mode = <?= json_encode($day_mode) ?>;
      window.members = <?= json_encode($members) ?>;
      window.xray = <?= json_encode($xray) ?>;
      window.sz = <?= json_encode($sz) ?>;
      circlesInitialColor = 'white'
      circlesHighlightColor = '#5D6D7E';
      useAladin = false;
      aladin = null;
      //aladinSurvey = 'CDS/P/Euclid/Q1/VIS';
      //aladinSurvey = 'CDS/P/DESI-Legacy-Surveys/DR10/color';
      let staticSurveyBeforeAladin = survey;
      let xrayLayer = null;
      let szLayer = null;
      var last_cursor_ra = null;
      var last_cursor_dec = null;
    </script>

    <script src="functions.js"></script>
    
  </head>
  <body>
    

    <div class="container">
        
      <div id="toggle-sidebar" class="toggle-sidebar expanded">
          <span style="color:black">&#9660;</span>
      </div>
        
      <div class="left">
	<div class="query">

          <script>
            var body = document.body;
            var query = document.querySelector('.query');
            if (day_mode == 1){
              	body.classList.toggle('day-mode');
              	query.classList.toggle('day-mode');
              	document.documentElement.classList.toggle('day-mode');
            }
          </script>




	  <div id="toggle-mode" class="tooltip">
            🌓
	    <span class="tooltiptext" style="top:110%;bottom:auto;left:-92pt;text-align:right;font-size:16px;width:100px">Toggle day/night mode</span>
      </div>
      
      <div id="share-query" class="tooltip">
        <img id="share-button" src="share-button.png" onclick="generateQueryUrl();" width="50px" height="50px">
	    <span class="tooltiptext" style="top:100%;bottom:auto;left:-60pt;text-align:right;font-size:16px;width:100px">copy url for this query</span>
      </div>
      
        <div id="help" class="tooltip" style="bottom:5pt">
          ?
          <!-- <span class="tooltiptext" style="bottom:-22pt; left:-430pt; text-align:left; font-size:16px; width:535px"> -->
          <span class="tooltiptext" style="bottom:-7pt; left:-630pt; text-align:left; font-size:16px; width:800px">
            <u>Shortcuts:</u><br>
            <table style="font-size:14px; width:100%; line-height:0.85;">
              <tr>
                <!-- Left column: first 12 shortcuts -->
                <td style="width:34%; vertical-align:top; padding-right:4px;">
                  <table style="width:100%;">
                    <tr><td><strong>up</strong></td><td>Select cluster above</td></tr>
                    <tr><td><strong>down</strong></td><td>Select cluster below</td></tr>
                    <tr><td><strong>m</strong></td><td>Show/hide members</td></tr>
                    <tr><td><strong>x/8</strong></td><td>Show/hide X-ray</td></tr>
                    <tr><td><strong>z/9</strong></td><td>
                        <script>
                            document.write(`Show/hide ${
                                catalog=="EUCSPT3G" ? "SPT S/N" : catalog=="EUCWL1" ? "SPT 2021 Y" : "SPT"
                            }`);
                        </script>
                    </td></tr>
                    <tr><td><strong>M/7</strong></td><td>Show/hide survey mask</td></tr>
                    <tr><td><strong>b</strong></td><td>Mark new BCG</td></tr>
                    <tr><td><strong>k</strong></td><td>Lock/unlock cursor coordinates</td></tr>
                    <tr><td><strong>c</strong></td><td>Copy cursor coordinates (degrees)</td></tr>
                    <tr><td><strong>C</strong></td><td>Copy cursor coordinates (sexagesimal)</td></tr>
                  </table>
                </td>

                <td style="width:37%; vertical-align:top; padding-left:4px;">
                  <table style="width:100%; margin-top:-15px;">
                    <tr><td><strong>+</strong>/<strong>i</strong></td><td>Zoom in (mousewheel up)</td></tr>
                    <tr><td><strong>-</strong>/<strong>o</strong></td><td>Zoom out (mousewheel down)</td></tr>
                    <tr><td><strong>p</strong></td><td>Zoom to fit page</td></tr>
                    <tr><td><strong>r</strong></td><td>Zoom factor 1</td></tr>
                    <tr><td><strong>f</strong></td><td>Toggle fullscreen</td></tr>
                    <tr><td><strong>a</strong></td><td>toggle Aladin Lite mode</td></tr>
                    <tr><td><strong>0/1/2/3</strong></td><td>Visual flag: undefined / contaminant / unsure / good</td></tr>
                    <tr><td><strong>4</strong></td><td>Load image from Legacy Surveys</td></tr>
                    <tr><td><strong>5</strong></td><td>Load image from Euclid VIS</td></tr>
                    <tr><td><strong>6</strong></td><td>Load image from Euclid NISP</td></tr>
                    <tr><td><strong>7</strong></td><td>Load image from euclidized DECam</td></tr>
                  </table>
                </td>

                <td style="width:29%; vertical-align:top; padding-left:4px;">
                  <table style="width:100%; margin-top:-15px;">
                    <tr><td><strong>u</strong></td><td>Copy link to selected cluster</td></tr>
                    <tr><td><strong>s</strong></td><td>Open cursor object in SIMBAD</td></tr>
                    <tr><td><strong>v</strong></td><td>Load target in VIS at ESA Sky</td></tr>
                    <tr><td><strong>e</strong></td><td>Open eRASS1 X-ray image</td></tr>
                    <tr><td><strong>l</strong></td><td>Load target in ESA Sky</td></tr>
                    <tr><td><strong>L</strong></td><td>Load target in Legacy Viewer</td></tr>
                    <tr><td><strong>t</strong></td><td>Load target in Aladin Lite</td></tr>
                    <tr><td><strong>d</strong></td><td>Download image</td></tr>
                    <tr><td><strong>R</strong></td><td>Reset form & cursor position</td></tr>
                    <tr><td><strong>h</strong></td><td>Show/hide left panels</td></tr>
                    <tr><td><strong>H</strong></td><td>Show/hide query fields</td></tr>
                    <tr><td><strong>n</strong></td><td>Toggle day/night mode</td></tr>
                  </table>
                </td>
              </tr>
            </table>
          </span>
        </div>


      
       <form action="index.php" method="POST" id="queryForm">

	    <table style="margin-left:auto;margin-right:auto;float:left;">
	      <tr><td style="white-space: nowrap;"><div class="tooltip"><a href="https://simbad.cds.unistra.fr/simbad/sim-fbasic" target="simbadquery">SIMBAD</a> name:<span class="tooltiptext" style="top:125%;bottom:auto;left:80pt">query on SIMBAD</span></div></td><td colspan=2><input size="29" type="text" name="objname" value="<?php echo $objname;?>"></td></tr>
	      <tr><td><div class="tooltip">Catalog name:<span class="tooltiptext" style="top:125%;bottom:auto;left:80pt">cluster name in catalog; separage list by commas</span></div></td><td colspan=2><input size="29" type="text" name="name" value="<?php echo $name;?>" maxlength=30000></td></tr>
	      <tr><td><div class="tooltip">R.A.:<span class="tooltiptext" style="top:125%;bottom:auto;left:80pt">Right Ascension<br>hh:mm:ss<br>hh mm ss<br>dd.dddd</span></div></td><td><input size="8" type="text" name="sra" value=<?php echo $sra;?>></td></tr>
	      <tr><td><div class="tooltip">Dec.:<span class="tooltiptext" style="top:125%;bottom:auto;left:80pt">Declination<br>dd:mm:ss<br>dd mm ss<br>dd.dddd</span></div></td><td><input size="8" type="text" name="sde" value=<?php echo $sde;?>></td></tr>
	      <tr><td><div class="tooltip">max. distance:<span class="tooltiptext" style="top:125%;bottom:auto;left:80pt">maximum distance from search coordinates [arcmin]</span></div></td><td><input size="4" type="text" name="dist" value="<?php echo $dist;?>"> arcmin</td></tr>
	      <tr><td style='text-align:right'><input size="8" type="text" name="bestzmin" value="<?php echo $bestzmin;?>"></td><td style='text-align:center'> < <div class="tooltip">BEST_Z<span class="tooltiptext" style="left:50pt;bottom:16pt">eRASS:5 photometric cluster redshift</span></div> &#8804 </td><td style='text-align:left'><input size="8" type="text" name="bestzmax" value="<?php echo $bestzmax;?>"></td></tr>
          <!--<tr><td style='text-align:right'><input size="8" type="text" name="euczmin" value="<?php echo $euczmin;?>"></td><td style='text-align:center'> &#8804 <div class="tooltip">EUC_Z<span class="tooltiptext" style="left:50pt;bottom:16pt">Euclid photometric cluster redshift</span></div> &#8804 </td><td style='text-align:left'><input size="8" type="text" name="euczmax" value="<?php echo $euczmax;?>"></td></tr>-->
          <tr><td style='text-align:right'><input size="8" type="text" name="lambdanormmin" value="<?php echo $lambdanormmin;?>"></td><td style='text-align:center'> < <div class="tooltip">RICHNESS<span class="tooltiptext" style="left:84pt;bottom:16pt">richness = scaled sum of membership probabilities</span></div> &#8804 </td><td style='text-align:left'><input size="8" type="text" name="lambdanormmax" value="<?php echo $lambdanormmax;?>"></td></tr>
          <!--<tr><td style='text-align:right'><input size="8" type="text" name="snrmin" value="<?php echo $snrmin;?>"></td><td style='text-align:center'> < <div class="tooltip">SNR<span class="tooltiptext" style="left:84pt;bottom:16pt">signal-to-noise ratio</span></div> &#8804 </td><td style='text-align:left'><input size="8" type="text" name="snrmax" value="<?php echo $snrmax;?>"></td></tr>-->
          <tr><td style='text-align:right'><input size="8" type="text" name="maskfracmin" value="<?php echo $maskfracmin;?>"></td><td style='text-align:center'> < <div class="tooltip">MASKFRAC<span class="tooltiptext" style="left:92pt;bottom:16pt">fraction of masked area</span></div> &#8804; </td><td style='text-align:left'><input size="8" type="text" name="maskfracmax" value="<?php echo $maskfracmax;?>"></td></tr>
          <!--<tr><td style='text-align:right'><input size="8" type="text" name="pcontmin" disabled value="<?php echo $pcontmin;?>"></td><td style='text-align:center'> < <div class="tooltip">PCONT<span class="tooltiptext" style="left:92pt;bottom:16pt">probability of cluster being a contamination</span></div> &#8804; </td><td style='text-align:left'><input size="8" type="text" name="pcontmax" disabled value="<?php echo $pcontmax;?>"></td></tr> -->

	      <tr>

	      <!-- </tr><tr> -->

		<!-- <td><label id="in-zvlim-label">
        <input type="hidden" name="in_zvlim" value="<?php echo $in_zvlim === 0 ? '0' : ($in_zvlim === 1 ? '1' : '2'); ?>">
        <span id="in-zvlim-display">
            <?php
              echo in_array($catalog, ['ERASS4E', 'ERASS4EV1', 'ERASS4EV2']) 
              ? ($in_zvlim === 0 ? '❌' : ($in_zvlim === 1 ? '✅' : '❔')) 
              : '❔';
            ?>
        </span>
        <div class="tooltip">IN_ZVLIM<span class="tooltiptext" style="bottom:18pt;left:0pt">photo. redshift is smaller than limiting redshift (= where survey is sufficiently deep)</span></div>
        </label> -->

		<td><label id="in-footprint-label">
        <input type="hidden" name="in_footprint" value="<?php echo $in_footprint === 0 ? '0' : ($in_footprint === 1 ? '1' : '2'); ?>">
        <span id="in-footprint-display">
            <?php
              echo in_array($catalog, ['EUCSPT3G','ERASS4E']) 
              ? ($in_footprint === 0 ? '❌' : ($in_footprint === 1 ? '✅' : '❔')) 
              : '❔';
            ?>        </span>
		  <div class="tooltip">IN_TR1<span class="tooltiptext" style="bottom:18pt;left:0pt">covered by Euclid's<br>test region 1</span></div></label></td>

		<td><label id="merger-label">
        <input type="hidden" name="merger" value="<?php echo $merger === 0 ? '0' : ($merger === 1 ? '1' : '2'); ?>">
        <span id="merger-display">
            <?php
              echo in_array($catalog, ['ERASS4E']) 
              ? ($merger === 0 ? '❌' : ($merger=== 1 ? '✅' : '❔')) 
              : '❔';
            ?>        </span>
		  <div class="tooltip">MERGER<span class="tooltiptext" style="bottom:18pt;left:0pt;width:100pt">2 BCGs<br>&#8805;300kpc apart</span></div></label></td>

        <!--
		<td><label id="in-xgood-label">
        <input type="hidden" name="in_xgood" value="<?php echo $in_xgood === 0 ? '0' : ($in_xgood === 1 ? '1' : '2'); ?>">
        <span id="in-xgood-display">
        <?php echo ($catalog === 'ERASS4E' || $catalog === 'ERASS4EV1' || $catalog == 'ERASS4EV2' || $catalog == 'ERASS4P' || $catalog == 'OPTICAL' || $catalog == 'KLUGE') && $in_xgood === 0 ? '❌' :  (($catalog === 'ERASS4E' || $catalog === 'ERASS4EV1' || $catalog == 'ERASS4EV2' || $catalog == 'ERASS4P' || $catalog == 'OPTICAL'|| $catalog == 'KLUGE') && $in_xgood === 1 ? '✅' : '❔'); ?>        </span>
		  <div class="tooltip">IN_XGOOD<span class="tooltiptext" style="bottom:18pt;left:0pt">reject regions without eRASS X-ray coverage</span></div></label></td>

        </tr>
        <tr>
        <td></td>-->

		<td><label id="visual-contamination-label">
        <input type="hidden" name="visual_contamination" value="<?php echo in_array($visual_contamination, [1,2,3]) ? $visual_contamination : '0'; ?>">
        <span id="visual-contamination-display">
        <?php echo $visual_contamination === 1 ? '❌' : ($visual_contamination === 2 ? '⚠️' : ($visual_contamination === 3 ? '✅' : '❔')); ?>
        </span>
		  <!--<div class="tooltip">MATCH<span class="tooltiptext" style="bottom:35pt;left:0pt;width:130pt">red = only eRASS:5<br>yellow = only Euclid<br>green = match within 2'</span></div></label></td>-->
          <div class="tooltip">CLU_QUALITY<span class="tooltiptext" style="bottom:35pt;left:0pt;width:185pt">visually classified as<br>contaminant, neutral, or good cluster</span></div></label></td>
        
		<!-- <td><label id="split-cleaned-label">
        <input type="hidden" name="split_cleaned" value="<?php echo $split_cleaned === 0 ? '0' : ($split_cleaned === 1 ? '1' : '2'); ?>">
        <span id="split-cleaned-display">
            <?php
              echo in_array($catalog, ['ERASS4E', 'ERASS4EV1', 'ERASS4EV2']) 
              ? ($split_cleaned === 0 ? '❌' : ($split_cleaned === 1 ? '✅' : '❔')) 
              : (in_array($catalog, ['ERASS4P', 'OPTICAL']) 
              ? '✅' 
              : '❔');
            ?>
        </span>
        <div class="tooltip">SPLIT_CLEANED<span class="tooltiptext" style="bottom:35pt;left:0pt">remove split clusters</span></div></label></td>-->
        
        </tr>
	    </table>

	    <!--<table style="display:inline-block;vertical-align:top;margin:0px 10px">-->
<!--<table style="display:inline-block;vertical-align:top;margin:0px 10px; column-count:2; column-gap:25px;">-->
<!--<table style="display:inline-table;vertical-align:top;margin:0px 10px;max-width:260px;table-layout:fixed;">-->
<!--<table style="display:inline-block;vertical-align:top;margin:0px 10px;width:460px;height:230px;column-count:2;column-gap:10px;column-fill:auto;">-->
        <!--<div style="display:inline-block;vertical-align:top;margin:0px 10px;width:480px;height:220px;column-count:2;column-gap:10px;column-fill:auto;overflow:hidden;">
            <table style="display:block;margin:0;width:100%;">-->

        <div id="catalog_wrap" style="display:inline-block;vertical-align:top;margin:0px 10px;width:440px;height:80px;column-count:1;column-gap:10px;column-fill:auto;overflow:hidden;">
            <table style="display:block;margin:0;width:100%;">
    	        <tr><td><b>Cluster catalogs</b></td></tr>
    	        <!--<tr><td><label><input type="radio" name="catalog" id="EUCPZWAVQ1"  value="EUCPZWAVQ1"  <?php if($catalog=="EUCPZWAVQ1" ) echo "checked";?>>PZWAV Q1</a></label></td></tr>
    	        <tr><td><label><input type="radio" name="catalog" id="EUCAMICOQ1"  value="EUCAMICOQ1"  <?php if($catalog=="EUCAMICOQ1" ) echo "checked";?>>AMICO Q1</a></label></td></tr>-->
    	        <!-- <tr><td><label><input type="radio" name="catalog" id="EUCPZWAV1"   value="EUCPZWAV1"   <?php if($catalog=="EUCPZWAV1"  ) echo "checked";?>>PZWAV RR2 v1</a></label></td></tr>
                <tr><td><label><input type="radio" name="catalog" id="EUCRR2V2"    value="EUCRR2V2"    <?php if($catalog=="EUCRR2V2"   ) echo "checked";?>>PZWAV RR2-HR2-24-8</a></label></td></tr> -->
                <!--<tr><td><label><input type="radio" name="catalog" id="EUCSPT3G"    value="EUCSPT3G"    <?php if($catalog=="EUCSPT3G"   ) echo "checked";?>>SPT 3G EDF</a></label></td></tr>-->
                <!-- <tr><td><label><input type="radio" name="catalog" id="EUCV0M80"    value="EUCV0M80"    <?php if($catalog=="EUCV0M80"   ) echo "checked";?>>DETPZ 12MER NoV MAG24 MASK0.8</a></label></td></tr>
                <tr><td><label><input type="radio" name="catalog" id="EUCV0M99"    value="EUCV0M99"    <?php if($catalog=="EUCV0M99"   ) echo "checked";?>>DETPZ 12MER NoV MAG24 MASK0.99</a></label></td></tr>
                <tr><td><label><input type="radio" name="catalog" id="EUCV1M80"    value="EUCV1M80"    <?php if($catalog=="EUCV1M80"   ) echo "checked";?>>DETPZ 12MER V1 MAG24 MASK0.8</a></label></td></tr>
                <tr><td><label><input type="radio" name="catalog" id="EUCV1M99"    value="EUCV1M99"    <?php if($catalog=="EUCV1M99"   ) echo "checked";?>>DETPZ 12MER V1 MAG24 MASK0.99</a></label></td></tr>
                <tr><td><label><input type="radio" name="catalog" id="EUCRR2AMICOHISNR" value="EUCRR2AMICOHISNR"    <?php if($catalog=="EUCRR2AMICOHISNR"   ) echo "checked";?>>AMICO RR2 high S/N</a></label></td></tr>
                <tr><td><label><input type="radio" name="catalog" id="EUCRR2PZWAV1" value="EUCRR2PZWAV1"    <?php if($catalog=="EUCRR2PZWAV1"   ) echo "checked";?>>PZWAV RR2 1</a></label></td></tr>
                <tr><td><label><input type="radio" name="catalog" id="EUCRR2PZWAV2" value="EUCRR2PZWAV2"    <?php if($catalog=="EUCRR2PZWAV2"   ) echo "checked";?>>PZWAV RR2 2</a></label></td></tr> -->
                <!--<tr><td><label class="tooltip"><input type="radio" name="catalog" id="EUCWL1" value="EUCWL1"    <?php if($catalog=="EUCWL1"   ) echo "checked";?>>wl-detected-mimik</a><span class="tooltiptext" style="bottom:-4pt;left:-170pt;text-align:center;font-size:16px;width:200px">wl_detectable_2nditer.dat</span></label></td></tr>-->
                <!-- <tr><td><label class="tooltip"><input type="radio" name="catalog" id="EUCTR1BAMICO" value="EUCTR1BAMICO"    <?php if($catalog=="EUCTR1BAMICO"   ) echo "checked";?>>AMICO TR1b</a><span class="tooltiptext" style="bottom:20pt;left:-300pt;text-align:center;font-size:16px;width:500px">/sps/euclid/OU-LE3/CL/ial_workspace/workdir/SeqPipRun/TR1/data/<br>unified_clusters_cat_12tiles_TEST_fft2025-11-12T14:31:29.fits<br>DET_CODE_NB==1</span></label></td></tr>
                <tr><td><label class="tooltip"><input type="radio" name="catalog" id="EUCTR1BPZWAV" value="EUCTR1BPZWAV"    <?php if($catalog=="EUCTR1BPZWAV"   ) echo "checked";?>>PZWAV TR1b</a><span class="tooltiptext" style="bottom:20pt;left:-300pt;text-align:center;font-size:16px;width:500px">/sps/euclid/OU-LE3/CL/ial_workspace/workdir/SeqPipRun/TR1/data/<br>unified_clusters_cat_12tiles_TEST_fft2025-11-12T14:31:29.fits<br>DET_CODE_NB==2</span></label></td></tr>
                <tr><td><label class="tooltip"><input type="radio" name="catalog" id="EUCTR1CAMICO" value="EUCTR1CAMICO"    <?php if($catalog=="EUCTR1CAMICO"   ) echo "checked";?>>AMICO TR1c</a><span class="tooltiptext" style="bottom:20pt;left:-300pt;text-align:center;font-size:16px;width:500px">/sps/euclid/OU-LE3/CL/ial_workspace/workdir/MergeDetCat/TR1_South/<br>AMICO_TR1_South_2025_12_05_selected_top40_z01.fits</span></label></td></tr>
                <tr><td><label class="tooltip"><input type="radio" name="catalog" id="EUCTR1CPZWAV" value="EUCTR1CPZWAV"    <?php if($catalog=="EUCTR1CPZWAV"   ) echo "checked";?>>PZWAV TR1c</a><span class="tooltiptext" style="bottom:20pt;left:-300pt;text-align:center;font-size:16px;width:500px">/sps/euclid/OU-LE3/CL/ial_workspace/workdir/MergeDetCat/TR1_South/<br>PZWAV_TR1_South_2025_12_05_selected_top40_z01.fits</span></label></td></tr>
                <tr><td><label class="tooltip"><input type="radio" name="catalog" id="EUCAMICOERASS1UNMATCHED" value="EUCAMICOERASS1UNMATCHED"    <?php if($catalog=="EUCAMICOERASS1UNMATCHED"   ) echo "checked";?>>AMICO TR1c eRASS1 unmatched</a></label></td></tr>
                <tr><td><label class="tooltip"><input type="radio" name="catalog" id="EUCPZWAVERASS1UNMATCHED" value="EUCPZWAVERASS1UNMATCHED"    <?php if($catalog=="EUCPZWAVERASS1UNMATCHED"   ) echo "checked";?>>PZWAV TR1c eRASS1 unmatched</a></label></td></tr>
                <tr><td><label class="tooltip"><input type="radio" name="catalog" id="EUCAMICOERASS1MATCHED" value="EUCAMICOERASS1MATCHED"    <?php if($catalog=="EUCAMICOERASS1MATCHED"   ) echo "checked";?>>AMICO TR1c eRASS1 matched</a></label></td></tr>
                <tr><td><label class="tooltip"><input type="radio" name="catalog" id="EUCPZWAVERASS1MATCHED" value="EUCPZWAVERASS1MATCHED"    <?php if($catalog=="EUCPZWAVERASS1MATCHED"   ) echo "checked";?>>PZWAV TR1c eRASS1 matched</a></label></td></tr>
                <tr><td><label class="tooltip"><input type="radio" name="catalog" id="EUCTR1DAMICO" value="EUCTR1DAMICO"    <?php if($catalog=="EUCTR1DAMICO"   ) echo "checked";?>>AMICO TR1d</a><span class="tooltiptext" style="bottom:20pt;left:-300pt;text-align:center;font-size:16px;width:700px">/sps/euclid/OU-LE3/CL/ial_workspace/workdir/DetIntile/TR1/data/<br>unified_clusters_gluematch_seqrun_tr1south_mask2patches_20251217_1426262025-12-17T14:28:00.fits<br>DET_CODE_NB==1</span></label></td></tr>
                <tr><td><label class="tooltip"><input type="radio" name="catalog" id="EUCTR1DPZWAV" value="EUCTR1DPZWAV"    <?php if($catalog=="EUCTR1DPZWAV"   ) echo "checked";?>>PZWAV TR1d</a><span class="tooltiptext" style="bottom:20pt;left:-300pt;text-align:center;font-size:16px;width:700px">/sps/euclid/OU-LE3/CL/ial_workspace/workdir/DetIntile/TR1/data/<br>unified_clusters_gluematch_seqrun_tr1south_mask2patches_20251217_1426262025-12-17T14:28:00.fits<br>DET_CODE_NB==2<br>Images available for z > 1.5 & SNR > 7</span></label></td></tr>-->
                <!--<tr><td><label class="tooltip"><input type="radio" name="catalog" id="EUCTR1EAMICO" value="EUCTR1EAMICO"    <?php if($catalog=="EUCTR1EAMICO"   ) echo "checked";?>>AMICO TR1e</a><span class="tooltiptext" style="bottom:36pt;left:0pt;text-align:center;font-size:12px;width:420px">/sps/euclid/OU-LE3/CL/ial_workspace/workdir/DetIntile/TR1/data/<br>unified_clusters_gluematch_seqrun_tr1south_jan26_2_20260129_2042132026-01-29T20:43:33.fits<br>DET_CODE_NB==1<br>Images available for z > 1.5 & SNR > 16</span></label></td></tr>
                <tr><td><label class="tooltip"><input type="radio" name="catalog" id="EUCTR1EPZWAV" value="EUCTR1EPZWAV"    <?php if($catalog=="EUCTR1EPZWAV"   ) echo "checked";?>>PZWAV TR1e</a><span class="tooltiptext" style="bottom:36pt;left:0pt;text-align:center;font-size:12px;width:420px">/sps/euclid/OU-LE3/CL/ial_workspace/workdir/DetIntile/TR1/data/<br>unified_clusters_gluematch_seqrun_tr1south_jan26_2_20260129_2042132026-01-29T20:43:33.fits<br>DET_CODE_NB==2<br>Images available for z > 1.5 & SNR > 7</span></label></td></tr>
                <tr><td><label class="tooltip"><input type="radio" name="catalog" id="EUCTR1EAMICORAND" value="EUCTR1EAMICORAND"    <?php if($catalog=="EUCTR1EAMICORAND"   ) echo "checked";?>>AMICO TR1e (randoms)</a><span class="tooltiptext" style="bottom:40pt;left:0pt;text-align:center;font-size:12px;width:320px">/sps/euclid/OU-LE3/CL/ial_workspace/workdir/DetIntile/TR1/<br>TR1_rand_selected_det1.fits<br>randomly selected clusters</span></label></td></tr>
                <tr><td><label class="tooltip"><input type="radio" name="catalog" id="EUCTR1EPZWAVRAND" value="EUCTR1EPZWAVRAND"    <?php if($catalog=="EUCTR1EPZWAVRAND"   ) echo "checked";?>>PZWAV TR1e (randoms)</a><span class="tooltiptext" style="bottom:40pt;left:0pt;text-align:center;font-size:12px;width:320px">/sps/euclid/OU-LE3/CL/ial_workspace/workdir/DetIntile/TR1/<br>TR1_rand_selected_det2.fits<br>randomly selected clusters</span></label></td></tr>
                
                <tr style="break-after:column;"><td></td></tr>              
                
                <tr><td><label class="tooltip"><input type="radio" name="catalog" id="EUCTR1ERICHOUTAMICO" value="EUCTR1ERICHOUTAMICO"    <?php if($catalog=="EUCTR1ERICHOUTAMICO"   ) echo "checked";?>>AMICO TR1e<br>(richness outliers)</a><span class="tooltiptext" style="top:50pt;left:-170pt;text-align:center;font-size:12px;width:420px;height:44px">/sps/euclid/OU-LE3/CL/ial_workspace/workdir/DetIntile/TR1/<br>TR1_rand_selected_det2.fits<br>selected by Stefano Andreon</span></label></td></tr>
                <tr><td><label class="tooltip"><input type="radio" name="catalog" id="EUCTR1ERICHOUTPZWAV" value="EUCTR1ERICHOUTPZWAV"    <?php if($catalog=="EUCTR1ERICHOUTPZWAV"   ) echo "checked";?>>PZWAV TR1e<br>(richness outliers)</a><span class="tooltiptext" style="top:50pt;left:-170pt;text-align:center;font-size:12px;width:420px;height:44px">/sps/euclid/OU-LE3/CL/ial_workspace/workdir/DetIntile/TR1/<br>TR1_rand_selected_det2.fits<br>selected by Stefano Andreon</span></label></td></tr>
                <tr><td><label class="tooltip"><input type="radio" name="catalog" id="EUCTR1ERICHOUTFPZWAV" value="EUCTR1ERICHOUTFPZWAV"    <?php if($catalog=="EUCTR1ERICHOUTFPZWAV"   ) echo "checked";?>>PZWAV TR1e<br>(richness outliers, flipped)</a><span class="tooltiptext" style="bottom:36pt;left:-170pt;text-align:center;font-size:12px;width:420px">/sps/euclid/OU-LE3/CL/ial_workspace/workdir/DetIntile/TR1/<br>TR1_rand_selected_det2.fits<br>selected by Stefano Andreon</span></label></td></tr>-->
                <!--<tr><td><label class="tooltip"><input type="radio" name="catalog" id="EUCTR1FAMICO" value="EUCTR1FAMICO"    <?php if($catalog=="EUCTR1FAMICO"   ) echo "checked";?>>AMICO TR1f</a><span class="tooltiptext" style="bottom:36pt;left:-170pt;text-align:center;font-size:12px;width:420px">/sps/euclid/OU-LE3/CL/ial_workspace/workdir/DetIntile/TR1f/data/<br>unified_clusters_gluematch_seqrun_TR1f_south_mask26april_20260519_1119312026-05-19T11:20:24.fits<br>DET_CODE_NB==1<br>Images available for z > 1.5</span></label></td></tr>
                <tr><td><label class="tooltip"><input type="radio" name="catalog" id="EUCTR1FPZWAV" value="EUCTR1FPZWAV"    <?php if($catalog=="EUCTR1FPZWAV"   ) echo "checked";?>>PZWAV TR1f</a><span class="tooltiptext" style="bottom:36pt;left:-170pt;text-align:center;font-size:12px;width:420px">/sps/euclid/OU-LE3/CL/ial_workspace/workdir/DetIntile/TR1f/data/<br>unified_clusters_gluematch_seqrun_TR1f_south_mask26april_defaultSNRcuts_<br>20260520_1521462026-05-20T15:22:34.fits<br>DET_CODE_NB==2<br>Images available for z > 1.5</span></label></td></tr>-->
                <!--<tr><td><label class="tooltip"><input type="radio" name="catalog" id="EUCTR1FAMICOCORNERS" value="EUCTR1FAMICOCORNERS"    <?php if($catalog=="EUCTR1FAMICOCORNERS") echo "checked";?>>AMICO TR1f (corners)</a><span class="tooltiptext" style="bottom:36pt;left:-60pt;text-align:center;font-size:12px;width:220px">E-mail by Stefano Andreon, 25 May 2026</span></label></td></tr>-->
                <!--<tr><td><label><input type="radio" name="catalog" id="ERASS4E"  value="ERASS4E"  <?php if($catalog=="ERASS4E")  echo "checked";?>><a href="https://wiki.mpe.mpg.de/eRosita/eRASS5ClCat" target="_blank">eRASS:5 v1.1</a></label></td></tr>-->
                <tr><td><label><input type="radio" name="catalog" id="ERASS1E"  value="ERASS1E"  <?php if($catalog=="ERASS1E")  echo "checked";?>>eRASS1</label></td></tr>
                            
	        </table>
        </div>

        <input type="hidden" name="day_mode" value="<?php echo $day_mode;?>">
        <input type="hidden" name="members" value="<?php echo $members;?>">
        <input type="hidden" name="xray" value="<?php echo $xray;?>">
        <input type="hidden" name="sz" value="<?php echo $sz;?>">
        <input type="hidden" name="survey"   value="<?php echo $survey;?>">

        <div style="clear:both;"></div>

        
        <table style="margin-left:auto;margin-right:auto;float:left;">

	      <tr><td style='text-align:left'><input type="submit" name="submit" value="Submit" style="width:100;height:30;font-size:17">
		<input type="button" value="Reset" onclick=resetForm() style="width:100;height:30;font-size:17"></td>
		<!--<td><label><input type="checkbox" id="overlaycheckbox" checked>
		  members</label></td>-->
		<td><label class="tooltip"><input type="checkbox" id="overlaycheckbox" checked><a href="javascript:ds9RegionFile()">members</a><span class="tooltiptext" style="bottom:20pt;left:-5pt;text-align:center;font-size:16px;width:100px">download DS9 region file</span></label></td>
		<!--<td><label><input type="checkbox" id="contouroverlaycheckbox" <?= !in_array($catalog, ['EUCTR1DAMICO']) ? 'checked' : 'disabled' ?>>-->
        <td><label><input type="checkbox" id="contouroverlaycheckbox" <?= $xray ? 'checked' : '' ?>>
            <a id="erodatlink" href="https://erosita.mpe.mpg.de/dr1/erodat/skyview/sky/" target="erass1">eRASS1 X-ray</a></label></td>
		<!--<td><label><input type="checkbox" id="contourszoverlaycheckbox" <?= in_array($catalog, ['EUCWL1','EUCTR1BAMICO','EUCTR1BPZWAV','EUCTR1CAMICO','EUCTR1CPZWAV','EUCPZWAVERASS1UNMATCHED','EUCAMICOERASS1UNMATCHED','EUCPZWAVERASS1MATCHED','EUCAMICOERASS1MATCHED','EUCTR1DPZWAV','EUCTR1EPZWAV','EUCTR1EAMICO','EUCTR1EPZWAVRAND','EUCTR1EAMICORAND','EUCTR1ERICHOUTAMICO','EUCTR1ERICHOUTPZWAV','EUCTR1ERICHOUTFPZWAV','EUCTR1FPZWAV','EUCTR1FAMICO','EUCTR1FAMICOCORNERS']) ? 'checked' : 'disabled' ?>> -->
		<td><label class="tooltip"><input type="checkbox" id="contourszoverlaycheckbox" <?= $sz ? 'checked' : '' ?>><a href="https://pole.uchicago.edu/public/data/edfs25/" target="spt">SPT 2021 Y</a><span class="tooltiptext" style="bottom:20pt;left:-5pt;text-align:center;font-size:16px;width:380px">https://szdb.osups.universite-paris-saclay.fr/ymaps/obs/<br>SPTSZ_Planck_min_variance_ymap.fits.gz</span></label></td>
		<td><label class="tooltip"><input type="checkbox" id="contoursz3goverlaycheckbox" <?= in_array($catalog, ['EUCSPT3G']) ? 'checked' : 'disabled' ?>><a href="https://szdb.osups.universite-paris-saclay.fr/ymap.html" target="spt3g">SPT 3G S/N</a><span class="tooltiptext" style="bottom:20pt;left:-5pt;text-align:center;font-size:16px;width:380px">https://lambda.gsfc.nasa.gov/data/suborbital/SPT/<br>spt_3g_euclid/cluster_snmap_SFL_thetacore_1p25.fits.gz</span></label></td> <!-- https://szdb.osups.universite-paris-saclay.fr/ymaps/obs/SPTSZ_Planck_min_variance_ymap.fits.gz -->
		

		<script>
		  document.getElementById("overlaycheckbox").addEventListener("click", dooverlay);
		  document.getElementById("contouroverlaycheckbox").addEventListener("click", docontouroverlay);
		  document.getElementById("contourszoverlaycheckbox").addEventListener("click", docontourszoverlay);
		  document.getElementById("contoursz3goverlaycheckbox").addEventListener("click", docontoursz3goverlay);
		</script>
	      </tr>
        </table>


        <script>
          const toggleModeBtn = document.getElementById('toggle-mode');

          const toggleDayModeEarly = () => {
            document.documentElement.classList.toggle('day-mode');
            document.body.classList.toggle('day-mode');
            query.classList.toggle('day-mode');
      
            if (document.body.classList.contains('day-mode')) {
                day_mode = 1;
            } else {
                day_mode = 0;
            }
            
            document.getElementsByName('day_mode')[0].value = day_mode;
          };

          toggleModeBtn.addEventListener('click', toggleDayModeEarly);
          
        </script>
        
        
        <script>
        
            const catalogRadio = document.getElementsByName("catalog");
        
            //in_zvlim_input = document.getElementsByName('in_zvlim')[0];
            /*document.getElementById('in-zvlim-label').addEventListener('click', function() {
                var in_zvlim = parseInt(in_zvlim_input.value)
                var display = document.getElementById('in-zvlim-display');
                if (in_zvlim === 2) {
                    display.innerHTML = '✅';
                    in_zvlim_input.value = '1';
                } else if (in_zvlim === 1) {
                    display.innerHTML = '❌';
                    in_zvlim_input.value = '0';
                } else {
                    display.innerHTML = '❔';
                    in_zvlim_input.value = '2';
                }
                document.getElementsByName('submit')[0].focus()
            });*/
            merger_input = document.getElementsByName('merger')[0];
            document.getElementById('merger-label').addEventListener('click', function() {
                var merger = parseInt(merger_input.value)
                var display = document.getElementById('merger-display');
                if (catalogRadio[0].checked){
                  if (merger === 2) {
                      display.innerHTML = '✅';
                      merger_input.value = '1';
                  } else if (merger === 1) {
                      display.innerHTML = '❌';
                      merger_input.value = '0';
                  } else {
                      display.innerHTML = '❔';
                      merger_input.value = '2';
                  }
                }
                document.getElementsByName('submit')[0].focus()
            });

            in_footprint_input = document.getElementsByName('in_footprint')[0];
            document.getElementById('in-footprint-label').addEventListener('click', function() {
                var in_footprint = parseInt(in_footprint_input.value)
                var display = document.getElementById('in-footprint-display');
                if (catalogRadio[0].checked){
                  if (in_footprint === 2) {
                      display.innerHTML = '✅';
                      in_footprint_input.value = '1';
                  } else if (in_footprint === 1) {
                      display.innerHTML = '❌';
                      in_footprint_input.value = '0';
                  } else {
                      display.innerHTML = '❔';
                      in_footprint_input.value = '2';
                  }
                }
                document.getElementsByName('submit')[0].focus()
            });

            //const in_xgood_input = document.getElementsByName('in_xgood')[0];
            //const in_xgood_display = document.getElementById('in-xgood-display');
            /*document.getElementById('in-xgood-label').addEventListener('click', function() {
merger_input = document.getElementsByName('in_footprint')[0];
            document.getElementById('in-footprint-label').addEventListener('click', function() {
                var in_footprint = parseInt(in_footprint_input.value)
                var display = document.getElementById('in-footprint-display');
                if (catalogRadio[2].checked | catalogRadio[6].checked){
                  if (in_footprint === 2) {
                      display.innerHTML = '✅';
                      in_footprint_input.value = '1';
                  } else if (in_footprint === 1) {
                      display.innerHTML = '❌';
                      in_footprint_input.value = '0';
                  } else {
                      display.innerHTML = '❔';
                      in_footprint_input.value = '2';
                  }
                }
                document.getElementsByName('submit')[0].focus()
            });
                //if (catalogRadio[4].checked | catalogRadio[5].checked | catalogRadio[6].checked | catalogRadio[7].checked | catalogRadio[8].checked){
                if (catalogRadio[4].checked | catalogRadio[5].checked | catalogRadio[6].checked | catalogRadio[7].checked){
                var in_xgood = parseInt(in_xgood_input.value)
                
                if (in_xgood === 2) {
                    in_xgood_display.innerHTML = '✅';
                    in_xgood_input.value = '1';
                } else if (in_xgood === 1) {
                    in_xgood_display.innerHTML = '❌';
                    in_xgood_input.value = '0';
                } else {
                    in_xgood_display.innerHTML = '❔';
                    in_xgood_input.value = '2';
                }
                }
                document.getElementsByName('submit')[0].focus()
            });*/

            visual_contamination_input = document.getElementsByName('visual_contamination')[0];
            document.getElementById('visual-contamination-label').addEventListener('click', function() {
                var visual_contamination = parseInt(visual_contamination_input.value)
                var display = document.getElementById('visual-contamination-display');
                if (visual_contamination === 0) {
                    display.innerHTML = '❌';
                    visual_contamination_input.value = '1';
                } else if (visual_contamination === 1) {
                    display.innerHTML = '⚠️';
                    visual_contamination_input.value = '2';
                } else if (visual_contamination === 2) {
                    display.innerHTML = '✅';
                    visual_contamination_input.value = '3';
                } else {
                    display.innerHTML = '❔';
                    visual_contamination_input.value = '0';
                }
                document.getElementsByName('submit')[0].focus()
            });

            //const split_cleaned_input = document.getElementsByName('split_cleaned')[0];
                        
            //const split_cleaned_display = document.getElementById('split-cleaned-display');
            const in_footprint_display = document.getElementById('in-footprint-display');
            
            /*document.getElementById('split-cleaned-label').addEventListener('click', function() {
                //if (catalogRadio[4].checked | catalogRadio[5].checked){
                if (catalogRadio[4].checked){
                    
                var split_cleaned = parseInt(split_cleaned_input.value)

                if (split_cleaned === 2) {
                    split_cleaned_display.innerHTML = '✅';
                    split_cleaned_input.value = '1';
                } else if (split_cleaned === 1) {
                    split_cleaned_display.innerHTML = '❌';
                    split_cleaned_input.value = '0';
                } else {
                    split_cleaned_display.innerHTML = '❔';
                    split_cleaned_input.value = '2';
                }
                }
                document.getElementsByName('submit')[0].focus()
            });*/
            
            document.addEventListener("keydown", function(event) {
                presskey(event);
            });
        </script>        

        
      </form>  


        <!-- <script>
            // hidden fields are not focusable; pressing enter does not work to submit when e.g., on IN_FOOTPRINT
            document.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    document.getElementsByName('submit').click();
                }
            });
        </script> -->

		<script>
          //const in_footprint = document.getElementsByName("in_footprint")[0];
          //const not_in_footprint = document.getElementsByName("not_in_footprint")[0];
          //const in_zvlim = document.getElementsByName("in_zvlim")[0];
          //const not_in_zvlim = document.getElementsByName("not_in_zvlim")[0];
          //const catalogRadio = document.getElementsByName("catalog");
          //const erass4ev01Radio = catalogRadio[4];
          //const erass4ev02Radio = catalogRadio[5];
          /*const LSDR9GRZRadio = catalogRadio[catalogRadio.length-5];
          const LSDR10GRZRadio = catalogRadio[catalogRadio.length-4];
          //const customRadio  = catalogRadio[catalogRadio.length - 1];
          const pcontmin = document.getElementsByName("pcontmin")[0];
          const pcontmax = document.getElementsByName("pcontmax")[0];
          const split_cleaned = document.getElementsByName("split_cleaned")[0];
          const in_xgood = document.getElementsByName("in_xgood")[0];
          */
          //const visual_contamination = document.getElementsByName("visual_contamination")[0];
          /*
          const contour_overlay = document.getElementById("contouroverlaycheckbox");
          pcontmin.disabled             = !erass1eRadio.checked; //& !customRadio.checked;
          pcontmax.disabled             = !erass1eRadio.checked; //& !customRadio.checked;
          split_cleaned.disabled        = !erass1eRadio.checked; //& !customRadio.checked;
          in_xgood.disabled             = !erass1eRadio.checked; //& !customRadio.checked;
          */
          //visual_contamination.disabled = !erass4ev02Radio.checked; //& !customRadio.checked;
          /*
          contour_overlay.disabled      = !erass1eRadio.checked; //& !customRadio.checked;
          in_footprint.disabled         = LSDR9GRZRadio.checked | LSDR10GRZRadio.checked;          
          not_in_footprint.disabled     = LSDR9GRZRadio.checked | LSDR10GRZRadio.checked;
          */

          /*if (!in_zvlim.checked & !not_in_zvlim.checked){
              in_zvlim.checked = true;
              not_in_zvlim.checked = true;
          }*/
          
          /*if (!in_footprint.checked & !not_in_footprint.checked){
              in_footprint.checked = true;
              not_in_footprint.checked = true;
          }*/

          //if (!erass4ev02Radio.checked){
              //in_xgood.checked = true;
              //split_cleaned.checked = true;
              //visual_contamination.checked = true;
          //}
		  document.querySelectorAll('input[name="catalog"]').forEach((radio) => {
            radio.addEventListener('click', () => {
              //pcontmin.disabled             = !erass1eRadio.checked; //& !customRadio.checked;
              //pcontmax.disabled             = !erass1eRadio.checked; //& !customRadio.checked;
		      //split_cleaned.disabled        = !erass1eRadio.checked; //& !customRadio.checked;
		      //in_xgood.disabled             = !erass1eRadio.checked; //& !customRadio.checked;
		      //visual_contamination.disabled = !erass4ev02Radio.checked; //& !customRadio.checked;
              //contour_overlay.disabled      = !erass1eRadio.checked; //& !customRadio.checked;
              //in_footprint.disabled         = LSDR9GRZRadio.checked | LSDR10GRZRadio.checked; 
              //not_in_footprint.disabled     = LSDR9GRZRadio.checked | LSDR10GRZRadio.checked; 
              //if (catalogRadio[4].checked | catalogRadio[5].checked){
              if (catalogRadio[2].checked){
                  //var display = document.getElementById('split-cleaned-display');
                  //var in_xgood = parseInt(in_xgood_input.value)
                  //var split_cleaned = parseInt(split_cleaned_input.value)
                  var in_footprint = parseInt(in_footprint_input.value)
                  var merger = parseInt(merger_input.value)

                  /*if (in_xgood === 1) {
                     in_xgood_display.innerHTML = '✅';
                  } else if (in_xgood === 0) {
                    in_xgood_display.innerHTML = '❌';
                  } else {
                    in_xgood_display.innerHTML = '❔';
                  }

                  if (split_cleaned === 1) {
                     split_cleaned_display.innerHTML = '✅';
                  } else if (split_cleaned === 0) {
                    split_cleaned_display.innerHTML = '❌';
                  } else {
                    split_cleaned_display.innerHTML = '❔';
                  }*/
                  if (in_footprint === 1) {
                     in_footprint_display.innerHTML = '✅';
                  } else if (in_footprint === 0) {
                    in_footprint_display.innerHTML = '❌';
                  } else {
                    in_footprint_display.innerHTML = '❔';
                  }
                  
                  if (merger === 1) {
                     merger_display.innerHTML = '✅';
                  } else if (merger === 0) {
                    merger_display.innerHTML = '❌';
                  } else {
                    merger_display.innerHTML = '❔';
                  }

              //} else if (catalogRadio[6].checked || catalogRadio[7].checked){
              /*} else if (catalogRadio[5].checked || catalogRadio[6].checked){
                  var in_xgood = parseInt(in_xgood_input.value)
                  if (in_xgood === 1) {
                     in_xgood_display.innerHTML = '✅';
                  } else if (in_xgood === 0) {
                    in_xgood_display.innerHTML = '❌';
                  } else {
                    in_xgood_display.innerHTML = '❔';
                  }
                  split_cleaned_display.innerHTML = '✅';
              //} else if (catalogRadio[8].checked){
              } else if (catalogRadio[7].checked){
                  var in_xgood = parseInt(in_xgood_input.value)
                  if (in_xgood === 1) {
                     in_xgood_display.innerHTML = '✅';
                  } else if (in_xgood === 0) {
                    in_xgood_display.innerHTML = '❌';
                  } else {
                    in_xgood_display.innerHTML = '❔';
                  } */
              } else {
                  //in_xgood_display.innerHTML = '❔';
                  //split_cleaned_display.innerHTML = '❔';
                  in_footprint_display.innerHTML = '❔';
                  merger_display.innerHTML = '❔';
              
                  //in_xgood.checked = true;
                  //split_cleaned.checked = true;
                  //visual_contamination.checked = false;
              }
              
            });
          });
          
        </script>
	</div>
	
  <?php
    //phpinfo();
    //echo "bla",isset($_POST['submit']);
	   if ( (count($_GET) == 0) && !isset($_POST['submit']) ){
               #$query = "";
               exit();}
  ?>

	<div id="loading-overlay-clusters">
          <div class="loading-spinner-clusters"></div>
	</div>

	<script>
	  startLoadingAnimation("clusters");
	</script>
	
	<div class="clusters">
	    
      <div class="toggle-button expanded">
          <span style="color:black">&#9660;</span>
      </div>


	  <?php

	   if ($sra == "None"){
               echo "<h1 align='center'>Error: Could not resolve name.</h1>";
               echo "<script>hideLoadingAnimation('clusters');</script>";
               exit;
	   }

           // Connect to the database
	   $passtxt = file('mysql_credentials.txt');
	   $dbname   = trim(substr($passtxt[1],9));
	   $username = trim(substr($passtxt[2],9));
	   $password = trim(substr($passtxt[3],9));
	   $host = "localhost";
	   try {
	     $conn = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
	     $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	   }catch(PDOException $e) {
	     echo "Connection failed: " . $e->getMessage();
	   }
	 	
	   // Retrieve data from the database

	   if ( (count($_GET) == 0) && !isset($_POST['submit']) ){
               #$query = "";
               exit();
           }else{
	   
               # query clusters
               if ($catalog == "OPTICAL"){
                    $query = "SELECT MEM_MATCH_ID, NAME, BEST_Z, Z_LAMBDA, LIT_Z, LAMBDA_NORM, RA, DE, RA_MBCG, DEC_MBCG, MASKFRAC, VDISP, VDISP_ERR, IN_FOOTPRINT, IN_ZVLIM, LMAX, VISUAL_CONTAMINATION";
               //}else if (strpos($catalog, 'EUC') !== false){
                //    $query = "SELECT MEM_MATCH_ID, NAME, BEST_Z, Z_LAMBDA, LIT_Z, LAMBDA_NORM, RA, DE, RA_MBCG, DEC_MBCG, MASKFRAC, IN_FOOTPRINT, IN_ZVLIM, LMAX, VISUAL_CONTAMINATION";
               }else{
                    $query = "SELECT MEM_MATCH_ID, NAME, BEST_Z, Z_LAMBDA, LIT_Z, LAMBDA_NORM, RA, DE, RA_OPT, DEC_OPT, RA_MBCG, DEC_MBCG, MASKFRAC, VDISP, VDISP_ERR, IN_FOOTPRINT, IN_ZVLIM, LMAX, VISUAL_CONTAMINATION";
               }

               if (in_array($catalog, ['EUCTR1BPZWAV','EUCTR1ERICHOUTAMICO','EUCTR1ERICHOUTPZWAV','EUCTR1ERICHOUTFPZWAV','EUCTR1FAMICOCORNERS'], true))
                   $query .= ", LAMBDA_RS";

               if ($catalog == "ERASS4E")
               //if ($catalog == "ERASS1E" | $catalog == "CUSTOM")
                   $query .= ", EXT_LIKE, DET_LIKE, L500, M500, R500, SNR, MERGER, BCG_SCORE";

               if ($catalog == "ERASS1PF")
                   $query .= ", CLASS";

               //if ($catalog == "ERASS1E")
               //if ($catalog == "ERASS1E" | $catalog == "CUSTOM")
               //   $query .= ", PCONT, IN_XGOOD, SPLIT_CLEANED, VISUAL_CONTAMINATION, L500, M500, R500, Z_LAMBDA_SECOND";
	       
               //if ($catalog == "DESY1")
               //if ($catalog == "EFEDS2" | $catalog == "DESY1" | $catalog == "CUSTOM")
               if ($catalog == "EFEDS2" | $catalog == "CUSTOM" | $catalog == "ERASS4E" | $catalog == "ERASS4EV1" | $catalog == "ERASS4EV2")
                      $query .= ", Z_LAMBDA_SECOND";
	       
               if ($sra != "" && $sde != ""){
                   $query .= ", SQRT(POW( ({$sde} - DE), 2) + POW( (RA - {$sra}) * COS(DE / 57.3), 2))*60. AS DISTANCE";
                     if ($dist == "")
                       exit("Please enter a maximum distance from R.A. and Dec.");
               }elseif ($sra != "" && $sde == ""){
                       exit("Please enter a Dec.");
               }elseif ($sra == "" && $sde != ""){
                       exit("Please enter a R.A.");
               }
               
               $query .= " FROM {$catalog}CLUSTERS WHERE";
               
               if ($name != ""){
                   $names = array_map('trim', explode(',', $name));
                   $query .= " (";
                   foreach ($names as $iname) {
                       $query .= "NAME LIKE '%{$iname}%' OR ";
                   }
                   $query = rtrim($query, ' OR ') . ") AND";
               }
               
               if ($bestzmin != "")                                                                                                                                                   
                   $query .= " BEST_Z > {$bestzmin} AND";                                                                                                                             
               if ($bestzmax != "")                                                                                                                                                   
                   $query .= " BEST_Z <= {$bestzmax} AND";                                                                                                                            

               if ($catalog == "ERASS4E"){
                   if ($euczmin != "")                                                                                                                                                   
                       $query .= " LIT_Z >= {$euczmin} AND";                                                                                                                             
                   if ($euczmax != "")                                                                                                                                                   
                       $query .= " LIT_Z <= {$euczmax} AND";                                                                                                                            
               }

                                                                                                                                                                                      
               if ($lambdanormmin != "")                                                                                                                                              
                   $query .= " LAMBDA_NORM > {$lambdanormmin} AND";                                                                                                                   
               if ($lambdanormmax != "")                                                                                                                                              
                   $query .= " LAMBDA_NORM <= {$lambdanormmax} AND";                                                                                                                  
                                                                                                                                                                                      
               /*if ($snrmin != "")                                                                                                                                              
                   $query .= " SNR > {$snrmin} AND";                                                                                                                   
               if ($snrmax != "")                                                                                                                                              
                   $query .= " SNR <= {$snrmax} AND";*/
                   
                   
               if ($maskfracmin != "")                                                                                                                                              
                   $query .= " MASKFRAC > {$maskfracmin} AND";                                                                                                                        
               if ($maskfracmax != "")                                                                                                                                                
                   $query .= " MASKFRAC <= {$maskfracmax} AND";                                                                                                                       
                                                                                                                                                                                      
               /*if ($pcontmin != "")                                                                                                                                                   
                   $query .= " PCONT > {$pcontmin} AND";                                                                                                                              
               if ($pcontmax != "")                                                                                                                                                   
                   $query .= " PCONT <= {$pcontmax} AND"; */                                                                                                                          

               if ($in_footprint === 0) {
                   $query .= " IN_FOOTPRINT = 0 AND";
               } elseif ($in_footprint === 1) {
                   $query .= " IN_FOOTPRINT = 1 AND";
               }

               if ($catalog == "ERASS4E"){
                   if ($merger === 0) {
                       $query .= " MERGER = 0 AND";
                   } elseif ($merger === 1) {
                       $query .= " MERGER = 1 AND";
                   }
                }

               /*if ($in_footprint && $not_in_footprint)
                   $query .= "";
               elseif ($in_footprint)
                   $query .= " IN_FOOTPRINT = 1 AND";
               elseif ($not_in_footprint)
                   $query .= " IN_FOOTPRINT = 0 AND";*/
                   
               if ($in_zvlim === 0) {
                   $query .= " IN_ZVLIM = 0 AND";
               } elseif ($in_zvlim === 1) {
                   $query .= " IN_ZVLIM = 1 AND";
               }

               /*if ($in_zvlim && $not_in_zvlim)
                   $query .= "";
               elseif ($in_zvlim)
                   $query .= " IN_ZVLIM = 1 AND";
               elseif ($not_in_zvlim)
                   $query .= " IN_ZVLIM = 0 AND";*/
	       
	       if ($catalog == "ERASS4E" | $catalog == "ERASS4EV1" | $catalog == "ERASS4EV2" | $catalog == "ERASS4P" | $catalog == "OPTICAL" | $catalog == "KLUGE"){
	       //if ($catalog == "ERASS1E" | $catalog == "CUSTOM"){
                   /*if ($in_xgood)
                       $query .= " IN_XGOOD = 1 AND";
                   if ($split_cleaned)
                       $query .= " SPLIT_CLEANED = 1 AND";*/
                   //if (!$visual_contamination)
                    //   $query .= " VISUAL_CONTAMINATION = 0 AND";
               if ($in_xgood === 0) {
                   $query .= " IN_XGOOD = 0 AND";
               } elseif ($in_xgood === 1) {
                   $query .= " IN_XGOOD = 1 AND";
               }
	       }
	       if ($catalog == "ERASS4E" | $catalog == "ERASS4EV1" | $catalog == "ERASS4EV2"){
               if ($split_cleaned === 0) {
                   $query .= " SPLIT_CLEANED = 0 AND";
               } elseif ($split_cleaned === 1) {
                   $query .= " SPLIT_CLEANED = 1 AND";
               }
                    
	       }
	       
           //if (!$visual_contamination)
            //   $query .= " VISUAL_CONTAMINATION = 0 AND";

            if ($visual_contamination === 1) {
                $query .= " VISUAL_CONTAMINATION = 1 AND";
            } elseif ($visual_contamination === 2) {
                $query .= " VISUAL_CONTAMINATION = 2 AND";
            } elseif ($visual_contamination === 3) {
                $query .= " VISUAL_CONTAMINATION = 3 AND";
            }

           $query = rtrim($query, "WHERE");
           $query = rtrim($query, "AND ");
	       
           if ($sra != "" && $sde != "")
               $query .= " HAVING DISTANCE < {$dist} ORDER BY DISTANCE";
               
           if ($sra != "" && $sde != ""){
               preg_match("/FROM\s+(.+?)\s+HAVING/i", $query, $matches);
               
               if (strpos($matches[1], "WHERE") == true){
                   $fillword = "AND";
               }else{
                   $fillword = "WHERE";
               }
               $countQuery = "SELECT COUNT(*) FROM {$matches[1]} {$fillword} SQRT(POW( ({$sde} - DE), 2) + POW( (RA - {$sra}) * COS(DE / 57.3), 2))*60. < {$dist}";
           }else{
	           $countQuery = preg_replace('/SELECT .* FROM/', 'SELECT COUNT(*) FROM', $query);
           }
           
           
	       $stmt = $conn->prepare($countQuery);
           $stmt->execute();
           $nclusters = $stmt->fetchColumn();
	       
	       if ($nclusters == 0){
		       echo "<script>hideLoadingAnimation('clusters');</script>";
		       exit("<h1 align='center'>No CLUSTERS found</h1>");
           }
           
           echo "<h1 align='center'>{$nclusters} CLUSTERS found</h1>";

	       if ($nclusters >= 20000) {
               echo "<h1 align='center'>Error: The query returned &ge;20000 clusters. Please refine your search.</h1>";
               echo "<script>hideLoadingAnimation('clusters');</script>";
               exit;
           }

           $stmt = $conn->prepare($query);
           $stmt->execute();
           $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
           $mids = array_column($results, 'MEM_MATCH_ID'); // convert bigint to string
           $mids = array_map('strval', $mids);
                          
           // Check result. This shows the actual query sent to MySQL, and the error. Useful for debugging.
           if (!$results) {
               $message  = 'Invalid query: ' . mysql_error() . "\n";
               $message .= 'Whole query: ' . $query;
               die($message);
           }
               
           error_reporting(E_ALL); 
           ini_set('display_errors',1);
               
        
           //if ($catalog == "LSDR10GRZ" | $catalog == "LSDR9GRZ" | $catalog == "OPTICAL" | (strpos($catalog, 'EUC') !== 0) & ($catalog != 'EUCSPT3G')){
           if ($catalog == "LSDR10GRZ" | $catalog == "LSDR9GRZ" | $catalog == "OPTICAL"){
               foreach ($results as &$row) {
                   $row['RA_OPT'] = NULL;
                   $row['DEC_OPT'] = NULL;
               }
               unset($row);
           }               
               
	       echo "<div style='display:inline-block;width=50px'><table id='nclusterstable' style='font-size:13px'><thead><th><div class='tooltip'>#<span class='tooltiptext' style='transform:translate(0%,-18%)'>running number (not ID_CLUSTER)</span></div></th></thead><tbody>";
               $i = 0;
               foreach ($results as $row) {
                    if ($row['VISUAL_CONTAMINATION'] == 1){
                    $color = '#ea925b';
                    } elseif ($row['VISUAL_CONTAMINATION'] == 2) {
                    $color = '#ABA200';
                    } elseif ($row['VISUAL_CONTAMINATION'] == 3) {
                    $color = '#3CB54D';
                    } else {
                    $color = 'initial';
                    }
                    echo "<tr style=\"background-color:" . $color . "\"><td align='right'>", $i, "</td></tr>";
                    $i += 1;
               }
               echo "</tbody></table></div>";
	       	    
               echo "<div style='display:inline-block;width:calc(100% - 50px)'><table align='center' style='font-size:13px' id='clusterstable' class='table-sortable'>";
               echo "<thead>";
               echo "<tr><th data-sort='string'><div class='tooltip'>";
               if ($catalog == "EUCRR2AMICOHISNR"){
                   echo "IAU NAME _ ID";
               }else if ($catalog == "EUCSPT3G" | $catalog == "EUCWL1" | str_contains($catalog, 'ERASS1') | str_contains($catalog, 'ERASS4')){
                   echo "NAME";
               }else{
                   echo "IAU NAME _ Z";
               }
               echo "<span class='tooltiptext' style='transform:translate(-10%,-18%)'>cluster name following IAU convention (truncated coordinates)</span></div></th><th data-sort='float'><div class='tooltip'>RA<span class='tooltiptext' style='transform: translate(-50%, -18%)'>Right Ascension</span></div></th><th data-sort='float'><div class='tooltip'>DEC<span class='tooltiptext' style='transform: translate(-50%, -18%)'>Declination</span></div></th>";
               if ($catalog == "ERASS1E" | $catalog == "ERASS4EV1" | $catalog == "ERASS4EV2" | $catalog == "ERASS1P" | $catalog == "ERASS4P" | $catalog == "CODEX1" | $catalog == "LSDR9GRZ" | $catalog == "LSDR10GRZ" | $catalog == "OPTICAL"){
                   echo "<th data-sort='float'><div class='tooltip'>LIT_Z<span class='tooltiptext' style='transform: translate(-50%, -18%)'>literature redshift</span></div></th>";
               }else if (str_contains($catalog, 'ERASS4')) {
                   echo "<th data-sort='float'><div class='tooltip'>EUC_Z<span class='tooltiptext' style='transform: translate(-50%, -18%)'>Euclid AMICO redshift</span></div></th>";
               }else if ($catalog == 'EUCSPT3G'){
                   echo "<th data-sort='float'><div class='tooltip'>Z_PZWAV<span class='tooltiptext' style='transform: translate(-50%, -18%)'>euclid redshift (Z_CLUSTER_1)</span></div></th>";
               }else if (str_contains($catalog, 'ERASS1MATCHED')) {
                   echo "<th data-sort='float'><div class='tooltip'>Z_EUCLID<span class='tooltiptext' style='transform: translate(-50%, -18%)'>euclid redshift</span></div></th>";
               }else if (strpos($catalog, 'EUC') !== 0){
                   echo "<th data-sort='float'><div class='tooltip'>ORG_Z<span class='tooltiptext' style='transform: translate(-50%, -18%)'>original redshift in catalog</span></div></th>";
               }
               
               if (strpos($catalog, 'EUC') !== 0){
                   echo "<th data-sort='float'><div class='tooltip'>BEST_Z<span class='tooltiptext' style='transform: translate(-50%, -18%)'>spectroscopic, photometric, or literature redshift</span></div></th>";
               }
               if ($catalog == 'EUCSPT3G'){
                   echo "<th data-sort='float'><div class='tooltip'>Z_SPT<span class='tooltiptext' style='transform: translate(-50%, -18%)'>photometric redshift</span></div></th>";
               }else if (str_contains($catalog, 'ERASS1')) {
                   echo "<th data-sort='float'><div class='tooltip'>BEST_Z (eRASS1)<span class='tooltiptext' style='transform: translate(-50%, -18%)'>best redshift</span></div></th>";
               }else if (str_contains($catalog, 'ERASS4')) {
                   echo "<th data-sort='float'><div class='tooltip'>Z_PHOTO<span class='tooltiptext' style='transform: translate(-50%, -18%)'>photometric redshift Z_LAMBDA_CORR</span></div></th>";
               }else{
                   echo "<th data-sort='float'><div class='tooltip'>Z_CLUSTER<span class='tooltiptext' style='transform: translate(-50%, -18%)'>photometric redshift</span></div></th>";
               }
               // if ($catalog == "ERASS1E" | $catalog == "CUSTOM" | $catalog == "EFEDS2" | $catalog == "DESY1"){
               if ($catalog == "ERASS1E" | $catalog == "DESY1" | $catalog == "ERASS4E" | $catalog == "ERASS4EV1" | $catalog == "ERASS4EV2"){
                   echo "<th data-sort='float'><div class='tooltip'>Z_PHOTO_2<span class='tooltiptext' style='transform: translate(-90%, -18%)'>Z_LAMBDA_SECOND: redshift of second cluster along the line of sight</span></div></th>";
               }
               echo "<th data-sort='float'><div class='tooltip'>RICHNESS";
               if (str_contains($catalog, 'ERASS1')) {
                   echo " (eRASS1)";
               }else if (in_array($catalog, ['EUCTR1ERICHOUT','EUCTR1FAMICOCORNERS'], true)) {
                   echo "_ZP";
               }else if (str_contains($catalog, 'PZWAV')) {
                   echo "_PZWAV";
               }else if (str_contains($catalog, 'AMICO')) {
                   echo "_AMICO";
               }
               echo "<span class='tooltiptext' style='transform: translate(-50%, -18%)'>RICHNESS_CLUSTER: scaled sum of membership probabilities</span></div></th>";
               if (in_array($catalog, ['EUCTR1BPZWAV','EUCTR1ERICHOUTAMICO','EUCTR1ERICHOUTPZWAV','EUCTR1ERICHOUTFPZWAV','EUCTR1FAMICOCORNERS'], true)) {
    	           echo "<th data-sort='float'><div class='tooltip'>RICHNESS_RS<span class='tooltiptext' style='transform: translate(-50%, -18%)'>richness based on red-sequence galaxies</span></div></th>";
               }
	           
               if (strpos($catalog, 'EUC') !== 0){
	               echo "<th data-sort='float'><div class='tooltip'>FRAC_MASKED<span class='tooltiptext' style='transform: translate(-50%, -18%)'>FRAC_MASKED_CLUSTER: fraction of masked area</span></div></th>";
               }
	           if (str_contains($catalog, 'ERASS4')) {
	               echo "<th data-sort='float'><div class='tooltip'>VDISP<span class='tooltiptext' style='transform: translate(-50%, -18%)'>velocity dispersion [km/s]</span></div></th><th data-sort='float'><div class='tooltip'>E_VDISP<span class='tooltiptext' style='transform: translate(-90%, -18%)'>VDISP_ERR: uncertainty of velocity dispersion [km/s]</span></div></th>";
	           }

	           if (str_contains($catalog, 'ERASS4')) {
    	           echo "<th data-sort='float'><div class='tooltip'>LMAX<span class='tooltiptext' style='transform: translate(-90%, -18%)'>eROMaPPer cluster optical likelihood</span></div></th>";
    	           echo "<th data-sort='float'><div class='tooltip'>SNR<span class='tooltiptext' style='transform: translate(-90%, -18%)'>AMICO cluster signal/noise</span></div></th>";
	           }else{
	               echo "<th data-sort='float'><div class='tooltip'>SNR<span class='tooltiptext' style='transform: translate(-90%, -18%)'>SNR_CLUSTER: signal to noise ratio of cluster detection</span></div></th>";
	           }
	           
               //if ($catalog == "ERASS1E" | $catalog == "CUSTOM"){
               if ($catalog == "ERASS1E"){
                   echo "<th data-sort='float'><div class='tooltip'>PCONT<span class='tooltiptext' style='transform: translate(-90%, -18%)'>probability of cluster being a contamination</span></div></th>";
               }
               if ($catalog == "ERASS4E" | $catalog == "ERASS4P"){
                   echo "<th data-sort='float'><div class='tooltip'>EXT_LIKE<span class='tooltiptext' style='transform: translate(-90%, -18%)'>Extent Likelihood</span></div></th>";
                   echo "<th data-sort='float'><div class='tooltip'>DET_LIKE<span class='tooltiptext' style='transform: translate(-90%, -18%)'>Detection Likelihood (DET_LIKE_0)</span></div></th>";
               }
               if ($catalog == "ERASS1E" | $catalog == "ERASS4E" | $catalog == "ERASS4EV1" | $catalog == "ERASS4EV2"){
                   echo "<th data-sort='float'><div class='tooltip'>L_X<span class='tooltiptext' style='transform: translate(-90%, -18%)'>log(X-ray luminosity 0.2-2.3keV inside 300 kpc [erg/s])</span></div></th>";
    	           echo "<th data-sort='float'><div class='tooltip'>F_X<span class='tooltiptext' style='transform: translate(-90%, -18%)'>log(X-ray flux 0.2-2.3keV inside 300 kpc [erg/s/cm²])</span></div></th>";
                   echo "<th data-sort='float'><div class='tooltip'>M_GAS<span class='tooltiptext' style='transform: translate(-90%, -18%)'>log(total gas mass inside 300 kpc [M<sub>&#x2609;</sub>])</span></div></th>";
                   //echo "<th data-sort='float'><div class='tooltip'>L500<span class='tooltiptext' style='transform: translate(-90%, -18%)'>log(X-ray luminosity inside R500 [erg/s])</span></div></th>";
                   //echo "<th data-sort='float'><div class='tooltip'>M500<span class='tooltiptext' style='transform: translate(-90%, -18%)'>log(total mass inside R500 [M<sub>&#x2609;</sub>])</span></div></th>";
	               //echo "<th data-sort='float'><div class='tooltip'>R500<span class='tooltiptext' style='transform: translate(-90%, -18%)'>R500 [kpc]</span></div></th>";
	           }
	           if ($catalog == "ERASS4E"){
                   echo "<th data-sort='float'><div class='tooltip'>BCG_SCORE<span class='tooltiptext' style='transform: translate(-90%, -18%)'>ML BCG likelihood</span></div></th>";
               }
               if ($catalog == "ERASS1PF"){
	               echo "<th data-sort='float'><div class='tooltip'>CLASS<span class='tooltiptext' style='transform: translate(-90%, -18%)'>Cluster class</span></div></th>";
	           }

               if ($sra != "" && $sde != "")
                   echo "<th data-sort='float'><div class='tooltip'>DISTANCE<span class='tooltiptext' style='transform: translate(-90%, -18%)'>from search position [arcmin]</span></div></th>";
	       
	           echo "</tr>";
               echo "</thead>";
               echo "<tbody id='clustersTableBody'>";
               
               $i = 0;
               foreach ($results as $row) {
                  if ($row['VISUAL_CONTAMINATION'] == 1){
                    $color = '#ea925b';
                    } elseif ($row['VISUAL_CONTAMINATION'] == 2) {
                    $color = '#ABA200';
                    } elseif ($row['VISUAL_CONTAMINATION'] == 3) {
                    $color = '#3CB54D';
                    } else {
                    $color = 'initial';
                    }
               echo "<tr id='c" . $i . "' style=\"background-color:" . $color . "\" onclick=\"doChangeImage(" . $i . ")\">";
               echo "<td style='text-align:left;width:100px;white-space:nowrap'>" . $row['NAME'] . "</td>";
               printf("<td style='text-align:center;width:100px'>%.5f</td>", $row['RA']);
               printf("<td style='text-align:center;width:100px'>%.5f</td>", $row['DE']);

               if (($catalog == 'EUCSPT3G') | (strpos($catalog, 'EUC') !== 0) | (str_contains($catalog, 'ERASS1MATCHED')) ){
	       
	             if (empty($row['LIT_Z'])){
	               printf("<td style='text-align:center;width:100px'>—</td>");
                 } else if ($catalog === 'EUCSPT3G') {
	               printf("<td style='text-align:center;width:100px'>%.3f</td>", $row['LIT_Z']);
                 } else if ($catalog ===  'EUCPZWAVERASS1MATCHED') {
	               printf("<td style='text-align:center;width:100px'>%.3f</td>", $row['LIT_Z']);
                 } else if ($catalog ===  'EUCAMICOERASS1MATCHED') {
	               printf("<td style='text-align:center;width:100px'>%.2f</td>", $row['LIT_Z']);
                 } else if (str_contains($catalog, 'ERASS4')){
	               printf("<td style='text-align:center;width:100px'>%.2f</td>", $row['LIT_Z']);
	             } else {
	               printf("<td style='text-align:center;width:100px'>%.5f</td>", $row['LIT_Z']);
	             }			  
               }
               if (strpos($catalog, 'EUC') !== 0){
	           
                 if (empty($row['BEST_Z'])){
                   printf("<td style='text-align:center;width:100px'>—</td>");
	             } else {
	               printf("<td style='text-align:center;width:100px'>%.5f</td>", $row['BEST_Z']);
	             }
               }

                   if (empty($row['Z_LAMBDA'])){
                     printf("<td style='text-align:center;width:130px'>—</td>");
                   } else if (strpos($catalog, 'EUCTR1ERICHOUT') === 0) {
    	             printf("<td style='text-align:center;width:130px'>%.2f</td>", $row['Z_LAMBDA']);
                   } else if (in_array($catalog, ['EUCTR1FAMICO','EUCTR1FAMICOCORNERS'], true)) {
    	             printf("<td style='text-align:center;width:130px'>%.2f</td>", $row['Z_LAMBDA']);
                   } else if (in_array($catalog, ['EUCRR2PZWAV2','EUCWL1','EUCTR1A','EUCTR1BPZWAV','EUCTR1CPZWAV','EUCTR1DPZWAV','EUCTR1EPZWAV','EUCTR1FPZWAV'], true)) {
    	             printf("<td style='text-align:center;width:130px'>%.3f</td>", $row['Z_LAMBDA']);
                   } else if (str_contains($catalog, 'ERASS1')){
	                 printf("<td style='text-align:center;width:100px'>%.4f</td>", $row['BEST_Z']);
                   } else if (str_contains($catalog, 'ERASS4')){
	                 printf("<td style='text-align:center;width:100px'>%.5f</td>", $row['Z_LAMBDA']);
                   } else if (str_contains($catalog, 'AMICO')) {
    	             printf("<td style='text-align:center;width:130px'>%.3f</td>", $row['Z_LAMBDA']);
                   //} else if (strpos($catalog, 'PZWAV') == 0) {
    	           //  printf("<td style='text-align:center;width:130px'>%.3f</td>", $row['Z_LAMBDA']);
                   //} else if (strpos($catalog, 'EUCRR2PZWAV2') == 0) {
                   }else{
    	             printf("<td style='text-align:center;width:130px'>%.2f</td>", $row['Z_LAMBDA']);
                   }
	       
                   //if ($catalog == "ERASS1E" | $catalog == "CUSTOM" | $catalog == "EFEDS2" | $catalog == "DESY1"){
                   if ($catalog == "ERASS1E" | $catalog == "DESY1" | $catalog == "ERASS4E" | $catalog == "ERASS4EV1" | $catalog == "ERASS4EV2"){
	       	     if (empty($row['Z_LAMBDA_SECOND'])){
                       printf("<td style='text-align:center;width:130px'>—</td>");
                     }else{
	       	   printf("<td style='text-align:center;width:130px'>%6.5f</td>", $row['Z_LAMBDA_SECOND']);
                     }
	           }
	       
                   if (empty($row['LAMBDA_NORM'])){
                     printf("<td style='text-align:center;width:130px'>—</td>");
                   }else{
	       	         printf("<td style='text-align:center;width:130px'>%.1f</td>", $row['LAMBDA_NORM']);
                   }
                   
                   if (in_array($catalog, ['EUCTR1BPZWAV','EUCTR1ERICHOUTAMICO','EUCTR1ERICHOUTPZWAV','EUCTR1ERICHOUTFPZWAV','EUCTR1FAMICOCORNERS'], true)) {
                       if (empty($row['LAMBDA_RS'])){
                         printf("<td style='text-align:center;width:130px'>—</td>");
                       }else{
	       	             printf("<td style='text-align:center;width:130px'>%.1f</td>", $row['LAMBDA_RS']);
                       }
                   }

                   
                   if (strpos($catalog, 'EUC') !== 0){
                     if (empty($row['VDISP'])){
                       printf("<td style='text-align:center;width:130px'>—</td>");
                       printf("<td style='text-align:center;width:130px'>—</td>");
                       printf("<td style='text-align:center;width:130px'>—</td>");
                     }else{
                       printf("<td style='text-align:center;width:130px'>%.2f</td>", $row['MASKFRAC']);
                       printf("<td style='text-align:center;width:130px'>%d</td>", $row['VDISP']);
                       printf("<td style='text-align:center;width:130px'>%d</td>", $row['VDISP_ERR']);
                     }
                   }
	       
                   if ($catalog != "LSDR10GRZ" & $catalog != "LSDR9GRZ"){
                     if (empty($row['LMAX'])){
                       printf("<td style='text-align:center;width:100px'>—</td>");
    	             }else{
	                   printf("<td style='text-align:center;width:100px'>%.1f</td>", $row['LMAX']);
	                 }
                   }			  
                   
                    if ($catalog == "ERASS4E"){
                     if (empty($row['SNR'])){
                       printf("<td style='text-align:center;width:100px'>—</td>");
    	             }else{
	                   printf("<td style='text-align:center;width:100px'>%.1f</td>", $row['SNR']);
	                 }
                   }
	       				
                   //if ($catalog == "ERASS1E" | $catalog == "CUSTOM"){
                   if ($catalog == "ERASS1E"){
        	       	 if (empty($row['PCONT'])){
                       printf("<td style='text-align:center;width:130px'>—</td>");
                     }else{
	               	   printf("<td style='text-align:center;width:130px'>%.2f</td>", $row['PCONT']);
                     }
                   }
                   if ($catalog == "ERASS4E" | $catalog == "ERASS4P"){
	       	        if (empty($row['DET_LIKE'])){
                       printf("<td style='text-align:center;width:130px'>—</td>");
                       printf("<td style='text-align:center;width:130px'>—</td>");
                    }else{
        	       	   printf("<td style='text-align:center;width:130px'>%.1f</td>", $row['EXT_LIKE']);
	       	           printf("<td style='text-align:center;width:130px'>%.1f</td>", $row['DET_LIKE']);
                    }
                   }
                   if ($catalog == "ERASS1E" | $catalog == "ERASS4E" | $catalog == "ERASS4EV1" | $catalog == "ERASS4EV2"){
	       	        if (empty($row['L500'])){
                       printf("<td style='text-align:center;width:130px'>—</td>");
                       printf("<td style='text-align:center;width:130px'>—</td>");
                       printf("<td style='text-align:center;width:130px'>—</td>");
                    }else{
        	       	   printf("<td style='text-align:center;width:130px'>%.2f</td>", $row['L500']);
	               	   printf("<td style='text-align:center;width:130px'>%.2f</td>", $row['M500']);
	       	           printf("<td style='text-align:center;width:130px'>%.2f</td>", $row['R500']);
                    }
	       
	               }
                   if ($catalog == "ERASS4E"){
                       if (empty($row['BCG_SCORE'])){
                         printf("<td style='text-align:center;width:130px'>—</td>");
	                   }else{
	                     printf("<td style='text-align:center;width:130px'>%.2f</td>", $row['BCG_SCORE']);
	                   }
                   }
                   if ($catalog == "ERASS1PF"){
	               	   printf("<td style='text-align:center;width:130px'>%.0f</td>", $row['CLASS']);
                   }

	       			      
                   if ($sra != "" && $sde != "")
	       	 printf("<td style='text-align:center;width:130px'>%.2f</td>", $row['DISTANCE']);
	       			      
	           echo "</tr>";
	       
	       			      
                   $i += 1;
               }
               echo "</tbody>";
               echo "</table></div>";
           }
          ?>

	</div>

	<script>
	  // read mysql query results and store into global variables
	  results = <?= json_encode($results) ?>;
	  mids = <?= json_encode($mids) ?>;
	</script>
	
	<div class="members">

          <div id="loading-overlay-members"><div class="loading-spinner-members"></div></div>

	  <?php
           echo "<h1 id='memberheader' align='center' style='cursor:copy;'></h1>";
      
           //echo "<label id='visual-contamination-markerlabel' style='display: block; text-align: center;'><input type='checkbox' id='visual-contamination-checkbox'  " . ($results[0]['VISUAL_CONTAMINATION'] == 1 ? "checked" : "") . "> Mark as VISUAL_CONTAMINATION</label><br>";
           echo "<label id='visual-contamination-markerlabel' style='display: block; text-align: center; cursor:pointer;'>
             <span id='visual-contamination-markericon'>" .
             ($results[0]['VISUAL_CONTAMINATION'] == 1 ? "❌" : ($results[0]['VISUAL_CONTAMINATION'] == 2 ? "✅" : "❔")) .
             "</span> Cluster quality
             </label><br>";
           echo "<table id='memberstable' align='center' class='table-sortable'>";
           echo "<thead id='membersTableHead'>";
           echo "<tr><th data-sort='float'>RA</th><th data-sort='float'>DEC</th><th data-sort='float'>PMEM</th><th data-sort='float'>";
           if ($catalog == "EUCRR2AMICOHISNR"){
               echo "r MAG (rest)";
           }else if ($catalog == "EUCRR2PZWAV2"){
               echo "H MAG";
           }else if (str_contains($catalog, 'ERASS1')){
               echo "z MAG";
           }else if (str_contains($catalog, 'ERASS4')){
               echo "z MAG";
           }else{
               echo "J MAG";
           }
           echo "</th><th data-sort='float'>ZSPEC</th><th data-sort='string'>ZSPEC_REF</th>";
           if ($catalog == "ERASS4E"){
               echo "<th data-sort='float'>BCG_SCORE</th>";
           }
           echo "</tr>";
           echo "</thead>";
           echo "<tbody id='membersTableBody'>";
           echo "</tbody>";
           echo "</table>";
           
           // Close the database connection
           $conn = null;
      ?>

      <script>
        document.getElementById("memberheader").addEventListener("click", function() {
            // Copy the 'name' to the clipboard
            navigator.clipboard.writeText(results[ic]['NAME']);
        });
        //document.getElementById('visual-contamination-checkbox').addEventListener('click', function(event) {
        document.getElementById('visual-contamination-markerlabel').addEventListener('click', function(event) {
            event.preventDefault();
            updateVisualContamination();
        });
      </script>

	</div>
      </div>

      <div id="coordinatesbox"></div>
      <div id="scalebar"></div>
      <div id="scalebarkpc"></div>
      <div class="zoom-buttons">
    	<label style="background:white;color:black;padding:2px 6px;border-radius:3px;font-size:14px;transform:translateY(2px);display:inline-flex;align-items:center;"><input type="checkbox" id="aladincheckbox" onchange="toggleAladinView()" checked>Aladin</label>
        <button style="padding:0px 4px; font-size:14px; line-height:1; height:21px;" onclick="dofullscreen()">⛶</button>
	    <button onclick="zoomOne()">Zoom 1</button>
	    <button onclick="zoomFit()">to Fit</button>
	    <button id="zoomin"  onclick="zoomIn()">In</button>
	    <button id="zoomout" onclick="zoomOut()">Out</button>
    	<!--<button onclick="nextCluster()"     style="position: fixed; bottom: 40px; right: 55px;  width: 100px; height: 100px; font-size: 60px;">&gt;</button>
	    <button onclick="previousCluster()" style="position: fixed; bottom: 40px; right: 200px; width: 100px; height: 100px; font-size: 60px;">&lt;</button>-->
	    <button onclick="previousCluster()">&lt;</button>
    	<button onclick="nextCluster()">&gt;</button>
      </div>
      <div class="imagesurvey-dropdown">
        <select name="imagesurvey-dropdown-select" style="font-size:13px; padding:3px;" onchange="changesurvey(this.value)">
            <option value="EUCDECAM"
                <?= ($survey === 'EUCDECAM' && in_array($catalog, ['EUCPZWAV1', 'EUCRR2V2', 'EUCSPT3G', 'EUCV0M80', 'EUCV0M99', 'EUCV1M80', 'EUCV1M99', 'EUCRR2AMICOHISNR', 'EUCRR2PZWAV1', 'EUCRR2PZWAV2', 'EUCWL1', 'EUCTR1A', 'EUCTR1BAMICO', 'EUCTR1BPZWAV', 'EUCTR1CAMICO', 'EUCTR1CPZWAV','EUCTR1ERICHOUTAMICO','EUCTR1ERICHOUTPZWAV','EUCTR1ERICHOUTFPZWAV','EUCTR1FAMICOCORNERS'])) ? 'selected' : '' ?>
                <?= !in_array($catalog, ['EUCPZWAV1', 'EUCRR2V2', 'EUCSPT3G', 'EUCV0M80', 'EUCV0M99', 'EUCV1M80', 'EUCV1M99', 'EUCRR2AMICOHISNR', 'EUCRR2PZWAV1', 'EUCRR2PZWAV2', 'EUCWL1', 'EUCTR1A', 'EUCTR1BAMICO', 'EUCTR1BPZWAV', 'EUCTR1DPZWAV','EUCTR1ERICHOUTAMICO','EUCTR1ERICHOUTPZWAV','EUCTR1ERICHOUTFPZWAV','EUCTR1FAMICOCORNERS']) ? 'disabled' : '' ?>>
                Euclidized DECam g-r-z
            </option>

            <option value="VIS"
                <?= ($survey === 'VIS' && !in_array($catalog, ['EUCTR1DAMICO'])) ? 'selected' : '' ?>
                <?= in_array($catalog, ['EUCTR1DAMICO']) ? 'disabled' : '' ?>>
                Euclid VIS
            </option>
            <option value="NISP"
                <?= ($survey === 'NISP' && !in_array($catalog, ['EUCTR1DAMICO'])) ? 'selected' : '' ?>
                <?= in_array($catalog, ['EUCTR1DAMICO']) ? 'disabled' : '' ?>>
                Euclid NISP Y-J-H
            </option>

            <!-- <option value="VIS" <?= $survey === 'VIS' ? 'selected' : '' ?>>Euclid VIS</option>
            <option value="NISP" <?= $survey === 'NISP' ? 'selected' : '' ?>>Euclid NISP Y-J-H</option> -->
            <option value="LS" <?= 
                ($survey === 'LS' || 
                ($survey === 'EUCDECAM' && !in_array($catalog, ['EUCPZWAV1', 'EUCRR2V2','EUCSPT3G', 'EUCV0M80', 'EUCV0M99', 'EUCV1M80', 'EUCV1M99', 'EUCRR2AMICOHISNR','EUCTR1ERICHOUTAMICO','EUCTR1ERICHOUTPZWAV','EUCTR1ERICHOUTFPZWAV','EUCTR1FAMICOCORNERS'])) ||
                (in_array($catalog, ['']))
                )
                ? 'selected' : '' 
            ?>>Legacy Surveys g-r-z</option>
        </select>
      </div>




      <div class="image" id="imagecontainer" tabindex="0">

	<div id="allimages">
	  <div id="aladin-lite-div"></div>
	  <img id="cutoutimage">
	  <img id="contouroverlay" style="position: absolute; left: 0; top: 0; display: none">
	  <img id="contourszoverlay" style="position: absolute; left: 0; top: 0; display: none">
	  <img id="contoursz3goverlay" style="position: absolute; left: 0; top: 0; display: none">
	  <div id="crosses"></div>
	  <div id="circles"></div>
	</div>
	<div id="circles_placeholder"></div> <!-- keeps line break -->
	<div id="imageerrormessage"     style="color: grey; font-weight: bold; font-size: larger; position: absolute; top: 0; left: 0; transform: translate(0%, 0%); display: none; text-align: center"></div>
	<div id="loading-overlay-image"><div class="loading-spinner-image" style="justify-content: center; align-items: center;"></div></div>

	<br>

	
        <div class="reloadbutton" style="display:none"><button onclick="reloadImage();">Reload image</button></div>
        <div class="hiresbutton"  style="display:none"><button onclick="loadHiResImage();">Load high-resolution image</button></div>
        <label><input type="checkbox" id="manualbcgcheckbox" onclick="this.blur()" unchecked>enable manual BCG selection</label>

	<br><br>
	
	<a id="download"   style="display:none;" href="javascript:renderDivAsPng()">download image</a><br><br>
	<!--<a id="ds9reg"     style="display:none;" href="javascript:ds9RegionFile()">download DS9 region file</a><br><br>-->
	<a id="imageurl"   style="display:none;" href="" target="image" >open image url</a><br><br>	
	<a id="esaskylink" style="display:none;" href="" target="esasky">show in ESA Sky</a><br>
	<a id="legacylink" style="display:none;" href="" target="legacyviewer">show in legacy viewer</a><br>
	<a id="aladinlink" style="display:none;" href="" target="aladin">show in Aladin Lite</a><br>
	<!--<a id="erodatlink" style="display:none;" href="" target="_blank">query eRASS1 X-ray catalog</a><br><br>-->
    <a id="clusterurl" style="display:none;" href="#" onclick="event.preventDefault();generateClusterUrl();">copy url for this cluster</a><br><br>
	
	
	<div id="text"></div>

	
	<script>
	  hideLoadingAnimation("clusters");
      
	  //var results = <?= json_encode($results) ?>;	  
	  if (results == null){
	      document.querySelector('.clusters').style.display = 'none';
	      document.querySelector('.members' ).style.display = 'none';
	      document.querySelector('.query').style.maxHeight = '100vh';
	  }else{
	      document.querySelector('.query').style.maxHeight = '60vh';
	      document.querySelector('.clusters').style.display = 'block';
	      document.querySelector('.members' ).style.display = 'block';
	      
	      startLoadingAnimation("members");

	      //var mid = <?= json_encode($mids[0]) ?>;
          const aladinCheckbox = document.getElementById("aladincheckbox");
          useAladin = aladinCheckbox && aladinCheckbox.checked;
	      changeImage(0,results[0]['NAME'],mids[0],results[0]['RA'],results[0]['DE'],results[0]['RA_OPT'],results[0]['DEC_OPT'],results[0]['RA_MBCG'],results[0]['DEC_MBCG'],results[0]['VISUAL_CONTAMINATION'],results[0]['BEST_Z'],0.5,0.5,true,true,false,false);
	      //if (catalog == 'ERASS4E' | catalog == 'ERASS4EV1' | catalog == 'ERASS4EV2' | catalog == 'ERASS1PF' | catalog == 'ERASS4P' | catalog == 'OPTICAL' | catalog == 'KLUGE' |  catalog.includes('EUC')){
	      //   document.getElementById("contouroverlaycheckbox").click();
	      //}
	      if (window.members == 0){
	          document.getElementById("overlaycheckbox").click();
              window.members = 0;
              document.getElementsByName('members')[0].value = 0;
	      }
	      /*if (window.xray == 0){
	          document.getElementById("contouroverlaycheckbox").click();
	          window.xray = 0;
              document.getElementsByName('xray')[0].value = 0;
	      }
	      if (window.sz == 0){
              document.getElementById("contourszoverlaycheckbox").click();
              window.sz = 0;
              document.getElementsByName('sz')[0].value = 0;
          }*/


	      document.getElementById('download'  ).style.display = "inline-block";
	      //document.getElementById('ds9reg'    ).style.display = "inline-block";
	      document.getElementById('imageurl'  ).style.display = "inline-block";
	      document.getElementById('esaskylink').style.display = "inline-block";
	      document.getElementById('legacylink').style.display = "inline-block";
	      document.getElementById('aladinlink').style.display = "inline-block";
	      //document.getElementById('erodatlink').style.display = "inline-block";
	      document.getElementById('clusterurl').style.display = "inline-block";
	      //document.querySelector(".reloadbutton").style.display = "inline-block";
	      //document.querySelector(".hiresbutton" ).style.display = "inline-block";
	      var z = results[0]['BEST_Z'];
	      if (z == null){
		  [mM,kpcas] = calculate_kpcas(0.3);
	      }else{
		  [mM,kpcas] = calculate_kpcas(z);	      
	      }
	  }
	</script>
	  
    <br>
  </div>


      
      <script>
    	var imagecontainer = document.getElementById("imagecontainer"); // image imagecontainer circles
    	var rect = imagecontainer.getBoundingClientRect();
        var coordinatesBox = document.getElementById("coordinatesbox");
	    var circles = document.getElementById("circles").children;

    	ra  = parseFloat(results[ic]['RA']);
    	dec = parseFloat(results[ic]['DE']);
    	updatecoords(ra,dec,'violet');
	
        imagecontainer.addEventListener("mousemove", function(event) {
          if (!lock_coordinates){
	        if (useAladin && aladin !== null) {
                var aladinDiv = document.getElementById("aladin-lite-div");
                var rect = aladinDiv.getBoundingClientRect();
                var w = aladin.pix2world(event.clientX - rect.left, event.clientY - rect.top);
                if (w !== null && w !== undefined) {
                    var ra_al = w[0];
                    var dec_al = w[1];
                    last_cursor_ra = ra_al;
                    last_cursor_dec = dec_al;
                    var sra_al = convertDegreesToSexagesimal(ra_al/15.);
                    var sde_al = convertDegreesToSexagesimal(dec_al);
                    coordinatesBox.innerHTML = ra_al.toFixed(5).padStart(11," ") + " " + dec_al.toFixed(5) + "<br>" + sra_al + " " + sde_al;
                    coordinatesBox.style.color = 'black';
                }
                return;
            }
            var x = event.clientX - imagecontainer.offsetLeft + imagecontainer.scrollLeft;
	        var y = event.clientY + imagecontainer.scrollTop;
	        var radec = convertPixelsToCoordinates(x, y, results[ic]['RA'], results[ic]['DE'], imagesize/2., imagesize/2., scale);
	        var sra = convertDegreesToSexagesimal(radec.ra/15.);
	        var sde = convertDegreesToSexagesimal(radec.dec);
            coordinatesBox.innerHTML = radec.ra.toFixed(5).padStart(11," ") + " " + radec.dec.toFixed(5) + "<br>" + sra + " " + sde;
            coordinatesBox.style.color = 'black'
          }
        });

        imagecontainer.addEventListener("mouseleave", function(event) {
            if (!lock_coordinates){
            	ra  = parseFloat(results[ic]['RA']);
            	dec = parseFloat(results[ic]['DE']);
                updatecoords(ra, dec, 'violet');
            }
        });

	    // optimize member frame height to make scrollbar unnecessary
	    $(document).ready(function(){
            adjustMembersHeight();
	    });
	    $(window).resize(function(){
    	    adjustMembersHeight();
    	});

	
        // for hiding the query form
        const toggleButton = document.querySelector('.toggle-button');
        const clustersarea = document.querySelector('.clusters');
        const membersarea  = document.querySelector('.members');
        toggleButton.addEventListener('click', () => {
          if(toggleButton.classList.contains('expanded')){
              query.classList.remove('move-down');
              query.classList.add('move-up');
	          setTimeout(() => {
                  clustersarea.style.maxHeight = "60vh";
                  membersarea.style.height = "calc(" + (document.documentElement.clientHeight - clustersarea.offsetHeight) + "px";
	          }, 500); // Wait for animation to finish before calculating the new height
          } else {
              query.classList.remove('move-up');
              query.classList.add('move-down');
              clustersarea.style.maxHeight = "40vh";
              membersarea.style.height = "20vh";
	          setTimeout(() => {
                  membersarea.style.height = "calc(" + (document.documentElement.clientHeight - clustersarea.offsetHeight - query.offsetHeight) + "px)";
	          }, 500); // Wait for animation to finish before calculating the new height
          }    
          toggleButton.classList.toggle('expanded');
          toggleButton.classList.toggle('collapsed');


        });

        // — Sidebar show/hide toggle —
        document.addEventListener('DOMContentLoaded', () => {
          const btn = document.getElementById('toggle-sidebar');
          if (!btn) return;
          btn.addEventListener('click', () => {
            const collapsed = document.body.classList.toggle('collapsed-sidebar');
          });
        });
        
        
          const tableHeaders = document.querySelectorAll('thead');
          var query = document.querySelector('.query');
              
     
          if (day_mode == 1){
            tableHeaders.forEach(header => {
              header.classList.toggle('day-mode', this.checked);
            });
            
            document.getElementById('cutoutimage').style.filter="invert(100%)";
            document.getElementById('contouroverlay').style.filter="invert(100%)";
            document.getElementById('contourszoverlay').style.filter="invert(100%)";
            document.getElementById('contoursz3goverlay').style.filter="invert(100%)";
            document.getElementById('aladin-lite-div').style.filter = "invert(100%)";
            
            circlesInitialColor = 'black';
            circlesHighlightColor = '#BCA9F5';
            
            var circles = document.getElementById("circles").children;
            for (let c=0; c<circles.length; c++){
                if (c!=0 && c!=im_mark) {
                    circles[c].style.borderColor = circlesInitialColor;
                } else if (c==im_mark) {
                    circles[c].style.borderColor = circlesHighlightColor;
                }
            }
          } 
         
          const toggleDayModeLate = () => {
            document.documentElement.classList.toggle('day-mode');
            document.body.classList.toggle('day-mode');
            tableHeaders.forEach(header => {
              header.classList.toggle('day-mode', this.checked);
            });
            query.classList.toggle('day-mode');

            if (document.body.classList.contains('day-mode')) {
		        document.getElementById('cutoutimage').style.filter="invert(100%)";
		        document.getElementById('contouroverlay').style.filter="invert(100%)";
		        document.getElementById('contourszoverlay').style.filter="invert(100%)";
		        document.getElementById('contoursz3goverlay').style.filter="invert(100%)";
		        document.getElementById('aladin-lite-div').style.filter = "invert(100%)";
		        day_mode = 1;
            }else{
		        document.getElementById('cutoutimage').style.filter="invert(0%)";
		        document.getElementById('contouroverlay').style.filter="invert(0%)";
		        document.getElementById('contourszoverlay').style.filter="invert(0%)";
		        document.getElementById('contoursz3goverlay').style.filter="invert(0%)";
		        document.getElementById('aladin-lite-div').style.filter = "invert(0%)";
	            day_mode = 0;
            }
            
            document.getElementsByName('day_mode')[0].value = day_mode;
            
            document.getElementById("c"+ic).style.background = getComputedStyle(document.documentElement).getPropertyValue('--highlight-color');
	        if (im>=0){
              document.getElementById("m"+im).style.background = getComputedStyle(document.documentElement).getPropertyValue('--highlight-color');
	        }
            var ntable = document.getElementById("nclusterstable");
	        var isrow = document.getElementById("c"+ic).rowIndex;
	        ntable.rows[isrow].style.background = getComputedStyle(document.documentElement).getPropertyValue('--highlight-color');

            if (day_mode == 1){
                circlesInitialColor = 'black';
                circlesHighlightColor = '#BCA9F5';
            } else {
                circlesInitialColor = 'white';
                circlesHighlightColor = '#5D6D7E';
            }
	        var circles = document.getElementById("circles").children;
            for (let c=0; c<circles.length; c++){
                if (c!=0 && c!=im_mark) {
                    circles[c].style.borderColor = circlesInitialColor;
                } else if (c==im_mark) {
                    circles[c].style.borderColor = circlesHighlightColor;
                }
            }
          };
          
          toggleModeBtn.removeEventListener('click', toggleDayModeEarly);
          
          toggleModeBtn.addEventListener('click', toggleDayModeLate);
          
      </script>
    
    </div>


    <script>
      // add hotkeys
      // disable some hotkeys when not editing the query form
      window.addEventListener("keydown", function(e) {
        if(event.target.nodeName !== "INPUT" && ["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
          e.preventDefault();
        }
      }, false);
      
      dragtopan();
    </script>
	
	
    <!-- allow table sorting. Script from https://www.cssscript.com/demo/sort-table-header-column/ and slightly modified  -->
    <script src="../tablesort.min.js"></script>
    <script>document.querySelectorAll('.table-sortable').forEach(el => el.tsortable())</script>

    <!-- necessary when clicking the download image link  -->    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.3.2/html2canvas.min.js"></script>
    
  </body>
</html>
