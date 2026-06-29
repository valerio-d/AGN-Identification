# Better execute each step by hand rather and simply running this script.
# Username has to be changed from "mkluge".
# A password has to be chosen and entered in the connect.py script.
# Download the eROMaPPer eRASS1 and eRASS:4 extended source catalogs from here (merged folder):
# https://datashare.mpcdf.mpg.de/s/bJ7RzujX1XJou6k   # password: greenshift
# eromapper_merged_zscan_erass11B_221207_extgt0_griz_grizw1_grz_grzw1_north_grz_north_grzw1_catalog.fit
# eromapper_merged_zscan_erass11B_221207_extgt0_griz_grizw1_grz_grzw1_north_grz_north_grzw1_catalog_members.fit
# eromapper_merged_zscan_erass41B_221031_extgt0_griz_grizw1_grz_grzw1_north_grz_north_grzw1_catalog.fit
# eromapper_merged_zscan_erass41B_221031_extgt0_griz_grizw1_grz_grzw1_north_grz_north_grzw1_catalog_members.fit
#
# optional: download the legacy images for the clusters. If not, they will be queried alongside the cluster properties when query.php is run.
# images.tar -- unpack them in /var/www/html/ so that they lie in /var/www/html/image/c*.jpg

# Add username and password in fill_database.py and run it after this setup script.
# Then change $username and $password in query.php and query_members.php.
# sudo cp query.php query_members.php tablesort.min.js /var/www/html/
# open browser and go to localhost/query.php


# install mysql client
sudo apt-get install mysql-server mysql-client
sudo a2enmod rewrite

# start service
sudo service mysql start
sudo systemctl restart apache2

# install python interface
sudo apt install php-mysql

# start mysql environment as root
sudo mysql -u root

CREATE DATABASE cluster_catalog;

# change password here
CREATE USER mkluge@'localhost' IDENTIFIED BY 'yourpassword'; # quotes are important

# allow user to modify the database tables
GRANT ALL PRIVILEGES ON cluster_catalog.* TO mkluge@'localhost';
FLUSH PRIVILEGES;

# see if it worked
show grants for mkluge@'localhost';

# end the mysql environment by typing exit
