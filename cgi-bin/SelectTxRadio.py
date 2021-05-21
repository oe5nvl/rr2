#!/usr/bin/python3


import sys
import urllib.parse
import time

print("**tx**********"+sys.argv[1]+"**************************************")

adr_runing_radio = '/var/www/html/PY/remote_runing_tx_radio.txt'
output = sys.argv[1]

output = urllib.parse.unquote(output)

fichier=open(adr_runing_radio,"w")
fichier.write(output)
fichier.close()
print("Content-type:text/html\n\n")
print("TX Radio Selected")

