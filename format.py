#!/usr/bin/env python

import numpy as np
from copy import deepcopy
from astropy.table import Table, vstack, unique, join
from pathlib import Path

cw_path = r'/Users/valerio/Work/data/AGN_identification/Salvato_etal2025_DR1_CW2020.colfits.gz'
gaia_path = r'/Users/valerio/Work/data/AGN_identification/Salvato_etal2025_DR1_GDR3.colfits.gz'
ls_path = r'/Users/valerio/Work/data/AGN_identification/Salvato_etal2025_DR1_LS10.colfits.gz'

cw   = Table.read(cw_path)
gaia = Table.read(gaia_path)
ls   = Table.read(ls_path)

#assign unique colors for the online visualizer
eROSITA_color = '#ca0020' #symbol = X
cw_color = '#fdae61' #symbol = traingle
gaia_color = '#abd9e9' #symbol = square
ls_color = '#2c7bb6' #symbol = circle


# --- TEMPORARY INSPECT ---
print("CW Columns:", cw.colnames[:5])
print("Gaia Columns:", gaia.colnames[:5])
print("LS Columns:", ls.colnames[:5])
# ----------------------------------------

#define unified column structure so vstack aligns everything perfectly
unified_names = ['DETUID', 'RA', 'DEC', 'CO_RA', 'CO_DEC']

cw_fixed = Table([cw['DETUID'][0],
                  cw['RA'][0],
                  cw['DEC'][0],
                  cw['CW2020_RA_1'][0],
                  cw['CW2020_DEC_1'][0]],
                 names=unified_names)
cw_fixed.add_column(cw_color, name='COLOR')#give each catalog a unique color for the members table in the visaulizer

gaia_fixed = Table([gaia['DETUID'][0],
                    gaia['RA'][0],
                    gaia['DEC'][0],
                    gaia['GDR3_RA_1'][0],
                    gaia['GDR3_DEC_1'][0]],
                   names=unified_names)
gaia_fixed.add_column(gaia_color, name='COLOR')

ls_fixed = Table([ls['DETUID'][0],
                  ls['RA'][0],
                  ls['DEC_1'][0],      #changed from 'DEC' to 'DEC_1'
                  ls['LS10_RA'][0],     #changed from 'LS10_RA_1' to 'LS10_RA'
                  ls['LS10_DEC'][0]],   #changed from 'LS10_DEC_1' to 'LS10_DEC'
                 names=unified_names)
ls_fixed.add_column(ls_color, name='COLOR')

#stack cleanly into a single 6-column table
member = vstack([cw_fixed, gaia_fixed, ls_fixed])

# cluster file
agn_master = deepcopy(member)
agn_master.keep_columns(['DETUID', 'RA', 'DEC'])
agn_master = unique(agn_master)

agn_master.add_column(np.arange(len(agn_master)), name='MEM_MATCH_ID')

# match the DETUID to a MEM_MATCH_ID
#automatically pair the right MEM_MATCH_ID to every row in 'member' via DETUID
member = join(member, agn_master['DETUID', 'MEM_MATCH_ID'], keys='DETUID', join_type='left')


# DETUID should become the NAME column in the inspector
member.rename_column('DETUID', 'NAME')
agn_master.rename_column('DETUID', 'NAME')

export_dir = Path('/Users/valerio/Work/data/AGN_identification/')
output_path_master = export_dir / 'agn_master_clusters.fits'
output_path_member = export_dir / 'merged_counterparts.fits'

agn_master.write(output_path_master, format='fits', overwrite=True)
member.write(output_path_member, format='fits', overwrite=True) #member.write('merged_counterparts.fits') # this is the member file
