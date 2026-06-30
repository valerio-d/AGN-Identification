#!/usr/bin/env python

import mysql.connector
from astropy.io import fits
from astropy.table import Table, vstack, Column, join
import numpy as np
import os
import sys
sys.path.append('.')
from cosmology_calculator_def import *
from urllib.request import urlretrieve
from tqdm import tqdm,trange
from astropy.coordinates import SkyCoord

try:
    username,password = np.loadtxt('/Users/valerio/Work/developer/AGN-Identification/python_update_mysql/mysql_credentials.txt', usecols=1, dtype=str)
except:
    print('Please update the file mysql_credentials.txt with your mysql username and password.')
    exit()

catdir  = 'python_update_mysql/'
c1names = 'ACO','ACT','codex1','codex2','codex3','codex4','codex5','MCXC','NORAS','planck','xclass1','xclass2','xclass3'
c2names = 'DESY1','SPT','XXL','efeds2' # no dr9 north run
c1files = [ catdir+'eromapper_merged_zscan_'+i+'_grz_griz_grizw1_grzw1_north_grz_north_grzw1_catalog_fixed_sdssgood_trim_mid.fit.gz' for i in c1names ]
c2files = [ catdir+'eromapper_merged_zscan_'+i+'_grz_griz_grizw1_grzw1_catalog_fixed_sdssgood_trim_mid.fit.gz' for i in c2names ]
cnames,cfiles = c1names + c2names, c1files + c2files
cfiles  = dict(zip( cnames , cfiles ))
cnames += ('ERASS1E','ERASS4E','Kluge','Hickson') #,'LSDR10grz','LSDR9grz') #,'erass1p','erass4p')
cfiles['ERASS1E']   = catdir+'eromapper_main_sample_v240118_clufin.fit'
cfiles['ERASS1HE']   = catdir+'eromapper_merged_ext_ge_0_zscan_erass1hard_grz_griz_giz_grizw1_grzw1_gizw1_north_grz_north_grzw1_catalog_fixed.fit.gz'
cfiles['ERASS1HP']   = catdir+'eromapper_merged_ext_ge_0_zscan_erass1hard_grz_griz_giz_grizw1_grzw1_gizw1_north_grz_north_grzw1_catalog_fixed.fit.gz'
cfiles['ERASS4E']   = catdir+'eromapper_0merged_zscan_erass41B_221031_extgt0_grz_griz_grizw1_grzw1_north_grz_north_grzw1_catalog.fit.gz'
cfiles['ERASS1P']   = catdir+'eromapper_merged_ext_eq_0_zscan_erass11B_221207_exteq0_grz_griz_grizw1_grzw1_north_grz_north_grzw1_catalog_fixed_sdssgood_cleaned_localgals_gaia_trim_mid.fit.gz'
cfiles['ERASS1PF'] = catdir + 'balzer_erass1_point.fits'
#cfiles['ERASS4P']   = catdir+'eromapper_merged_ext_ge_0_zscan_erass41B_221031_extge0_grz_griz_grizw1_grzw1_north_grz_north_grzw1_catalog.fit.gz'
#cfiles['ERASS4P']   = catdir+'eromapper_merged_ext_gt_0_zscan_erass41B_240910_ext_ge_0_grz_griz_giz_grizw1_grzw1_gizw1_north_grz_north_grzw1_catalog_fixed_slim.fit.gz'
#cfiles['ERASS4P']   = catdir+'eromapper_merged_zscan_erass41B_240910_ext_ge_0_griz_grz_giz_north_grz_grizw1_grzw1_gizw1_north_grzw1_catalog_public_fixed_trim.fit.gz'
#cfiles['ERASS4P']   = catdir+'erass5_optical_ge0_version0.13.fits.gz'
#cfiles['ERASS4P']   = catdir+'erass5_optical_ge0_version0.13_fixed.fits'
cfiles['ERASS4P']   = catdir+'erass5_optical_ge0_version1.1.fits.gz'
#cfiles['ERASS4P']   = catdir+'erass5_optical_ge0_version0.13_referencesample.fits'
#cfiles['ERASS4P']   = catdir+'erass5_optical_ge0_version0.13_SDSSlatest.fits'
cfiles['ERASS5WAVELET'] = catdir + 'eromapper_merged_zscan_erass5wavelet2_griz_grz_giz_north_grz_catalog_confidentialSDSSDR19_fixed_bcg_trim.fit' #'eromapper_merged_zscan_erass5wavelet_griz_grz_giz_north_grz_catalog_confidentialSDSSDR19_fixed_trim.fit.gz'
#cfiles['Kluge']     = catdir+'eromapper_merged_zscan_Kluge_grz_north_grz_catalog_fixed_sdssgood_trim_mid.fit.gz'
#cfiles['Kluge']     = catdir+'eromapper_merged_zscan_Kluge_griz_north_grz_catalog_fixed.fit.gz'
#cfiles['Kluge']     = catdir+'eromapper_zscan_Kluge_240910_legacy_dr101sga_grz_z_v0.6_catalog_fixed.fit.gz'
#cfiles['Kluge']     = catdir+'eromapper_merged_zscan_Kluge_legacy_dr101sga_griz_z_v0.6_catalog_fixed.fit.gz'
#cfiles['Kluge']     = catdir+'eromapper_merged_zscan_Kluge_griz_grz_giz_north_grz_catalog_fixed.fit.gz'
#cfiles['Kluge']     = catdir+'eromapper_merged_zscan_Kluge_grz_griz_giz_north_grz_catalog_fixed.fit.gz'
cfiles['Kluge']     = catdir+'eromapper_merged_zscan_Kluge_griz_grz_giz_north_grz_catalog_fixed_confidentialSDSSlatest_trim.fit.gz'
cfiles['EUCPZWAV1']   = catdir+'pzwav_detections_april25_test_run_RR2.fits.bin'
cfiles['EUCRR2V2']   = catdir+'DETPZ_ClusterTileHR2_maglim24_SNR8_639det.fits'
cfiles['EUCPZWAVQ1']   = catdir+'validated_EDFS_joint_clusters_15det_per_deg2_20250307_v1.fits'
cfiles['EUCAMICOQ1']   = catdir+'validated_EDFS_joint_clusters_15det_per_deg2_20250307_v1.fits'
cfiles['EROPZWAVQ1']   = catdir+'eromapper_merged_zscan_euclid_pzwav_q1_griz_grz_giz_north_grz_grizw1_grzw1_gizw1_north_grzw1_catalog_confidentialSDSSlatest_fixed_trim.fit.gz'
#cfiles['EUCSPT3G']   = catdir+'euclid_SPT3g_EDF_lit_clus.dat'
cfiles['EUCSPT3G']   = catdir+'spt3g_edfs_cluster_catalog_A25_with_cf.fits'
cfiles['EUCV0M80']   = catdir+'DETPZ_12MER_NoVISDET_maglim24_maskthresh0.8_fixpix_SNR_cut.fits'
cfiles['EUCV0M99']   = catdir+'DETPZ_12MER_NoVISDET_maglim24_maskthresh0.99_fixpix_SNR_cut.fits'
cfiles['EUCV1M80']   = catdir+'DETPZ_12MER_VISDET1_maglim24_maskthresh0.8_fixpix_SNR_cut.fits'
cfiles['EUCV1M99']   = catdir+'DETPZ_12MER_VISDET1_maglim24_maskthresh0.99_fixpix_SNR_cut.fits'
#cfiles['EUCRR2AMICOHISNR'] = catdir+'amico_merged_cl2025-07-17T09_36_11.fits'
cfiles['EUCRR2AMICOHISNR'] = catdir+'amico_selected_top20_z01.fits'
cfiles['HSCS20AWIDESMN10'] = catdir+'camira_s20a_wide_sm_n10.tbl'
cfiles['EUCRR2PZWAV1'] = catdir+'EUC_LE3_DET-CL_CL-DETECTIONS-PZWAV_20250828T140958.715614Z_03.20.fits'
cfiles['EUCRR2PZWAV2'] = catdir+'pzwav_amico_matched_catalogue_RR2_two_way_comoving_100925_clean_with_richness.fits'
#cfiles['EUCWL1'] = catdir+'wl_detectable_2nditer.dat'
cfiles['EUCTR1A'] = catdir+'EUC_LE3_DET-CL_CL-DETECTIONS-PZWAV_20251110T075441.777781Z_03.20.fits'
cfiles['EUCTR1BPZWAV'] = catdir+'unified_clusters_cat_12tiles_TEST_fft2025-11-12T14_31_29.fits'
cfiles['EUCTR1BAMICO'] = catdir+'unified_clusters_cat_12tiles_TEST_fft2025-11-12T14_31_29.fits'
cfiles['EUCTR1CPZWAV'] = catdir+'PZWAV_TR1_South_2025_12_05_selected_top40_z01.fits'
cfiles['EUCTR1CAMICO'] = catdir+'AMICO_TR1_South_2025_12_05_selected_top40_z01.fits'

cfiles['Hickson']   = catdir+'eromapper_merged_zscan_Hickson_grz_catalog_fixed.fit.gz'
cfiles['LSDR9grz']  = catdir+'eromapper_merged_optical_north_grz_catalog_fixed_sdssgood_trim_mid.fit'
cfiles['LSDR10grz'] = catdir+'eromapper_merged_optical_grz_catalog_fixed_sdssgood_trim_mid.fit'

#cfiles['OPTICAL']     = catdir+'optical_combined_fixed_slim.fit.gz'
#cfiles['OPTICAL']     = catdir+'optical_combined_public_lamgt20_fixed.fit.gz'
#cfiles['OPTICAL']     = catdir+'optical_combined_confidentialSDSSDR19_lamgt20_fixed_bcg.fit'
cfiles['OPTICAL']     = catdir + 'optical_combined_lamgt20_confidentialSDSSDR19_fixed_bcg.fit.gz'

#cfiles['ERASS5RANDOM']     = catdir + 'randoms_erass5_merged2_trim.fit'
cfiles['ERASS5RANDOM']     = catdir + 'randoms_erass5_merged2_trim_fixed.fit'

#cfiles['custom'] = '/home/mkluge/Documents/eRosita/projects/bluebcgs/literature_samples/liu2012/liu2012_bcg_positions.csv'
cfiles['custom'] = '/home/mkluge/Documents/eRosita/projects/bluebcgs/literature_samples/cerulo2019/cerulo2019_WH15_parent_like_strict_aladin_with_id_z.csv'

orgzcol = {'codex1'    : None,
           'codex2'    : 'ZCMB',
           'codex3'    : 'IN_Z',
           'codex4'    : None,
           'codex5'    : 'ORIG_Z',
           'MCXC'     : 'REDSHIFT',
           'NORAS'    : 'Z',
           'xclass1'   : 'Z',  # z=0
           'xclass2'   : 'REDSHIFT',  # z=0
           'xclass3'   : 'REDSHIFT',  # z=0
           'XXL'      : 'Z',
           'efeds2'   : 'ZBEST',           
           'ACT'      : 'REDSHIFT',
           'SPT'      : 'REDSHIFT', # z=0
           'planck'   : 'Z', # z<0
           'LS DR9+10': 'BEST_Z',
           'OPTICAL': 'BEST_Z',
           'ACO'      : 'Z_ABELL',
           'Kluge'    : 'Z_KLUGE',
           'DESY1'    : 'Z_LAMBDA_DES',
           'EUCPZWAV1'  : 'Z_CLUSTER',
           'EUCRR2V2' : 'Z_CLUSTER',
           'EUCPZWAVQ1'  : 'Z_CLUSTER_PZWAV',
           'EUCAMICOQ1'  : 'Z_CLUSTER_AMICO',
           'EROPZWAVQ1'  : 'Z_CLUSTER_PZWAV',
           'EUCSPT3G' : 'Z_LAMBDA',
           'EUCV0M80' : 'Z_CLUSTER',
           'EUCV0M99' : 'Z_CLUSTER',
           'EUCV1M80' : 'Z_CLUSTER',
           'EUCV1M99' : 'Z_CLUSTER',
           'EUCRR2AMICOHISNR' : 'Z_CLUSTER',
           'EUCRR2PZWAV1': 'Z_CLUSTER',
           'EUCRR2PZWAV1': 'Z_CLUSTER_1',
           'Hickson'  : None}

#cfiles['custom']  = cfiles['ERASS1E']
#cfiles['custom']  = cfiles['Kluge']
#cfiles['custom'] = cfiles['efeds2']
#cfiles['custom'] = cfiles['DESY1']
#cfiles['custom'] = catdir+'ACO_L01.fit'
#orgzcol['custom'] = orgzcol['ACO']
#orgzcol['custom'] = orgzcol['Kluge']
#orgzcol['custom'] = orgzcol['ERASS1P']

#cnames = ['EUCRR2PZWAV1']
#cnames = ['EUCRR2PZWAV2']
#cnames = ['EROPZWAVQ1']
#cnames = ['EUCRR2V2']
#cnames = ['EUCAMICOQ1']
#cnames = ['EUCPZWAVQ1']
#cnames = ['EUCPZWAV1']
#cnames = ['EUCSPT3G']
#cnames = ['EUCWL1']
#cnames = ['EUCTR1A']
#cnames = ['EUCTR1CPZWAV']
#cnames = ['EUCTR1CAMICO']
#cnames = ['EUCV0M80','EUCV0M99','EUCV1M80','EUCV1M99']
#cnames = ['EUCRR2AMICOHISNR']
#cnames = ['ERASS1PF']
cnames = ['ERASS1E']
#cnames = ['ACT']
#cnames = ['ACO']
#cnames = ['planck']
#cnames = ['DESY1']
#cnames = ['Kluge']
#cnames = ['MCXC']
#cnames = ['NORAS']
#cnames = ['xclass1']
#cnames = ['OPTICAL']
#cnames = ['HSCS20AWIDESMN10']
#cnames = ['ERASS5WAVELET']
#cnames = ['ERASS5RANDOM']

#cnames = ['Kluge','DESY1','ACO','planck','SPT','ACT','codex5','codex1','XXL','xclass1','NORAS','MCXC','efeds2']
#cnames = ['xclass1','NORAS','MCXC','efeds2']
#cnames = ['xclass1']

#cnames = ['ERASS1PF']
#cnames = ['Hickson']
#cnames = ['custom']
#cnames = ['DESY1']
#cnames = ['LSDR9grz']
#cnames = ['LSDR10grz']
#cnames = ['efeds2']
#cnames = ['codex1']
#cnames = ['SPT']

#cnames = ['XXL']


cid = {'ACO'    : 'NAME', #'ACO',
       'ACT'    : 'NAME',
       'codex1' : 'NAME', #'ID_CLUSTER',
       'codex2' : 'GROUP_ID', # CODEX3
       'codex3' : 'IN_C3ID', # IN_GRPID
       'codex4' : 'CLUSTER', # FIELD
       'codex5' : 'NAME', #'CODEX', # FIELD
       'DESY1'  : 'NAME', #'ID', # NAME
       'MCXC'   : 'NAME',
       'NORAS'  : 'NAME', #'NORAS_RECNO', # NAME N_NAME
       'planck' : 'NAME', #'INDEX'
       'SPT'    : 'NAME', #'SPT_ID',
       'xclass1': 'NAME', #'XCLASS',
       'xclass2': 'XCLASS',
       'xclass3': 'XCLASS',
       'efeds2' : 'NAME',
       'XXL'    : 'NAME',
       'ERASS1P': 'DETUID',
       'ERASS1PF': 'IAUNAME',
       'ERASS4P': 'NAME',
       'ERASS1E': 'NAME',
       'ERASS4E': 'DETUID',
       'ERASS1HE': 'IAUNAME',
       'ERASS1HP': 'IAUNAME',
       'ERASS4E': 'DETUID',
       'ERASS5WAVELET': 'NAME',
       'ERASS5RANDOM': 'NAME',
       'Kluge'  : 'NAME',
       'Hickson': 'HRC',
       'custom' : 'NAME',
       'OPTICAL': 'NAME',
       'EUCPZWAV1': 'NAME',
       'EUCRR2V2': 'NAME',
       'EUCPZWAVQ1': 'NAME',
       'EUCAMICOQ1': 'NAME',
       'EROPZWAVQ1': 'NAME',
       'EUCSPT3G': 'NAME',
       'EUCWL1': 'NAME',
       'EUCTR1A': 'NAME',
       'EUCTR1BPZWAV': 'NAME',
       'EUCTR1BAMICO': 'NAME',
       'EUCTR1CPZWAV': 'NAME',
       'EUCTR1CAMICO': 'NAME',
       'EUCRR2AMICOHISNR': 'NAME',
       'EUCV0M80': 'NAME',
       'EUCV0M99': 'NAME',
       'EUCV1M80': 'NAME',
       'EUCV1M99': 'NAME',
       'EUCRR2PZWAV1': 'NAME',
       'EUCRR2PZWAV2': 'NAME',
       'HSCS20AWIDESMN10': 'NAME',
       'LSDR10grz': 'NAME',
       'LSDR9grz': 'NAME'}


mydb = mysql.connector.connect(
    host="localhost",
    user=username,
    password=password,
    database="cluster_catalog"
)

cursor = mydb.cursor(buffered=True)

for cname in cnames:
    newcluster = True
    newmember  = True
    cleartable = True
    downloadimages = False
    update_catfile = False
    
    print('loading catalog '+cname+'...')
    print(cfiles[cname])

    if cname == 'EUCSPT3G':
        cat = Table.read(cfiles[cname])
        cat.rename_columns(['iau_name','ra(deg)','dec(deg)','redshift','flag_cov_cen'],['NAME','RA','DEC','Z_LAMBDA','IN_FOOTPRINT'])
        cat['IN_FOOTPRINT'] = (1 - cat['IN_FOOTPRINT']).astype(bool)
        cat['Z_LAMBDA'][cat['Z_LAMBDA']==-1] = np.nan
        aux = Table.read(catdir + 'pzwav_spt_matched_catalogue_RR2_two_way_comoving_151025.fits')
        #aux.rename_columns(['ID_CLUSTER_1_1','iau_name_2','ra(deg)_2','dec(deg)_2','redshift_2'],['MEM_MATCH_ID','NAME','RA','DEC','Z_LAMBDA'])
        aux.rename_columns(['iau_name_2','ra(deg)_2','dec(deg)_2','redshift_2'],['NAME','RA','DEC','Z_LAMBDA'])
        cat = join(cat, aux, keys=('NAME','RA','DEC','Z_LAMBDA'), join_type='left', table_names=['cat','aux'], uniq_col_name='{col_name}_{table_name}')
        cat['MEM_MATCH_ID'] = np.arange(len(cat), dtype=np.uint32)
        rs_richness = Table.read(catdir + 'rs_richnesses_SPT3g.dat', format='ascii', names=['NAME','LAMBDA_NORM','LAMBDA_NORM_ERR','RA_OPT','DEC_OPT'], guess=False, fast_reader=False, data_start=0)
        cat = join(cat, rs_richness, join_type='outer')
        cat['LAMBDA_NORM'] = cat['LAMBDA_NORM'].filled(np.nan)
    elif cname == 'HSCS20AWIDESMN10':
        colnames = ['MEM_MATCH_ID','NAME','RA','DEC','Z_LAMBDA','LAMBDA_NORM','Z_SPEC']
        cat = Table.read(cfiles[cname], format='ascii', guess=False, names=colnames, header_start=-1)
        cat['BEST_Z'] = np.where( cat['Z_SPEC'] == -1, cat['Z_LAMBDA'], cat['Z_SPEC'] )
        cat['RA_OPT'],cat['DEC_OPT'],cat['MASKFRAC'],cat['VDISP'],cat['VDISP_ERR'],cat['LIT_Z'],cat['LMAX'] = [np.nan] * 7
        cat['IN_FOOTPRINT'] = True
        cat['IN_ZVLIM'] = True
    elif cname == 'EUCWL1':
        colnames = ['NAME','RA','DEC','Z_LAMBDA','LAMBDA_NORM']
        cat = Table.read(cfiles[cname], format='ascii', guess=False, names=colnames, header_start=-1)
        cat['MEM_MATCH_ID'] = np.arange(len(cat))
        cat['BEST_Z'] = cat['Z_LAMBDA'] #np.where( cat['Z_SPEC'] == -1, cat['Z_LAMBDA'], cat['Z_SPEC'] )
        cat['RA_OPT'],cat['DEC_OPT'],cat['MASKFRAC'],cat['VDISP'],cat['VDISP_ERR'],cat['LIT_Z'],cat['LMAX'] = [np.nan] * 7
        cat['IN_FOOTPRINT'] = True
        cat['IN_ZVLIM'] = True
    elif cname == 'ERASS5WAVELET':
        cat = Table.read(cfiles[cname])
        cat_zlambda2 = Table.read(catdir + 'eromapper_merged_zscan_erass5wavelet2_griz_grz_giz_north_grz_catalog_confidentialSDSSDR19_fixed_trim.fit')
        cat['Z_LAMBDA_SECOND'] = cat_zlambda2['Z_LAMBDA_SECOND']
        cat.remove_columns(['RA','DEC','RADEC_ERR','EXT_LIKE','EXT'])
        orgcat = Table.read(catdir + 't_ver24042026_fixeddetuid.fits')
        orgcat['_order'] = np.arange(len(orgcat))
        cat = join(orgcat, cat, keys=('DETUID'), join_type='outer', table_names=['orgcat','cat'], uniq_col_name='{col_name}_{table_name}')
        cat.sort('_order')
        cat.remove_column('_order')
        cat.write(catdir + 'erass5wavelet_v0.2_clusters.fits', overwrite=True)
        xiaoyuan = Table.read(catdir + 'ver0.2_optical.fits')
        cat['DETUID'] = xiaoyuan['DETUID']
        cat['NAME'] = xiaoyuan['NAME']
        cat.write(catdir + 'erass5wavelet_v0.3_clusters.fits', overwrite=True)
    else:        
        cat = Table.read(cfiles[cname])
    if 'EUC' in cname and 'Q1' in cname:
        edfs_mid = cat['ID_CLUSTER_PZWAV'].copy()
        cat2 = Table.read(cfiles[cname].replace('EDFS','EDFN'))
        edfn_mid = cat2['ID_CLUSTER_PZWAV'].copy()
        mid_offset1 = cat['ID_CLUSTER_PZWAV'].max() + 1
        cat2['ID_CLUSTER_PZWAV'] += mid_offset1
        cat = vstack([cat, cat2])
        cat2 = Table.read(cfiles[cname].replace('EDFS','EDFF'))
        edff_mid = cat2['ID_CLUSTER_PZWAV'].copy()
        mid_offset2 = cat['ID_CLUSTER_PZWAV'].max() + 1
        cat2['ID_CLUSTER_PZWAV'] += mid_offset2
        cat = vstack([cat, cat2])
        del cat2
    if cname == 'EUCRR2PZWAV1':
        cat  = cat[ np.argsort(cat['SNR_CLUSTER'])[-200:][::-1] ]
        
    #cat = Table.read(cfiles[cname].replace('EDFS','EDFN'))
    #mid_offset1 = 448
    #cat['ID_CLUSTER_PZWAV'] += mid_offset1
    #cat = cat[ (cat['ID_CLUSTER_PZWAV'] >= mid_offset1) & (cat['ID_CLUSTER_PZWAV'] < mid_offset2) ]
    #exit()
    
    #fits.open(cfiles[cname])[1].data
    if 'VISUAL_CONTAMINATION' not in cat.colnames:
        cat['VISUAL_CONTAMINATION'] = np.zeros( len(cat), dtype=np.uint8)
    if 'RA_MBCG' not in cat.colnames:
        cat['RA_MBCG'] = np.full( len(cat), np.nan, dtype=np.float32 )
    if 'DEC_MBCG' not in cat.colnames:
        cat['DEC_MBCG'] = np.full( len(cat), np.nan, dtype=np.float32 )

    #if 'Z_LAMBDA_CORR' in cat.colnames:
        #cat['Z_LAMBDA'] = cat['Z_LAMBDA_CORR']
        #corr = cat['BEST_Z_TYPE'] == 'photo_z'
        #cat['BEST_Z'][corr] = cat['Z_LAMBDA_CORR'][corr]
        #cat['Z_LAMBDA'] = cat['Z_LAMBDA_CORR']
        #cat['BEST_Z_TYPE'][corr] = 'photo_z_corr'
    
    if cname == 'ERASS1P' or cname == 'ERASS4P':
        #cat['SPLIT_CLEANED'] = cat['SPLIT_CLEANED_EXT']
        cat = cat[(cat['EXT']==0.) & cat['IN_XGOOD'] & cat['IN_ZVLIM'] & cat['SPLIT_CLEANED'] & (cat['LAMBDA_NORM']>20.)] # & (cat['LAMBDA_NORM']<=40.)] # comment for temp for localhost

        bluemaster = Table.read('/home/mkluge/Documents/eRosita/projects/bluebcgs/master_bluebcg_table_gaia_sdssdr20.fits')
        lx = dict(zip(bluemaster['name'], bluemaster['Lx300_0p2_2p3_ergps']))
        cat['L500'] = [lx.get(k, np.nan) for k in cat['NAME']]
        cat['RA_MBCG'] = cat['RA_BCG']
        cat['DEC_MBCG'] = cat['DEC_BCG']
        
    if cname == 'OPTICAL':
        cat['SPLIT_CLEANED'] = cat['SPLIT_CLEANED2']
        cat = cat[cat['SPLIT_CLEANED'] & cat['IN_ZVLIM']]
        #exit()
        #cat['IN_XGOOD'] = True
        #cat['SPLIT_CLEANED'] = True
        #cat['RUN'] = np.char.replace(cat['RUN'], 'legacy_dr101sga', '_s')
        #cat['RUN'] = np.char.replace(cat['RUN'], 'legacy_dr9sga_north'  , '_n')
        #cat['RUN'] = np.char.replace(cat['RUN'], '_z_v0.6', '')
        #cat['RUN'] = np.char.replace(cat['RUN'], '_z_v0.7', '')
        #cat['NAME'] = cat['NAME'] + cat['RUN']
        
    if 'BCG_SCORE' not in cat.colnames:
        cat['BCG_SCORE'] = np.full(len(cat), np.nan, np.float32)
        
    #if cname == 'ERASS4P':
    #    cat['RA_MBCG'] = np.nan
    #    cat['DEC_MBCG'] = np.nan
    #    cat['BCG_SCORE'] = np.nan
    #    ml = Table.read(catdir + 'joined_pnt_results.fits')
    #    cat2 = cat[ np.isin( cat['MEM_MATCH_ID'], ml['MEM_MATCH_ID'][ml['BCG_ML']] ) ]
    #    cat2.keep_columns(['MEM_MATCH_ID','RA','DEC'])
    #    mlb = ml[ml['BCG_ML']]
    #
    #    mem_ids = mlb['MEM_MATCH_ID']
    #    id_to_index = {
    #        mid: i for i, mid in enumerate(mem_ids)
    #        #if not mem_ids.mask[i]
    #    }
    #    for i, mid in enumerate(cat['MEM_MATCH_ID']):
    #        if isinstance(mid, np.ma.core.MaskedConstant): continue
    #        if mid in id_to_index:
    #            j = id_to_index[mid]
    #            cat['RA_MBCG'][i]  = mlb['RA'][j]
    #            cat['DEC_MBCG'][i] = mlb['DEC'][j]
    #            cat['BCG_SCORE'][i] = mlb['BCG_ML_SCORE'][j]
    #            
    #    cat.write(cfiles[cname].replace('.fit','bcg.fit'), overwrite=True)
        
        
    if cname == 'ERASS1PF':
        mid_file = Table.read(catdir + 'eromapper_merged_ext_ge_0_zscan_erass11B_221207_extge0_grz_griz_grizw1_grzw1_north_grz_north_grzw1_catalog_fixed_sdssgood_trim_mid.fit.gz')
        mid_file['DETUID'] = np.char.replace(mid_file['DETUID'], 'c947', 'c010')
        cat = join(cat, mid_file[['DETUID', 'MEM_MATCH_ID', 'IN_FOOTPRINT', 'IN_ZVLIM']], keys='DETUID', join_type='left')
        cat.columns['CLUSTER_CLASS'].name = 'CLASS'
        for col in 'LIT_Z', 'VDISP_BOOT', 'VDISP_BOOT_ERR':
            cat[col][cat[col]==999999.] = np.nan
        
    #    select_fabian = np.load(catdir+'erass1_pnt_fabian.npy')
    #    cat = cat[np.isin(cat[cid[cname]], select_fabian[:,1])]
    #    #cat['NAME'] = [ i.replace('1eRASS ','') for i in select_fabian[:,0] ] #select_fabian[:,0]
    #    cat[cid[cname]] = select_fabian[:,0] #select_fabian[:,0]
    #    cat['CLASS'] = select_fabian[:,2].astype(np.uint8) #select_fabian[:,0]
    #    #cat = cat[np.isin(cat['NAME'], ['J034225.3+005142', 'J034233.5-295425'])]

    if 'EUC' in cname:
        for col in 'VDISP','VDISP_ERR','LIT_Z':
            cat[col] = np.nan

        if 'RA_OPT' not in cat.colnames:
            cat['RA_OPT']  = np.nan #cat['RA']
            cat['DEC_OPT'] = np.nan #cat['DEC']
            
        if cname == 'EUCPZWAV1' or cname == 'EUCRR2PZWAV1' or cname == 'EUCTR1A':
            cat.rename_columns(['ID_CLUSTER','RIGHT_ASCENSION_CLUSTER', 'DECLINATION_CLUSTER', 'Z_CLUSTER', 'FRAC_MASKED_CLUSTER', 'RICHNESS_CLUSTER', 'SNR_CLUSTER'], ['MEM_MATCH_ID','RA','DEC','Z_LAMBDA','MASKFRAC','LAMBDA_NORM','LMAX'])
        elif cname == 'EUCTR1BPZWAV':
            cat.rename_columns(['ID_UNIQUE_CLUSTER','RIGHT_ASCENSION_CLUSTER', 'DECLINATION_CLUSTER', 'Z_CLUSTER', 'FRAC_MASKED_CLUSTER', 'RICHNESS_CLUSTER', 'SNR_CLUSTER'], ['MEM_MATCH_ID','RA','DEC','Z_LAMBDA','MASKFRAC','LAMBDA_NORM','LMAX'])
            cat = cat[cat['DET_CODE_NB']==2]
            cat['MEM_MATCH_ID'] -= cat['MEM_MATCH_ID'][0]
            cat['LAMBDA_NORM'] = np.nan
            richness = np.loadtxt(catdir+'for_matthias_TR1b_v2.dat')
            richness[richness==-99.99] = np.nan
            richness[:,2][richness[:,2]==-1.] = np.nan
            for i in range(len(cat)):
                cat['LAMBDA_NORM'][i] = richness[:,1][ richness[:,0] == cat['MEM_MATCH_ID'][i] ][0]                                                                                                
                cat['RA_OPT'][i]      = richness[:,3][ richness[:,0] == cat['MEM_MATCH_ID'][i] ][0]                                                                                                
                cat['DEC_OPT'][i]     = richness[:,4][ richness[:,0] == cat['MEM_MATCH_ID'][i] ][0]                                                                                                
        elif cname == 'EUCTR1BAMICO':
            cat.rename_columns(['ID_UNIQUE_CLUSTER','RIGHT_ASCENSION_CLUSTER', 'DECLINATION_CLUSTER', 'Z_CLUSTER', 'FRAC_MASKED_CLUSTER', 'RICHNESS_CLUSTER', 'SNR_CLUSTER'], ['MEM_MATCH_ID','RA','DEC','Z_LAMBDA','MASKFRAC','LAMBDA_NORM','LMAX'])
            cat = cat[cat['DET_CODE_NB']==1]
        elif 'EUCTR1C' in cname:
            cat.rename_columns(['ID','Z','SNR'], ['MEM_MATCH_ID','Z_LAMBDA','LMAX'])
            cat['MASKFRAC'] = np.nan
            cat['LAMBDA_NORM'] = np.nan
        elif cname == 'EUCRR2PZWAV2':
            cat.rename_columns(['ID_CLUSTER_1','RIGHT_ASCENSION_CLUSTER_1', 'DECLINATION_CLUSTER_1', 'Z_CLUSTER_1', 'FRAC_MASKED_CLUSTER_1', 'SNR_CLUSTER_1'], ['MEM_MATCH_ID','RA','DEC','Z_LAMBDA','MASKFRAC','LMAX'])
        elif cname == 'EUCRR2V2':
            cat.rename_columns(['ID_CLUSTER','RIGHT_ASCENSION_CLUSTER', 'DECLINATION_CLUSTER', 'Z_CLUSTER', 'FRAC_MASKED_CLUSTER', 'RICHNESS_CLUSTER', 'SNR_CLUSTER'], ['MEM_MATCH_ID','RA','DEC','Z_LAMBDA','MASKFRAC','LAMBDA_NORM','LMAX'])
        elif cname == 'EUCPZWAVQ1':
            cat.rename_columns(['ID_CLUSTER_PZWAV','RIGHT_ASCENSION_CLUSTER_PZWAV', 'DECLINATION_CLUSTER_PZWAV', 'Z_CLUSTER_PZWAV', 'FRAC_MASKED_CLUSTER_PZWAV', 'RICHNESS_CLUSTER_PZWAV', 'SNR_CLUSTER_PZWAV'], ['MEM_MATCH_ID','RA','DEC','Z_LAMBDA','MASKFRAC','LAMBDA_NORM','LMAX'])
        elif cname == 'EUCAMICOQ1':
            cat.rename_columns(['ID_CLUSTER_PZWAV','RIGHT_ASCENSION_CLUSTER_AMICO', 'DECLINATION_CLUSTER_AMICO', 'Z_CLUSTER_AMICO', 'FRAC_MASKED_CLUSTER_AMICO', 'RICHNESS_CLUSTER_AMICO', 'SNR_CLUSTER_AMICO'], ['MEM_MATCH_ID','RA','DEC','Z_LAMBDA','MASKFRAC','LAMBDA_NORM','LMAX'])
        elif cname == 'EUCSPT3G':
            #cat['MEM_MATCH_ID'] = np.arange(len(cat), dtype=np.uint16)
            cat['MASKFRAC'] = np.full(len(cat), np.nan)
            #cat['LAMBDA_NORM'] = np.full(len(cat), np.nan)
            #cat['LMAX'] = np.full(len(cat), np.nan)
            cat.remove_column('LIT_Z')
            #cat.rename_columns(['RICHNESS_PMEM_1','SNR_CLUSTER_1','Z_CLUSTER_1'],['LAMBDA_NORM','LMAX','LIT_Z'])
            cat.rename_columns(['SNR_CLUSTER_1','Z_CLUSTER_1'],['LMAX','LIT_Z'])
        elif cname == 'EUCV0M80':
            cat.rename_columns(['RIGHT_ASCENSION_CLUSTER', 'DECLINATION_CLUSTER', 'Z_CLUSTER'], ['RA','DEC','Z_LAMBDA'])
            cat['MEM_MATCH_ID'] = np.arange(len(cat), dtype=np.uint8)
            for col in 'MASKFRAC','LAMBDA_NORM','LMAX':
                cat[col] = np.nan
        elif cname == 'EUCV0M99':
            cat.rename_columns(['RIGHT_ASCENSION_CLUSTER', 'DECLINATION_CLUSTER', 'Z_CLUSTER', 'SNR_CLUSTER'], ['RA','DEC','Z_LAMBDA','LMAX'])
            cat['MEM_MATCH_ID'] = np.arange(len(cat), dtype=np.uint8)
            for col in 'MASKFRAC','LAMBDA_NORM':
                cat[col] = np.nan
        elif 'EUCV1M' in cname:
            cat.rename_columns(['ID_CLUSTER', 'RIGHT_ASCENSION_CLUSTER', 'DECLINATION_CLUSTER', 'Z_CLUSTER', 'SNR_CLUSTER', 'RICHNESS_CLUSTER', 'FRAC_MASKED_CLUSTER'], ['MEM_MATCH_ID','RA','DEC','Z_LAMBDA','LMAX','LAMBDA_NORM','MASKFRAC'])
        elif cname == 'EUCRR2AMICOHISNR':
            cat.rename_columns(['ID', 'Z', 'SNR'], ['MEM_MATCH_ID','Z_LAMBDA','LMAX'])
            cat['MASKFRAC'] = np.nan
            cat['LAMBDA_NORM'] = np.nan
            richness = np.loadtxt(catdir+'amico_selected_top20_z01_richness.dat')
            richness[richness==-99.99] = np.nan
            richness[:,2][richness[:,2]==-1.] = np.nan
            for i in range(len(cat)):
                cat['LAMBDA_NORM'][i] = richness[:,1][ richness[:,0] == cat['MEM_MATCH_ID'][i] ][0]

        cat['BEST_Z']  = cat['Z_LAMBDA']
        if cname != 'EUCSPT3G':
            cat['IN_FOOTPRINT'] = True
        cat['IN_ZVLIM'] = True
        if cname == 'EUCRR2AMICOHISNR':
            coords = SkyCoord(cat['RA'], cat['DEC'], unit='deg')
            ra = coords.ra.hms
            dec = coords.dec.signed_dms
            iau = [f"J{int(h):02d}{int(m):02d}{int(s*10)//1/10:04.1f}{int(ds*d):+03d}{int(m_):02d}{int(s_)//1:02d}_{z:d}" for h, m, s, ds, d, m_, s_, z in zip(ra.h, ra.m, ra.s, dec.sign, dec.d, dec.m, dec.s, cat['MEM_MATCH_ID'])]
            cat['NAME'] = iau
        elif cname != 'EUCSPT3G' and cname != 'EUCWL1' and cname != 'ERASS5WAVELET':
            coords = SkyCoord(cat['RA'], cat['DEC'], unit='deg')
            ra = coords.ra.hms
            dec = coords.dec.signed_dms
            iau = [f"J{int(h):02d}{int(m):02d}{int(s*10)//1/10:04.1f}{int(ds*d):+03d}{int(m_):02d}{int(s_)//1:02d}_z{z:.02f}" for h, m, s, ds, d, m_, s_, z in zip(ra.h, ra.m, ra.s, dec.sign, dec.d, dec.m, dec.s, cat['BEST_Z'])]
            cat['NAME'] = iau
            #for i in range(len(cat)):
            #    print(f"mv {cat['ID_CLUSTER'][i]}.jpg {cat['NAME'][i]}.jpg")

        if cname == 'EUCRR2AMICOHISNR':
            cat['VISUAL_CONTAMINATION'] = np.isin(cat['NAME'].astype(str), ['J040300.3-455316_21397','J043609.1-585210_4734','J031829.2-461338_16639','J043937.4-574728_4930','J043108.9-504101_4949','J043611.6-585041_4722','J043604.7-585021_4731','J025649.7-524241_14441','J025147.8-523351_14429','J041256.2-531028_2001','J044141.8-521751_4749','J042203.5-512942_4771','J032838.6-555914_18899','J025332.6-500820_14456','J044734.8-324521_9943','J050018.9-330424_9948','J021835.1-511546_37','J031320.7-474929_16596','J021714.5-535118_49','J030107.7-504203_16625','J024726.4-590854_14421','J045001.6-563830_4726','J025450.0-500145_14427','J025533.1-501335_14432','J035645.8-614830_1994','J022815.9-512354_4','J040255.5-485217_21129','J034838.1-520709_12070','J025222.4-495803_14447','J043804.3-301251_23700','J025949.4-604805_18901','J035138.7-480807_12080','J044846.8-564710_4750','J025558.3-501834_14459','J042909.4-533611_4765','J025507.9-500835_14463','J024130.0-500533_14464','J025620.1-501452_14465','J042857.2-534901_4724','J024752.1-591043_14434','J044246.9-272413_9923','J035616.4-614556_2000','J044441.6-290846_9937','J045348.9-565259_4788','J032726.4-485440_16601','J044848.1-303001_9977','J035837.8-452229_21202','J044545.5-282254_9991','J031216.5-594958_18959','J035836.9-615802_2074','J031503.2-514308_16650','J044809.2-553759_4884','J041235.0-574802_2111','J031640.4-580149_19024','J025623.6-502333_14452','J043211.2-464311_21204','J043333.8-513139_5009','J042855.8-543121_5032','J025546.6-501613_14629','J033416.2-453416_12314','J031808.6-475112_16786','J044048.7-360748_24010','J044355.1-321210_10015','J025651.1-502907_14528','J043424.5-522142_4881','J043046.0-572554_4924','J045426.8-570128_4956','J035420.0-613559_7771','J032442.8-604307_19465','J024834.6-561136_14422','J041248.5-574801_1990','J041229.7-574033_2022','J042005.7-574827_2112','J032255.0-632244_19381','J043421.4-545856_5485','J033239.5-603528_8191','J020119.6-525812_611','J045133.9-345506_9912','J025734.3-503717_14556','J044141.8-521939_5039','J030948.1-514053_17460','J042905.5-534828_4721','J040052.3-583953_2002','J034048.2-454119_12087','J042012.0-512740_2096','J031551.6-574506_19305','J041625.0-605816_3374','J041612.2-605612_1991','J043843.3-574854_7565','J025417.3-525614_14444','J031616.6-574822_19139','J025704.8-503127_15826','J020440.1-540551_5','J032705.4-473815_16560','J023144.5-514631_24','J020841.2-544726_43','J031653.1-575306_19073','J041221.7-515814_2295','J020853.4-544916_226','J042805.8-475239_21416','J023112.9-513953_316','J032155.8-455431_16992','J020449.8-540742_519','J041152.1-515123_2785','J025728.3-503549_15371','J020949.3-553933_1006','J041259.7-574759_3377','J043620.4-294735_25054','J032441.6-574916_20525'])

        elif cname == 'EUCRR2PZWAV2':
            cat['LAMBDA_NORM'] = cat['RICHNESS_PMEM']
            cat['VISUAL_CONTAMINATION'] = np.isin(cat['NAME'], ['J045609.6-310212_z0.41','J043735.0-302615_z1.78','J050523.9-283425_z1.49','J044558.4-335845_z1.73','J050210.9-280520_z1.43','J043913.4-302223_z1.50','J042235.8-310219_z1.48','J042455.4-352826_z1.10','J050132.4-284922_z1.40','J043039.4-352828_z0.42','J044345.6-285257_z1.54','J050325.8-271542_z0.81','J041830.1-330617_z1.36','J050001.9-341134_z1.50','J044232.8-275947_z0.80','J044429.5-282352_z1.71','J044610.5-282604_z0.94','J042545.0-344935_z0.47','J043612.9-303417_z0.96','J043254.3-331714_z1.22','J043122.4-292700_z1.59','J042138.2-321600_z1.88','J042000.3-343907_z0.49','J044513.0-362342_z0.64','J044153.0-331151_z1.44','J050557.4-282536_z0.39','J041830.9-303013_z0.38','J041933.9-331111_z0.41','J042121.4-345032_z0.37','J044405.0-324221_z0.98','J045009.7-280439_z0.36','J044001.9-311502_z1.49','J041835.2-314142_z0.84','J044057.0-353342_z1.34','J044124.5-343740_z1.19','J050556.5-282549_z0.33','J044228.4-331414_z0.34','J044448.7-344118_z0.88','J043339.8-341649_z0.47','J045602.5-291501_z0.39','J043019.2-345520_z0.45','J045722.4-352421_z0.58','J044335.5-280956_z1.36','J044052.0-360343_z0.47','J045639.5-302734_z1.35','J044853.6-312912_z1.26','J044001.2-294514_z1.37','J044933.2-354443_z1.37','J045540.2-300324_z0.80','J044734.9-360833_z1.62','J045935.8-322109_z1.38','J045313.8-350225_z0.94','J044351.6-341722_z0.77','J043640.5-345758_z1.46','J045453.8-311420_z0.83','J050313.0-271902_z0.44','J043938.4-302313_z1.49','J044129.0-321615_z1.75','J043636.7-351322_z0.39','J042916.3-334958_z1.48','J043642.0-290944_z1.64','J042412.7-351629_z0.37','J044152.0-351529_z1.02','J043418.5-302244_z1.05','J045956.2-274302_z1.60','J043556.4-344528_z1.58','J045550.4-304044_z1.26','J044426.3-353145_z0.88','J044811.2-272805_z1.39','J044707.9-274042_z0.66','J045651.0-354513_z0.63','J044934.7-305427_z0.45','J044839.8-272447_z1.61','J045059.1-280001_z1.46','J044639.5-354005_z1.14','J044205.5-331527_z1.51','J043409.1-340155_z0.70','J042738.7-343411_z0.46','J044204.9-354217_z0.97','J043459.3-345442_z0.58','J045557.5-332919_z0.87','J045118.2-325600_z1.49'])

        elif cname == 'EUCTR1BPZWAV':
            cat['VISUAL_CONTAMINATION'] = np.isin(cat['NAME'], np.array(['J032845.9-554301_z2.57','J032845.9-554249_z2.29','J034002.4-550242_z1.44','J032621.8-543545_z1.91','J034005.2-550242_z1.77','J034003.8-550242_z2.50','J034148.1-550718_z2.45','J033855.6-542306_z0.64','J033115.6-544304_z1.34','J033150.5-550919_z0.83','J032605.2-542829_z0.85','J033230.2-545156_z1.57','J032747.0-553751_z0.65','J033550.7-545704_z0.65','J034002.4-550306_z0.58','J032603.8-542853_z1.03','J033313.5-542109_z0.41','J033901.0-542241_z1.16','J032857.2-554250_z0.52','J033213.1-550544_z2.53','J033636.9-551812_z1.82','J033636.9-551812_z2.54','J034008.2-550405_z1.00','J034059.9-550406_z0.80','J034018.1-550451_z2.41','J033710.7-550357_z2.20','J032558.2-542916_z2.35','J033702.5-543410_z2.36','J032738.9-553450_z2.30','J032709.5-542243_z1.25','J033630.2-542625_z1.07','J033632.9-542537_z1.75','J033210.2-550643_z0.45','J033448.3-550844_z1.57','J033752.6-550340_z0.68','J033732.8-551542_z1.59','J032540.1-545148_z1.89','J032744.5-553527_z1.14','J032613.4-542907_z0.30','J033021.7-553500_z2.50','J033112.1-552016_z1.76','J034154.7-545904_z2.17','J033648.3-542935_z2.26']))

    if update_catfile:
        #coords = SkyCoord(cat['RA'], cat['DEC'], unit='deg')
        #ra = coords.ra.hms
        #dec = coords.dec.signed_dms
        #iau = [f"J{int(h):02d}{int(m):02d}{int(s*10)//1/10:04.1f}{int(ds*d):+03d}{int(m_):02d}{int(s_)//1:02d}" for h, m, s, ds, d, m_, s_ in zip(ra.h, ra.m, ra.s, dec.sign, dec.d, dec.m, dec.s)]
        #cat['NAME'] = iau

        if 'DETUID' in cat.colnames:
            erass5_fullcat = Table.read(catdir + 'all_s4_s5_SourceCat1B_c030_240905_poscorr_mpe_photom.fits.gz')
            s = np.argsort(erass5_fullcat['DETUID'])
            i = s[np.searchsorted(erass5_fullcat['DETUID'][s], cat['DETUID'])]
            erass5_fullcat = erass5_fullcat[i]
            if not np.array_equal(erass5_fullcat['DETUID'], cat['DETUID']):
                print('ERROR: mismatch between cat and original cat.'); exit()
            cat['EXT_LIKE'] = erass5_fullcat['EXT_LIKE'].round(6)    

        import healsparse as hsp
        in_cosmo = hsp.HealSparseMap.read(catdir + 'zvlim_ns_cosmo_zv04.fits.gz').get_values_pos(cat['RA'], cat['DEC'], lonlat=True) > 0.
        fracgood_griz = hsp.HealSparseMap.read(catdir + 'fracgood_griz.fit')     .get_values_pos(cat['RA'], cat['DEC'], lonlat=True).clip(0)
        fracgood_grz  = hsp.HealSparseMap.read(catdir + 'fracgood_grz.fit')      .get_values_pos(cat['RA'], cat['DEC'], lonlat=True).clip(0)
        fracgood_giz  = hsp.HealSparseMap.read(catdir + 'fracgood_giz.fit')      .get_values_pos(cat['RA'], cat['DEC'], lonlat=True).clip(0)
        fracgood_grzn = hsp.HealSparseMap.read(catdir + 'fracgood_north_grz.fit').get_values_pos(cat['RA'], cat['DEC'], lonlat=True).clip(0)
        fracgood_max = np.max([fracgood_griz, fracgood_grz, fracgood_giz, fracgood_grzn], axis=0)
        #in_footprint_any = ~np.isnan(cat['LIMMAG_G'].filled(np.nan)) & (~np.isnan(cat['LIMMAG_R'].filled(np.nan)) | ~np.isnan(cat['LIMMAG_I'].filled(np.nan))) & ~np.isnan(cat['LIMMAG_Z'].filled(np.nan)) & (fracgood_max>0)
        in_footprint_any = ~np.isnan(cat['LIMMAG_G'].filled(np.nan) if np.ma.isMaskedArray(cat['LIMMAG_G']) else cat['LIMMAG_G']) & (~np.isnan(cat['LIMMAG_R'].filled(np.nan) if np.ma.isMaskedArray(cat['LIMMAG_R']) else cat['LIMMAG_R']) | ~np.isnan(cat['LIMMAG_I'].filled(np.nan) if np.ma.isMaskedArray(cat['LIMMAG_I']) else cat['LIMMAG_I'])) & ~np.isnan(cat['LIMMAG_Z'].filled(np.nan) if np.ma.isMaskedArray(cat['LIMMAG_Z']) else cat['LIMMAG_Z']) & (fracgood_max > 0)
        if np.ma.isMaskedArray(cat['Z_LAMBDA']):
            zvlim02 = hsp.HealSparseMap.read(catdir + 'zvlim_ns_primary_zv02.fits.gz').get_values_pos(cat['RA'], cat['DEC'], lonlat=True)
            zvlim02[zvlim02<0] = np.nan
            cat['ZVLIM_02'] = np.where(cat['Z_LAMBDA'].mask, zvlim02, cat['ZVLIM_02'])
            zvlim04 = hsp.HealSparseMap.read(catdir + 'zvlim_ns_primary_zv04.fits.gz').get_values_pos(cat['RA'], cat['DEC'], lonlat=True)
            zvlim04[zvlim04<0] = np.nan
            cat['ZVLIM_04'] = np.where(cat['Z_LAMBDA'].mask, zvlim04, cat['ZVLIM_04'])
        
        indexshift = [np.where(np.r_[cat.colnames] == 'FRACGOOD')[0][0]+1]        
        cat.add_column(Column(fracgood_max), index=indexshift[-1], name='FRACGOOD_MAX')
        indexshift.append( np.where(np.r_[cat.colnames] == 'IN_FOOTPRINT')[0][0]+1 )
        cat.add_column(Column(in_footprint_any), index=indexshift[-1], name='IN_FOOTPRINT_ANY')
        indexshift.append( np.where(np.r_[cat.colnames] == 'IN_FOOTPRINT_ANY')[0][0]+1 )            
        cat.add_column(Column(in_cosmo), index=indexshift[-1], name='IN_COSMOFOOTPRINT')

        if np.ma.isMaskedArray(cat['Z_LAMBDA']):
            cat['IN_FOOTPRINT'][ cat['Z_LAMBDA'].mask ] = cat['IN_FOOTPRINT_ANY'][ cat['Z_LAMBDA'].mask ]
        cat.rename_columns(['IN_FOOTPRINT','FRACGOOD','IN_FOOTPRINT_ANY'],['IN_FOOTPRINT_RUN','FRACGOOD_RUN','IN_FOOTPRINT'])
        
        for i in 'RA','RA_OPT','RA_MBCG','DEC','DEC_OPT','DEC_MBCG':
            cat[i].unit = 'deg'
        if 'EXT' in cat.colnames:
            cat['EXT'].unit = 'arcsec'
        cat['VDISP'].unit = 'km/s'
        cat['VDISP_ERR'].unit = 'km/s'
        #cat['EXP'].unit = 's'
        cat.write(cfiles[cname].replace('.gz','').replace('.fit','_fixed.fit'), overwrite=True)
    
        with fits.open(cfiles[cname].replace('.gz','').replace('.fit','_fixed.fit'), mode='update', memmap=True) as hdul:
            iend = len(cat.colnames)
            for istart in indexshift:
                for j in range(iend, istart, -1):
                    if f'TCOMM{j}' in hdul[1].header:
                        hdul[1].header[f'TCOMM{j+1}'] = hdul[1].header[f'TCOMM{j}']
            hdul[1].header[f'TCOMM{hdul[1].columns.names.index("IN_COSMOFOOTPRINT")+1}'] = 'Cluster center is in cosmology footprint'
            hdul[1].header[f'TCOMM{hdul[1].columns.names.index("IN_FOOTPRINT")+1}'] = 'Cluster center has GRI or GIZ coverage and max(FRACGOOD_MAX)>0'
            hdul[1].header[f'TCOMM{hdul[1].columns.names.index("IN_FOOTPRINT_RUN")+1}'] = 'Cluster center for this RUN is within the survey footprint'
            hdul[1].header[f'TCOMM{hdul[1].columns.names.index("FRACGOOD_MAX")+1}'] = 'Maximum FRACGOOD of all filter band combinations'
            hdul.flush()
            exit()
            
    if newmember:
        fake = False
        if fake:
            mem = Table(names=['MEM_MATCH_ID', 'RA', 'DEC', 'PMEM', 'REFMAG', 'CG', 'ZSPEC', 'ZSPEC_REF'], dtype=[np.int64,       np.float32, np.float32, np.float32, np.float32, np.bool_,       np.float32, 'U40'])
        
        #mem = cat
        mem = Table.read(cfiles[cname].replace('clufin.fit','members.fit'))
        #mem = Table.read(cfiles[cname].replace('_trim.fit','_members_trim.fit'))
        #mem = Table.read(cfiles[cname].replace('confidentialSDSSDR19_fixed','members_confidentialSDSSDR19'))
        #cfiles['OPTICAL']     = catdir + 'optical_combined_lamgt20_confidentialSDSSDR19_fixed.fit'

        #print(cfiles[cname].replace('public_fixed_trim.fit.gz','members_public_trim.fit.gz'))
        #mem = Table.read(cfiles[cname].replace('public_lamgt20_fixed.fit.gz','members_public_lamgt20_mags.fit.gz'))
        #mem = Table.read(cfiles[cname].replace('optical_combined_fixed_slim.fit.gz','optical_members_combined_slim.fit.gz'))
        #mem = fits.open(cfiles[cname].replace('_fixed','').replace('.fit.gz','_members_'+str(sys.argv[1])+'.fit'))[1].data
        #mem = Table.read(cfiles[cname].replace('fixed.fit.gz','members.fit.gz'))
        #mem = Table.read(cfiles[cname].replace('_mid','').replace('_large','').replace('_fixed','').replace('_clufin','').replace('.fit','_members.fit.gz'))
        #mem = Table.read(cfiles[cname].replace('fixed_sdssgood_trim_mid.fit','members_sdssgood_slim.fit'))        
        #mem = Table.read(cfiles[cname].replace('fixed_sdssgood_cleaned_localgals_gaia_trim_mid.fit.gz','members_sdssgood_cleaned_slim.fit.gz'))
        #mem = Table.read(cfiles[cname].replace('fixed_sdssgood_trim_mid.fit','members_sdssgood.fit'))        
        #mem = Table.read(cfiles[cname].replace('ext_gt_0','ext_ge_0').replace('fixed_slim.fit.gz','members_slim.fit.gz'))        
        #mem = Table.read(cfiles[cname].replace('confidentialSDSSlatest_fixed_trim.fit.gz','members_confidentialSDSSlatest_trim.fit.gz'))

        #if cname == 'ERASS4P':
        #    ml_pos = ml[ml['PMEM'] > 0]
        #    bcg_dict = {
        #        (row['ID'], row['MEM_MATCH_ID']): row['BCG_ML_SCORE']
        #        for row in tqdm(ml_pos, 'BCG dict')
        #    }
        #    bcg_probs = [
        #        bcg_dict.get((id_, mm_), 0)
        #        for id_, mm_ in tqdm(zip(mem['ID'], mem['MEM_MATCH_ID']), 'lookup', len(mem))
        #    ]
        #    mem.add_column(Table.Column(name='BCG_SCORE', data=bcg_probs))
        #    
        #    mem.write(cfiles[cname].replace('.fit','_members_bcg.fit'), overwrite=True)
        
        if 'BCG_SCORE' not in mem.colnames:
            mem['BCG_SCORE'] = np.full(len(mem), np.nan, np.float32)

            #cat = cat[cat['SPLIT_CLEANED'] & cat['IN_ZVLIM'] & (cat['LAMBDA_NORM']>30.)]
            #u,c = np.unique(cat['NAME'], return_counts=True)
            #cat = cat[ np.isin(cat['NAME'], u[c==2]) ]
            
            #for i in u[c==2]:
            #    w = np.where(cat['NAME'] == i)[0]
            #    for j in w:
            #        cat['NAME'][j] = f"{cat['NAME'][j]}_{cat['RUN'][j]}"
            #cat = cat[ np.argsort(cat['NAME']) ]
            #cs = np.r_[['_s' in i for i in cat['NAME']]]
            #
            #ms = np.isin(mem['MEM_MATCH_ID'], cat['MEM_MATCH_ID'][cs])
            #cn,mn = ~cs,~ms
            #id_mn = np.where(mn)[0]
            #cms = SkyCoord(mem['RA'][ms], mem['DEC'][ms], unit='deg')
            #cmn = SkyCoord(mem['RA'][mn], mem['DEC'][mn], unit='deg')
            #m = cmn.match_to_catalog_sky(cms)
            #g = m[1].arcsec < 1.
            #mem['ID'][id_mn[g]] = mem['ID'][ms][m[0][g]]
            #exit()


        if cname == 'EUCRR2AMICOHISNR':
            colnames = ['MEM_MATCH_ID','RA','DEC','PMEM','REFMAG']
            dtypes   = ['>i8','>f8','>f8','>f4','>f4']
            mem_small = Table.read(catdir + 'amico_selected_top20_z01_membership_smallpatch.dat', format='ascii', guess=False, names=colnames, header_start=-1)
            mem_big   = Table.read(catdir + 'amico_selected_top20_z01_membership_bigpatch.dat', format='ascii', guess=False, names=colnames, header_start=-1)
            mem = vstack([mem_small, mem_big])
            for i,c in enumerate(colnames):
                mem[c] = mem[c].astype(dtypes[i])
            mem['ZSPEC'] = np.full(len(mem), np.nan, '>f4')
            mem['ZSPEC_REF'] = np.full(len(mem), 'N/A', 'U32')
        elif cname == 'EUCSPT3G':
            mem = Table.read(catdir + 'membership_SPT3g_recent.dat', format='ascii', names=['NAME','RA','DEC','PMEM','REFMAG'])
            mem['MEM_MATCH_ID'] = np.nan
            namedict = {}
            for n in np.unique(cat['NAME']): #[~cat['MEM_MATCH_ID'].mask]):
                mem['MEM_MATCH_ID'][mem['NAME']==n] = cat['MEM_MATCH_ID'][cat['NAME']==n][0]
                
            #mem = Table.read(catdir + 'output_pzwav_rr2_spt_members_with_RA_Dec_z_all_aper_fluxes_161025.fits')
            #mem.rename_columns(['ID_CLUSTER', 'RIGHT_ASCENSION', 'DECLINATION', 'FLUX_J_2FWHM_APER'], ['MEM_MATCH_ID', 'RA', 'DEC', 'REFMAG'])
            #mem['REFMAG'] = -2.5*np.log10(mem['REFMAG']) + 23.9
            mem['ZSPEC'] = np.full(len(mem), np.nan, '>f4')
            mem['ZSPEC_REF'] = np.full(len(mem), 'N/A', 'U32')

            
            #exit()

        elif cname == 'EUCWL1':
            mem = Table.read(catdir + 'membership_wldetectable.dat', format='ascii', names=['NAME','RA','DEC','PMEM','REFMAG'])
            mem['MEM_MATCH_ID'] = np.nan
            namedict = {}
            for n in np.unique(cat['NAME']): #[~cat['MEM_MATCH_ID'].mask]):
                mem['MEM_MATCH_ID'][mem['NAME']==n] = cat['MEM_MATCH_ID'][cat['NAME']==n][0]
                
            #mem = Table.read(catdir + 'output_pzwav_rr2_spt_members_with_RA_Dec_z_all_aper_fluxes_161025.fits')
            #mem.rename_columns(['ID_CLUSTER', 'RIGHT_ASCENSION', 'DECLINATION', 'FLUX_J_2FWHM_APER'], ['MEM_MATCH_ID', 'RA', 'DEC', 'REFMAG'])
            #mem['REFMAG'] = -2.5*np.log10(mem['REFMAG']) + 23.9
            mem['ZSPEC'] = np.full(len(mem), np.nan, '>f4')
            mem['ZSPEC_REF'] = np.full(len(mem), 'N/A', 'U32')            
        elif cname == 'EUCTR1BPZWAV':
            mem = Table.read(catdir + 'membership_TR1b_PZWAV2.dat', format='ascii', names=['MEM_MATCH_ID','RA','DEC','PMEM','REFMAG'])
            namedict = {}
            #for n in np.unique(cat['NAME']): #[~cat['MEM_MATCH_ID'].mask]):
            #    mem['MEM_MATCH_ID'][mem['NAME']==n] = cat['MEM_MATCH_ID'][cat['NAME']==n][0]
            mem['ZSPEC'] = np.full(len(mem), np.nan, '>f4')
            mem['ZSPEC_REF'] = np.full(len(mem), 'N/A', 'U32')            
        elif cname == 'EUCRR2PZWAV2':
            mem = Table.read(catdir + 'output_pzwav_rr2_hr2_members_with_ra_dec_z_flux_h.fits')
            mem.rename_columns(['ID_CLUSTER', 'RIGHT_ASCENSION', 'DECLINATION', 'FLUX_H_2FWHM_APER'], ['MEM_MATCH_ID', 'RA', 'DEC', 'REFMAG'])
            mem['REFMAG'] = -2.5*np.log10(mem['REFMAG']) + 23.9
            mem['ZSPEC'] = np.full(len(mem), np.nan, '>f4')
            mem['ZSPEC_REF'] = np.full(len(mem), 'N/A', 'U32')
        elif 'RR2' in cname:
            mem = Table(names=['MEM_MATCH_ID', 'RA', 'DEC', 'PMEM', 'REFMAG', 'CG', 'ZSPEC', 'ZSPEC_REF'], dtype=[np.int64,       np.float32, np.float32, np.float32, np.float32, np.bool_,       np.float32, 'U40'])
        elif 'EUC' in cname or cname == 'HSCS20AWIDESMN10':
            fake = True
            if fake:
                mem = Table(names=['MEM_MATCH_ID', 'RA', 'DEC', 'PMEM', 'REFMAG', 'CG', 'ZSPEC', 'ZSPEC_REF'], dtype=[np.int64,       np.float32, np.float32, np.float32, np.float32, np.bool_,       np.float32, 'U40'])
            #https://eas.esac.esa.int/sas/
            #SELECT m.object_id, m.right_ascension, m.declination, flux_j_3fwhm_aper
            #FROM catalogue.mer_catalogue AS m
            #JOIN user_mkluge.objids AS o
            #ON m.object_id = o.col1
            else:
                mem  = Table.read(catdir+'output_members_edfs_161224_q1_nov24Pmem.fits')
                mem = mem[ np.isin(mem['ID_CLUSTER'], edfs_mid) ]
                mem2 = Table.read(catdir+'output_members_edfn_161224_q1_nov24Pmem.fits')
                mem2 = mem2[ np.isin(mem2['ID_CLUSTER'], edfn_mid) ]
                mem2['ID_CLUSTER'] += mid_offset1
                mem  = vstack([mem, mem2])
                del mem2
                mem2 = Table.read(catdir+'output_members_edff_161224_q1_nov24Pmem.fits')
                mem2 = mem2[ np.isin(mem2['ID_CLUSTER'], edff_mid) ]
                mem2['ID_CLUSTER'] += mid_offset2
                mem  = vstack([mem, mem2])
                del mem2
                
                #mem = Table.read(catdir+'output_members_edfn_161224_q1_nov24Pmem.fits')
                #exit()
                #mem['ID_CLUSTER'] += mid_offset1
                #mem = mem[ np.isin(mem['ID_CLUSTER'], edfn_mid) ]
                
                memradec = Table.read(catdir+'euc_q1_members_radec.vot.gz')
                id_to_index = {oid: idx for idx, oid in enumerate(memradec['object_id'])}
                memsort = [id_to_index[i] for i in mem['OBJECT_ID']]
                mem.rename_column('ID_CLUSTER','MEM_MATCH_ID')
                mem['RA']  = memradec['right_ascension'][memsort]
                mem['DEC'] = memradec['declination'][memsort]
                mem['REFMAG'] = -2.5*np.log10(memradec['flux_j_3fwhm_aper'][memsort]) + 23.9
                mem['CG'] = False
                mem['ZSPEC'] = np.nan
                #mem['ZSPEC_REF'] = 'N/A'
                mem['ZSPEC_REF'] = Column(data=np.full(len(mem), 'N/A', dtype='U10'), name='ZSPEC_REF')
                #exit()
                memspec = Table.read(catdir + 'Q1_extspec_cat_v1.1.fits')
                cm  = SkyCoord(mem['RA']    , mem['DEC']    , unit='deg')
                cms = SkyCoord(memspec['right_ascension'], memspec['declination'], unit='deg')
                match = cm.match_to_catalog_sky(cms)
                good = match[1].arcsec < 1
                mem['ZSPEC'][good] = memspec['z_spec'][match[0][good]]
                mem['ZSPEC_REF'][good] = memspec['z_source'][match[0][good]]
                
                #exit()
                #mem = mem[ np.isin(mem['MEM_MATCH_ID'], cat['MEM_MATCH_ID']) ]
                #cm  = SkyCoord(mem['RA']    , mem['DEC']    , unit='deg')
                #
                #fabian = Table.read(catdir + 'fabian_eucq1_virus.csv')
                #cfs = SkyCoord(fabian['ra'], fabian['dec'], unit='deg')
                #matchf = cm.match_to_catalog_sky(cfs)
                #goodf = (matchf[1].arcsec < 1) & (fabian['bad_spec'][matchf[0]] == 'False')
                #mem['ZSPEC'][goodf] = fabian['spec_z'][matchf[0][goodf]]
                #mem['ZSPEC_REF'][goodf] = 'VIRUS'
                #
                #w = mem['ZSPEC_REF'] == 'VIRUS'
                #catra   = [cat['RA'  ][cat['MEM_MATCH_ID'] == mem['MEM_MATCH_ID'][goodf][i]][0] for i in range(goodf.sum()) ]
                #catdec  = [cat['DEC' ][cat['MEM_MATCH_ID'] == mem['MEM_MATCH_ID'][goodf][i]][0] for i in range(goodf.sum()) ]
                #catname = [cat['NAME'][cat['MEM_MATCH_ID'] == mem['MEM_MATCH_ID'][goodf][i]][0] for i in range(goodf.sum()) ]
                #print(np.c_[mem['RA'].data[w], mem['DEC'].data[w], mem['ZSPEC'][w], catname, catra, catdec])
                #exit()
            
        if 'PMEM' not in mem.colnames:
            mem['PMEM'] = mem['P'] * mem['PFREE'] * mem['THETA_I'] * mem['THETA_R']
        #if 'Z_SPEC' not in mem.colnames:
        #    mem.rename_columns(['ZSPEC','ZSPEC_REF'],['Z_SPEC','Z_SPEC_REF'])

        if 'EUC' in cname:
            # match to Christoph's Euclid galaxy spec-z compilation
            #euc = Table.read(catdir+'all_cut.fits')
            euc1 = Table.read(catdir+'Q1_extspec_cat_v1.1.fits') # Datalabs: team_workspaces/Euclid-Consortium/external_spectra/Q1/Q1_cat_v1.1/
            euc2 = Table.read(catdir+'RR2_extspec_cat_v1.0.fits.gz')  # Datalabs: team_workspaces/EXTSPEC/test_output/RR2_v1/
            euc = vstack([euc1,euc2])
            #euc = Table.read(catdir + 'spec_z_compilation_matthias_2025_07_12.fits')
            #euc.rename_columns(['ra','dec','z','ref'], ['right_ascension','declination','z_spec','z_source'])
            ce = SkyCoord(euc['right_ascension'], euc['declination'], unit='deg')
            cm  = SkyCoord(mem['RA']    , mem['DEC']    , unit='deg')
            match = cm.match_to_catalog_sky(ce)
            #good = (match[1].arcsec < 1) & mem['ZSPEC'].mask & (euc['z_spec'][match[0]] != -99.)
            #mem['ZSPEC'].mask[good] = True
            good = (match[1].arcsec < 1) & (euc['z_spec'][match[0]] != -99.)
            mem['ZSPEC'][good] = euc['z_spec'][match[0][good]]
            mem['ZSPEC_REF'][good] = euc['z_source'][match[0][good]]
    
    # discard clusters, which have no eromapper measurements
    #cat = cat[cat.MEM_MATCH_ID!=999999]
    #cat = cat[~np.isnan(cat.MEM_MATCH_ID)]

    if cname == 'custom':
        cat = Table.read(cfiles[cname])
        #cat.rename_columns(['name','ra_deg','dec_deg','z'],['NAME','RA','DEC','Z_LAMBDA_CORR']) # Liu et al. (2012)
        cat.rename_columns(['name','ra','dec','redshift'],['NAME','RA','DEC','Z_LAMBDA_CORR']) # Cerulo et al. (2019)
        cat['MEM_MATCH_ID'] = np.arange(len(cat))
        cat['BEST_Z'] = cat['Z_LAMBDA_CORR']
        for i in 'IN_FOOTPRINT','IN_ZVLIM':
            cat[i] = True
        cat['VISUAL_CONTAMINATION'] = 0
        for i in 'RA_OPT','DEC_OPT','RA_MBCG','DEC_MBCG','MASKFRAC','LAMBDA_NORM','VDISP','VDISP_ERR','LIT_Z','LMAX':
            cat[i] = np.nan
        
        ## edit
        #for ik in range(len(cat)):
        #  if ~np.isnan(cat.SPEC_Z_BOOT[ik]):
        #      bestznolitz = cat.SPEC_Z_BOOT[ik]
        #  elif ~np.isnan(cat.CG_SPEC_Z[ik]):
        #      bestznolitz = cat.CG_SPEC_Z[ik]
        #  elif ~np.isnan(cat.Z_LAMBDA[ik]):
        #      bestznolitz = cat.Z_LAMBDA[ik]
        #  else:
        #      bestznolitz = np.nan
        #  cat.BEST_Z[ik] = bestznolitz
        #g  = np.abs(cat.BEST_Z - cat.Z_KLUGE)<0.02
        #g *= cat.LAMBDA_NORM<10
        #g *= cat.BEST_Z_TYPE != 'lit_z'
        #cat = cat[g]
        ##g = ~np.isnan(cat.Z_LAMBDA) & (np.abs(cat.BEST_Z - cat.Z_KLUGE)>=0.05) & (np.abs(cat.BEST_Z - cat.Z_KLUGE)<0.1)
        #from astropy.coordinates import SkyCoord
        ##sga = fits.open('/home/matthias/Downloads/SGA-2020.fits')[1].data
        #ck = SkyCoord(cat.RA    , cat.DEC    , unit='deg')
        #ce = SkyCoord(cat.RA_BCG, cat.DEC_BCG, unit='deg')
        #cm = SkyCoord(mem['RA'] , mem['DEC'] , unit='deg')
        ##cs = SkyCoord(sga.RA, sga.DEC, unit='deg')
        ##m = ck.match_to_catalog_sky(cs)
        ##nosga = (m[1].arcsec > 2) # 30 arcsec?                
        #m = ck.match_to_catalog_sky(ce)
        #g2 = (m[1].arcsec > 4)
        #mm = ck.match_to_catalog_sky(cm)
        #g3 = (mm[1].arcsec > 4)
        #cat = cat[g2 & g3]
        #g  = cat.SPLIT_CLEANED & cat.IN_XGOOD & ~cat.VISUAL_CONTAMINATION & ~np.isnan(cat.BEST_Z)
        #g *= cat.BEST_Z_TYPE=='lit_z'
        #g *= cat.IN_FOOTPRINT
        #g *= ~np.isnan(cat.Z_LAMBDA)
        #g *= ~cat.IN_CALIB_ZRANGE
        #g *= np.isnan(cat.SPEC_Z_BOOT) & np.isnan(cat.CG_SPEC_Z)
        #g *= ~np.isnan(cat.Z_LAMBDA) & (cat.BEST_Z_TYPE=='lit_z') & ()

        #g *= cat.RUN == 'legacy_dr10_grz_z_v0.9'
        #g *= cat.Z_LAMBDA < 0.8
        #g = (cat.LIT_Z < 0.01) #& (cat.SPLIT_CLEANED) & (cat.IN_XGOOD)
        #g = cat.VISUAL_CONTAMINATION
        #g = cat.HECATE_30_ARCSEC
        #g = ~np.isnan(cat.Z_LAMBDA) & (cat.BEST_Z_TYPE=='lit_z') & cat.IN_CALIB_ZRANGE & (cat.LIT_Z<cat.Z_LAMBDA)
        #exit()
        #cat = cat[g]
        
    if ('custom' in cname) | (cfiles[cname] == cfiles['ERASS1E']) | (cfiles[cname] == cfiles['ERASS1HE']) | (cfiles[cname] == cfiles['ERASS1PF']):
        #cat.columns['VDISP_BOOT_ERR'].name = 'VDISP_ERR_BOOT'
        #exit()
        if 'RA_CORR' in cat.colnames:
            if 'RA' in cat.colnames:
                cat.columns['RA'].name  = 'RA_UNCORR'
                cat.columns['DEC'].name = 'DEC_UNCORR'
            cat.columns['RA_CORR'].name  = 'RA'
            cat.columns['DEC_CORR'].name = 'DEC'
            #exit()
            #cat.columns['VDISP'].name = 'VDISP_BOOT' # not the correct column
            #cat.columns['VDISP_ERR'].name = 'VDISP_ERR_BOOT' # not the correct column
            #cat.RA  = cat.RA_CORR
            #cat.DEC = cat.DEC_CORR
    #else:
    #    if orgzcol[cname] is not None:
    #        cat['LIT_Z'] = cat[orgzcol[cname]]
    #        cat['LIT_Z'][cat['LIT_Z']<=0] = np.nan
    #        cat['LIT_Z'][cat['LIT_Z']>=10] = np.nan
    #    else:
    #        cat['LIT_Z'] *= np.nan

    #if 'ERASS4' in cname:
    #    #exit()
    #    cat.columns['RA'].name  = 'RA_UNCORR'
    #    cat.columns['DEC'].name = 'DEC_UNCORR'
    #    cat.columns['RA_CORR'].name  = 'RA'
    #    cat.columns['DEC_CORR'].name = 'DEC'
    #    cat.columns['VDISP_ERR_BOOT'].name = 'VDISP_BOOT_ERR'

    #if 'ERASS1H' in cname:
    #cat.columns['VDISP_ERR_BOOT'].name = 'VDISP_BOOT_ERR'
        
    if cid[cname] != 'NAME' and 'NAME' in cat.colnames:
        cat.columns['NAME'].name = 'NAME_OLD'
    cat.columns[cid[cname]].name = 'NAME'

    
    #cat['NAME'] = cat[cid[cname]]
    if cname == 'ERASS1HE':
        cat = cat[cat['EXT_LIKE'] >  0]
    elif cname == 'ERASS1HP':
        cat = cat[cat['EXT_LIKE'] == 0]
    elif cname == 'OPTICAL':
        cat.rename_column('LNLIKE','LMAX')
        

    if cat['MEM_MATCH_ID'].dtype.name == 'int32':
        print('WARNING: MEM_MATCH_ID is int32')
        for icat in cat,mem:
            m = icat['MEM_MATCH_ID'].astype(float)
            m[m==999999] = np.nan
            icat.columns.del_col('MEM_MATCH_ID')
            icat.columns.add_col( fits.Column('MEM_MATCH_ID', 'D', m) )

            
    if newcluster:
        if 'ORG_Z' in cat.colnames:
            cat['LIT_Z'] = cat['ORG_Z']
        # clear table before populating it anew
        if cleartable:
            try:
                cursor.execute("DELETE FROM "+cname.upper()+"CLUSTERS")
                cursor.execute("DROP TABLE "+cname.upper()+"CLUSTERS")
            except:
                print("Creating new table "+cname.upper()+"CLUSTERS")
    
        # create table
        execution_command = "CREATE TABLE IF NOT EXISTS "+cname.upper()+"CLUSTERS ("\
            "MEM_MATCH_ID BIGINT SIGNED,"\
            "NAME VARCHAR(50),"\
            "RA DECIMAL(8,5),"\
            "DE DECIMAL(7,5),"\
            "MASKFRAC DECIMAL(3,2),"\
            "Z_LAMBDA DECIMAL(6,5),"\
            "LAMBDA_NORM DECIMAL(6,2),"\
            "VDISP MEDIUMINT,"\
            "VDISP_ERR MEDIUMINT,"\
            "BEST_Z DECIMAL(6,5),"\
            "LIT_Z DECIMAL(6,5),"\
            "IN_FOOTPRINT TINYINT(1),"\
            "IN_ZVLIM TINYINT(1),"\
            "RA_OPT DECIMAL(8,5),"\
            "DEC_OPT DECIMAL(7,5),"\
            "RA_MBCG DECIMAL(8,5),"\
            "DEC_MBCG DECIMAL(7,5),"\
            "BCG_SCORE DECIMAL(3,2),"\
            "VISUAL_CONTAMINATION TINYINT(1)"\
            ");"

        if 'LSDR' not in cname:
            execution_command = execution_command[:-2] + ",LMAX DECIMAL(5,1));"
            
        #if cname == 'ERASS1E':
        if (cname == 'ERASS1E'): # | (cname == 'custom'):
            #execution_command = execution_command[:-2] + ",PCONT DECIMAL(3,2));"
            execution_command = execution_command[:-2] + ",PCONT DECIMAL(3,2),SPLIT_CLEANED TINYINT(1),IN_XGOOD TINYINT(1),L500 DECIMAL(5,2),M500 DECIMAL(5,2),R500 MEDIUMINT,Z_LAMBDA_SECOND DECIMAL(6,5));"
        #if (cname == 'EFEDS2') | (cname == 'DESY1'):
        #if (cname == 'efeds2') | (cname == 'custom'):
        #    execution_command = execution_command[:-2] + ",Z_LAMBDA_SECOND DECIMAL(6,5));"

        if (cname == 'ERASS1PF'):
            execution_command = execution_command[:-2] + ",CLASS TINYINT(1));"

        if cname == 'ERASS4P':
            execution_command = execution_command[:-2] + ",Z_LAMBDA_SECOND DECIMAL(6,5), IN_XGOOD TINYINT(1), SPLIT_CLEANED TINYINT(1), L500 DECIMAL(5,2), DET_LIKE DECIMAL(8,1));" # temp for localhost
        if (cname == 'OPTICAL') | (cname == 'Kluge'):
            execution_command = execution_command[:-2] + ",IN_XGOOD TINYINT(1), SPLIT_CLEANED TINYINT(1));" # temp for localhost

        #if (cname == 'OPTICAL'): # wip
        #    execution_command = execution_command[:-2] + ",SPLIT_CLEANED TINYINT(1));"
        if (cname == 'ERASS5WAVELET'):
            execution_command = execution_command[:-2] + ",Z_LAMBDA_SECOND DECIMAL(6,5),SPLIT_CLEANED TINYINT(1),IN_XGOOD TINYINT(1),EXT_LIKE DECIMAL(7,1),DET_LIKE DECIMAL(9,1));"

        if (cname == 'ERASS5RANDOM'):
            execution_command = execution_command[:-2] + ",IN_XGOOD TINYINT(1));"
            
            
        cursor.execute(execution_command)
            
        dtypes = {'MEM_MATCH_ID'  : 'BIGINT SIGNED',
                  'NAME'          : 'VARCHAR(50)',
                  'RA'            : 'DECIMAL(8,5)',
                  'DEC'           : 'DECIMAL(7,5)',
                  'MASKFRAC'      : 'DECIMAL(3,2)',
                  'Z_LAMBDA_CORR' : 'DECIMAL(6,5)',
                  'LAMBDA_NORM'   : 'DECIMAL(6,2)',
                  'VDISP'    : 'MEDIUMINT',
                  'VDISP_ERR': 'MEDIUMINT',
                  'BEST_Z'        : 'DECIMAL(6,5)',
                  'LIT_Z'         : 'DECIMAL(6,5)',
                  'RA_OPT'        : 'DECIMAL(8,5)',
                  'DEC_OPT'       : 'DECIMAL(7,5)',
                  'RA_MBCG'        : 'DECIMAL(8,5)',
                  'DEC_MBCG'       : 'DECIMAL(7,5)',
                  'BCG_SCORE'     : 'DECIMAL(3,2)',
                  'IN_FOOTPRINT'  : 'TINYINT(1)',
                  'IN_ZVLIM'      : 'TINYINT(1)',
                  'VISUAL_CONTAMINATION': 'TINYINT(1)'}

        
        cols1 = np.r_[['MEM_MATCH_ID', 'NAME', 'RA', 'DE' , 'RA_OPT', 'DEC_OPT', 'RA_MBCG', 'DEC_MBCG', 'MASKFRAC', 'Z_LAMBDA'     , 'LAMBDA_NORM', 'VDISP'     , 'VDISP_ERR'     , 'BEST_Z', 'LIT_Z', 'IN_FOOTPRINT', 'IN_ZVLIM', 'VISUAL_CONTAMINATION']]
        cols2 = np.r_[['MEM_MATCH_ID', 'NAME', 'RA', 'DEC', 'RA_OPT', 'DEC_OPT', 'RA_MBCG', 'DEC_MBCG', 'MASKFRAC', 'Z_LAMBDA_CORR', 'LAMBDA_NORM', 'VDISP', 'VDISP_ERR', 'BEST_Z', 'LIT_Z', 'IN_FOOTPRINT', 'IN_ZVLIM', 'VISUAL_CONTAMINATION']]
        
        if 'LSDR' not in cname:
            dtypes['LMAX'] = 'DECIMAL(5,1)'
            cols1 = np.append(cols1, 'LMAX')
            cols2 = np.append(cols2, 'LMAX')
            
        if (cname == 'ERASS1E'): # | (cname == 'custom'):
            dtypes['PCONT'] = 'DECIMAL(3,2)'
            dtypes['SPLIT_CLEANED'] = 'TINYINT(1)'
            dtypes['IN_XGOOD'] = 'TINYINT(1)'
            dtypes['L500'] = 'DECIMAL(5,2)'
            dtypes['M500'] = 'DECIMAL(5,2)'
            dtypes['R500'] = 'MEDIUMINT'
            dtypes['Z_LAMBDA_SECOND'] = 'DECIMAL(6,5)'

            morecols = ['PCONT','SPLIT_CLEANED','IN_XGOOD','L500','M500','R500','Z_LAMBDA_SECOND']
            cols1 = np.append(cols1, morecols)
            cols2 = np.append(cols2, morecols)
            cat['L500'] = np.log10(cat['L500'] * 1e42)
            cat['M500'] = np.log10(cat['M500'] * 1e13)

        if (cname == 'ERASS1PF'):
            dtypes['CLASS'] = 'TINYINT(1)'
            morecols = ['CLASS']
            cols1 = np.append(cols1, morecols)
            cols2 = np.append(cols2, morecols)

        if cname == 'ERASS4P':
            dtypes['Z_LAMBDA_SECOND'] = 'DECIMAL(6,5)'
            dtypes['IN_XGOOD'] = 'TINYINT(1)'
            dtypes['SPLIT_CLEANED'] = 'TINYINT(1)'
            dtypes['BCG_SCORE'] = 'DECIMAL(3,2)'
            dtypes['BCG_SCORE'] = 'DECIMAL(3,2)'
            dtypes['L500'] = 'DECIMAL(5,2)'
            dtypes['DET_LIKE'] = 'DECIMAL(8,1)'
            morecols = ['Z_LAMBDA_SECOND','IN_XGOOD','SPLIT_CLEANED','BCG_SCORE','L500','DET_LIKE']
            cols1 = np.append(cols1, morecols)
            cols2 = np.append(cols2, morecols)
            cat['L500'] = np.log10(cat['L500'])
            cat.rename_column('DET_LIKE_0','DET_LIKE')

        if (cname == 'OPTICAL') | (cname == 'Kluge'):
            dtypes['IN_XGOOD'] = 'TINYINT(1)'
            dtypes['SPLIT_CLEANED'] = 'TINYINT(1)'
            dtypes['BCG_SCORE'] = 'DECIMAL(3,2)'
            morecols = ['IN_XGOOD','SPLIT_CLEANED','BCG_SCORE']
            cols1 = np.append(cols1, morecols)
            cols2 = np.append(cols2, morecols)            

        if (cname == 'ERASS5WAVELET'):
            dtypes['Z_LAMBDA_SECOND'] = 'DECIMAL(6,5)'
            dtypes['SPLIT_CLEANED'] = 'TINYINT(1)'
            dtypes['IN_XGOOD'] = 'TINYINT(1)'
            dtypes['EXT_LIKE'] = 'DECIMAL(11,6)'
            dtypes['DET_LIKE'] = 'DECIMAL(8,3)'
            dtypes['BCG_SCORE'] = 'DECIMAL(3,2)'
            morecols = ['Z_LAMBDA_SECOND','SPLIT_CLEANED','IN_XGOOD','EXT_LIKE','DET_LIKE','BCG_SCORE']
            cols1 = np.append(cols1, morecols)
            cols2 = np.append(cols2, morecols)

        if (cname == 'ERASS5RANDOM'):
            dtypes['IN_XGOOD'] = 'TINYINT(1)'
            morecols = ['IN_XGOOD']
            cols1 = np.append(cols1, morecols)
            cols2 = np.append(cols2, morecols)
            
            
            
        #if (cname == 'OPTICAL'): # wip
        #    dtypes['SPLIT_CLEANED'] = 'TINYINT(1)'
        #    morecols = ['SPLIT_CLEANED']
        #    cols1 = np.append(cols1, morecols)
        #    cols2 = np.append(cols2, morecols)
            
        #if (cname == 'EFEDS2') | (cname == 'DESY1'):
        ##if (cname == 'efeds2') | (cname == 'DESY1') | (cname == 'custom'):
        #    dtypes['Z_LAMBDA_SECOND'] = 'DECIMAL(6,5)'
        #    morecols = ['Z_LAMBDA_SECOND']
        #    #cols1.extend(morecols)
        #    #cols2.extend(morecols)
        #    cols1 = np.append(cols1, morecols)
        #    cols2 = np.append(cols2, morecols)
            
            
            
        # populate table with clusters
        for i in trange(len(cat), desc='clusters'):
            #if i%10000 == 0:
            #    print('inserting cluster',i,'out of',len(cat))
            data = ','.join([ "'"+str(cat[c][i])+"'" if 'VARCHAR' in dtypes[c] else str(cat[c][i]) for c in cols2 ])
            data = data.replace('nan','NULL').replace('--','NULL')
            cursor.execute("insert into "+cname.upper()+"CLUSTERS ("+','.join(cols1)+") values ("+ data +");")
        
    if newmember:
        # only use members of good clusters
        mem = mem[ np.isin(mem['MEM_MATCH_ID'], cat['MEM_MATCH_ID']) ]
        if 'REFMAG' not in mem.colnames:
            mem['REFMAG'] = mem['MAG'][:,3]
        
        # clear table before populating it anew
        if cleartable:
            try:
                cursor.execute("DELETE FROM "+cname.upper()+"MEMBERS") # clear table
                cursor.execute("DROP TABLE " +cname.upper()+"MEMBERS") # clear table
            except:
                print("Creating new table "+cname.upper()+"MEMBERS")
        
        # create table
        # DEC makes problems, use DE
        cursor.execute("CREATE TABLE IF NOT EXISTS "+cname.upper()+"MEMBERS ("
            "MEM_MATCH_ID BIGINT SIGNED,"
            "RA DECIMAL(8,5),"
            "DE DECIMAL(7,5),"
            "PMEM DECIMAL(3,2),"
            "REFMAG DECIMAL(4,2),"
            "CG TINYINT(1),"
            "ZSPEC DECIMAL(6,5),"
            "ZSPEC_REF VARCHAR(37),"
            "BCG_SCORE DECIMAL(3,2)"
            #"Z_SPEC DECIMAL(6,5),"
            #"Z_SPEC_REF VARCHAR(37)"
            ");")
        
        dtypes = {'MEM_MATCH_ID': 'BIGINT SIGNED',
                  'RA'          : 'DECIMAL(8,5)',
                  'DEC'         : 'DECIMAL(7,5)',
                  'PMEM'        : 'DECIMAL(3,2)',
                  'REFMAG'      : 'DECIMAL(4,2)',
                  'ZSPEC'       : 'DECIMAL(6,5)',
                  'ZSPEC_REF'   : 'VARCHAR(40)'}
        
        cols1 = 'MEM_MATCH_ID','RA','DE' ,'PMEM','REFMAG','ZSPEC','ZSPEC_REF'
        cols2 = 'MEM_MATCH_ID','RA','DEC','PMEM','REFMAG','ZSPEC','ZSPEC_REF'

        if (cname == 'ERASS4P') | (cname == 'OPTICAL') | (cname == 'ERASS5WAVELET'):
            dtypes['BCG_SCORE'] = 'DECIMAL(3,2)'
            morecols = ['BCG_SCORE']
            cols1 = np.append(cols1, morecols)
            cols2 = np.append(cols2, morecols)
        
        # populate table with members
        for i in trange(len(mem), desc='members'):
            #if i%10000 == 0:
            #    print('inserting member',i,'out of',len(mem))
            data = ','.join([ "'"+str(mem[c][i])+"'" if 'VARCHAR' in dtypes[c] else str(mem[c][i]) for c in cols2 ])
            data = data.replace('nan','NULL').replace('N/A','NULL').replace('--','NULL')
            cursor.execute("insert into "+cname.upper()+"MEMBERS ("+','.join(cols1)+") values ("+ data +");")

    #if downloadimages:
    #    for i in range(len(cat)):
    #      #if cat.IN_FOOTPRINT[i] and ~np.isnan(cat.Z_ABELL[i]):
    #        clustername = str(cat.NAME[i]).replace(' ','')
    #        print(i, clustername)
    #        clusterjpg = 'newimages/' + clustername+'.jpg'
    #        storedjpg  = '/var/www/html/images/' + cname + '/' + clustername+'.jpg'
    #        if not os.path.isdir('/var/www/html/images/' + cname):
    #            os.mkdir('/var/www/html/images/' + cname)
    #        if not os.path.isfile(clusterjpg) and not os.path.isfile(storedjpg): # and not os.path.isfile('/var/www/html/images/'+clustername+'.jpg'):
    #            kpcas,distmod = calculate_kpcas(cat.BEST_Z[i])
    #            pixscale = 2 * 2 * 1000 / 1560 / kpcas
    #            image_url = f"https://www.legacysurvey.org/viewer/cutout.jpg?ra={cat.RA[i]}&dec={cat.DEC[i    ]}&layer=ls-dr10-grz&pixscale={pixscale}&size=1560"
    #            try:
    #                #ima = urlretrieve(image_url, clusterjpg)
    #                ima = urlretrieve(image_url, storedjpg) # sudo rights
    #            except Exception as e:
    #                print(e)


    if downloadimages:
        for i in range(len(cat)):
        #for i in range(12953,len(cat)):
          #if cat.IN_FOOTPRINT[i] and ~np.isnan(cat.Z_ABELL[i]):
            clustername = str(cat['NAME'][i]).replace(' ','')
            #print(i, clustername)
            clusterjpg = 'newimages/' + clustername+'.jpg'
            storedjpg  = '/var/www/html/images/' + cname + '/' + clustername+'.jpg'
            if not os.path.isdir('/var/www/html/images/' + cname):
                os.mkdir('/var/www/html/images/' + cname)
            if not os.path.isfile(clusterjpg) and not os.path.isfile(storedjpg): # and not os.path.isfile('/var/www/html/images/'+clustername+'.jpg'):
                kpcas,distmod = calculate_kpcas(cat['BEST_Z'][i])
                pixscale = 2 * 2 * 1000 / 1560 / kpcas  # EUC 1 * 2, eRO 2 * 2
                image_url = f"https://www.legacysurvey.org/viewer/cutout.jpg?ra={cat['RA'][i]}&dec={cat['DEC'][i    ]}&layer=ls-dr10-grz&pixscale={pixscale}&size=1560"

                print(f'[ ! -s {clustername}.jpg ] && wget -O {clustername}.jpg "{image_url}"')
                continue

                retry = 0
                while retry < 5:
                    try:
                        ima = urlretrieve(image_url, storedjpg) # sudo rights
                        break
                    except Exception as e:
                        retry += 1
                        print(f'retrying {retry}: {e}')
                        if retry == 5:
                            print(f'giving up on {i} {clustername}')


            
            
# update database
if newcluster | newmember:
    mydb.commit()
