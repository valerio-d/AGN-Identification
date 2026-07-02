## Commands to create fits catalogs (replacing the format.py script)

- `gzip -d  Salvato_etal2025_DR1_LS10.colfits.gz` - unzip a .gz file
<br>
- `stilts tpipe in=Salvato_etal2025_DR1_LS10.colfits out=Salvato_etal2025_DR1_LS10.fits` - chnage format from `.colfits` to `.fits`
<br>
- `topcat Salvato_etal2025_DR1_LS10.fits` - open file with topcat
<br>
<br>

--- sidenote --- `ctrl + Z`, `bg` - sets the task in background. Starting the task with `&` at the end creates a separate terminal to execute that task
e.g., <u>topcat file.fits **&**</u>
<br>

```bash
stilts tmatch2 in1=eRASS1_Main.v1.2.fits in2=Salvato_etal2025_DR1_LS10.fits icmd2='keepcols "DETUID LS10_RA LS10_DEC LS10_Xray_proba NWAY_* dered_mag_g dered_mag_r  dered_mag_z dered_mag_W1 dered_mag_W2 SOFTFLUX zz_final"'  matcher=exact values1=DETUID values2=DETUID find=all join=all1 out=eRASS1_LS10_match.fits 
```
-- this command uses `stilts` to match the two files for exact values: DETUID, finding all and "joining all from 1", out specifies the output file name.
<br>
<img alt="visualization of command equivalent on TopCat program" src="assets\screenshots\topcatMatching.png" width="400" height="800" />

The columns to keep in the new file are selected through `icmd='keepcols""'`, this allos to specifiy the specific columns to keep.
<br>

The command is then repeated merging the output file with the other counterparts catalogs:
**CatWise2020**:
```bash
stilts tmatch2 in1=eRASS1_LS10_match.fits  in2=Salvato_etal2025_DR1_CW2020.fits icmd2='keepcols "DETUID UID_Hard CW2020_RA_1 CW2020_DEC_1 CW2020_Xray_proba NWAY_* CW2020_W1mag CW2020_W2mag"'  matcher=exact values1=DETUID_1 values2=DETUID find=all join=all1 out=eRASS1_LS10__CW2020_match.fits
```
<br>

**Gaia DR3**:
```bash
stilts tmatch2 in1=eRASS1_LS10_CW2020_match.fits  in2=Salvato_etal2025_DR1_GDR3.fits icmd2='keepcols "DETUID UID_Hard GDR3_RA_1 GDR3_DEC_1 GDR3_Xray_proba NWAY_* GDR3_phot_g_mean_mag GDR3_phot_bp_mean_mag GDR3_phot_rp_mean_mag"'  matcher=exact values1=DETUID_1 values2=DETUID find=all join=all1 out=eRASS1_LS10__CW2020_GDR3_match.fits
```
<br>
The final file now has merged data from the original eROSITA catalog and the counterparts using Legacy Survey DR10 (LS10), Gaia DR3 (GDR3), and CatWISE2020 (CW2020).
<br>

Protip: using:
```bash
stilts tpipe in=salvato_etal2025_DR1_GDR3.fits omode=stats
```
allows for a clean view of the columns/data inside a file