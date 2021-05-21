#!/usr/bin/python3


import os
import sys
import subprocess


def clear_print(x) :
    print( x.replace('\n','<br>'))

argument = sys.argv[1]
print("Content-type:text/html\n\n")

print("<div style='width:100%;background-color: black;color:white;'>")
if  argument=="RxConf" :
    adr_conf = '/var/www/html/configurationRX.js'
    with open(adr_conf) as f:
         clear_print( f.read())
         
if  argument=="TxConf" :
    adr_conf = '/var/www/html/configurationTX.js'
    with open(adr_conf) as f:
         clear_print( f.read())

if  argument=="ApacheError" :
    adr_log='/var/log/apache2/error.log'
    with open(adr_log) as g:
        clear_print( g.read())
    
if  argument=="PlutoHelp" :
    import paramiko
    client = paramiko.SSHClient()
    client.load_system_host_keys()

    client.set_missing_host_key_policy(paramiko.WarningPolicy())
    clear_print("Connecting to Pluto...Wait")

    client.connect('192.168.2.1', 22, username='root', password='analog')
    stdin, stdout, stderr = client.exec_command('help')
    for line in stdout:
        clear_print(line)
    client.close()
    clear_print("-------------<br>Done")

    

    
if  argument=="PlutoReboot" :
    import paramiko
    client = paramiko.SSHClient()
    client.load_system_host_keys()

    client.set_missing_host_key_policy(paramiko.WarningPolicy())
    clear_print("Connecting to Pluto...Wait")

    client.connect('192.168.2.1', 22, username='root', password='analog')
    stdin, stdout, stderr = client.exec_command('reboot')
    clear_print('Pluto reboot in progress')
    
if  argument=="RxHistoric" :
    adr_runing_radio = '/var/www/html/PY/remote_runing_rx_radio.txt'
    clear_print("Current Receiver On")
    with open(adr_runing_radio) as f:
         clear_print( f.read())
        
    adr_log='/var/www/html/log/remote_radio.log'
    clear_print("<br>Last parameters received<br>")
    with open(adr_log) as g:
        clear_print( g.read())
        
if  argument=="TxHistoric" :
    adr_runing_radio = '/var/www/html/PY/remote_runing_tx_radio.txt'
    clear_print("Current Transmitter On")
    with open(adr_runing_radio) as f:
         clear_print( f.read())
        
    adr_log='/var/www/html/log/remote_radio.log'
    clear_print("<br>Last parameters received<br>")
    with open(adr_log) as g:
        clear_print( g.read())
        

    
print("</div>")    
 
