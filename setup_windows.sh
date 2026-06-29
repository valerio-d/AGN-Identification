# Better execute each step by hand rather and simply running this script.
# Username has to be changed from "mkluge".
# A password has to be chosen and entered in the connect.py script.
# Download the eROMaPPer eRASS1 and eRASS:4 extended source catalogs from here (merged folder):
# https://datashare.mpcdf.mpg.de/s/bJ7RzujX1XJou6k # password: greenshift
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



# download mysql from here and install it. There seems to be only a 32 bit msi installer
https://dev.mysql.com/downloads/install/

# open mysql shell from task menu
Open a command prompt (e.g., powershell)
Enter mysqlsh
In this shell, type \sql
# connect to a database
\connect --mysql -u root
# test if it worked
show databases;

# add new database
CREATE DATABASE cluster_catalog;

# change password here
CREATE USER mkluge@'localhost' IDENTIFIED BY 'yourpassword'; # quotes are important

# allow user to modify the database tables
GRANT ALL PRIVILEGES ON cluster_catalog.* TO mkluge@'localhost';
FLUSH PRIVILEGES;

# see if it worked
show grants for mkluge@'localhost';





To install MySQL on Windows from a zip file, you can use the following steps:

Download the MySQL Community Server from the official website: https://dev.mysql.com/downloads/mysql/

Once the download is complete, extract the contents of the zip file to a directory on your computer, such as "C:\mysql".

Open a command prompt (e.g., powershell and open it with administrator privileges)

Navigate to the directory where you extracted the MySQL files. For example, if you extracted the files to "C:\mysql", you would navigate to that directory by running the command "cd C:\mysql".

Run the command "bin\mysqld.exe --initialize" to initialize the MySQL data directory and create the necessary files and folders.

Run the command "bin\mysqld.exe --install" to install the MySQL service.

Start the MySQL service by running the command "net start mysql".

Configure the MySQL root user password by running the command "bin\mysqladmin.exe -u root password yourpassword"

To check the installation, you can enter the command SHOW VARIABLES LIKE "%version%"; in the MySQL command line client or
