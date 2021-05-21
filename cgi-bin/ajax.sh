#!/bin/bash

echo "Content-type:text/html"
echo ""
echo "<div style='width:100%;background-color: black;color:white;'>"

if [ $1 == "USB" ]
	then	
	x=$(lsusb)
fi
if [ $1 == "HackRFinfo" ]
	then	
	x=$(sudo python3 HackRFinfo.py)
fi

if [ $1 == "testpin26" ]
	then	
	x=$(sudo python3 test_pin26.py)
fi

if [ $1 == "RTLSDRinfo" ]
	then	
	x=$(sudo python3 RTLSDRinfo.py)
fi

if [ $1 == "RebootOPI" ]
	then	
	x=$(sudo python3 RebootOPI.py)
fi

echo "${x//$'\n'/<br>}"
echo "</div>"
