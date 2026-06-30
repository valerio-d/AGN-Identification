function updateSurveyDropdownForAladin() {
    const box = document.querySelector(".imagesurvey-dropdown");
    const sel = document.getElementsByName("imagesurvey-dropdown-select")[0];
    const hidden = document.getElementsByName("survey")[0];

    if (!box || !sel) return;

    box.style.display = "block";

    for (const opt of sel.options) {
        if (opt.value === "NISP") {
            opt.textContent = "Euclid NISP Y-J-H";
        }
    }

    for (const opt of sel.options) {
        opt.disabled = useAladin && !["NISP", "VIS", "LS"].includes(opt.value);
    }

    let targetSurvey;

    if (useAladin) {
        if (["NISP", "VIS", "LS"].includes(staticSurveyBeforeAladin)) {
            targetSurvey = staticSurveyBeforeAladin;
        } else {
            targetSurvey = "NISP";
        }
    } else {
        targetSurvey = staticSurveyBeforeAladin;
    }

    sel.value = targetSurvey;
    survey = targetSurvey;
    if (hidden) hidden.value = targetSurvey;

    if (useAladin && aladin !== null) {
        changesurvey(targetSurvey, false);
    }
}

function changesurvey(newsurvey, rememberStatic=true) {
    survey = newsurvey;
    document.getElementsByName('survey')[0].value = survey;

    if (rememberStatic && (!useAladin || ["NISP","VIS","LS"].includes(newsurvey))) {
        staticSurveyBeforeAladin = newsurvey;
    }

    if (useAladin && aladin !== null) {
        if (survey === "LS") {
            window.legacyNorthLayer.setOpacity(1.0);
            window.legacySouthLayer.setOpacity(1.0);
            window.visLayer.setOpacity(0.0);
            aladin.getBaseImageLayer().setOpacity(0.0);
        } else if (survey === "VIS") {
            window.legacyNorthLayer.setOpacity(0.0);
            window.legacySouthLayer.setOpacity(0.0);
            window.visLayer.setOpacity(1.0);
            aladin.getBaseImageLayer().setOpacity(0.0);
        } else if (survey === "NISP") {
            window.legacyNorthLayer.setOpacity(0.0);
            window.legacySouthLayer.setOpacity(0.0);
            window.visLayer.setOpacity(0.0);
            aladin.getBaseImageLayer().setOpacity(1.0);
        }

        try { aladin.view.requestRedraw(); } catch(e) {}
        return;
    }

    doChangeImage(ic);
}

function dofullscreen(){
    if(document.fullscreenElement){
        document.exitFullscreen();
        document.body.classList.remove('collapsed-sidebar');
        setTimeout(() => {
            if (useAladin && aladin !== null) {
                aladin.view.requestRedraw();
                updateAladinOverlays();
                setTimeout(updateAladinOverlays, 200);
            }
        }, 300);
    }else{
        document.documentElement.requestFullscreen();
        document.body.classList.add('collapsed-sidebar');
        setTimeout(() => {
            if (useAladin && aladin !== null) {
                aladin.view.requestRedraw();
                updateAladinOverlays();
                setTimeout(updateAladinOverlays, 200);
            }
        }, 300);
    }
}
            
function updatecoords(ra,dec,color){
    var sexra = convertDegreesToSexagesimal(ra/15.);
    var sexde = convertDegreesToSexagesimal(dec);
    var coordinatesBox = document.getElementById("coordinatesbox");
    coordinatesBox.innerHTML = ra.toFixed(5).padStart(11," ") + " " + dec.toFixed(5) + "<br>" + sexra + " " + sexde;
    coordinatesBox.style.color = color
}

function startLoadingAnimation(element) {
    var loadingOverlay = document.getElementById("loading-overlay-"+element);
    var loadingSpinner = document.querySelector(".loading-spinner-"+element);
    loadingSpinner.style.animation = "spin 1s linear infinite";
    loadingOverlay.style.display   = "block";
}
function hideLoadingAnimation(element) {
    var loadingOverlay = document.getElementById("loading-overlay-"+element);
    var loadingSpinner = document.querySelector(".loading-spinner-"+element);
    loadingSpinner.style.animation = "none";
    loadingOverlay.style.display   = "none";
}

function calculate_kpcas(z){
    H0 = 67.66; // Planck+18; code taken from https://astro.ucla.edu/~wright/CosmoCalc.html
    WM = 0.30966;
    WV = 1.0 - WM - 0.4165/(H0*H0);
    
    c = 299792.458;
    
    h = H0/100.;
    WR = 4.165E-5/(h*h);
    WK = 1-WM-WR-WV;
    az = 1.0/(1+1.0*z);
    n=1000;
    for (let i=0; i<n; i++){
	a = az*(i+0.5)/n;
	adot = Math.sqrt(WK+(WM/a)+(WR/(a*a))+(WV*a*a));
    }
    DCMR = 0.0;
    
    for (let i=0; i<n; i++){
	a = az+(1-az)*(i+0.5)/n;
	adot = Math.sqrt(WK+(WM/a)+(WR/(a*a))+(WV*a*a));
	DCMR = DCMR + 1./(a*adot);
    }
    
    DCMR = (1.-az)*DCMR/n;
    
    ratio = 1.00;
    x = Math.sqrt(Math.abs(WK))*DCMR;
    if (x > 0.1){
	if (WK > 0){
	    ratio =  0.5*(Math.exp(x)-Math.exp(-x))/x ;
	}else{
	    ratio = Math.sin(x)/x;
	}
    }else{
	y = x*x;
	if (WK < 0){y = -y;}
	ratio = 1. + y/6. + y*y/120.;
    }
    DCMT = ratio*DCMR;
    DA = az*DCMT;
    DA_Mpc = (c/H0)*DA;
    kpc_DA = DA_Mpc/206.264806;
    
    DL = DA/(az*az);
    DL_Mpc = (c/H0)*DL;
    mM = 5*Math.log10(DL_Mpc*1e6)-5;
    return [mM, kpc_DA];
}	  

function convertDegreesToSexagesimal(degrees){
    var sign = (degrees < 0) ? '-' : '';
    var absDegrees = Math.abs(degrees);
    var intDegrees = Math.floor(absDegrees);
    var intMinutes = Math.floor((absDegrees - intDegrees) * 60);
    var Seconds = (((absDegrees - intDegrees) * 60) - intMinutes) * 60;
    return sign + intDegrees.toString().padStart(2,"0") + ":" +  intMinutes.toString().padStart(2,"0") + ":" + Seconds.toFixed(2).toString().padStart(5,"0");
}

function convertCoordinatesToPixels(ra, dec, centerRA, centerDec, centerpx, centerpy, zoom) {
    centerpx *= zoom;
    centerpy *= zoom;
    //pxscale   = document.getElementById("pxscalediv").innerHTML;
    if (Math.abs(ra - centerRA) > 180) { // wip
        if (ra > centerRA) {
            ra = parseFloat(ra) - 360;
        } else {
            ra = parseFloat(ra) + 360;
        }
    }
    let x = (centerpx) -  (ra - centerRA)  / pxscale * zoom * Math.cos(centerDec*Math.PI/180.) * 3600.;
    let y = (centerpy) - (dec - centerDec) / pxscale * zoom * 3600.;
    return { x: x, y: y };
}

function convertPixelsToCoordinates(x, y, centerRA, centerDec, centerpx, centerpy, zoom) {
    centerpx *= zoom;
    centerpy *= zoom;
    //pxscale   = document.getElementById("pxscalediv").innerHTML;
    let ra =  parseFloat(centerRA)  + (centerpx - x) * pxscale / zoom / Math.cos(centerDec*Math.PI/180.) / 3600.;
    let dec = parseFloat(centerDec) + (centerpy - y) * pxscale / zoom / 3600.;
    return { ra: ra, dec: dec };
}

function addSpecZCatalog({name, url, color = "cyan", sourceSize = 20, shape = "circle", labelColumn = "z_spec"}) {
    const cat = A.catalog({name, color, sourceSize, shape, displayLabel: true, labelColumn, labelColor: color, labelFont: "12px sans-serif", onClick: "showPopup"});
    aladin.addCatalog(cat);
    cat.hide();
    fetch(url).then(r => {
        if (!r.ok) throw new Error(`Failed to load ${url}: ${r.status}`);
        return r.text();
    }).then(txt => {
        const lines = txt.trim().split(/\r?\n/);
        const header = lines[0].split(",").map(s => s.trim());
        const ira = header.indexOf("ra"), idec = header.indexOf("dec");
        if (ira < 0 || idec < 0) throw new Error(`${url} needs columns named ra and dec`);
        const sources = [];
        for (const line of lines.slice(1)) {
            if (!line.trim()) continue;
            const c = line.split(",");
            const ra = parseFloat(c[ira]), dec = parseFloat(c[idec]);
            if (!Number.isFinite(ra) || !Number.isFinite(dec)) continue;
            const data = {};
            header.forEach((h, i) => { data[h] = c[i]; });
            sources.push(A.source(ra, dec, data));
        }
        cat.addSources(sources);
        console.log("added", sources.length, "sources to", name);
    }).catch(err => console.error(err));
    return cat;
}

function scrollMemberTableTo(im) {
    var row = document.getElementById("m" + im);
    var membersarea = document.querySelector(".members");

    if (!row || !membersarea) return;

    var rowRect = row.getBoundingClientRect();
    var membersRect = membersarea.getBoundingClientRect();

    var rowHeight = row.offsetHeight;

    var topMargin = 2.2 * rowHeight;
    var bottomMargin = 1 * rowHeight;  // adjust this

    if (rowRect.top < membersRect.top + topMargin) {
        membersarea.scrollTop -= (membersRect.top + topMargin - rowRect.top);
    } else if (rowRect.bottom > membersRect.bottom - bottomMargin) {
        membersarea.scrollTop += (rowRect.bottom - (membersRect.bottom - bottomMargin));
    }
}

// -------------------- Aladin Lite live sky viewer mode --------------------
function getCurrentClusterFovDeg() {
    let z = null;
    if (results && results[ic]) z = results[ic]['BEST_Z'];
    z = parseFloat(z);
    if (!Number.isFinite(z)) z = 0.3;   // same fallback idea as static mode
    const tmp = calculate_kpcas(z);
    const kpcas_tmp = tmp[1];
    // 2 Mpc across the image
    const pxscale_tmp = 0.5 * 2 / imagesize / kpcas_tmp * 1000.;
    return pxscale_tmp * imagesize / 3600.;
}
function getAladinArcsecPerPixel() {
    const fov = aladin.getFoV();          // degrees, usually [xFoV, yFoV]
    const w = document.getElementById("aladin-lite-div").clientWidth;
    return fov[0] * 3600.0 / w;
}
let aladinInitializing = false;
let aladinPendingCallback = null;

function initAladin(callback=null){
    if (aladin !== null) {
        if (callback) callback();
        return;
    }

    if (aladinInitializing) {
        aladinPendingCallback = callback;
        return;
    }

    if (typeof A === "undefined" || typeof A.aladin === "undefined") {
        console.error("Aladin Lite was not loaded.");
        return;
    }

    aladinInitializing = true;

    const doInit = function(){
        var ra0 = results && results[ic] ? parseFloat(results[ic]['RA']) : parseFloat(sra);
        var dec0 = results && results[ic] ? parseFloat(results[ic]['DE']) : parseFloat(sde);
        var fov0 = getCurrentClusterFovDeg();

        //aladinSurvey = 'China-VO/P/BASS/DR3/image';  // Comment this out and also in index.php. I dont think is being used anymore. Or when specifying the survey in the url, leave it?
        //aladinSurvey = 'https://erass-cluster-inspector.com/euclid/hips/nisp_y/';

        aladin = A.aladin('#aladin-lite-div', {
            target: ra0 + ' ' + dec0,
            fov: fov0,
        
            // temporary fallback; immediately replaced below
            survey: 'CDS/P/DESI-Legacy-Surveys/DR10/color',
        
            showReticle: false,
            showZoomControl: false,
            showFov: false,
            showFullscreenControl: false,
            showLayersControl: true,
            showGotoControl: false,
            showShareControl: false,
            showFrame: false,
            showCooGrid: false,
            showProjectionControl: false
        });
        
        const nispHips = aladin.createImageSurvey(
            'nisp',
            'NISP Y-J-H IDR1',
            'https://erass-cluster-inspector.com/euclid/hips/nisp',
            'equatorial',
            9,
            { imgFormat: 'jpeg' }
        );
        
        aladin.setImageSurvey(nispHips);
        
        const visHips = aladin.createImageSurvey(
            'vis',
            'VIS IDR1 (4x4 binned)',
            'https://erass-cluster-inspector.com/euclid/hips/vis',
            'equatorial',
            9,
            { imgFormat: 'jpeg' }
        );
        
        aladin.setImageSurvey(nispHips);
        window.visLayer = aladin.setOverlayImageLayer( visHips, 'vis' );
        
        /*const euclidVIS = A.imageHiPS(
            'https://easidr.esac.esa.int/sas/maps/VIS_WIDE_TEST/',
            {
                name: 'Euclid VIS',
                imgFormat: 'png',
                // only if your Aladin version supports it:
                credentials: 'include'
            }
        );
        aladin.addOverlayImageLayer(euclidVIS, 'Euclid VIS');*/
        
        
        
        const legacyNorthHiPS = aladin.createImageSurvey(
            'Legacy_DR9north',
            'LS north (BASS+MzLS), DR9',
            'China-VO/P/BASS/DR3/image',
            'equatorial',
            10,
            { imgFormat: 'png' }
        );
        window.legacyNorthLayer = aladin.setOverlayImageLayer( legacyNorthHiPS, 'Legacy_DR9north' );
        //window.legacyNorthLayer.setOpacity(0.0);

        const legacySouthHiPS = aladin.createImageSurvey(
            'Legacy_DR10south',
            'LS south (DECam), DR10',
            'CDS/P/DESI-Legacy-Surveys/DR10/color',
            'equatorial',
            11,
            { imgFormat: 'png' }
        );
        window.legacySouthLayer = aladin.setOverlayImageLayer( legacySouthHiPS, 'Legacy_DR10south' );
        //window.legacySouthLayer.setOpacity(0.0);



        /*aladinSurvey = (dec0 > 32.375)
            ? 'China-VO/P/BASS/DR3/image'
            : 'CDS/P/DESI-Legacy-Surveys/DR10/color';

        try {
            aladin = A.aladin('#aladin-lite-div', {
                target: ra0 + ' ' + dec0,
                fov: fov0,
                survey: aladinSurvey,   // temporary fallback, e.g. Legacy
                showReticle: false,
                showZoomControl: false,
                showFov: false,
                showFullscreenControl: false,
                showLayersControl: true,
                showGotoControl: false,
                showShareControl: false,
                showFrame: false,
                showCooGrid: false,
                showProjectionControl: false
            });
        } catch(e) {
            console.error("A.aladin failed", e);
            aladin = null;
            aladinInitializing = false;
            return;
        }*/
        
        
        /*// --- Euclid VIS as base layer ---
        const manualHiPSVIS = aladin.createImageSurvey(
            'Euclid_VIS_WIDE_TEST',
            'Euclid VIS WIDE TEST',
            'hips_proxy.php/',
            'equatorial',
            9,
            { imgFormat: 'jpg' }
        );
        aladin.setImageSurvey(manualHiPSVIS);*/

        // --- ADD YOUR HiPS LAYER HERE ---
        /*if (!window.xrayLayer) {
            window.xrayLayer = aladin.setOverlayImageLayer(
                'erosita/dr1/rate/024'
            );
        
            const enabled = document.getElementById("contouroverlaycheckbox")?.checked;
        
            if (window.xrayLayer.setAlpha) {
                window.xrayLayer.setAlpha(enabled ? 0.3 : 0.0);
            } else if (window.xrayLayer.setOpacity) {
                window.xrayLayer.setOpacity(enabled ? 0.3 : 0.0);
            }
        }*/
        


       /* const maskHips = aladin.createImageSurvey(
            'mask_detcl',
            'MASK: correctedall_south_april26.fits',
            'https://erass-cluster-inspector.com/euclid/hips/mask_detcl/',
            'equatorial',
            5,
            { imgFormat: 'png' }
        );
        window.maskLayer = aladin.setOverlayImageLayer( maskHips, 'MASK: correctedall_south_april26.fits');
        window.maskVisible = false;z
        window.maskLayer.setOpacity(0.0);*/

        if (!window.xrayLayer) {
            const manualHiPS024010 = aladin.createImageSurvey(
                'eRASS1_024_Rate_c010',
                'eRASS1 0.2-2.3 keV',
                'https://erosita.mpe.mpg.de/dr1/erodat/static/hips/eRASS1_024_Rate_c010/',
                'equatorial',
                7,
                { imgFormat: 'png' }
            );
            window.xrayLayer = aladin.setOverlayImageLayer(manualHiPS024010, 'eRASS1_024_Rate_c010');
            const enabled = document.getElementById("contouroverlaycheckbox")?.checked;
            window.xrayLayer.setOpacity(enabled ? 0.8 : 0.0);
        }

        /*if (!window.xrayLayer) {
            const manualHiPS024010 = aladin.createImageSurvey(
                'eRASS1_024_Rate_c010',
                'eRASS1 0.2-2.3 keV',
                //'https://erosita.mpe.mpg.de/dr1/erodat/static/hips/eRASS1_024_Rate_c010/',
                'https://erass-cluster-inspector.com/euclid/hips/eRASS1_024_Rate_c010/',
                'equatorial',
                6,
                { imgFormat: 'png' }
            );
            window.xrayLayer = aladin.setOverlayImageLayer(manualHiPS024010, 'eROSITA_024_Rate_c010');
            const enabled = document.getElementById("contouroverlaycheckbox")?.checked;
            window.xrayLayer.setOpacity(enabled ? 0.8 : 0.0);
        }*/
        
        /*if (!window.xrayLayer) {
            const manualHiPS024010 = aladin.createImageSurvey(
                'eROSITA_s04_s05_024_Rate_c030',
                'eROSITA_s04_s05_024_Rate_c030',
                //'https://erosita.mpe.mpg.de/dr1/erodat/static/hips/eRASS1_024_Rate_c010/',
                //'https://erass-cluster-inspector.com/euclid/hips/eRASS1_024_Rate_c010/',
                'https://erass-cluster-inspector.com/euclid/hips_proxy.php/',
                'equatorial',
                6,
                { imgFormat: 'png' }
            );
            window.xrayLayer = aladin.setOverlayImageLayer(manualHiPS024010, 'eROSITA_s04_s05_024_Rate_c030');
            const enabled = document.getElementById("contouroverlaycheckbox")?.checked;
            window.xrayLayer.setOpacity(enabled ? 0.8 : 0.0);
        }*/

        /*if (!window.szLayer) {
            const szHips = aladin.createImageSurvey(
                'spt_y',
                'SPT 2021 Y',
                'https://erass-cluster-inspector.com/euclid/hips/spt_y/',
                'equatorial',
                4,
                { imgFormat: 'png' }
            );
            window.szLayer = aladin.setOverlayImageLayer(szHips, 'spt_y');

            // initial state from your existing checkbox
            const enabled = document.getElementById("contourszoverlaycheckbox")?.checked;
            window.szLayer.setOpacity(enabled ? 0.6 : 0.0);
        }*/

        //addSpecZCatalog({name: "RR2_extspec_cat_v1.0.fits", url: "https://erass-cluster-inspector.com/euclid/catalogs_aux/RR2_extspec_cat_v1.0.csv", color: "cyan"});
        /*addSpecZCatalog({name: "deep mode", url: "https://erass-cluster-inspector.com/euclid/catalogs_aux/deep_mode_noduplicates_catalogue.csv", color: "magenta"});
        addSpecZCatalog({name: "wide mode", url: "https://erass-cluster-inspector.com/euclid/catalogs_aux/wide_mode_noduplicates_catalogue.csv", color: "orange"});
        addSpecZCatalog({name: "deep survey", url: "https://erass-cluster-inspector.com/euclid/catalogs_aux/deep_survey_noduplicates_catalogue.csv", color: "magenta"});
        addSpecZCatalog({name: "wide survey", url: "https://erass-cluster-inspector.com/euclid/catalogs_aux/wide_survey_noduplicates_catalogue.csv", color: "orange"});
        //addSpecZCatalog({name: "eRASS:5", url: "https://erass-cluster-inspector.com/euclid/catalogs_aux/spec_z_compilation_matthias_2025_07_12.csv", color: "green"});
        */

        /*if (!window.xrayLayer) {
            const manualHiPS024030 = aladin.createImageSurvey(
                'eROSITA_s04_024_Image_c030',
                'eROSITA_s04_024_Image_c030',
                'hips_proxy.php/',
                'equatorial',
                6,
                { imgFormat: 'png' }
            );
            window.xrayLayer024030 = aladin.setOverlayImageLayer(
                manualHiPS024030,
                'eROSITA_s04_024_Image_c030'
            );
            window.xrayLayer = aladin.setOverlayImageLayer(manualHiPS024030, 'eROSITA_s04_024_Image_c030');

            // initial state from your existing checkbox
            const enabled = document.getElementById("contouroverlaycheckbox")?.checked;
            if (window.xrayLayer.setAlpha) {
                window.xrayLayer.setAlpha(enabled ? 0.3 : 0.0);
            } else if (window.xrayLayer.setOpacity) {
                window.xrayLayer.setOpacity(enabled ? 0.3 : 0.0);
            }
        }*/

        // wheel binding (unchanged)
        const aladinDiv = document.getElementById("aladin-lite-div");
        if (!aladinDiv.dataset.wheelbound) {
            aladinDiv.addEventListener("wheel", aladinWheelZoomAtCursor, { passive:false, capture:true });
            aladinDiv.dataset.wheelbound = "1";
        }

        try {
            aladin.on('positionChanged', updateAladinOverlays);
            aladin.on('zoomChanged', updateAladinOverlays);
            aladin.on('projectionChanged', updateAladinOverlays);
        } catch(e) {}

        aladinInitializing = false;

        if (callback) callback();
        if (aladinPendingCallback) {
            const cb = aladinPendingCallback;
            aladinPendingCallback = null;
            cb();
        }
    };

    if (A.init && typeof A.init.then === "function") {
        A.init.then(doInit);
    } else {
        doInit();
    }
}

function aladinRedrawSoon(){
    if (!useAladin) return;
    window.requestAnimationFrame(function(){ updateAladinOverlays(); setTimeout(updateAladinOverlays,80); setTimeout(updateAladinOverlays,250); });
}
function addCrossAladin(ra, dec, cls){
    if (ra == null || dec == null || ra == 0 || dec == 0 || aladin === null) return;
    var p = aladin.world2pix(parseFloat(ra), parseFloat(dec));
    if (p === null || p === undefined) return;
    var cross = document.createElement("div");
    cross.classList.add(cls);
    cross.style.left = p[0] + "px";
    cross.style.top  = p[1] + "px";
    document.getElementById("crosses").appendChild(cross);
}
function updateAladinOverlays(){
    if (!useAladin || aladin === null || !results || !results[ic]) return;
    var circles = document.getElementById("circles");
    var crosses = document.getElementById("crosses");
    if (!circles || !crosses) return;
    circles.innerHTML = ""; crosses.innerHTML = "";
    addCrossAladin(results[ic]['RA'],     results[ic]['DE'],      "crossyellow");
    addCrossAladin(results[ic]['RA_OPT'], results[ic]['DEC_OPT'], "crossorange");
    addCrossAladin(results[ic]['RA_MBCG'], results[ic]['DEC_MBCG'], "crosspurple");
    addCrossAladin(sra, sde, "crossblue");
    if (typeof memcoords === "undefined" || memcoords === null) return;
    for (let c=0; c<memcoords.length; c++){
        var p = aladin.world2pix(parseFloat(memcoords[c][0]), parseFloat(memcoords[c][1]));
        if (p === null || p === undefined) continue;
        var circle = document.createElement("div");
        circle.classList.add("circle");
        circle.style.left = p[0] + "px"; circle.style.top = p[1] + "px";
        var color = circlesInitialColor;
        if (c == im_mark) color = circlesHighlightColor; //; else if (c == 0) color = 'red';
        var linetype = (memzspec && memzspec[c]) ? 'dashed' : 'solid';
        circle.style.border = "3px " + linetype + " " + color;
        circle.addEventListener("click", function(e){
            e.stopPropagation();
            if (im_mark === c) {
                var row = document.getElementById("m" + c);
                if (row) row.style.background = "initial";
                im = -1;
                im_mark = -1;
                im_before = -1;
            } else {
                if (im_mark >= 0) {
                    var oldrow = document.getElementById("m" + im_mark);
                    if (oldrow) oldrow.style.background = "initial";
                }
                im = c;
                im_mark = c;
                im_before = c;
                var row = document.getElementById("m" + c);
                if (row) {
                    row.style.background =
                        getComputedStyle(document.documentElement)
                        .getPropertyValue("--highlight-color");
                }
                scrollMemberTableTo(c);
            }
            updateAladinOverlays();
        });
        circle.addEventListener("wheel", aladinWheelZoomAtCursor, { passive: false, capture: true});
        circles.appendChild(circle);
    }
    const aladin_pxscale = getAladinArcsecPerPixel();
    const scalebar    = document.getElementById("scalebar");
    const scalebarkpc = document.getElementById("scalebarkpc");
    scalescalebar(
        aladin_pxscale,
        document.getElementById("aladin-lite-div").clientWidth,
        1.0
    );
    if (results[ic]['BEST_Z'] == null) {
        scalebarkpc.style.display = "none";
    } else {
        scalescalebarkpc(
            aladin_pxscale * kpcas,
            document.getElementById("aladin-lite-div").clientWidth,
            1.0
        );
    }
    if (useAladin) {
        scalebar.style.left = "auto";
        scalebar.style.right = "26px";
        scalebar.style.marginLeft = "0px";
        scalebar.style.transform = "translateY(6px)";
        scalebarkpc.style.left = "auto";
        scalebarkpc.style.right = "26px";
        scalebarkpc.style.marginLeft = "0px";
        scalebarkpc.style.transform = "translateY(6px)";
    } else {
        scalebar.style.right = "";
        scalebar.style.left = "50%";
        scalebar.style.marginLeft = "10px";
        scalebar.style.transform = "";
        scalebarkpc.style.right = "";
        scalebarkpc.style.left = "50%";
        scalebarkpc.style.marginLeft = "10px";
        scalebarkpc.style.transform = "";
    }
}

function aladinWheelZoomAtCursor(e) {
    if (!useAladin || aladin === null) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    const div = document.getElementById("aladin-lite-div");
    const r = div.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;

    const sky = aladin.pix2world(x, y);
    if (!sky) return;

    const center = aladin.getRaDec();
    const fov = aladin.getFov ? aladin.getFov()[0] : aladin.getFoV()[0];

    const factor = e.deltaY < 0 ? 0.90 : 1.0 / 0.90;

    let dra = sky[0] - center[0];
    if (dra > 180) dra -= 360;
    if (dra < -180) dra += 360;

    const ddec = sky[1] - center[1];

    const newCenterRa  = sky[0] - factor * dra;
    const newCenterDec = sky[1] - factor * ddec;

    aladin.gotoRaDec(newCenterRa, newCenterDec);
    //aladin.setFov(fov * factor);
    aladin.setFov(clampAladinFov(fov * factor));
    
    aladinRedrawSoon();
}

function showCurrentClusterInAladin(){
    if (!useAladin || aladin === null || !results || !results[ic]) return;

    var ra = parseFloat(results[ic]['RA']);
    var dec = parseFloat(results[ic]['DE']);

    aladin.gotoRaDec(ra, dec);
    aladin.setFov(getCurrentClusterFovDeg());
    aladin.view.setRotation(0);

    document.getElementById("coordinatesbox").style.display = "none";
    document.getElementById("scalebar").style.display = "block";

    if (results[ic]['BEST_Z'] != null) {
        document.getElementById("scalebarkpc").style.display = "block";
    }

    document.querySelector(".zoom-buttons").style.display = "block";
    updateSurveyDropdownForAladin();

    hideLoadingAnimation("image");

    var msg = document.getElementById("imageerrormessage");
    if (msg) msg.style.display = "none";

    aladinRedrawSoon();
}

function toggleAladinView(){
    if (!useAladin) zoomFit();
    
    var cb = document.getElementById("aladincheckbox");
    useAladin = cb ? cb.checked : !useAladin;

    var image = document.getElementById("imagecontainer");
    var aladinDiv = document.getElementById("aladin-lite-div");
    var cutout = document.getElementById("cutoutimage");

    document.getElementById("coordinatesbox").style.display =
        useAladin ? "none" : "block";

    //document.querySelector(".imagesurvey-dropdown").style.display = useAladin ? "none" : "block";
    updateSurveyDropdownForAladin();    


    if (useAladin){
        image.classList.add("aladin-mode");
        aladinDiv.style.display = "block";
        cutout.style.display = "none";

        initAladin(() => {
            showCurrentClusterInAladin();
            updateSurveyDropdownForAladin();
            docontouroverlay();
            docontourszoverlay();
        });

    }else{
        image.classList.remove("aladin-mode");
        aladinDiv.style.display = "none";
        cutout.style.display = "block";

        const scalebar    = document.getElementById("scalebar");
        const scalebarkpc = document.getElementById("scalebarkpc");

        [scalebar, scalebarkpc].forEach(b => {
            b.style.removeProperty("right");
            b.style.removeProperty("transform");
            b.style.left = "50%";
            b.style.marginLeft = "10px";
        });

        doChangeImage(ic);
        docontouroverlay();
        docontourszoverlay();
    }
}

function centerMember(im, ra, dec, centerRA, centerDec, centerpx, centerpy){
    if (useAladin && aladin !== null) {
        if (im_before >= 0) {
            var oldrow = document.getElementById("m"+im_before);
            if (oldrow) oldrow.style.background = "initial";
        }
        if (im == im_before) {
            im = -1;
            im_mark = -1;
            im_before = -1;
            updateAladinOverlays();
            return;
        }
        var row = document.getElementById("m"+im);
        if (row) {
            row.style.background =
                getComputedStyle(document.documentElement)
                .getPropertyValue('--highlight-color');
        }
        im_mark = im;
        im_before = im;
        aladin.gotoRaDec(parseFloat(ra), parseFloat(dec));
        updateAladinOverlays();
        return;
    }    
    //pxscale = document.getElementById("pxscalediv").innerHTML;
    let pos = convertCoordinatesToPixels(ra, dec, centerRA, centerDec, centerpx, centerpy, scale);
    let cw = image.clientWidth;
    let ch = image.clientHeight;
    let sx = pos.x - cw/2;
    let sy = pos.y - ch/2;
    //ic_before = document.getElementById("memberselectdiv").innerHTML
    //if (im_before>=0){
	//    document.getElementById("m"+im_before).style.background = "initial";
    //}
    //im_before = im;

    //const nightModeInput = document.getElementsByName('night_mode')[0];
    
    //if(nightModeInput.value == 0){
    //document.getElementById("m"+im).style.background = getComputedStyle(document.documentElement).getPropertyValue('--highlight-color');
    //}else{
    //document.getElementById("m"+i).style.background = getComputedStyle(document.documentElement).getPropertyValue('--highlight-color');
    //}
    //document.getElementById("memberselectdiv").innerHTML = im;
    

            var circles = document.getElementById("circles");
            var highlightColor = getComputedStyle(document.documentElement).getPropertyValue('--highlight-color');;
                
            if (im_before >= 0){

        	    //if (im_before == 0){
    	        //    color = 'red';
            	//}else{
	                color = circlesInitialColor;
	            //}		      
                
                circles.children[im_before].style.borderColor = color;
                document.getElementById("m"+im_before).style.background = "initial";

                if (im != im_before) {
                    document.getElementById("m"+im).style.background = highlightColor;
                    circles.children[im].style.borderColor = circlesHighlightColor;
                    image = document.getElementById("imagecontainer");	  
                    image.scrollTo( sx, sy );

                } else {
                    im = -1;
                }
            } else {
            //document.getElementsByName("objname")[0].value = im; // print temporary            
                document.getElementById("m"+im).style.background = highlightColor;
                circles.children[im].style.borderColor = circlesHighlightColor;
                image = document.getElementById("imagecontainer");	  
                image.scrollTo( sx, sy );

            
            }

            im_before = im;
            im_mark = im;
    
    //document.getElementsByName("objname")[0].value = circles.children.length; // print temporary
    
}

function dooverlay(){
    circles = document.getElementById("circles");
    crosses = document.getElementById("crosses");
    if (document.getElementById("overlaycheckbox").checked) {
    	circles.style.display = "block";
    	crosses.style.display = "block";
    }else{
	    circles.style.display = "none";
	    crosses.style.display = "none";
    }
    window.members = 1 - window.members;
    document.getElementsByName("members")[0].value = window.members;
}

function docontouroverlay(){
    const enabled = document.getElementById("contouroverlaycheckbox").checked;
    const contours = document.getElementById("contouroverlay");

    window.xray = enabled ? 1 : 0;
    document.getElementsByName("xray")[0].value = window.xray;

    // normal image mode: use SVG contours
    contours.style.display = (enabled && !useAladin) ? "block" : "none";

    // Aladin mode: use HiPS layer
    if (window.xrayLayer) {
        if (window.xrayLayer.setVisible) {
            window.xrayLayer.setVisible(enabled && useAladin);
        }
        window.xrayLayer.setOpacity((enabled && useAladin) ? 0.8 : 0.0);
    }
}

function docontourszoverlay(){
    const enabled = document.getElementById("contourszoverlaycheckbox").checked;
    const contours = document.getElementById("contourszoverlay");

    window.sz = enabled ? 1 : 0;
    document.getElementsByName("sz")[0].value = window.sz;

    // normal image mode: use SVG contours
    contours.style.display = (enabled && !useAladin) ? "block" : "none";

    // Aladin mode: use HiPS layer
    if (window.szLayer) {
        if (window.szLayer.setVisible) {
            window.szLayer.setVisible(enabled && useAladin);
        }
        window.szLayer.setOpacity((enabled && useAladin) ? 0.6 : 0.0);
    }
}

/*function docontourszoverlay(){
    const enabled = document.getElementById("contourszoverlaycheckbox").checked;
    const contourssz = document.getElementById("contourszoverlay");

    contourssz.style.display = (enabled && !useAladin) ? "block" : "none";

    window.sz = enabled ? 1 : 0;
    document.getElementsByName("sz")[0].value = window.sz;
}*/

function docontoursz3goverlay(){
    const contourssz3g = document.getElementById("contoursz3goverlay");
    const enabled = document.getElementById("contoursz3goverlaycheckbox").checked;
    contourssz3g.style.display = (enabled && !useAladin) ? "block" : "none";
}

function roundToClosest(num) {
    let arr = [1, 2, 5, 10, 20, 30, 60]; // array of the closest numbers
    let closest = arr[0]; // set the closest number to the first element in the array
    for (let i = 1; i < arr.length; i++) {
	if (Math.abs(num - closest) > Math.abs(num - arr[i])) {
	    closest = arr[i]; // update closest if a closer number is found
	}
    }
    return closest; // return the closest number
}
function roundToClosestKpc(num) {
    let arr = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000]; // array of the closest numbers
    let closest = arr[0]; // set the closest number to the first element in the array
    for (let i = 1; i < arr.length; i++) {
	    if (Math.abs(num - closest) > Math.abs(num - arr[i])) {
	        closest = arr[i]; // update closest if a closer number is found
	    }
    }
    return closest; // return the closest number
}

function roundToClosestFromArray(num, arr) {
    let closest = arr[0];
    for (let i = 1; i < arr.length; i++) {
        if (Math.abs(num - closest) > Math.abs(num - arr[i])) {
            closest = arr[i];
        }
    }
    return closest;
}

function scalescalebar(pxscale, imagewidth, scale) {
    var scalebar = document.getElementById("scalebar");

    // Desired scalebar length: half of visible image/canvas width
    var targetPx = imagewidth / 2. / scale;

    // Angular length of that target in arcsec
    var targetArcsec = targetPx * pxscale;

    var value, label, scalebarWidthPx;

    if (targetArcsec < 60.) {
        // arcsec
        value = roundToClosestFromArray(targetArcsec, [1, 2, 5, 10, 20, 30, 60]);
        label = value + " arcsec";
        scalebarWidthPx = value / pxscale * scale;

    } else if (targetArcsec < 3600.) {
        // arcmin
        var targetArcmin = targetArcsec / 60.;
        value = roundToClosestFromArray(targetArcmin, [1, 2, 5, 10, 20, 30, 60]);
        label = value + " arcmin";
        scalebarWidthPx = value * 60. / pxscale * scale;

    } else {
        // degrees
        var targetDeg = targetArcsec / 3600.;
        value = roundToClosestFromArray(targetDeg, [1, 2, 5, 10, 20, 30, 45, 60, 90, 120, 180]);
        label = value + " deg";
        scalebarWidthPx = value * 3600. / pxscale * scale;
    }

    scalebar.innerHTML = label;
    scalebar.style.width = scalebarWidthPx + "px";
}

function scalescalebarkpc(pxscale, imagewidth, scale) {
    var scalebarkpc = document.getElementById("scalebarkpc");
    //let imagesize = img.clientWidth/scale;
    scalebarkpcWidthPx = imagewidth / 2. / scale;
    scalebarkpcWidthKpc = parseInt(scalebarkpcWidthPx*pxscale);
    scalebarkpcWidthKpc = roundToClosestKpc(scalebarkpcWidthKpc);
    scalebarkpcWidthPx = scalebarkpcWidthKpc/1./pxscale*scale + "px";
    //scalebarkpc.innerHTML = scalebarkpcWidthKpc + " kpc";
    scalebarkpc.innerHTML = (scalebarkpcWidthKpc >= 10000 ? scalebarkpcWidthKpc.toLocaleString("en-US") : scalebarkpcWidthKpc) + " kpc";
    scalebarkpc.style.width = scalebarkpcWidthPx;
}

function drawCircles(coordinates, zspec, raopt, decopt, rambcg, decmbcg, centerRA, centerDec, centerpx, centerpy, pxscale, bcg, zoom){
    let circles = document.getElementById("circles");	      
    // Clean for new cluster
    crosses.innerHTML = "";
    circles.innerHTML = "";

    // RA, DE X-ray center (ermldet?)
    let cross = document.createElement("div");
    cross.classList.add("crossyellow");
    cross.style.left = imagesize/2*zoom + "px";
    cross.style.top  = imagesize/2*zoom + "px";
    crosses.appendChild(cross);
    
    // RA_OPT, DEC_OPT optical center
    if (raopt != null & decopt != null & raopt != 0 & decopt != 0){
        let pos = convertCoordinatesToPixels(raopt, decopt, centerRA, centerDec, centerpx, centerpy, zoom);
    	cross = document.createElement("div");
	    cross.classList.add("crossorange");
	    cross.style.left = pos.x + "px";
	    cross.style.top  = pos.y + "px";
	    crosses.appendChild(cross);
    }

    // RA_MBCG, DEC_MBCG manually selected BCG
    if (rambcg != null & decmbcg != null & rambcg != 0 & decmbcg != 0){
        let pos = convertCoordinatesToPixels(rambcg, decmbcg, centerRA, centerDec, centerpx, centerpy, zoom);
    	cross = document.createElement("div");
	    cross.classList.add("crosspurple");
	    cross.style.left = pos.x + "px";
	    cross.style.top  = pos.y + "px";
	    crosses.appendChild(cross);
    }

    // RA, DEC of search
    //document.getElementsByName("objname")[0].value = sra; // print temporary // wip
    pos = convertCoordinatesToPixels(sra, sde, centerRA, centerDec, centerpx, centerpy, zoom);
    if (pos.x >=0 & pos.x < imagesize*zoom & pos.y >=0 & pos.y < imagesize*zoom){
	    cross = document.createElement("div");
	    cross.classList.add("crossblue");
	    cross.style.left = pos.x + "px";
	    cross.style.top  = pos.y + "px";
	    crosses.appendChild(cross);
    }
    
    // Iterate through the coordinates
    for (let c=0; c<coordinates.length; c++){
	    let coord = coordinates[c];
	    let pos = convertCoordinatesToPixels(coord[0], coord[1], centerRA, centerDec, centerpx, centerpy, zoom);
	    let circle = document.createElement("div");
	    
	    circle.classList.add("circle");
	    circle.style.left = pos.x + "px";
	    circle.style.top =  pos.y + "px";	      

        if (c == im_mark) {
	        color = circlesHighlightColor;
    	}else{
	        color = circlesInitialColor;
	    }		      

    
    	if (zspec[c]){
	        linetype = 'dashed'
	    }else{
    	    linetype = 'solid'
    	}


    	//document.getElementsByName("objname")[0].value = day_mode; // print temporary
	
        // mark member in table when clicking on its circle
        circle.addEventListener("click", function(e) {
            im = c;
            var highlightColor = getComputedStyle(document.documentElement).getPropertyValue('--highlight-color');;
            if (im_before >= 0){
        	    //if (im_before == bcg){
    	        //    color = 'red';
            	//}else{
	                color = circlesInitialColor;
	            //}		      
                circles.children[im_before].style.borderColor = color;
                document.getElementById("m"+im_before).style.background = "initial";
                if (im != im_before) {
                    document.getElementById("m"+im).style.background = highlightColor;
                    this.style.borderColor = circlesHighlightColor;
                } else {
                    im = -1;
                }
            } else {
                document.getElementById("m"+im).style.background = highlightColor;
                this.style.borderColor = circlesHighlightColor;
            //document.getElementsByName("objname")[0].value = 'hier'; // print temporary
            }
            im_mark = im;
            im_before = im;
            
            // scroll to selected member in the table
            /*var table  = document.getElementById("memberstable");
            var rows = table.getElementsByTagName("tr");
        	var isrow = document.getElementById("m"+im).rowIndex - 1;
            var query = document.querySelector('.query');
            var clustersarea = document.querySelector('.clusters');
            var membersarea = document.querySelector('.members');
	        var queryheight    = parseFloat(window.getComputedStyle(query).getPropertyValue('height'));
            var clustersheight = parseFloat(window.getComputedStyle(clustersarea).getPropertyValue('height'));
            var membersheight  = parseFloat(window.getComputedStyle(membersarea).getPropertyValue('height'));
            selectedRow = rows[document.getElementById("m"+im).rowIndex];
            o = (clustersheight + queryheight + membersheight) - (table.offsetTop + selectedRow.offsetTop + selectedRow.offsetHeight + 10);
	        if (o + clustersarea.scrollTop < 0) {
        	    membersarea.scrollTop = -o;
            } else {
                membersarea.scrollTop = 0;
            }*/
            if (im >= 0) scrollMemberTableTo(im);
        });

    	circle.style.border = "3px "+linetype+" "+color;
	    circles.appendChild(circle);


    };
}

function drawCircles3(coordinates, zspec, raopt, decopt, rambcg, decmbcg,
                     centerRA, centerDec, centerpx, centerpy,
                     pxscale, cg, bcg, zoom) {
  const crosses = document.getElementById("crosses");
  const circles = document.getElementById("circles");
  const imagesizePx = imagesize * zoom;

  // clear previous
  crosses.innerHTML = "";
  circles.innerHTML = "";
  im_mark = -1;      // reset highlighted index
  im_before = -1;

  // helper to place a “cross”
  function addCross(cls, ra, dec) {
    if (ra && dec) {
      const pos = convertCoordinatesToPixels(
        ra, dec, centerRA, centerDec, centerpx, centerpy, zoom
      );
      if (pos.x >= 0 && pos.x <= imagesizePx &&
          pos.y >= 0 && pos.y <= imagesizePx
      ) {
        const cross = document.createElement("div");
        cross.classList.add(cls);
        cross.style.left = pos.x + "px";
        cross.style.top  = pos.y + "px";
        crosses.appendChild(cross);
      }
    }
  }

  // center X-ray
  const cross0 = document.createElement("div");
  cross0.classList.add("crossyellow");
  cross0.style.left = imagesizePx/2 + "px";
  cross0.style.top  = imagesizePx/2 + "px";
  crosses.appendChild(cross0);

  // optical, manual-BCG, and search crosses
  addCross("crossorange", raopt, decopt);
  addCross("crosspurple", rambcg, decmbcg);
  addCross("crossblue", sra, sde);

  // circle‐drawing
  coordinates.forEach((coord, idx) => {
    const [ra, dec] = coord;
    const pos = convertCoordinatesToPixels(
      ra, dec, centerRA, centerDec, centerpx, centerpy, zoom
    );

    // skip anything off‐canvas
    if (pos.x < 0 || pos.x > imagesizePx ||
        pos.y < 0 || pos.y > imagesizePx
    ) {
      return;
    }

    const circle = document.createElement("div");
    circle.classList.add("circle");
    circle.style.left = pos.x + "px";
    circle.style.top  = pos.y + "px";

    // determine border color
    let color = circlesInitialColor;
    //if (idx === bcg) color = 'red';
    //else if (idx === cg) color = 'orange';
    // highlight override happens in click handler

    // determine line style
    const linetype = zspec[idx] ? 'dashed' : 'solid';
    circle.style.border = `3px ${linetype} ${color}`;

    // store original index for click logic
    circle.dataset.index = idx;

    circle.addEventListener("click", function() {
      const i = +this.dataset.index;
      const highlightColor = getComputedStyle(document.documentElement)
                                  .getPropertyValue('--highlight-color');

      // reset previous
      if (im_before >= 0) {
        const prevCircle = circles.querySelector(`[data-index="${im_before}"]`);
        if (prevCircle) {
          let prevColor = circlesInitialColor;
          //if (im_before === bcg) prevColor = 'red';
          //else if (im_before === cg) prevColor = 'orange';
          prevCircle.style.borderColor = prevColor;
        }
        const prevRow = document.getElementById("m" + im_before);
        if (prevRow) prevRow.style.background = "";
      }

      // if clicking the same again, toggle off
      if (im_before === i) {
        im_mark = im_before = -1;
        return;
      }

      // highlight new
      this.style.borderColor = circlesHighlightColor;
      const row = document.getElementById("m" + i);
      if (row) row.style.background = highlightColor;

      im_mark = im_before = i;

      // scroll table if present
      const table = document.getElementById("memberstable");
      if (table && row) {
        const members = document.querySelector('.members');
        const offset = row.offsetTop - (members.clientHeight / 2 - row.clientHeight / 2);
        members.scrollTop = offset;
      }
    });

    circles.appendChild(circle);
  });
}




function drawCircles2(coordinates, zspec, raopt, decopt, rambcg, decmbcg, centerRA, centerDec, centerpx, centerpy, pxscale, cg, bcg, zoom){
    let circles = document.getElementById("circles");	      
    // Clean for new cluster
    crosses.innerHTML = "";
    circles.innerHTML = "";

    // RA, DE X-ray center (ermldet?)
    let cross = document.createElement("div");
    cross.classList.add("crossyellow");
    cross.style.left = imagesize/2*zoom + "px";
    cross.style.top  = imagesize/2*zoom + "px";
    crosses.appendChild(cross);
    
    // RA_OPT, DEC_OPT optical center
    if (raopt != null & decopt != null & raopt != 0 & decopt != 0){
        let pos = convertCoordinatesToPixels(raopt, decopt, centerRA, centerDec, centerpx, centerpy, zoom);
    	cross = document.createElement("div");
	    cross.classList.add("crossorange");
	    cross.style.left = pos.x + "px";
	    cross.style.top  = pos.y + "px";
	    crosses.appendChild(cross);
    }

    // RA_MBCG, DEC_MBCG manually selected BCG
    if (rambcg != null & decmbcg != null & rambcg != 0 & decmbcg != 0){
        let pos = convertCoordinatesToPixels(rambcg, decmbcg, centerRA, centerDec, centerpx, centerpy, zoom);
    	cross = document.createElement("div");
	    cross.classList.add("crosspurple");
	    cross.style.left = pos.x + "px";
	    cross.style.top  = pos.y + "px";
	    crosses.appendChild(cross);
    }

    // RA, DEC of search
    //document.getElementsByName("objname")[0].value = sra; // print temporary // wip
    pos = convertCoordinatesToPixels(sra, sde, centerRA, centerDec, centerpx, centerpy, zoom);
    if (pos.x >=0 & pos.x <= imagesize*zoom & pos.y >=0 & pos.y <= imagesize*zoom){
	    cross = document.createElement("div");
	    cross.classList.add("crossblue");
	    cross.style.left = pos.x + "px";
	    cross.style.top  = pos.y + "px";
	    crosses.appendChild(cross);
    }
    
    // Iterate through the coordinates
    for (let c=0; c<coordinates.length; c++){
	    let coord = coordinates[c];
	    let pos = convertCoordinatesToPixels(coord[0], coord[1], centerRA, centerDec, centerpx, centerpy, zoom);
	    if (pos.x <0 | pos.x > imagesize*zoom | pos.y <0 | pos.y > imagesize*zoom){
	        continue;
	    }
	    let circle = document.createElement("div");
	    
	    circle.classList.add("circle");
	    circle.style.left = pos.x + "px";
	    circle.style.top =  pos.y + "px";	      

        if (c == im_mark) {
	        color = circlesHighlightColor;
        //}else if (c == bcg){
    	//    color = 'red';
	    //}else if (c == cg){
		//    color = 'orange';
    	}else{
	        color = circlesInitialColor;
	    }		      

    
    	if (zspec[c]){
	        linetype = 'dashed'
	    }else{
    	    linetype = 'solid'
    	}


    	//document.getElementsByName("objname")[0].value = day_mode; // print temporary
	
        // mark member in table when clicking on its circle
        circle.addEventListener("click", function(e) {
            im = c;
            var highlightColor = getComputedStyle(document.documentElement).getPropertyValue('--highlight-color');;
            if (im_before >= 0){
        	    //if (im_before == bcg){
    	        //    color = 'red';
	            //}else if (im_before == cg){
        		//    color = 'orange';
            	//}else{
	                color = circlesInitialColor;
	            //}		      
                circles.children[im_before].style.borderColor = color;
                let elem_before = document.getElementById("m" + im_before);
                if (elem_before) {
                    elem_before.style.background = "initial";
                }
                if (im != im_before) {
                    let elem = document.getElementById("m" + im);
                    if (elem) {
                        elem.style.background = "initial";
                        this.style.borderColor = circlesHighlightColor;
                    }
                    //document.getElementById("m"+im).style.background = highlightColor;
                    
                } else {
                    im = -1;
                }
            } else {
                let elem = document.getElementById("m" + im);
                if (elem) {
                    elem.style.background = highlightColor;
                    this.style.borderColor = circlesHighlightColor;
                }
            }
            im_mark = im;
            im_before = im;
            
            // scroll to selected member in the table
            var table  = document.getElementById("memberstable");
            var rows = table.getElementsByTagName("tr");
            let row = document.getElementById("m" + im);
            if (row) {
        	    var isrow = document.getElementById("m"+im).rowIndex - 1;
                var query = document.querySelector('.query');
                var clusters = document.querySelector('.clusters');
                var members = document.querySelector('.members');
	            var queryheight    = parseFloat(window.getComputedStyle(query).getPropertyValue('height'));
                var clustersheight = parseFloat(window.getComputedStyle(clusters).getPropertyValue('height'));
                var membersheight  = parseFloat(window.getComputedStyle(members).getPropertyValue('height'));
                selectedRow = rows[document.getElementById("m"+im).rowIndex];
                o = (clustersheight + queryheight + membersheight) - (table.offsetTop + selectedRow.offsetTop + selectedRow.offsetHeight + 10);
	            if (o + clusters.scrollTop < 0) {
        	        members.scrollTop = -o;
                } else {
                    members.scrollTop = 0;
                }
            }
        });

    	circle.style.border = "3px "+linetype+" "+color;
	    circles.appendChild(circle);


    };
}

function visualContaminationNextValue(v) {
    v = parseInt(v);
    if (v === 0) return 1;
    if (v === 1) return 2;
    if (v === 2) return 3;
    return 0;
}

function visualContaminationIcon(v) {
    v = parseInt(v);
    if (v === 1) return '❌';
    if (v === 2) return '🟡';
    if (v === 3) return '✅';
    return '❔';
}

function updateVisualContamination(newValue=null) {
    const oldValue = parseInt(results[ic]['VISUAL_CONTAMINATION']);

    if (newValue === null) {
        newValue = visualContaminationNextValue(oldValue);
    }
    newValue = parseInt(newValue);

    $.ajax({
        type: "POST",
        url: "update_visual_contamination.php",
        data: {
            catalog: catalog,
            visual_contamination: newValue,
            mid: mids[ic]
        },
        success: function(response) {
            results[ic]['VISUAL_CONTAMINATION'] = newValue;

            const icon = document.getElementById('visual-contamination-markericon');
            if (icon) icon.innerHTML = visualContaminationIcon(newValue);

            setVisualContaminationRowStyle(ic, true);
        },
        error: function(xhr, status, error) {
            console.error("Update failed", error);
        }
    });
}

function setVisualContaminationRowStyle(i, selected=false) {
    const row = document.getElementById("c" + i);
    const ntable = document.getElementById("nclusterstable");
    if (!row || !ntable || !results[i]) return;

    const isrow = row.rowIndex;
    const v = parseInt(results[i]['VISUAL_CONTAMINATION']);
    const highlight = getComputedStyle(document.documentElement)
        .getPropertyValue('--highlight-color');

    let bg;

    if (selected) {
        if (v === 1) {
            bg = "#e94848";
        } else if (v === 2) {
            bg = "#877923";   // selected dark yellow
        } else if (v === 3) {
            bg = "#2C8F3C";
        } else {
            bg = highlight;
        }
    } else {
        if (v === 1) {
            bg = "#ea925b";
        } else if (v === 2) {
            bg = "#ABA200";   // slightly dark yellow
        } else if (v === 3) {
            bg = "#3CB54D";
        } else {
            bg = "initial";
        }
    }
    row.style.background = bg;
    ntable.rows[isrow].style.background = bg;
}

function updateMBCG(new_ra_mbcg,new_dec_mbcg) {
    if (!document.getElementById("overlaycheckbox").checked){
        return;
    }
    
    let crosspurple = document.querySelector(".crosspurple");
    
    if (results[ic]['RA_MBCG'] === new_ra_mbcg && results[ic]['DEC_MBCG'] === new_dec_mbcg){
        new_ra_mbcg = null;
        new_dec_mbcg = null;
    }
    
    const data = {
        catalog: catalog,
        mid: mids[ic]
    };
    if (new_ra_mbcg !== null && new_dec_mbcg !== null){
        data.ra_mbcg = new_ra_mbcg;
        data.dec_mbcg = new_dec_mbcg;
    }

    $.ajax({
        type: "POST",
        url: "update_mbcg.php",
        data: data,
        success: function(response) {
            results[ic]['RA_MBCG'] = new_ra_mbcg;
            results[ic]['DEC_MBCG'] = new_dec_mbcg;
            if (new_ra_mbcg != null && new_dec_mbcg != null) {
                if (!crosspurple) {
                    crosspurple = document.createElement("div");
                    crosspurple.classList.add("crosspurple");
                    crosses.appendChild(crosspurple);
                }
                if (useAladin && aladin !== null) {
                    let p = aladin.world2pix(parseFloat(new_ra_mbcg), parseFloat(new_dec_mbcg));
                    crosspurple.style.left = p[0] + "px";
                    crosspurple.style.top  = p[1] + "px";
                } else {
                    let pos = convertCoordinatesToPixels(new_ra_mbcg, new_dec_mbcg, results[ic]['RA'], results[ic]['DE'], imagesize/2, imagesize/2, scale);
                    crosspurple.style.left = pos.x + "px";
                    crosspurple.style.top  = pos.y + "px";
                }
            } else if (crosspurple) {
                crosses.removeChild(crosspurple);
            }
            if (useAladin) updateAladinOverlays();

        },
        error: function(xhr, status, error) {
            console.error("Update failed", error);
        }
    });
}

function changeImage(i,name,mid,ra,dec,raopt,decopt,rambcg,decmbcg,vcont,z,zoom,zoom_before,newimage,loadlocalimage=true,zoomx=false,zoomy=false) {
    //i = parseFloat(i)
    //ic_before = ic;
    ic = i;
    vcont = parseInt(vcont);

    if (newimage){
        document.title = `${name} - Euclid Cluster Inspector (private)`;
    }

    if (newimage & loadlocalimage & (imagesize != 1560)){
	    imagesize = 1560;
	    zoom = zoom / 1560 * imagesize;
	    zoom_before = zoom_before / 1560 * imagesize;
	    scale = scale / 1560 * imagesize;
	    scale_before = scale_before / 1560 * imagesize;
	    document.querySelector(".hiresbutton").style.display = "inline-block";
    }
    
    img = document.getElementById('cutoutimage');
    var image = document.getElementById("imagecontainer");
    var imgWidthBefore  = parseFloat(img.style.width);
    var imgHeightBefore = parseFloat(img.style.height);
    img.style.width  = imagesize * zoom + "px";
    img.style.height = imagesize * zoom + "px";
    img2 = document.getElementById('contouroverlay');
    img2.style.width  = imagesize * zoom + "px";
    img2.style.height = imagesize * zoom + "px";
    img3 = document.getElementById('contourszoverlay');
    img3.style.width  = imagesize * zoom + "px";
    img3.style.height = imagesize * zoom + "px";
    img4 = document.getElementById('contoursz3goverlay');
    img4.style.width  = imagesize * zoom + "px";
    img4.style.height = imagesize * zoom + "px";
    imageerrormessage = document.getElementById("imageerrormessage");
    if (useAladin) {
        document.getElementById("imagecontainer").classList.add("aladin-mode");
        document.getElementById("aladin-lite-div").style.display = "block";
        img.style.display = "none";
        img2.style.display = "none";
        img3.style.display = "none";
        img4.style.display = "none";
        initAladin(showCurrentClusterInAladin);
    }
    imageerrormessage.style.width   = img.style.width;
    //imageerrormessage.style.height  = img.style.height;
    imageerrormessage.style.top  = "calc(" + img.style.height + " / 4)";
    zoomToYellowCrossX = false;
    zoomToYellowCrossY = false;
    if (imgWidthBefore  <= image.clientWidth ){
	    zoomToYellowCrossX = true;
    }
    if (imgHeightBefore <= image.clientHeight){
	    zoomToYellowCrossY = true;
    }
    
    loadingOverlay = document.getElementById("loading-overlay-image");
    loadingSpinner = document.querySelector(".loading-spinner-image");
    loadingOverlay.style.width     = img.style.width;
    if (parseFloat(img.style.width) > document.documentElement.clientWidth / 2){
    	loadingOverlay.style.top  = document.documentElement.clientHeight / 2     - 104 + "px";
	    loadingOverlay.style.left = document.documentElement.clientWidth  * 3 / 4 - 104 + "px";
    }else{
	    loadingOverlay.style.top  = parseFloat(img.style.height) / 2 - 104 + "px";
	    loadingOverlay.style.left = document.documentElement.clientWidth / 2 + parseFloat(img.style.width ) / 2 - 104 + "px";
    }
    
    //if (zoomToYellowCross){
    //    loadingOverlay.style.top  = image.style.height / 2      + "px";
    //    loadingOverlay.style.left = image.style.width  / 2      + "px";
    //}
    //else if (parseFloat(img.style.width) > document.documentElement.clientWidth / 2){
    //    loadingOverlay.style.top  = document.documentElement.clientHeight / 2     - 104 + "px";
    //    loadingOverlay.style.left = document.documentElement.clientWidth  * 3 / 4 - 104 + "px";
    //}else{
    //    loadingOverlay.style.top  = parseFloat(img.style.height) / 2 + "px";
    //    //loadingOverlay.style.left = document.documentElement.clientWidth / 2 + parseFloat(img.style.width ) / 2 - 104 + "px";
    //    loadingOverlay.style.left = image.clientWidth / 2 + parseFloat(img.style.width ) / 2 - 104 + "px";
    //}

    if(newimage){
	  //ic_before = parseFloat(document.getElementById("irowdiv").innerHTML);
	  //document.getElementById("irowdiv").innerHTML = ic;
	  im_mark = -1;
	  img3.src = null;
	  img2.src = null;
	  img.src = '';
	  imageerrormessage = document.getElementById("imageerrormessage");
	  imageerrormessage.innerHTML = "Image loading...";
	  //imageerrormessage.innerHTML = catalog;
	  startLoadingAnimation("image");
	  imageerrormessage.style.display = "block";
	  //loadingSpinner.style.animation = "animation: spin 1s linear infinite";
      //loadingOverlay.style.display   = "block";

	  document.getElementById("coordinatesbox").style.display = "none";
	  document.getElementById("scalebar").style.display = "none";
	  document.getElementById("scalebarkpc").style.display = "none";
	  document.querySelector(".zoom-buttons").style.display = "none";
	  //document.querySelector(".imagesurvey-dropdown").style.display = "none";
	  
	  //var scalebar = document.getElementById("scalebar");
	  //scalebar.style.width = 240/pxscale*scale+"px";
	  //if(ic_before>=0){

	  // select new row in clusters table
      var row = document.getElementById("c"+ic);
      var ntable = document.getElementById("nclusterstable");
      var isrow = row.rowIndex;

      if (document.getElementById("c"+ic_before) && results[ic_before]) {
        setVisualContaminationRowStyle(ic_before, false);
      }

      setVisualContaminationRowStyle(ic, true);
    
	  ic_before = ic;

    }else{
      img.style.width  = imagesize * zoom + "px";
      img.style.height = imagesize * zoom + "px";
      img2.style.width  = imagesize * zoom + "px";
      img2.style.height = imagesize * zoom + "px";
      img3.style.width  = imagesize * zoom + "px";
      img3.style.height = imagesize * zoom + "px";
	  image = document.getElementById("imagecontainer");

	  let cw = image.clientWidth;
	  let ch = image.clientHeight;
	  let csx = image.scrollLeft;
	  let csy = image.scrollTop;
	  let cx = (csx+cw/2.)*zoom;
	  let cy = (csx+ch/2.)*zoom;
	  if (zoomToYellowCrossX){  // not working perfectly. some integer rounding issue?
	    csx = parseFloat(img.style.width ) / 2. - cw/2.;
	  }else{
	    orig_cx = (csx + cw/2.) / zoom_before;
	    csx = orig_cx * zoom - cw/2.;
	  }
	
	  if (zoomToYellowCrossY){
	    csy = parseFloat(img.style.height) / 2. - ch/2.;		  
	  }else{
	    orig_cy = (csy + ch/2.) / zoom_before;
	    csy = orig_cy * zoom - ch/2.;
	  }

	
	  if (zoomx){ // zoom on mouse position
	    var mouse_offsetx = zoomx - image.getBoundingClientRect().left - cw/2.;
	    var mouse_offsety = zoomy - ch/2.;
	    if (zoom_before < zoom){ // zoom in
		  var shiftcorrection = zoom / zoom_before - 1.;
		  csx += mouse_offsetx * shiftcorrection;
		  csy += mouse_offsety * shiftcorrection;
	    }else{ // zoom out
		  var shiftcorrection = 1 - zoom / zoom_before;
		  var zoomfactor2 = zoom_before / zoom;
		  csx -= mouse_offsetx * shiftcorrection;
		  csy -= mouse_offsety * shiftcorrection;
	    }
	  }
	  image.scrollTo(csx, csy);
	  scalescalebar(pxscale, image.clientWidth, scale);
      drawCircles(memcoords, memzspec, raopt, decopt, rambcg, decmbcg, ra, dec, imagesize/2, imagesize/2, pxscale, 0, zoom);
      if (useAladin) showCurrentClusterInAladin();
      if (z == null){
	      document.getElementById("scalebarkpc").style.display = "none";
	  }else{
	      scalescalebarkpc(pxscale*kpcas, image.clientWidth, scale);
	  }
	  //if (kpcas != undefined){
	  //};
	  return;
    }	  


    //}

    //const nightModeInput = document.getElementsByName('night_mode')[0];
    //if(nightModeInput.value == 0){

    //}else{
    //document.getElementById("c"+i).style.background = getComputedStyle(document.documentElement).getPropertyValue('--highlight-color');
    //}
    //document.getElementById("c"+i).style.background = "#A7A84E";

    legacylink = "https://www.legacysurvey.org/viewer/?ra=" + ra + "&dec=" + dec + "&zoom=24&layer=ls-dr10-grz&mark=";
    //legacylink = "https://viewer.legacysurvey.org/?ra=" + ra + "&dec=" + dec + "&zoom=12&layer=ls-dr9&mark=";
    esaskylink = "https://sky.esa.int/esasky/?projection=TAN&cooframe=J2000&sci=true&lang=en&target=" + ra + "," + dec + "&hips=Euclid+VIS&fov=" + pxscale*imagesize/3600.;
    aladinlink = "https://aladin.cds.unistra.fr/AladinLite/?target=" + ra + "%20" + dec + "&fov=" + pxscale*imagesize/3600. + "&survey=CDS%2FP%2FEuclid%2FQ1%2FVIS";
    memcoords = [];
    memzspec  = [];
    //cg = -1;
    
    // cluster not in members list
    if(!mid){
	  hideLoadingAnimation("members");

	  legacylink = legacylink.slice(0,-1) // remove last semicolon
	  document.getElementById('legacylink').href = legacylink;
	  document.getElementById('esaskylink').href = esaskylink;
	  document.getElementById('aladinlink').href = aladinlink;
      [mM, kpcas] = calculate_kpcas(z == null ? 0.3 : z);
	  pxscale = 1 * 2 / imagesize / kpcas * 1000.;
	  //document.getElementById("pxscalediv").innerHTML = pxscale;

      //var erodatlink = "https://erosita.mpe.mpg.de/dr1/erodat/catalogue/search/?Longitude=" + ra + "&Latitude=" + dec + "&CoordSys=icrs&Distance=10.0&DistanceUnit=arcmin&Catalogue=DR1_Main";
      var erodatlink = "https://erosita.mpe.mpg.de/dr1/erodat/skyview/sky/?goto=" + ra + "," + dec + "&fov=" + pxscale*imagesize/3600.;
	  document.getElementById('erodatlink').href = erodatlink;

      if (survey == "LS"){
	      var imageurl = "https://www.legacysurvey.org/viewer/cutout.jpg?ra=" + ra + "&dec=" + dec + "&layer=ls-dr10-grz&pixscale=" + pxscale + "&size=" + imagesize;
      } else if (survey == "VIS"){
          var imageurl = "https://alasky.cds.unistra.fr/hips-image-services/hips2fits?hips=CDS/P/Euclid/Q1/VIS&width=" + imagesize + "&height=" + imagesize + "&projection=TAN&ra=" + ra + "&dec=" + dec + "&fov=" + pxscale*imagesize/3600. + "&format=jpg&stretch=asinh&min_cut=-0.006&max_cut=0.15";
      } else if (survey == "NISP"){
          var imageurl = "https://alasky.cds.unistra.fr/hips-image-services/hips2fits?hips=CDS/P/Euclid/Q1/color&width=" + imagesize + "&height=" + imagesize + "&projection=TAN&ra=" + ra + "&dec=" + dec + "&fov=" + pxscale*imagesize/3600. + "&format=jpg";
      }
      
      reloadbutton = document.querySelector(".reloadbutton");
      hiresbutton  = document.querySelector(".hiresbutton");
      if (reloadbutton) {
            if (survey == "LS"){
                reloadbutton.style.display = 'inline-block';
                hiresbutton.style.display  = 'inline-block';
            } else {
                reloadbutton.style.display = 'none';
                hiresbutton.style.display  = 'none';
            }
      }
      
	  document.getElementById('imageurl').href = imageurl;

	  image = document.getElementById("imagecontainer");
      
	  updatetext(z,kpcas,mM);

	  ra  = parseFloat(results[ic]['RA']);
	  dec = parseFloat(results[ic]['DE']);
	  updatecoords(ra,dec,'violet');

      //document.write(image.clientwidth);
	  //if (image.clientwidth != undefined){
	    scalescalebar(pxscale, image.clientWidth, scale);
	    scalescalebarkpc(pxscale*kpcas, image.clientWidth, scale);
	  //}else{
	  //  scalescalebar(pxscale, imagesize/2, 0.5);
	  //  //scalescalebarkpc(pxscale*kpcas, imagesize/2, 0.5);
	  //}
        if (useAladin) {
	        document.getElementById("coordinatesbox").style.display = "none";
			document.getElementById("scalebar").style.display = "block";
			document.getElementById("scalebarkpc").style.display = "block";
			document.querySelector(".zoom-buttons" ).style.display = "block";
			updateSurveyDropdownForAladin();
			hideLoadingAnimation("image");
			imageerrormessage.style.display = "none";
	    }else{
	        
	  fetch("images/" + survey + "/" + catalog + "/" + name.replace(" ","") + ".jpg", {method: "HEAD"})
	  .then(response => {
		if (response.ok & loadlocalimage) {
		    // load local image
	    	imageerrormessage.innerHTML = "Image loading from webhost...";
		    img.src = "images/" + survey + "/" + catalog + "/" + name.replace(" ","") + ".jpg";
		    img.onload = function(){
    			document.getElementById("coordinatesbox").style.display = "block";
	    		document.getElementById("scalebar").style.display = "block";
                if (z != null){
		    	    document.getElementById("scalebarkpc").style.display = "block";
                }
			    document.querySelector(".zoom-buttons").style.display = "block";
        	    //document.querySelector(".imagesurvey-dropdown").style.display = "block";
			    hideLoadingAnimation("image");
			    //loadingSpinner.style.animation = "none";
			    //loadingOverlay.style.display   = "none";
			    imageerrormessage.style.display = "none";
    	        drawCircles(memcoords, memzspec, raopt, decopt, rambcg, decmbcg, ra, dec, imagesize/2, imagesize/2, pxscale, cg, 0, zoom);
		    }
		//} else if (survey == "LS") {
		} else {
		    // query from legacy viewer
	    	if (survey == "LS"){
	    	  imageerrormessage.innerHTML = "Image loading from Legacy Viewer...<br><br>(takes ~5-20 seconds)";
	    	} else {
	    	  imageerrormessage.innerHTML = "Image loading from ESA Sky...<br><br>(takes ~5-20 seconds)";
	    	}
		    var xhr = new XMLHttpRequest();
		    xhr.open("GET", imageurl, true);
		    xhr.onreadystatechange = function() {
			if (this.readyState === XMLHttpRequest.DONE) {
			    if (this.status === 500) {
				// error
				document.getElementById("coordinatesbox").style.display = "none";
				document.getElementById("scalebar").style.display = "none";
				document.getElementById("scalebarkpc").style.display = "none";
				document.querySelector(".zoom-buttons").style.display = "none";
	            //document.querySelector(".imagesurvey-dropdown").style.display = "none";
				hideLoadingAnimation("image");
				//loadingSpinner.style.animation = "none";
				//loadingOverlay.style.display   = "none";
				imageerrormessage.style.display = "block";
				imageerrormessage.innerHTML = "No image available.";
			    //} else if (this.status === 200) {
			    } else if (this.status === 200 || this.status === 0) {
				  // success
				  //img.src = this.responseURL;
				  img.onload = function(){
				    document.getElementById("coordinatesbox").style.display = "block";
				    document.getElementById("scalebar").style.display = "block";
                    if (z != null){
		    	        document.getElementById("scalebarkpc").style.display = "block";
                    }
				    document.querySelector(".zoom-buttons").style.display = "block";
	                //document.querySelector(".imagesurvey-dropdown").style.display = "block";
				    hideLoadingAnimation("image");
				    //loadingSpinner.style.animation = "none";
				    //loadingOverlay.style.display   = "none";
				    imageerrormessage.style.display = "none";
				    drawCircles(memcoords, memzspec, raopt, decopt, rambcg, decmbcg, ra, dec, imagesize/2, imagesize/2, pxscale, cg, 0, zoom);
				    if (useAladin) showCurrentClusterInAladin();
				  }
			    }
			  }
		      };
		      xhr.send();
	      	  img.src = imageurl;
	        } /*else {
  	            imageerrormessage.innerHTML = "No image available for " + survey + "...";
				imageerrormessage.style.display = "block";
	            document.querySelector(".imagesurvey-dropdown").style.display = "block";
  	        }*/
	  })
	  
	  fetch("contours/" + catalog + "/" + name.replace(" ","") + ".svg", {method: "HEAD"})
	      	.then(response => {
		    if (response.ok) {
	      		// load local image
	      		img2.src = "contours/" + catalog + "/" + name.replace(" ","") + ".svg";
			    img2.onload = function(){
			        document.getElementById("coordinatesbox").style.display = "block";
			        document.getElementById("scalebar").style.display = "block";
			        document.getElementById("scalebarkpc").style.display = "block";
			        document.querySelector(".zoom-buttons").style.display = "block";
	                //document.querySelector(".imagesurvey-dropdown").style.display = "block";
	                docontouroverlay();
			        //loadingSpinner.style.animation = "none";
			        //loadingOverlay.style.display   = "none";
			        hideLoadingAnimation("image");
			        imageerrormessage.style.display = "none";
			    }
		    }
        });

	  fetch("contours_spt/" + catalog + "/" + name.replace(" ","") + ".svg", {method: "HEAD"})
	      	.then(response => {
		    if (response.ok) {
	      		// load local image
	      		img3.src = "contours_spt/" + catalog + "/" + name.replace(" ","") + ".svg";
			    img3.onload = function(){
			        document.getElementById("coordinatesbox").style.display = "block";
			        document.getElementById("scalebar").style.display = "block";
			        document.getElementById("scalebarkpc").style.display = "block";
			        document.querySelector(".zoom-buttons").style.display = "block";
	                //document.querySelector(".imagesurvey-dropdown").style.display = "block";
	                docontourszoverlay();
			        //loadingSpinner.style.animation = "none";
			        //loadingOverlay.style.display   = "none";
			        hideLoadingAnimation("image");
			        //imageerrormessage.style.display = "none";
			    }
		    }
        });

	  fetch("contours_spt3g/" + catalog + "/" + name.replace(" ","") + ".svg", {method: "HEAD"})
	      	.then(response => {
		    if (response.ok) {
	      		// load local image
	      		img4.src = "contours_spt3g/" + catalog + "/" + name.replace(" ","") + ".svg";
			    img4.onload = function(){
			        document.getElementById("coordinatesbox").style.display = "block";
			        document.getElementById("scalebar").style.display = "block";
			        document.getElementById("scalebarkpc").style.display = "block";
			        document.querySelector(".zoom-buttons").style.display = "block";
	                //document.querySelector(".imagesurvey-dropdown").style.display = "block";
	                docontoursz3goverlay();
			        //loadingSpinner.style.animation = "none";
			        //loadingOverlay.style.display   = "none";
			        hideLoadingAnimation("image");
			        //imageerrormessage.style.display = "none";
			    }
		    }
        });
	    }
	    let circles = document.getElementById("circles");
	    let crosses = document.getElementById("crosses");	      
	    circles.innerHTML = "";
	    crosses.innerHTML = "";
	    $("#memberheader").text( "No data for CLUSTER " + name );      	          
	    $("#membersTableBody").empty();
	    $("#membersTableHead").hide();
	    $("#visual-contamination-markerlabel").hide();

    }else{
	    startLoadingAnimation("members");
	    $("#memberheader").empty();
	    $("#membersTableHead").hide();
	    $("#visual-contamination-markerlabel").hide();
	    $("#membersTableBody").empty();

        //let circles = document.getElementById("circles");	      
        // Clean for new cluster
        circles.innerHTML = "";
        crosses.innerHTML = "";

	    document.getElementById('legacylink').href = legacylink;
	    document.getElementById('esaskylink').href = esaskylink;
	    document.getElementById('aladinlink').href = aladinlink;
	    [mM,kpcas] = calculate_kpcas(z);
	    
	    pxscale = 1 * 2 / imagesize / kpcas * 1000.;
	    //pxscale = 0.6
	    //pxscale = 0.262  // native resolution
	    //document.getElementById("pxscalediv").innerHTML = pxscale;

        //var erodatlink = "https://erosita.mpe.mpg.de/dr1/erodat/catalogue/search/?Longitude=" + ra + "&Latitude=" + dec + "&CoordSys=icrs&Distance=10.0&DistanceUnit=arcmin&Catalogue=DR1_Main";
        var erodatlink = "https://erosita.mpe.mpg.de/dr1/erodat/skyview/sky/?goto=" + ra + "," + dec + "&fov=" + pxscale*imagesize/3600.;
	    document.getElementById('erodatlink').href = erodatlink;

        if (survey == "LS"){
	        var imageurl = "https://www.legacysurvey.org/viewer/cutout.jpg?ra=" + ra + "&dec=" + dec + "&layer=ls-dr10-grz&pixscale=" + pxscale + "&size=" + imagesize;
	    document.getElementById('imageurl').href = imageurl;
	    } else if (survey == "VIS"){
            var imageurl = "https://alasky.cds.unistra.fr/hips-image-services/hips2fits?hips=CDS/P/Euclid/Q1/VIS&width=" + imagesize + "&height=" + imagesize + "&projection=TAN&ra=" + ra + "&dec=" + dec + "&fov=" + pxscale*imagesize/3600. + "&format=jpg&stretch=asinh&min_cut=-0.006&max_cut=0.15";
        } else if (survey == "NISP"){
            var imageurl = "https://alasky.cds.unistra.fr/hips-image-services/hips2fits?hips=CDS/P/Euclid/Q1/color&width=" + imagesize + "&height=" + imagesize + "&projection=TAN&ra=" + ra + "&dec=" + dec + "&fov=" + pxscale*imagesize/3600. + "&format=jpg";
        }
        
        reloadbutton = document.querySelector(".reloadbutton");
        hiresbutton  = document.querySelector(".hiresbutton");
        if (reloadbutton) {
            if (survey == "LS"){
                reloadbutton.style.display = 'inline-block';
                hiresbutton.style.display  = 'inline-block';
            } else {
                reloadbutton.style.display = 'none';
                hiresbutton.style.display  = 'none';
            }
        }

	    document.getElementById('imageurl').href = imageurl;
	    
	    updatetext(z,kpcas,mM);
	    
	    ra  = parseFloat(results[ic]['RA']);
	    dec = parseFloat(results[ic]['DE']);
	    updatecoords(ra,dec,'violet');

	    image = document.getElementById("imagecontainer");
	    scalescalebar(pxscale, image.clientWidth, scale);
	    scalescalebarkpc(pxscale*kpcas, image.clientWidth, scale);
	    
	    img = document.getElementById('cutoutimage')
	    img2 = document.getElementById('contouroverlay')
	    img3 = document.getElementById('contourszoverlay')
	    img4 = document.getElementById('contoursz3goverlay')
	    
	    if (['EUCTR1DAMICO'].includes(catalog)) {
            img2.style.display = "none";
        }
	    if (!['EUCWL1','EUCTR1BAMICO','EUCTR1BPZWAV','EUCTR1CAMICO','EUCTR1CPZWAV','EUCPZWAVERASS1UNMATCHED','EUCAMICOERASS1UNMATCHED','EUCPZWAVERASS1MATCHED','EUCAMICOERASS1MATCHED','EUCTR1DPZWAV','EUCTR1EPZWAV','EUCTR1EAMICO','EUCTR1EPZWAVRAND','EUCTR1EAMICORAND','EUCTR1FPZWAV','EUCTR1FAMICO','EUCTR1FPZWAV','EUCTR1FAMICO'].includes(catalog)) {
	    //if (catalog !== 'EUCWL1' && catalog !== 'EUCTR1BAMICO' && catalog !== 'EUCTR1BPZWAV' && catalog !== 'EUCTR1CAMICO' && catalog !== 'EUCTR1CPZWAV') {
            img3.style.display = "none";
        }
        if (!['EUCSPT3G','EUCWL1'].includes(catalog)) {
            img4.style.display = "none";
        }
	    //if (catalog !== 'EUCSPT3G' && catalog !== 'EUCWL1') {
        //    img4.style.display = "none";
        //}
        if (useAladin) {
	        document.getElementById("coordinatesbox").style.display = "none";
			document.getElementById("scalebar").style.display = "block";
			document.getElementById("scalebarkpc").style.display = "block";
			document.querySelector(".zoom-buttons" ).style.display = "block";
			hideLoadingAnimation("image");
			imageerrormessage.style.display = "none";
	    }else{
	        
	    fetch("images/" + survey + "/" + catalog + "/" + name.replace(" ","") + ".jpg", {method: "HEAD"})
	      	.then(response => {
		    if (response.ok & loadlocalimage) {
	      		// load local image
    	    	imageerrormessage.innerHTML = "Image loading from webhost...";
	      		img.src = "images/" + survey + "/" + catalog + "/" + name.replace(" ","") + ".jpg";
			    img.onload = function(){
			        document.getElementById("coordinatesbox").style.display = "block";
			        document.getElementById("scalebar").style.display = "block";
			        document.getElementById("scalebarkpc").style.display = "block";
			        document.querySelector(".zoom-buttons" ).style.display = "block";
	                //document.querySelector(".imagesurvey-dropdown").style.display = "block";
			        hideLoadingAnimation("image");
			        //loadingSpinner.style.animation = "none";
			        //loadingOverlay.style.display   = "none";
			        imageerrormessage.style.display = "none";
			    }
		    //} else if (survey == "LS") {
  	        } else {
      		  // query from legacy viewer			  
        	  if (survey == "LS"){
	    	      imageerrormessage.innerHTML = "Image loading from Legacy Viewer...<br><br>(takes ~5-20 seconds)";
	    	  } else {
	    	      imageerrormessage.innerHTML = "Image loading from ESA Sky...<br><br>(takes ~5-20 seconds)";
	    	  }
			  var xhr = new XMLHttpRequest();
			  xhr.open("GET", imageurl, true);
			  xhr.onreadystatechange = function() {
			    if (this.readyState === XMLHttpRequest.DONE) {
		          if (this.status === 500) {
				    // error
				    document.getElementById("coordinatesbox").style.display = "none";
				    document.getElementById("scalebar").style.display = "none";
				    document.getElementById("scalebarkpc").style.display = "none";
				    document.querySelector(".zoom-buttons").style.display = "none";
	                //document.querySelector(".imagesurvey-dropdown").style.display = "none";
				    //loadingSpinner.style.animation = "none";
				    //loadingOverlay.style.display   = "none";
				    hideLoadingAnimation("image");
				    imageerrormessage.innerHTML = "No image available.";
			      //} else if (this.status === 200) {
                  } else if (this.status === 200 || this.status === 0) {
		          //}else{
		              //document.write(this.status);
				    // success
				    //img.src = this.responseURL;
				    img.onload = function(){
					  document.getElementById("coordinatesbox").style.display = "block";
					  document.getElementById("scalebar").style.display = "block";
					  document.getElementById("scalebarkpc").style.display = "block";
					  document.querySelector(".zoom-buttons").style.display = "block";
	                  //document.querySelector(".imagesurvey-dropdown").style.display = "block";
					  //loadingSpinner.style.animation = "none";
					  //loadingOverlay.style.display   = "none";
					  hideLoadingAnimation("image");
				   	  imageerrormessage.style.display = "none";
				    }
				  }
			    }
			  };
			  xhr.send();
	      	  img.src = imageurl;
  	        } /*else {
  	            imageerrormessage.innerHTML = "No image available for " + survey + "...";
	            document.querySelector(".imagesurvey-dropdown").style.display = "block";
  	        }*/
	    })

	    fetch("contours/" + catalog + "/" + name.replace(" ","") + ".svg", {method: "HEAD"})
	      	.then(response => {
		    if (response.ok) {
	      		// load local image
	      		img2.src = "contours/" + catalog + "/" + name.replace(" ","") + ".svg";
			    img2.onload = function(){
			        document.getElementById("coordinatesbox").style.display = "block";
			        document.getElementById("scalebar").style.display = "block";
			        document.getElementById("scalebarkpc").style.display = "block";
			        document.querySelector(".zoom-buttons").style.display = "block";
	                //document.querySelector(".imagesurvey-dropdown").style.display = "block";
                    docontouroverlay();
			        //loadingSpinner.style.animation = "none";
			        //loadingOverlay.style.display   = "none";
			        hideLoadingAnimation("image");
			        imageerrormessage.style.display = "none";
			    }
		    }
        });

	    fetch("contours_spt/" + catalog + "/" + name.replace(" ","") + ".svg", {method: "HEAD"})
	      	.then(response => {
		    if (response.ok) {
	      		// load local image
	      		img3.src = "contours_spt/" + catalog + "/" + name.replace(" ","") + ".svg";
			    img3.onload = function(){
			        document.getElementById("coordinatesbox").style.display = "block";
			        document.getElementById("scalebar").style.display = "block";
			        document.getElementById("scalebarkpc").style.display = "block";
			        document.querySelector(".zoom-buttons").style.display = "block";
	                //document.querySelector(".imagesurvey-dropdown").style.display = "block";
                    docontourszoverlay();
			        //loadingSpinner.style.animation = "none";
			        //loadingOverlay.style.display   = "none";
			        hideLoadingAnimation("image");
			        //imageerrormessage.style.display = "none";
			    }
		    }
        });

	    fetch("contours_spt3g/" + catalog + "/" + name.replace(" ","") + ".svg", {method: "HEAD"})
	      	.then(response => {
		    if (response.ok) {
	      		// load local image
	      		img4.src = "contours_spt3g/" + catalog + "/" + name.replace(" ","") + ".svg";
			    img4.onload = function(){
			        document.getElementById("coordinatesbox").style.display = "block";
			        document.getElementById("scalebar").style.display = "block";
			        document.getElementById("scalebarkpc").style.display = "block";
			        document.querySelector(".zoom-buttons").style.display = "block";
	                //document.querySelector(".imagesurvey-dropdown").style.display = "block";
	                docontoursz3goverlay();
			        //loadingSpinner.style.animation = "none";
			        //loadingOverlay.style.display   = "none";
			        hideLoadingAnimation("image");
			        //imageerrormessage.style.display = "none";
			    }
		    }
        });
	    }

        if (catalog === 'LSDR10GRZ') {
            if (ra < 180) {
                querymembersfile = "query_members_ls10e.php";
            } else {
                querymembersfile = "query_members_ls10w.php";
            }
        } else if (catalog === 'LSDR9GRZ') {
            querymembersfile = "query_members_ls9.php";
        } else {
            querymembersfile = "query_members.php";
        }
        $.ajax({
	    type: "POST",
	    url: querymembersfile,
	    data: { query: "SELECT RA, DE, PMEM, REFMAG, CG, ZSPEC, ZSPEC_REF, BCG_SCORE FROM " + catalog + "MEMBERS WHERE " + catalog + "MEMBERS.MEM_MATCH_ID = " + mid + " ORDER BY BCG_SCORE DESC, REFMAG ASC" },
	    success: function(response) {
	      	var rows = response.split("<br>");
	        nmem = rows.length - 1;
		    $("#membersTableHead").show();
		    $("#memberstable th").removeAttr("data-dir");
	        $("#memberheader").text( nmem + " MEMBERS in CLUSTER " + name); 
	        
            $("#visual-contamination-markerlabel").show();
            $("#visual-contamination-markericon").html(visualContaminationIcon(vcont));

	        $("#membersTableBody").empty();
                var table = $("#membersTableBody");
                for(var j = 0; j < rows.length - 1; j++){
	      	    var columns = rows[j].split(" ");
	      	    legacylink = legacylink + columns[0] + "," + columns[1] + ";";
	      	    memcoords.push([columns[0], columns[1]]);
	      	    //if (j == 0){
	          	//	color = 'color:red';
	      	    //}else if (columns[4] == 1){
    	      	//	cg = j;
	          	//	color = 'color:orange';
	      	    //}else{
	      	    	color = '';
	      	    //}

	      	    if (columns[2] == "-1.00"){
	      		    columns[2] = "—";
	      	    }

	      	    if (columns[5] == "0.00000"){
	      		    columns[5] = "—";
	      		    memzspec.push(false);
	      	    }else{
	      		    memzspec.push(true);
	      	    }
		    
	      	    if (columns[6] == "NULL"){
	      		    columns[6] = "—";
	      	    }
	      	    if (columns[7] == ""){
	      		    columns[7] = "—";
	      	    }
		    
	      	    var tr = $("<tr id='m" + j + "' onclick='centerMember(" + j + "," + columns[0] + "," + columns[1] + "," + ra  + "," + dec + "," + imagesize/2 + "," + imagesize/2 + ")'>");
	      	    var td1 = "<td style='text-align:center;width:100px;" + color + "'>" + columns[0] + "</td>";
	      	    var td2 = "<td style='text-align:center;width:100px;" + color + "'>" + columns[1] + "</td>";
	      	    var td3 = "<td style='text-align:center;width:100px;" + color + "'>" + columns[2] + "</td>";
	      	    var td4 = "<td style='text-align:center;width:100px;" + color + "'>" + columns[3] + "</td>";
	      	    var td5 = "<td style='text-align:center;width:100px;" + color + "'>" + columns[5] + "</td>";
	      	    var td6 = "<td style='text-align:center;width:100px;" + color + "'>" + columns[6] + "</td>";
	      	    var td7 = "<td style='text-align:center;width:100px;" + color + "'>" + columns[7] + "</td>";
	      	    tr.append(td1, td2, td3, td4, td5, td6, td7);
	      	    tr.append("</tr>");
	      	    table.append(tr);
                }
	    }
        }).done(function(){
	        hideLoadingAnimation("members");
    	    legacylink = legacylink.slice(0,-1) // remove last semicolon
    	    document.getElementById('legacylink').href = legacylink;
    	    document.getElementById('esaskylink').href = esaskylink;
    	    document.getElementById('aladinlink').href = aladinlink;
	        //drawCircles(memcoords, memzspec, raopt, decopt, rambcg, decmbcg, ra, dec, imagesize/2, imagesize/2, pxscale, cg, 0, zoom);
	        drawCircles(memcoords, memzspec, raopt, decopt, rambcg, decmbcg, ra, dec, imagesize/2, imagesize/2, pxscale, 0, zoom);
            if (useAladin) showCurrentClusterInAladin();
        }
            //var scalebar = document.getElementById("scalebar");
	    //scalebar.style.width = 240/pxscale*scale+"px";

	//}
	);

    }
}

function resetForm(){
    document.getElementsByName("objname")[0].value = "";
    document.getElementsByName("name")[0].value = "";
    document.getElementsByName("sra")[0].value = "";
    document.getElementsByName("sde")[0].value = "";
    document.getElementsByName("dist")[0].value = "20";
    document.getElementsByName("bestzmin")[0].value = "";
    document.getElementsByName("bestzmax")[0].value = "";
    document.getElementsByName("euczmin")[0].value = "";
    document.getElementsByName("euczmax")[0].value = "";
    document.getElementsByName("lambdanormmin")[0].value = "";
    document.getElementsByName("lambdanormmax")[0].value = "";
    document.getElementsByName("snrmin")[0].value = "";
    document.getElementsByName("snrmax")[0].value = "";
    //document.getElementsByName("maskfracmin")[0].value = "";
    //document.getElementsByName("maskfracmax")[0].value = "";
    //document.getElementsByName("pcontmin")[0].value = "";
    //document.getElementsByName("pcontmax")[0].value = "";
    //document.getElementsByName("in_footprint")[0].checked = true;
    //document.getElementsByName("not_in_footprint")[0].checked = true;
    //document.getElementsByName("in_zvlim")[0].checked = true;
    //document.getElementsByName("not_in_zvlim")[0].checked = true;
    //document.getElementsByName("in_xgood")[0].checked = true;
    //document.getElementsByName("split_cleaned")[0].checked = true;
    //document.getElementsByName("visual_contamination")[0].value = 2;
    
    //document.getElementById('in-zvlim-display').innerHTML = '❔';
    //document.getElementsByName('in_zvlim')[0].value = '2';
    //document.getElementById('in-footprint-display').innerHTML = '❔';
    //document.getElementsByName('in_footprint')[0].value = '2';
    //document.getElementById('in-xgood-display').innerHTML = '❔';
    //document.getElementsByName('in_xgood')[0].value = '2';
    //document.getElementById('visual-contamination-display').innerHTML = '❔';
    //document.getElementsByName('visual_contamination')[0].value = '2';
    //document.getElementById('split-cleaned-display').innerHTML = '❔';
    //document.getElementsByName('split_cleaned')[0].value = '2';

    
    //document.getElementById("overlaycheckbox").checked = true;
    //document.getElementById("contouroverlaycheckbox").checked = true;
    //document.getElementById("ERASS1E").checked = true;
    document.getElementsByName("objname")[0].focus();
}

function reloadImage_old(){
    //img2.src = null;
    //ic_before = parseFloat(document.getElementById("irowdiv").innerHTML);
    //document.getElementById("irowdiv").innerHTML = i;
    document.getElementById('cutoutimage').src = null;
    imageerrormessage = document.getElementById("imageerrormessage");
    
    if (survey == "LS"){
	    imageerrormessage.innerHTML = "Image loading from Legacy Viewer...";
	} else {
	    imageerrormessage.innerHTML = "Image loading from ESA Sky...";
	}
    imageerrormessage.style.display = "block";
    startLoadingAnimation("image");
    document.getElementById("coordinatesbox").style.display = "none";
    document.getElementById("scalebar").style.display = "none";
    document.getElementById("scalebarkpc").style.display = "none";
    document.querySelector(".zoom-buttons").style.display = "none";
	//document.querySelector(".imagesurvey-dropdown").style.display = "none";
    var url = document.getElementById('imageurl').href;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", imageurl, true);
    xhr.onreadystatechange = function() {
	if (this.readyState === XMLHttpRequest.DONE) {
	    if (this.status === 500) {
	      	// error
	      	//document.getElementById("coordinatesbox").style.display = "none";
	      	//document.getElementById("scalebar").style.display = "none";
	      	//document.getElementById("scalebarkpc").style.display = "none";
	      	//document.querySelector(".zoom-buttons").style.display = "none";
		hideLoadingAnimation("image");
	      	imageerrormessage.style.display = "block";
	      	imageerrormessage.innerHTML = "No image available.";
	    } else if (this.status === 200) {
	      	// success
	      	img.src = this.responseURL;
	  	//img.src = "https://www.legacysurvey.org/viewer/cutout.jpg?ra=0.8047&dec=-35.93531&layer=ls-dr10-grz&pixscale=2.536855445147674&size=300";
	      	img.onload = function(){
	      	    document.getElementById("coordinatesbox").style.display = "block";
	      	    document.getElementById("scalebar").style.display = "block";
	      	    document.getElementById("scalebarkpc").style.display = "block";
	      	    document.querySelector(".zoom-buttons").style.display = "block";
	            //document.querySelector(".imagesurvey-dropdown").style.display = "block";
		        hideLoadingAnimation("image");
	      	    imageerrormessage.style.display = "none";
	      	}
	    }
	}
    };
    xhr.send();
}

function reloadImage(){
	scale = scale * 1560 / imagesize;
	scale_before = scale_before * 1560 / imagesize;
	changeImage(ic,results[ic]['NAME'],mids[ic],results[ic]['RA'],results[ic]['DE'],results[ic]['RA_OPT'],results[ic]['DEC_OPT'],results[ic]['RA_MBCG'],results[ic]['DEC_MBCG'],results[ic]['VISUAL_CONTAMINATION'],results[ic]['BEST_Z'], scale, scale_before, true, loadlocalimage = false);
}

function loadHiResImage(){
    if (imagesize != 3000){
	imagesize = 3000;
	scale = scale * 1560 / imagesize;
	scale_before = scale_before * 1560 / imagesize;
	changeImage(ic,results[ic]['NAME'],mids[ic],results[ic]['RA'],results[ic]['DE'],results[ic]['RA_OPT'],results[ic]['DEC_OPT'],results[ic]['RA_MBCG'],results[ic]['DEC_MBCG'],results[ic]['VISUAL_CONTAMINATION'],results[ic]['BEST_Z'], scale, scale_before, true, loadlocalimage = false);
	document.querySelector(".hiresbutton").style.display = "none";
    }
}

function makeDownloadFilename() {
    let filename = results[ic]['NAME'];

    if (document.getElementById("overlaycheckbox").checked) filename += "_members";
    if (document.getElementById("contouroverlaycheckbox").checked) filename += "_xray";
    if (document.getElementById("contourszoverlaycheckbox").checked) filename += "_sz";
    if (document.getElementById("contoursz3goverlaycheckbox").checked) filename += "_sz3g";

    return filename + ".png";
}

function downloadCanvas(canvas) {
    const link = document.createElement("a");
    link.download = makeDownloadFilename();
    link.href = canvas.toDataURL("image/png");
    link.click();
}

function renderDivAsPng() {
    const divElement = document.getElementById("allimages");

    if (useAladin && aladin !== null) {
        try { aladin.view.requestRedraw(); } catch(e) {}
        updateAladinOverlays();

        setTimeout(() => {
            const w = divElement.clientWidth;
            const h = divElement.clientHeight;

            html2canvas(divElement, {
                useCORS: true,
                width: w,
                height: h,
                scale: 1
            }).then(downloadCanvas);
        }, 300);

        return;
    }

    const canvas = document.createElement("canvas");
    canvas.width  = imagesize;
    canvas.height = imagesize;

    changeImage(
        ic, results[ic]['NAME'], mids[ic],
        results[ic]['RA'], results[ic]['DE'],
        results[ic]['RA_OPT'], results[ic]['DEC_OPT'],
        results[ic]['RA_MBCG'], results[ic]['DEC_MBCG'],
        results[ic]['VISUAL_CONTAMINATION'], results[ic]['BEST_Z'],
        1.0 / window.devicePixelRatio, scale_before, false
    );

    setTimeout(() => {
        html2canvas(divElement, {
            canvas: canvas,
            useCORS: true,
            width: imagesize,
            height: imagesize,
            scale: 1
        }).then(c => {
            downloadCanvas(c);

            changeImage(
                ic, results[ic]['NAME'], mids[ic],
                results[ic]['RA'], results[ic]['DE'],
                results[ic]['RA_OPT'], results[ic]['DEC_OPT'],
                results[ic]['RA_MBCG'], results[ic]['DEC_MBCG'],
                results[ic]['VISUAL_CONTAMINATION'], results[ic]['BEST_Z'],
                scale_before, 1.0 / window.devicePixelRatio, false
            );
        });
    }, 300);
}

function ds9RegionFile() {
    var text = '# Region file format: DS9 version 4.1\nglobal color=green dashlist=8 3 width=1 font="helvetica 10 normal roman" select=1 highlite=1 dash=0 fixed=0 edit=1 move=1 delete=1 include=1 source=1\nfk5\n';
    text += 'point('+results[ic]['RA']+','+results[ic]['DE']+') # point=x 31 color=yellow width=4\n';
    if (results[ic]['RA_OPT'] != null & results[ic]['DEC_OPT'] != null & results[ic]['RA_OPT'] != 0 & results[ic]['DEC_OPT'] != 0){
        text += 'point('+results[ic]['RA_OPT']+','+results[ic]['DEC_OPT']+') # point=x 31 color=orange width=4\n';
    }
    if (results[ic]['RA_MBCG'] != null & results[ic]['DEC_MBCG'] != null & results[ic]['RA_MBCG'] != 0 & results[ic]['DEC_MBCG'] != 0){
        text += 'point('+results[ic]['RA_MBCG']+','+ results[ic]['DEC_MBCG']+') # point=x 31 color=purple width=4\n';
    }
    for (let c=0; c<memcoords.length; c++){
	//if (c==0){
	//    text += 'circle('+memcoords[c]+',1") # color=red text={}';
	//}else if (c==cg){
	//    text += 'circle('+memcoords[c]+',1") # color=orange text={}';
	//}else{
	    text += 'circle('+memcoords[c]+',1") # color=white text={}';
	//}
	text += '\n';
    };
    
    var blob = new Blob([text], { type: "text/plain" });
    // Create a temporary anchor element
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = results[ic]['NAME']+".reg";
    
    // Append the anchor element to the document body
    document.body.appendChild(a);
    
    // Trigger a click event on the anchor element
    a.click();
    
    // Remove the temporary anchor element
    document.body.removeChild(a);
}

function updatetext(z,kpcas,mM) {
    text = document.getElementById('text');
    var newText = 'The image cutout above has a diameter of 2 Mpc.<br>';
    if (z == null){
	    newText += 'The redshift is unknown and assumed to be z=0.3.<br>';
    }else{
	    // check if empty cluster is selected.
	    newText += 'The redshift of the selected cluster is Z_CLUSTER=' + z + '.<br>';
    };
    newText += 'At that redshift, the physical scale is ' + kpcas.toFixed(3) + ' kpc / arcsec<br>'
	+ 'and the distance modulus is m-M=' + mM.toFixed(3) + ' mag.<br>'
	+ 'These values have been calculated using the <a href="https://www.astro.ucla.edu/~wright/CosmoCalc.html" target="cosmocalc">cosmology calculator by Ned Wright</a> assuming a <a href="https://ui.adsabs.harvard.edu/abs/2020A%26A...641A...6P" target="planck">Planck+2018 cosmology</a>.<br><br>';
    if (z != null){
	    newText += 'All circles denote cluster members.<br>'
	    + 'Dashed circles mark galaxies with a spectroscopic redshift ZSPEC.<br>'
	    //+ 'The red circle marks the BCG.<br>'
	    + 'The catalog center (RA, DEC) is marked by the yellow cross.<br>'
	    + 'The galaxy distribution barycenter (RA_OPT, DEC_OPT) is marked by the orange cross.<br>'
	    + 'The manually chosen BCG is (RA_MBCG, DEC_MBCG) is marked by the purple cross.<br>'
	    + 'The search coordinates from the form are marked by the blue cross.<br><br>';
    };
    newText += 'If you find this webpage useful for your work, please cite <a href="https://ui.adsabs.harvard.edu/abs/2024A%26A...688A.210K" target="kluge24">Kluge et al. (2024)</a>.<br>For questions or comments, please contact mkluge (at) mpe.mpg.de<br>';

    text.innerHTML = newText;
}

const ALADIN_MIN_FOV_DEG = 0.003;  // smallest allowed zoomed-in FoV
const ALADIN_MAX_FOV_DEG = 180.0;  // largest allowed zoomed-out FoV

function clampAladinFov(fovDeg) {
    return Math.min(
        ALADIN_MAX_FOV_DEG,
        Math.max(ALADIN_MIN_FOV_DEG, fovDeg)
    );
}

function zoomOne(){
    if (useAladin && aladin !== null) {
        aladin.gotoRaDec(parseFloat(results[ic]['RA']), parseFloat(results[ic]['DE']));
        aladin.setFov(getCurrentClusterFovDeg());
        aladin.view.setRotation(0);
        aladinRedrawSoon();
        return;
    }
    scale = 1.0;
    changeImage(ic,results[ic]['NAME'],mids[ic],results[ic]['RA'],results[ic]['DE'],results[ic]['RA_OPT'],results[ic]['DEC_OPT'],results[ic]['RA_MBCG'],results[ic]['DEC_MBCG'],results[ic]['VISUAL_CONTAMINATION'],results[ic]['BEST_Z'], scale, scale_before, false);
    scale_before = scale;
}

function zoomFit(){
    if (useAladin && aladin !== null) {
        aladin.gotoRaDec(parseFloat(results[ic]['RA']), parseFloat(results[ic]['DE']));
        aladin.setFov(180);
        aladin.view.setRotation(0);
        aladinRedrawSoon();
        return;
    }
    image = document.getElementById("imagecontainer");
    //document.getElementsByName("objname")[0].value = image.clientWidth + " " + image.offsetWidth; // print temporary
    scale = Math.min( image.offsetWidth/imagesize, image.offsetHeight/imagesize );
    changeImage(ic,results[ic]['NAME'],mids[ic],results[ic]['RA'],results[ic]['DE'],results[ic]['RA_OPT'],results[ic]['DEC_OPT'],results[ic]['RA_MBCG'],results[ic]['DEC_MBCG'],results[ic]['VISUAL_CONTAMINATION'],results[ic]['BEST_Z'], scale, scale_before, false, imagesize);
    scale_before = scale;
    // do again because of unpredictable scrollbar
    scale = Math.min( image.clientWidth/imagesize, image.clientHeight/imagesize );
    changeImage(ic,results[ic]['NAME'],mids[ic],results[ic]['RA'],results[ic]['DE'],results[ic]['RA_OPT'],results[ic]['DEC_OPT'],results[ic]['RA_MBCG'],results[ic]['DEC_MBCG'],results[ic]['VISUAL_CONTAMINATION'],results[ic]['BEST_Z'], scale, scale_before, false);
    scale_before = scale;
    image.scrollTop = 0.;
}

function zoomIn(factor=1.2, x=false, y=false){
    if (useAladin && aladin !== null) { var fov = aladin.getFov ? aladin.getFov()[0] : getCurrentClusterFovDeg(); aladin.setFov(clampAladinFov(fov / factor)); aladinRedrawSoon(); return; }
    if (scale_before < 50){
	scale *= factor;
	changeImage(ic,results[ic]['NAME'],mids[ic],results[ic]['RA'],results[ic]['DE'],results[ic]['RA_OPT'],results[ic]['DEC_OPT'],results[ic]['RA_MBCG'],results[ic]['DEC_MBCG'],results[ic]['VISUAL_CONTAMINATION'],results[ic]['BEST_Z'], scale, scale_before, false, false, x, y);
	scale_before = scale;
    }
}

function zoomOut(factor=1.2, x=false, y=false){
    if (useAladin && aladin !== null) { var fov = aladin.getFov ? aladin.getFov()[0] : getCurrentClusterFovDeg(); aladin.setFov(clampAladinFov(fov * factor)); aladinRedrawSoon(); return; }
    if (scale_before > 0.2){
	scale /= factor;
	changeImage(ic,results[ic]['NAME'],mids[ic],results[ic]['RA'],results[ic]['DE'],results[ic]['RA_OPT'],results[ic]['DEC_OPT'],results[ic]['RA_MBCG'],results[ic]['DEC_MBCG'],results[ic]['VISUAL_CONTAMINATION'],results[ic]['BEST_Z'], scale, scale_before, false, false, x, y);
	scale_before = scale;
    }
}

function adjustMembersHeight(){
    var query    = document.querySelector('.query');
    var clustersarea = document.querySelector('.clusters');
    var membersarea  = document.querySelector('.members');
    membersarea.style.height = "calc(" + (document.documentElement.clientHeight - query.offsetHeight - clustersarea.offsetHeight) + "px";
}

function doChangeImage(ic){
    changeImage(ic,results[ic]['NAME'],mids[ic],results[ic]['RA'],results[ic]['DE'],results[ic]['RA_OPT'],results[ic]['DEC_OPT'],results[ic]['RA_MBCG'],results[ic]['DEC_MBCG'],results[ic]['VISUAL_CONTAMINATION'],results[ic]['BEST_Z'], scale, scale_before, true,true,false,false);
}

function nextCluster(){
    var table  = document.getElementById("clusterstable");
    var rows = table.getElementsByTagName("tr");
	var isrow = document.getElementById("c"+ic).rowIndex - 1;
    var clustersarea = document.querySelector('.clusters');
    var query = document.querySelector('.query');
    var clustersheight = parseFloat(window.getComputedStyle(clustersarea).getPropertyValue('height'));
	var queryheight    = parseFloat(window.getComputedStyle(query).getPropertyValue('height'));
    if (isrow < rows.length - 2) {
		        ic_before = ic;
	            ic = document.getElementById("c"+ic).nextElementSibling.getAttribute('id').substring(1);
	            doChangeImage(ic);
	            selectedRow = rows[document.getElementById("c"+ic).rowIndex];
	            o = (clustersheight + queryheight) - (table.offsetTop + selectedRow.offsetTop + selectedRow.offsetHeight + 20);
	            if (o + clustersarea.scrollTop < 0) {
    	            clustersarea.scrollTop = -o;
                }
    }
}

function previousCluster(){
    var table  = document.getElementById("clusterstable");
    var rows = table.getElementsByTagName("tr");
    var isrow = document.getElementById("c"+ic).rowIndex - 1;
    var clustersarea = document.querySelector('.clusters');
    var query = document.querySelector('.query');
    var clustersheight = parseFloat(window.getComputedStyle(clustersarea).getPropertyValue('height'));
	var queryheight    = parseFloat(window.getComputedStyle(query).getPropertyValue('height'));
    if (isrow > 0){
	        	ic_before = ic;
    	        ic = document.getElementById("c"+ic).previousElementSibling.getAttribute('id').substring(1);
	        	doChangeImage(ic);
	            selectedRow = rows[document.getElementById("c"+ic).rowIndex];
	            o = table.offsetTop - queryheight + selectedRow.offsetTop - selectedRow.offsetHeight - clusters.scrollTop - 20;
	            if (o < 0) {
    	            clustersarea.scrollTop += o;	
                }
	        }
}

function firstCluster(){
    var table  = document.getElementById("clusterstable");
    var rows = table.getElementsByTagName("tr");
	var isrow = document.getElementById("c"+ic).rowIndex - 1;
    var clustersarea = document.querySelector('.clusters');
    var query = document.querySelector('.query');
    var clustersheight = parseFloat(window.getComputedStyle(clustersarea).getPropertyValue('height'));
	var queryheight    = parseFloat(window.getComputedStyle(query).getPropertyValue('height'));
    if (isrow > 0) {
        ic_before = ic;
        ic = document.querySelector('#clusterstable tr[id^="c"]').id.substring(1);
        doChangeImage(ic);
        selectedRow = rows[document.getElementById("c"+ic).rowIndex];
        clustersarea.scrollTop = 0;
    }
}

function lastCluster(){
    var table  = document.getElementById("clusterstable");
    var rows = table.getElementsByTagName("tr");
	var isrow = document.getElementById("c"+ic).rowIndex - 1;
    var clustersarea = document.querySelector('.clusters');
    var query = document.querySelector('.query');
    var clustersheight = parseFloat(window.getComputedStyle(clustersarea).getPropertyValue('height'));
	var queryheight    = parseFloat(window.getComputedStyle(query).getPropertyValue('height'));
    if (isrow < rows.length - 2) {
        ic_before = ic;
        ic = document.querySelectorAll('#clusterstable tr[id^="c"]');
        ic = ic[ic.length - 1].id.substring(1);
        doChangeImage(ic);
        selectedRow = rows[document.getElementById("c"+ic).rowIndex];
        o = (clustersheight + queryheight) - (table.offsetTop + selectedRow.offsetTop + selectedRow.offsetHeight + 20);
        clustersarea.scrollTop = clustersarea.scrollHeight;
    }
}


function presskey(event) {
    if ([37, 38, 39, 40, 36, 35].includes(event.keyCode)) {
        event.preventDefault();

        if (event.keyCode === 40) { // arrow down
            nextCluster();
        } else if (event.keyCode === 38) { // arrow up
            previousCluster();
        } else if (event.keyCode === 36) { // Home / Pos1
            firstCluster();
        } else if (event.keyCode === 35) { // End
            lastCluster();
        } else if (event.keyCode === 37) { // arrow left
            var clustersarea = document.querySelector('.clusters');
            if (clustersarea) clustersarea.scrollLeft = 0;
        } else if (event.keyCode === 39) { // arrow right
            var clustersarea = document.querySelector('.clusters');
            if (clustersarea) clustersarea.scrollLeft = clustersarea.scrollWidth;
        }
    }else if (event.target.nodeName !== "INPUT") {
        if (event.key === "x" || event.key === "8")  {
	        contouroverlaycheckbox = document.getElementById("contouroverlaycheckbox");
	        contouroverlaycheckbox.checked = !contouroverlaycheckbox.checked
	        docontouroverlay();
        }else if ((event.key === "z" || event.key === "9")  && ((useAladin && aladin !== null) || ['EUCWL1','EUCTR1BAMICO','EUCTR1BPZWAV','EUCTR1CAMICO','EUCTR1CPZWAV','EUCPZWAVERASS1UNMATCHED','EUCAMICOERASS1UNMATCHED','EUCPZWAVERASS1MATCHED','EUCAMICOERASS1MATCHED','EUCTR1DPZWAV','EUCTR1EPZWAV','EUCTR1EAMICO','EUCTR1EPZWAVRAND','EUCTR1EAMICORAND','EUCTR1ERICHOUTAMICO','EUCTR1ERICHOUTPZWAV','EUCTR1ERICHOUTFPZWAV','EUCTR1FPZWAV','EUCTR1FAMICO','EUCTR1FAMICOCORNERS'].includes(catalog))) {
        //}else if (event.key === "z" && ['EUCWL1','EUCTR1BAMICO','EUCTR1BPZWAV','EUCTR1CAMICO','EUCTR1CPZWAV','EUCPZWAVERASS1UNMATCHED','EUCAMICOERASS1UNMATCHED','EUCPZWAVERASS1MATCHED','EUCAMICOERASS1MATCHED','EUCTR1DPZWAV','EUCTR1EPZWAV','EUCTR1EAMICO','EUCTR1EPZWAVRAND','EUCTR1EAMICORAND','EUCTR1ERICHOUTAMICO','EUCTR1ERICHOUTPZWAV','EUCTR1ERICHOUTFPZWAV','EUCTR1FPZWAV','EUCTR1FAMICO','EUCTR1FAMICOCORNERS'].includes(catalog)) {
	        contourszoverlaycheckbox = document.getElementById("contourszoverlaycheckbox");
	        contourszoverlaycheckbox.checked = !contourszoverlaycheckbox.checked
	        docontourszoverlay();
        }else if (event.key === "Z" && ['EUCSPT3G'].includes(catalog)) {
	        contoursz3goverlaycheckbox = document.getElementById("contoursz3goverlaycheckbox");
	        contoursz3goverlaycheckbox.checked = !contoursz3goverlaycheckbox.checked
	        docontoursz3goverlay();
        }else if ((event.key === "M" || event.key === "7")  && useAladin && aladin !== null) {
            window.maskVisible = !window.maskVisible;
            window.maskLayer.setOpacity(window.maskVisible ? 0.3 : 0.0);
        }else if (event.key === "m") {
	        overlaycheckbox = document.getElementById("overlaycheckbox");
	        overlaycheckbox.checked = !overlaycheckbox.checked
	        dooverlay();
	    }else if (event.key === "d") {
	        renderDivAsPng();
	    }else if (event.key === "r") {
	        zoomOne();
        }else if (event.key === "p") {
	        zoomFit();
        }else if (event.key === "f") {
	        dofullscreen();
        }else if ((event.key === "+") || (event.key === "i")) {
	        zoomIn();
        }else if ((event.key === "-") || (event.key === "o")){
	        zoomOut();
        //}else if (event.key === "q" && ['EUCAMICOQ1','EUCPZWAVQ1'].includes(catalog)) {
	        //loadHiResImage();
        }else if (event.key === "R") {
	        event.preventDefault();
	        resetForm();
        }else if (event.key === "c") {
            navigator.clipboard.writeText(document.getElementById("coordinatesbox").innerHTML.split("<br>")[0].trimStart());
        }else if (event.key === "C") {
            //navigator.clipboard.writeText(document.getElementById("coordinatesbox").innerHTML.split("<br>")[0].trimStart().replace(/ +/g, ","));
            navigator.clipboard.writeText(document.getElementById("coordinatesbox").innerHTML.split("<br>")[1].trimStart());
        }else if (event.key === "s") {
            var simbadurl = "https://simbad.cds.unistra.fr/simbad/sim-coo?radius=1&Coord=" + document.getElementById("coordinatesbox").innerHTML.split("<br>")[0].trimStart();
            window.open(simbadurl, 'simbad');
            //navigator.clipboard.writeText(document.getElementById("coordinatesbox").innerHTML.split("<br>")[0].trimStart());
        //}else if (event.key === "V") {
	        //updateVisualContamination();
        }else if (event.key === "u") {
	        generateClusterUrl();
        }else if (["0", "1", "2", "3"].includes(event.key)) {
            event.preventDefault();
            updateVisualContamination(parseInt(event.key));
        }else if (event.key === "b") {
            if (document.getElementById('manualbcgcheckbox').checked){
                if (useAladin && aladin !== null && last_cursor_ra !== null) {
                    updateMBCG(last_cursor_ra, last_cursor_dec);
                } else {
	                var [ra_mbcg, dec_mbcg] = document.getElementById("coordinatesbox").innerHTML.split("<br>")[0].trimStart().split(" ");
	                updateMBCG(ra_mbcg, dec_mbcg);
                }
            }
	    }else if (event.key === "e") {
            window.open(document.getElementById('erodatlink').href, 'erass1');
        }else if (event.key === "v") {
            const [ra, dec] = document.getElementById("coordinatesbox").innerHTML.split("<br>")[0].trimStart().split(/\s+/);
            const fov = (aladin.getFov ? aladin.getFov() : aladin.getFoV())[0];
            window.open(`https://easidr.esac.esa.int/sas/maps/VIS_WIDE_TEST/?ra=${ra}&dec=${dec}&fov=${fov}&hideProperties`, 'vis');
        }else if (event.key === "L") {
	        if (overlaycheckbox.checked){
	            window.open(legacylink, 'legacyviewer');
	        } else {
                window.open(legacylink.replace(/&mark.*$/, ''), 'legacyviewer');
	        }
        }else if (event.key === "l") {
	        window.open(esaskylink, 'esasky');
        }else if (event.key === "t") {
	        window.open(aladinlink, 'aladin');
        }else if (event.key === "a") {
            var cb = document.getElementById("aladincheckbox");
            cb.checked = !cb.checked;
            toggleAladinView();
	    }else if (event.key === "7" && ['EUCPZWAV1', 'EUCRR2V2', 'EUCSPT3G', 'EUCV0M80', 'EUCV0M99', 'EUCV1M80', 'EUCV1M99', 'EUCRR2AMICOHISNR', 'EUCRR2PZWAV2', 'EUCWL1', 'EUCTR1A', 'EUCTR1BAMICO', 'EUCTR1BPZWAV', 'EUCTR1CAMICO', 'EUCTR1CPZWAV', 'EUCTR1DPZWAV','EUCTR1ERICHOUTAMICO','EUCTR1ERICHOUTPZWAV','EUCTR1ERICHOUTFPZWAV','EUCTR1FAMICOCORNERS'].includes(catalog) && !useAladin) {
            document.getElementsByName('imagesurvey-dropdown-select')[0].value = 'EUCDECAM';
            changesurvey('EUCDECAM');
	    }else if (event.key === "5" && ![].includes(catalog)) {
            document.getElementsByName('imagesurvey-dropdown-select')[0].value = 'VIS';
            changesurvey('VIS');
	    }else if (event.key === "6" && ![].includes(catalog)) {
            document.getElementsByName('imagesurvey-dropdown-select')[0].value = 'NISP';
            changesurvey('NISP');
        }else if (event.key === "4") {
            document.getElementsByName('imagesurvey-dropdown-select')[0].value = 'LS';
            changesurvey('LS');
        }else if (event.key === "n") {
	        toggleModeBtn.click();
        }else if (event.key === "H") {
	        toggleButton.click();
        }else if (event.key === "h") {
	        document.body.classList.toggle('collapsed-sidebar');
	    }else if (event.key === "k") {
	        lock_coordinates = !lock_coordinates;
            if (lock_coordinates && useAladin && aladin !== null && last_cursor_ra !== null) {
                updatecoords(last_cursor_ra, last_cursor_dec, 'violet');
                document.getElementById("coordinatesbox").style.display = "block";
            } else if (!lock_coordinates && useAladin) {
                document.getElementById("coordinatesbox").style.display = "none";
            }
	    }
    }

}

function dragtopan(){
    image = document.getElementById('imagecontainer');
    allimages = document.getElementById('allimages'); // Assuming this is the target for cursor changes
    
    let isDragging = false;
    let startX, startY, scrollLeft, scrollTop;
    
    allimages.addEventListener('mousedown', (e) => {
        if (useAladin) return;
        
        e.preventDefault();
        image.focus();
        isDragging = true;
        startX = e.pageX - image.offsetLeft;
        startY = e.pageY - image.offsetTop;
        scrollLeft = image.scrollLeft;
        scrollTop = image.scrollTop;
        allimages.style.cursor = 'grabbing'; // Change cursor to grabbing on mousedown
    });
    
    allimages.addEventListener('mouseup', () => {
        if (useAladin) return;

        if (isDragging) {
            isDragging = false;
            allimages.style.cursor = 'grab';
        }
    });

    image.addEventListener('mousemove', (e) => {
        if (useAladin) return;

        if (!isDragging){
            allimages.style.cursor = 'grab';
            return;
        }

        e.preventDefault();
        const x = e.pageX - image.offsetLeft;
        const y = e.pageY - image.offsetTop;
        image.scrollLeft = scrollLeft - (x - startX);
        image.scrollTop  = scrollTop  - (y - startY);
    });

    allimages.addEventListener('wheel', (e) => {
        if (useAladin) return;

        e.preventDefault();

        if (e.deltaY < 0){
            zoomIn(1.2, e.clientX, e.clientY);
        } else if (e.deltaY > 0){
            zoomOut(1.2, e.clientX, e.clientY);
        }
    }, { passive: false });
}


function generateQueryUrl() {
    const baseUrl = "https://erass-cluster-inspector.com/euclid/index.php";
    let queryParams = [];

    const addParamIfNotDefault = (name, value, defaultValue) => {
        if(value.toString() !== defaultValue.toString()) {
            queryParams.push(`${name}=${encodeURIComponent(value)}`);
        }
    };
    
    var selectedCat = ""; // Variable to store the id of the selected radio button
    var radios = document.getElementsByName("catalog"); // Get all radio buttons with the name "catalog"

    for (var i = 0; i < radios.length; i++) {
      if (radios[i].checked) { // Check if the radio button is selected
        selectedCat = radios[i].id; // Get the id of the selected radio button
        break; // Exit the loop once the selected button is found
      }
    }
    
    addParamIfNotDefault("catalog", selectedCat, "");

    addParamIfNotDefault("objname", document.getElementsByName("objname")[0].value, "");
    addParamIfNotDefault("name", document.getElementsByName("name")[0].value, "");
    addParamIfNotDefault("dist", document.getElementsByName("dist")[0].value, "");
    
    addParamIfNotDefault("sra", document.getElementsByName("sra")[0].value, "");
    addParamIfNotDefault("sde", document.getElementsByName("sde")[0].value, "");
    addParamIfNotDefault("bestzmin", document.getElementsByName("bestzmin")[0].value, "");
    addParamIfNotDefault("bestzmax", document.getElementsByName("bestzmax")[0].value, "");
    addParamIfNotDefault("lambdanormmin", document.getElementsByName("lambdanormmin")[0].value, "");
    addParamIfNotDefault("lambdanormmax", document.getElementsByName("lambdanormmax")[0].value, "");
    addParamIfNotDefault("snrmin", document.getElementsByName("snrmin")[0].value, "");
    addParamIfNotDefault("snrmax", document.getElementsByName("snrmax")[0].value, "");
    //addParamIfNotDefault("maskfracmin", document.getElementsByName("maskfracmin")[0].value, "");
    //addParamIfNotDefault("maskfracmax", document.getElementsByName("maskfracmax")[0].value, "");
    //addParamIfNotDefault("pcontmin", document.getElementsByName("pcontmin")[0].value, "");
    //addParamIfNotDefault("pcontmax", document.getElementsByName("pcontmax")[0].value, "");
    addParamIfNotDefault("survey", document.getElementsByName("imagesurvey-dropdown-select")[0].value, "LS");
    addParamIfNotDefault("day_mode", document.getElementsByName("day_mode")[0].value, 0);
    addParamIfNotDefault("members", document.getElementsByName("members")[0].value, 1);
    addParamIfNotDefault("xray", document.getElementsByName("xray")[0].value, 0);
    addParamIfNotDefault("sz", document.getElementsByName("sz")[0].value, 0);

    //const checkboxes = [
        //{name: "in_footprint", defaultValue: "2"},
        //{name: "not_in_footprint", defaultValue: "1"},
        //{name: "in_zvlim", defaultValue: "2"},
        //{name: "not_in_zvlim", defaultValue: "1"},
        //{name: "in_xgood", defaultValue: "1"},
        //{name: "split_cleaned", defaultValue: "1"},
        //{name: "visual_contamination", defaultValue: "2"},
    //];
    
    const triplecheckboxes = [
        {name: "in_footprint", defaultValue: "2"},
        //{name: "not_in_footprint", defaultValue: "1"},
        //{name: "in_zvlim", defaultValue: "2"},
        //{name: "not_in_zvlim", defaultValue: "1"},
        //{name: "in_xgood", defaultValue: "2"},
        //{name: "split_cleaned", defaultValue: "2"},
        {name: "visual_contamination", defaultValue: "0"},
    ];

    /*checkboxes.forEach(({name, defaultValue}) => {
        var element = document.getElementsByName(name)[0];
        var value = element.checked ? "1" : "0";
        addParamIfNotDefault(name, value, defaultValue);
    });*/
    
    triplecheckboxes.forEach(({name, defaultValue}) => {
        var value = document.getElementsByName(name)[0].value.toString();
        addParamIfNotDefault(name, value, defaultValue);
    });

    // Construct the full URL
    let shareableUrl = baseUrl + (queryParams.length > 0 ? '?' + queryParams.join('&') : '');

    // Copy the URL to the clipboard
    navigator.clipboard.writeText(shareableUrl);
}


function generateClusterUrl() {
    const baseUrl = "https://erass-cluster-inspector.com/euclid/index.php";
    
    let shareableUrl = baseUrl + "?catalog=" + catalog + "&name=" + encodeURIComponent(results[ic]['NAME']);
    
    if (day_mode == 1){
        shareableUrl += "&day_mode=1";
    }
    if (survey != "NISP"){
        shareableUrl += "&survey=" + survey;
    }

    // Copy the URL to the clipboard
    navigator.clipboard.writeText(shareableUrl);
}
