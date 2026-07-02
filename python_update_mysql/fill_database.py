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
from copy import deepcopy

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
cfiles['custom'] = '/home/mkluge/Documents/eRosita/projects/bluebcgs/literature_samples/cerulo2019/cerulo2019_WH15_parent_like_strict_aladin_with_id_z.csv'
cfiles['ERASS1A']   = '/Users/valerio/Work/data/AGN_identification/FINAL_eRASS1_LS10_CW2020_GDR3_match.fits' #THIS IS WHERE THE LOCATION OF THE FILE IS


orgzcol = {'ACO'      : 'Z_ABELL',
           'Hickson'  : None}

cnames = ['ERASS1A'] #IMPORTANT, CHANIGN TO THE FINAL CATALOG


cid = {'ERASS4P': 'NAME',
       'ERASS1E': 'NAME',
       'ERASS4E': 'DETUID',
       'ERASS1A': 'DETUID', #IMPORTANT, SETTING THE NAME COLUMN TO THE ID
       'LSDR9grz': 'NAME'}


mydb = mysql.connector.connect(
    host="localhost",
    user=username,
    password=password,
    database="cluster_catalog"
)

cursor = mydb.cursor(buffered=True)

for cname in cnames:
    newcluster = False
    newmember  = True
    cleartable = True
    downloadimages = False
    update_catfile = False
    
    print('loading catalog '+cname+'...')
    print(cfiles[cname])


    if cname=='ERASS1A': #~VALERIO main if block for OUR new catalog
        cat = Table.read(cfiles[cname])
        cat.keep_columns([ #~VALERIO deciding which columns to keep from the table
            'DETUID','RA', 'DEC', 'EXT_LIKE', 'DET_LIKE_0', 'zz_final', 'ML_FLUX_1', #general coulmns
            'LS10_RA', 'LS10_DEC', 'LS10_Xray_proba', 'NWAY_Separation_LS10_ERO', 'NWAY_LS10_bias_LS10_Xray_proba', 'NWAY_LS10_p_single', 'NWAY_LS10_p_any', 'NWAY_LS10_p_i', 'NWAY_LS10_match_flag', 'dered_mag_g', 'dered_mag_r', 'dered_mag_z', 'dered_mag_W1', 'dered_mag_W2',#LS10
            'CW2020_RA', 'CW2020_DEC', 'CW2020_Xray_proba', 'NWAY_CW2020_p_single', 'NWAY_CW2020_p_any', 'NWAY_CW2020_p_i', 'NWAY_CW2020_match_flag', 'CW2020_w1mag', 'CW2020_w2mag',#CW2020
            'GDR3_RA', 'GDR3_DEC', 'GDR3_Xray_proba', 'NWAY_bias_GDR3_Xray_proba', 'NWAY_GDR3_p_single', 'NWAY_GDR3_p_any', 'NWAY_GDR3_p_i', 'NWAY_GDR3_match_flag', 'GDR3_phot_g_mean_mag', 'GDR3_phot_bp_mean_mag', 'GDR3_phot_rp_mean_mag'#GDR3
        ])
        cat.rename_columns(['zz_final', 'NWAY_LS10_bias_LS10_Xray_proba'], ['BEST_Z', 'NWAY_bias_LS10_Xray_proba']) #~valerio formatiing 
        cat['ML_FLUX_1'] = np.log10(cat['ML_FLUX_1'])


    if 'MEM_MATCH_ID' not in cat.colnames:
        cat['MEM_MATCH_ID'] = np.arange( 1, len(cat)+1, dtype=np.uint64)


    if 'VISUAL_CONTAMINATION' not in cat.colnames:
        cat['VISUAL_CONTAMINATION'] = np.zeros( len(cat), dtype=np.uint8)
    #if 'RA_MBCG' not in cat.colnames:
    #    cat['RA_MBCG'] = np.full( len(cat), np.nan, dtype=np.float32 )
    #if 'DEC_MBCG' not in cat.colnames:
    #    cat['DEC_MBCG'] = np.full( len(cat), np.nan, dtype=np.float32 )

            
    if newmember:#~VALERIO important filtering catalogs creation and renaming columns
        mem_ls10 = deepcopy(cat)
        mem_ls10 = mem_ls10[~mem_ls10['LS10_RA'].mask]
        mem_ls10.keep_columns(['MEM_MATCH_ID', 'LS10_RA', 'LS10_DEC', 'LS10_Xray_proba', 'NWAY_Separation_LS10_ERO', 'NWAY_bias_LS10_Xray_proba', 'NWAY_LS10_p_single', 'NWAY_LS10_p_any', 'NWAY_LS10_p_i', 'NWAY_LS10_match_flag', 'dered_mag_g', 'dered_mag_r', 'dered_mag_z', 'dered_mag_W1', 'dered_mag_W2'])
        mem_ls10.add_column(np.full(len(mem_ls10), 1, np.uint8), name='SURVEY')
        mem_ls10.rename_columns(['dered_mag_g', 'dered_mag_r', 'dered_mag_z', 'dered_mag_W1', 'dered_mag_W2'], ['g', 'r', 'z', 'w1', 'w2'])
        mem_ls10.rename_columns(['LS10_RA', 'LS10_DEC', 'LS10_Xray_proba', 'NWAY_Separation_LS10_ERO', 'NWAY_LS10_p_single', 'NWAY_LS10_p_any', 'NWAY_LS10_p_i', 'NWAY_LS10_match_flag'], ['RA', 'DEC', 'Xray_proba', 'NWAY_Separation_ERO', 'NWAY_p_single', 'NWAY_p_any', 'NWAY_p_i', 'NWAY_match_flag'])

        mem_cw2020 = deepcopy(cat)
        mem_cw2020 = mem_cw2020[~mem_cw2020['CW2020_RA'].mask]
        mem_cw2020.keep_columns(['MEM_MATCH_ID', 'CW2020_RA', 'CW2020_DEC', 'CW2020_Xray_proba', 'NWAY_CW2020_p_single', 'NWAY_CW2020_p_any', 'NWAY_CW2020_p_i', 'NWAY_CW2020_match_flag', 'CW2020_w1mag', 'CW2020_w2mag'])
        mem_cw2020.add_column(np.full(len(mem_cw2020), 1, np.uint8), name='SURVEY')
        mem_cw2020.rename_columns(['CW2020_w1mag', 'CW2020_w2mag'], ['w1', 'w2'])
        mem_cw2020.rename_columns(['CW2020_RA', 'CW2020_DEC', 'CW2020_Xray_proba', 'NWAY_CW2020_p_single', 'NWAY_CW2020_p_any', 'NWAY_CW2020_p_i', 'NWAY_CW2020_match_flag'], ['RA', 'DEC', 'Xray_proba', 'NWAY_p_single', 'NWAY_p_any', 'NWAY_p_i', 'NWAY_match_flag'])

        mem_gdr3 = deepcopy(cat)
        mem_gdr3 = mem_gdr3[~mem_gdr3['GDR3_RA'].mask]
        mem_gdr3.keep_columns(['MEM_MATCH_ID','GDR3_RA', 'GDR3_DEC', 'GDR3_Xray_proba', 'NWAY_bias_GDR3_Xray_proba', 'NWAY_GDR3_p_single', 'NWAY_GDR3_p_any', 'NWAY_GDR3_p_i', 'NWAY_GDR3_match_flag', 'GDR3_phot_g_mean_mag', 'GDR3_phot_bp_mean_mag', 'GDR3_phot_rp_mean_mag'])
        mem_gdr3.add_column(np.full(len(mem_gdr3), 1, np.uint8), name='SURVEY')
        mem_gdr3.rename_columns(['GDR3_phot_g_mean_mag', 'GDR3_phot_bp_mean_mag', 'GDR3_phot_rp_mean_mag'], ['G', 'BP', 'RP'])
        mem_gdr3.rename_columns(['GDR3_RA', 'GDR3_DEC', 'GDR3_Xray_proba', 'NWAY_bias_GDR3_Xray_proba', 'NWAY_GDR3_p_single', 'NWAY_GDR3_p_any', 'NWAY_GDR3_p_i', 'NWAY_GDR3_match_flag'], ['RA', 'DEC', 'Xray_proba', 'NWAY_bias_Xray_proba', 'NWAY_p_single', 'NWAY_p_any', 'NWAY_p_i', 'NWAY_match_flag'])

        mem = vstack([mem_ls10, mem_cw2020, mem_gdr3])
        mem['NWAY_match_flag'][mem['NWAY_match_flag'] < 0] = 0
        #mem['g'] = mem['g'].filled(np.nan)
        #mem['r'] = mem['r'].filled(np.nan)
        #mem['z'] = mem['z'].filled(np.nan)
        #mem['w1'] = mem['w1'].filled(np.nan)
        #mem['w2'] = mem['w2'].filled(np.nan)
        mem['g'][np.isinf(mem['g'])] = np.nan
        mem['r'][np.isinf(mem['r'])] = np.nan
        mem['z'][np.isinf(mem['z'])] = np.nan
        mem['w1'][np.isinf(mem['w1'])] = np.nan
        mem['w2'][np.isinf(mem['w2'])] = np.nan

        #if 'BCG_SCORE' not in mem.colnames:
        #    mem['BCG_SCORE'] = np.full(len(mem), np.nan, np.float32)
        
    if cid[cname] != 'NAME' and 'NAME' in cat.colnames: #adds a new name column = detuid
        cat.columns['NAME'].name = 'NAME_OLD'
    cat.columns[cid[cname]].name = 'NAME'

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
    
        # ~Valerio IMPROTANT create table FOR CLUSTER TABLE
        execution_command = "CREATE TABLE IF NOT EXISTS "+cname.upper()+"CLUSTERS ("\
            "MEM_MATCH_ID BIGINT SIGNED,"\
            "NAME VARCHAR(50),"\
            "RA DECIMAL(8,5),"\
            "DE DECIMAL(7,5),"\
            "BEST_Z DECIMAL(6,5),"\
            "VISUAL_CONTAMINATION TINYINT(1),"\
            "EXT_LIKE DECIMAL(7,1),"\
            "DET_LIKE DECIMAL(8,1),"\
            "ML_FLUX DECIMAL(5,2)"\
            ");"

        if (cname == 'ERASS1E'): # | (cname == 'custom'):
            execution_command = execution_command[:-2] + ",PCONT DECIMAL(3,2),SPLIT_CLEANED TINYINT(1),IN_XGOOD TINYINT(1),L500 DECIMAL(5,2),M500 DECIMAL(5,2),R500 MEDIUMINT,Z_LAMBDA_SECOND DECIMAL(6,5));"

        if (cname == 'ERASS1PF'):
            execution_command = execution_command[:-2] + ",CLASS TINYINT(1));"

        if cname == 'ERASS4P':
            execution_command = execution_command[:-2] + ",Z_LAMBDA_SECOND DECIMAL(6,5), IN_XGOOD TINYINT(1), SPLIT_CLEANED TINYINT(1), L500 DECIMAL(5,2), DET_LIKE DECIMAL(8,1));" # temp for localhost
        if (cname == 'OPTICAL') | (cname == 'Kluge'):
            execution_command = execution_command[:-2] + ",IN_XGOOD TINYINT(1), SPLIT_CLEANED TINYINT(1));" # temp for localhost

            
        cursor.execute(execution_command)
            
        dtypes = {''
            'MEM_MATCH_ID'  : 'BIGINT SIGNED',
            'NAME'          : 'VARCHAR(50)',
            'RA'            : 'DECIMAL(8,5)',
            'DEC'           : 'DECIMAL(7,5)',
            'BEST_Z'        : 'DECIMAL(6,5)',
            'VISUAL_CONTAMINATION': 'TINYINT(1)', 
            'EXT_LIKE': 'DECIMAL(7,1)',
            'DET_LIKE_0': 'DECIMAL(8,1)',
            'ML_FLUX_1': 'DECIMAL(5,2)'
        }

        
        cols1 = np.r_[['MEM_MATCH_ID', 'NAME', 'RA', 'DE', 'BEST_Z', 'VISUAL_CONTAMINATION', 'EXT_LIKE', 'DET_LIKE', 'ML_FLUX']]
        cols2 = np.r_[['MEM_MATCH_ID', 'NAME', 'RA', 'DEC', 'BEST_Z', 'VISUAL_CONTAMINATION', 'EXT_LIKE', 'DET_LIKE_0', 'ML_FLUX_1']]
        
        #if 'LSDR' not in cname:
         #   dtypes['LMAX'] = 'DECIMAL(5,1)'
          #  cols1 = np.append(cols1, 'LMAX')
           # cols2 = np.append(cols2, 'LMAX')
            
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
        #if 'REFMAG' not in mem.colnames:
        #   mem['REFMAG'] = mem['MAG'][:,3]
        
        # clear table before populating it anew
        if cleartable:
            try:
                cursor.execute("DELETE FROM "+cname.upper()+"MEMBERS") # clear table
                cursor.execute("DROP TABLE " +cname.upper()+"MEMBERS") # clear table
            except:
                print("Creating new table "+cname.upper()+"MEMBERS")
        
        # ~VALERIO IMPORTANT create table FOR MEMBERS
        # DEC makes problems, use DE
        cursor.execute("CREATE TABLE IF NOT EXISTS "+cname.upper()+"MEMBERS ("
            "MEM_MATCH_ID BIGINT SIGNED,"
            "g DECIMAL(4,2),"
            "r DECIMAL(4,2),"
            "z DECIMAL(4,2)," 
            "w1 DECIMAL(4,2),"
            "w2 DECIMAL(4,2)," 
            "RA DECIMAL(8,5)," 
            "DE DECIMAL(7,5),"
            "Xray_proba DECIMAL(4,3)," 
            "NWAY_bias_Xray_proba DECIMAL(10,5),"
            "NWAY_Separation_ERO DECIMAL(6,4),"
            "NWAY_p_single DECIMAL(4,3),"
            "NWAY_p_any DECIMAL(4,3),"
            "NWAY_p_i DECIMAL(4,3),"
            "NWAY_match_flag TINYINT(1)"
            ");")
        
        dtypes = {
                'MEM_MATCH_ID': 'BIGINT SIGNED',
                'RA'          : 'DECIMAL(8,5)',
                'DEC'         : 'DECIMAL(7,5)',
                'g'           : 'DECIMAL(4,2)',
                'r'           : 'DECIMAL(4,2)',
                'z'           : 'DECIMAL(4,2)',
                'w1'          : 'DECIMAL(4,2)',
                'w2'          : 'DECIMAL(4,2)', 
                'Xray_proba': 'DECIMAL(4,3)', 
                'NWAY_bias_Xray_proba': 'DECIMAL(10,5)',
                'NWAY_Separation_ERO': 'DECIMAL(6,4)', 
                'NWAY_p_single': 'DECIMAL(4,3)',
                'NWAY_p_any': 'DECIMAL(4,3)', 
                'NWAY_p_i': 'DECIMAL(4,3)',
                'NWAY_match_flag': 'TINYINT(1)'     
            }
        
        cols1 = 'MEM_MATCH_ID','RA','DE', 'g', 'r', 'z', 'w1', 'w2', 'Xray_proba', 'NWAY_bias_Xray_proba', 'NWAY_Separation_ERO', 'NWAY_p_single', 'NWAY_p_any', 'NWAY_p_i', 'NWAY_match_flag'
        cols2 = 'MEM_MATCH_ID','RA','DEC', 'g', 'r', 'z', 'w1', 'w2', 'Xray_proba', 'NWAY_bias_Xray_proba', 'NWAY_Separation_ERO', 'NWAY_p_single', 'NWAY_p_any', 'NWAY_p_i', 'NWAY_match_flag'

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
            #print("insert into "+cname.upper()+"MEMBERS ("+','.join(cols1)+") values ("+ data +");")
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
