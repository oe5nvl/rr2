#!/usr/bin/python3           # This is client.py file


import time
import asyncio
import websockets
import json
import xmlrpc.client
import os
import sys






# get local machine name
host = 'localhost'                           

port_para_Web = 8003
adr_local = "http://localhost:9003"

Sxml = xmlrpc.client.ServerProxy(adr_local)



                             
print("Bridge to pass RX parameters from client WEB to OPI")



async def consumer_handler(websocket_p, path):
    async for message_recu in websocket_p:
        F=json.loads(message_recu)
        
            
        if "F_Fine" in F :
              print(time.asctime(),"F_Fine ",F["F_Fine"])
              Sxml.set_F_Fine(float(F["F_Fine"]))
              
        if "FrRX" in F :
              print(time.asctime(),"FrRX ",F["FrRX"])
              Sxml.set_FrRX(float(F["FrRX"]))
              
        if "decim_LP" in F :
              print(time.asctime(),"decim_LP ",F["decim_LP"])
              Sxml.set_decim_LP(float(F["decim_LP"]))
              
        if "LSB_USB" in F :
              print(time.asctime(),"LSB USB ",F["LSB_USB"])
              Sxml.set_LSB_USB(float(F["LSB_USB"]))
              
        if "Gain_RF" in F :
              print(time.asctime(),"Gain_RF ",F["Gain_RF"])
              Sxml.set_Gain_RF(float(F["Gain_RF"]))
              
        if "Gain_IF" in F :
              print(time.asctime(),"Gain_IF ",F["Gain_IF"])
              Sxml.set_Gain_IF(float(F["Gain_IF"]))
              
        if "Gain_BB" in F :
              print(time.asctime(),"Gain_BB ",F["Gain_BB"])
              Sxml.set_Gain_BB(float(F["Gain_BB"]))
              
        if "Larg_Fil" in F :
              print(time.asctime(),"Larg_Fil ",F["Larg_Fil"])
              Sxml.set_Largeur_filtre(float(F["Larg_Fil"]))
        
        if "Squelch" in F :
              print(time.asctime(),"Squelch ",F["Squelch"])
              Sxml.set_Squelch(float(F["Squelch"]))
                  
        
        
        
       
            
        
        
        await websocket_p.send("OK")
              
            
  

        

start_server_para = websockets.serve(consumer_handler, "", port_para_Web)

loop = asyncio.get_event_loop()

try:
    loop.run_until_complete(start_server_para)
   
    loop.run_forever()
   
    
    
    
except KeyboardInterrupt:
    print(time.asctime(),"Keyboard Interrupt")
finally:
    loop.close()
    print(time.asctime(),"Stop Para RX service.")
    
