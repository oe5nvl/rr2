import time
import sys
import os
import subprocess
print(1)
adr_runing_rx_radio = '/var/www/html/PY/remote_runing_rx_radio.txt'
adr_runing_tx_radio = '/var/www/html/PY/remote_runing_tx_radio.txt'

#Redirection message
adr_log='/var/www/html/log/remote_radio.log'
f_log = open(adr_log, 'w')
f_log.write(time.asctime()+" Start of radio manager at boot")  
f_log.close() 
f_log = open(adr_log, 'a')                      
sys.stdout = f_log 
sys.stderr = f_log   

print(2)

# Clear any old process
fo = open(adr_runing_rx_radio, "w")
fo.write("") 
fo.close()
fo = open(adr_runing_tx_radio, "w")
fo.write("") 
fo.close()
print(3)
# copy authorization to apache to access GPIO as root
#os.system("cp /var/www/html/cgi-bin/python_web /etc/sudoers.d/python_web")


in_progress_rx = ""
in_progress_tx = ""
fo_rx = open(adr_runing_rx_radio, "r")
fo_tx = open(adr_runing_tx_radio, "r")
print(4)
while True :
    #RX
    position = fo_rx.seek(0, 0)
    demand_rx = fo_rx.read().strip()

    #print("<"+demand_rx+">")
    #print("-"+in_progress_rx+"+")
    
    if demand_rx != in_progress_rx :
        #print(demand_rx)        
        if in_progress_rx !="" :
            print("radio select empty")
            rx_gnuradio.kill()
            rx_para.terminate()
            rx_audio.terminate()
            rx_spectre.terminate()
            print(time.asctime()+" Terminate RX",in_progress_rx," due to ",demand_rx)
            in_progress_rx = ""
            
        # launch new radio
       
        if demand_rx !="" and demand_rx != "stop":
            print("rx-demand:"+demand_rx)
            print(time.asctime() + " Launch RX: ",demand_rx)
            print("starte radio prozesse")
            rx_audio=subprocess.Popen(["python3","/var/www/html/PY/remote_rx_audio.py"])
            rx_spectre=subprocess.Popen(["python3","/var/www/html/PY/remote_rx_spectre.py"])
            rx_para=subprocess.Popen(["python3","/var/www/html/PY/remote_rx_para.py"])

            if demand_rx=="hack_ssb":
                rx_gnuradio=subprocess.Popen(["python2" , "/var/www/html/PY/hack_rx_ssb_v2.py" ])
            if demand_rx=="hack_nbfm":
                rx_gnuradio=subprocess.Popen(["python2" , "/var/www/html/PY/hack_rx_nbfm_v2.py" ])
            if demand_rx=="hack_wbfm":
                rx_gnuradio=subprocess.Popen(["python2" , "/var/www/html/PY/hack_rx_wbfm_v2.py" ])
            if demand_rx=="hack_am":
                rx_gnuradio=subprocess.Popen(["python2" , "/var/www/html/PY/hack_rx_am_v2.py" ])
            if demand_rx=="pluto_ssbnvl":
                print(1)
                rx_gnuradio=subprocess.Popen(["python2" , "/var/www/html/PY/pluto_rx_ssb_v2.py" ])
            if demand_rx=="pluto_nbfmnvl":
                rx_gnuradio=subprocess.Popen(["python2" , "/var/www/html/PY/pluto_rx_nbfm_v2.py" ])
            if demand_rx=="pluto_wbfmnvl":
                rx_gnuradio=subprocess.Popen(["python2" , "/var/www/html/PY/pluto_rx_wbfm_v2.py" ])
            if demand_rx=="pluto_amnvl":
                rx_gnuradio=subprocess.Popen(["python2" , "/var/www/html/PY/pluto_rx_am_v2.py" ])
            
            in_progress_rx = demand_rx
            print("Start RX ",in_progress_rx)
            
    #TX
    position = fo_tx.seek(0, 0)
    demand_tx = fo_tx.read().strip()
    if demand_tx != in_progress_tx :
       
        if in_progress_tx !="" :
            tx_gnuradio.kill()
            tx_para.terminate()
            tx_audio.kill()
            print(time.asctime() + " Terminate TX",in_progress_tx," due to ",demand_tx)
            in_progress_tx = ""
        
        # launch new radio
        if demand_tx !="" and demand_tx != "stop":
            print("Init TX Audio and ocillator pin 26")
           # tx_audio=subprocess.Popen(["sudo","python3","/var/www/html/PY/remote_tx_audio.py"]) #sudo to have access to GPIO from apache
            tx_audio=subprocess.Popen(["python3","/var/www/html/PY/remote_tx_audio.py"]) #sudo to have access to GPIO from apache nvl
            print("Init TX parameter reception")
            tx_para=subprocess.Popen(["python3","/var/www/html/PY/remote_tx_para.py"])  
            print("Init Tx Radio",demand_tx)          
            if demand_tx=="hack_ssb":
                tx_gnuradio=subprocess.Popen(["python2" , "/var/www/html/PY/hack_tx_ssb_v2.py"])
            if demand_tx=="hack_nbfm":
                tx_gnuradio=subprocess.Popen(["python2" , "/var/www/html/PY/hack_tx_nbfm_v2.py"])
            if demand_tx=="pluto_ssbnvl":
                tx_gnuradio=subprocess.Popen(["python2" , "/var/www/html/PY/pluto_tx_ssb_v2.py"])
            if demand_tx=="pluto_nbfmnvl":
                tx_gnuradio=subprocess.Popen(["python2" , "/var/www/html/PY/pluto_tx_nbfm_v2.py"])
               
            
            in_progress_tx = demand_tx
            print(time.asctime() + " Start TX",in_progress_tx)
            
            
    f_log.flush();
    
            
    if int(os.stat(adr_log).st_size)> 10000 :    
            f_log2 = open(adr_log, 'w')
            f_log2.write(time.asctime()+" Clear log too long remote_rx_para") 
            f_log2.close() 
            
    time.sleep(0.1)   
    


