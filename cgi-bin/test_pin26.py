#!/usr/bin/python3           address Python 3 environment


import os            # To execute system command
import time         # this lets us have a time delay

numgpio=227                     # OK for Orange Pi One Plus H6 , Pin 26

numgpio=str(numgpio)
print ("Pin 26, numgpio:"+numgpio)


os.system("sudo echo "+numgpio+" > /sys/class/gpio/export")
 					

os.system("sudo echo out > /sys/class/gpio/gpio"+numgpio+"/direction")       


print ("Square signal around 50Hz for 10s")
T0=time.time()+10
while time.time()<T0:
        os.system("echo 0 > /sys/class/gpio/gpio"+numgpio+"/value")
        time.sleep(0.01)
        os.system("echo 1 > /sys/class/gpio/gpio"+numgpio+"/value")
        time.sleep(0.01)


os.system("echo 0 > /sys/class/gpio/gpio"+numgpio+"/value")   # set port/pin value to 0/LOW/False
os.system("sudo echo "+numgpio+" > /sys/class/gpio/unexport") # Clean GPIO
print ("Bye.")
