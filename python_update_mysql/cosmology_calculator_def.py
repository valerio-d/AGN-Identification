#!/home/matthias/anaconda3/bin/python
  
import sys
from math import *

# the basis for this scirpt is the cosmology calculator ala Ned Wright (www.astro.ucla.edu/~wright)
# input values = redshift, Ho, Omega_m, Omega_vac
# ouput values = age at z, distance in Mpc, kpc/arcsec, apparent to abs mag conversion

def calculate_kpcas(z):
  #H0 = 69.6                       # Hubble constant
  #WM = 0.286                      # Omega(matter)
  H0 = 67.66                       # Hubble constant
  WM = 0.30966                      # Omega(matter)
  WV = 1.0 - WM - 0.4165/(H0*H0)  # Omega(vacuum) or lambda
    
  # initialize constants

  WR = 0.        # Omega(radiation)
  WK = 0.        # Omega curvaturve = 1-Omega(total)
  c = 299792.458 # velocity of light in km/sec
  DCMR = 0.0     # comoving radial distance in units of c/H0
  kpc_DA = 0.0
  a = 1.0        # 1/(1+z), the scale factor of the Universe
  az = 0.5       # 1/(1+z(object))

  h = H0/100.
  WR = 4.165E-5/(h*h)   # includes 3 massless neutrino species, T0 = 2.72528
  WK = 1-WM-WR-WV
  az = 1.0/(1+1.0*z)
  n=1000         # number of points in integrals
  for i in range(n):
    a = az*(i+0.5)/n
    adot = sqrt(WK+(WM/a)+(WR/(a*a))+(WV*a*a))

  DCMR = 0.0

  # do integral over a=1/(1+z) from az to 1 in n steps, midpoint rule
  for i in range(n):
    a = az+(1-az)*(i+0.5)/n
    adot = sqrt(WK+(WM/a)+(WR/(a*a))+(WV*a*a))
    DCMR = DCMR + 1./(a*adot)

  DCMR = (1.-az)*DCMR/n

  # tangential comoving distance

  ratio = 1.00
  x = sqrt(abs(WK))*DCMR
  if x > 0.1:
    if WK > 0:
      ratio =  0.5*(exp(x)-exp(-x))/x 
    else:
      ratio = sin(x)/x
  else:
    y = x*x
    if WK < 0: y = -y
    ratio = 1. + y/6. + y*y/120.
  DCMT = ratio*DCMR
  DA = az*DCMT
  DA_Mpc = (c/H0)*DA
  kpc_DA = DA_Mpc/206.264806

  DL = DA/(az*az)
  DL_Mpc = (c/H0)*DL
  mM = 5*log10(DL_Mpc*1e6)-5
  return(kpc_DA, mM)
