
# Testing F1ATB Remote SDR

https://github.com/F1ATB/Remote-SDR



Short info for installation:

Raspberry Pi4 

apt-get update

apt-get upgrade


# Install Apache Web Server !

apt install apache2 -y

nano /etc/apache2/sites-available/000-default.conf

change content to:

<VirtualHost *:80>
	
    ServerName localhost

    ServerAdmin webmaster@localhost
    DocumentRoot /var/www/html

    ScriptAlias "/cgi-bin/" "/var/www/html/cgi-bin/"
    <Directory "/var/www/html/cgi-bin/">
                AllowOverride None
                Options +ExecCGI
                AddHandler cgi-script .cgi .pl .py
                Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined		
</VirtualHost>



sudo a2enmod cgid

systemctl restart apache2

then check apache2 

# Install GnuRadio 3.7.13 

sudo apt-get install gnuradio

sudo apt install lxterminal


Add to the configuration file /etc/gnuradio/conf.d/grc.conf in the [grc] section

[grc]

xterm_executable = /usr/bin/lxterminal

ssh -X pi@192.168.8.3

#testen

gnuradio-companion


sudo apt-get install cmake build-essential libusb-1.0-0-dev

sudo apt-get install pkg-config


# rtl sdr (optional) - not tested

We clone Osmocom in the Downloads folder of the root user, for example:

cd ~/Downloads

git clone https://github.com/osmocom/rtl-sdr.git

Go to the rtl-sdr folder and chain the commands: 

cd rtl-sdr

mkdir build

cd build

cmake ../ -DINSTALL_UDEV_RULES=ON -DDETACH_KERNEL_DRIVER=ON

make

make install

ldconfig



# install osmosdr 

sudo apt-get install gr-osmosdr


# hackrf (optional) - not tested

apt install hackrf

hackrf_info

With an RTL-SDR on the USB port, you have information by typing:

rtl_eeprom

or

rtl_eeprom -h



# Install Adalm-Pluto interface

sudo apt-get install gr-iio

sudo apt-get install libiio-utils


optional:

sudo apt-get install gqrx-sdr

sudo apt-get install python3-paramiko

sudo apt install python3-pip

sudo apt-get install python3-setuptools

sudo pip3 install websockets


cd ~/

mkdir app

cd app

git clone https://github.com/oe5nvl/rr2.git

cd rr2

sudo cp -r *  /var/www/html


Attention: 

Use this installation not on internet !!!

SECURITY PEOBLEM !!!

sudo chmod -R 777 /var/html

sudo chmod 777 /var/www/html/*.py

sudo chmod 777 /var/www/html/PY/*.py

sudo chmod 777 /var/www/html/cgi-bin/*.py


sudo chmod 666  /var/www/html/PY/*.txt

sudo chmod 777 /var/www/html/cgi-bin/*.sh

sudo chmod -R 777 /var/log/apache2

sudo chmod 777 /var/www/html/log

sudo crontab -e

@reboot python3 /var/www/html/start_radio_manager_at_boot.py


Chrome Browser:
chrome://flags


Insecure origins treated as secure
Treat given (insecure) origins as secure origins. Multiple origins can be supplied as a comma-separated list. Origins must have their protocol specified e.g. "http://example.com". For the definition of secure contexts, see https://w3c.github.io/webappsec-secure-contexts/ – Mac, Windows, Linux, Chrome OS, Android

https://your raspi ip



# start program

a) reboot

or

b)

cd /var/www/html 

python3 start_radio_manager_at_boot.py















