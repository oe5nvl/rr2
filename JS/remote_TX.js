				
// Variables Audio
//****************

var audioTX={Ctx:null,mic_stream:null,node_gain:null,node_proces_sortie:null,node_proces_analyse:null,node_analyseur:null,node_filtre:null,BufferSize:256,VolTx:1,cptFFT:0,osc1:null,osc2:null,Source:0,Transmit:false,RC_Amp:1};
var audioParaTX={Compresse:1};

 //Variables emetteur
 var SDR_TX={Freq:144300000,GainRF:50,GainIF:50,GainBB:40,Offset:0,Bande:0,Fmin:0,Fmax:0,Decal_RX:0,IP:"",relay_auto:false};
 var tx_python_gnuradio_script="";
 var recal_auto_relay=-1;
 var timer_auto_relay=0;
 var ID_TX_Interval=null;

// Variables websockets
var websocket={audioTX:null,paraTX:null,audioTXpret:false,tSortie_Audio:0,deb_moyen:0,paraTXpret:false};

//Sinus table for CTCSS signal
var CTCSS = {int_sinus:new Int16Array(1024),deltaPhase:0,phase:0};

for (var i=0;i<1024;i++){
	CTCSS.int_sinus[i]=Math.floor(4800*Math.sin(Math.PI*i/512)+0.5); //4800 =15% modulation level
}



$("#start-audioTX").click ( function() {
	if(websocket.paraTXpret) {
			 if(!websocket.audioTXpret && SDR_TX.IP.length>3) { //Initialisation echanges et contexte audio
				if (audioTX.Ctx == null) Lance_audioTX();
				Lance_websocket_audioTX();	
			 }
			 audioTX.Transmit=!audioTX.Transmit;
			 SDR_RX.mode = $("input[name='mode']:checked").val();
			 if (SDR_RX.mode==2 || SDR_RX.mode==4) audioTX.Transmit=false; //Pas d'emission en AM ou WBFM
			 if (audioTX.Transmit){
				 var M=SDR_RX.mode; //0 ou 1
				if(SDR_RX.mode==0) M=-1	; //Mode TX = Mode RX
				//The TX needs -1 or 1 for LSB / USB
				if (SDR_RX.mode<2 ) websocket.paraTX.send( '{"LSB_USB":"' + M+'"}'); //-1 ou +1
				 $("#start-audioTX").html("TX Audio On");
				 $("#start-audioTX").removeClass('bt_off').addClass('bt_on');
				 freq_TX();
			 } else {
				 $("#start-audioTX").html("TX Audio Off");
				 $("#start-audioTX").removeClass('bt_on').addClass('bt_off');
			 }
			 
			 GainIF_TX(); //Pour activer ou arreter la puissance
	} 
})

//Les Websockets
//***************
function Lance_websocket_audioTX(){
	//Initialisation du websocket_audio
	// serveur de test public
	var adresse="ws://"+SDR_TX.IP+":"+(parseInt(Port_socket)+4).toString()+"/"; // Basic port number +4 for TX audio
	websocket.audioTX = new WebSocket(adresse);

	$("#TX_audi_set").css("background-color","LightGreen");

	// code à déclencher quand le connexion est ouverte
	websocket.audioTX.onopen = function(evt) {
	   $("#TX_audi_con").css("background-color","LightGreen"); //Audio connected
	  
	 websocket.audioTXpret=true;
	    
	};

	// code à déclencher si le serveur nous envoie spontanément
	// un message
	websocket.audioTX.onmessage = function(evt) {
		// le serveur envoi des messages. On attend rien.
		//('Le serveur TX envoie (' + evt.data + ')');
		
	  
	};

	// en cas d'erreur
	websocket.audioTX.onerror = function(evt){
	  console.log(evt);
	};
  
	
}



function Lance_websocket_paraTX(){
	//Initialisation du websocket_spectre
	// serveur de test public
	console.log("Lance_websocket_paraTX");
	Watch_dog.TXpara=0;
	var adresse="ws://"+SDR_TX.IP+":"+(parseInt(Port_socket)+3).toString()+"/"; //Basic Port number +3 for the parameters
	websocket.paraTX = new WebSocket(adresse);

	$("#TX_para_set").css("background-color","LightGreen");
    $("#TXonLed").css("background-color","Red");
	// code à déclencher quand le connexion est ouverte
	websocket.paraTX.onopen = function(evt) {
	  $("#TX_para_con").css("background-color","LightGreen");
	  $("#TXonLed").css("background-color","Orange"); 
	  websocket.paraTXpret=true;
	  console.log("websocket.paraTXpret=true")
	  //setTimeout("init_para_sdrTX();", 500)
	  ID_TX_Interval=setInterval("freq_TX();",5100); //Refresh . On ne peut pas envoyer immediatement derirre l'ouverture du websocket
	};

	// code à déclencher si le serveur nous envoie spontanément
	// un message
	websocket.paraTX.onmessage = function(evt) {
		// le serveur envoi des messages
		//write('Le serveur envoie (' + evt.data + ')');
		
		$("#TXonLed").css("background-color","LightGreen");
	    Watch_dog.TXpara=0;	  
	};

	// en cas d'erreur
	websocket.paraTX.onerror = function(evt){
	  console.log(evt);
	};
  
	
}

function init_para_sdrTX(){	
    console.log("init_paratx"); 
	Mode_TX(); 
	freq_TX();	 
	GainRF_TX();
	GainIF_TX();
	GainBB_TX();
}

//Traitement Audio du Microphone
function  Lance_audioTX(){
	sauvegarde_parametresTX();	
	audioTX.Ctx = new AudioContext({sampleRate:10000}); // On force 10kHz pour le micro
	if (!navigator.getUserMedia)
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia || navigator.msGetUserMedia;

    if (navigator.getUserMedia){
		//On se connecte à l'audio input par defaut, le micro
        navigator.getUserMedia({audio:true}, 
            function(stream) {
                start_microphone(stream);
            },
            function(e) {
                alert('Error capturing audio.May be no microphone connected');
            }
            );

    } else { 
		alert('getUserMedia not supported in this browser or access to a non secure server(not https)');
	}
}

function start_microphone(stream){
		
		//Flux du micro
		audioTX.mic_stream = audioTX.Ctx.createMediaStreamSource(stream);
		
		//Flux Oscillateurs
		audioTX.osc1=audioTX.Ctx.createOscillator();
		audioTX.osc2=audioTX.Ctx.createOscillator();
		audioTX.osc1.start();
		audioTX.osc2.start();
		
		//Creation des Nodes de traitement
        audioTX.node_gain = audioTX.Ctx.createGain();      
        audioTX.node_proces_sortie = audioTX.Ctx.createScriptProcessor(audioTX.BufferSize, 1, 1);      
		audioTX.node_filtre = audioTX.Ctx.createBiquadFilter();
		audioTX.node_filtre.type = "lowpass";
		audioTX.node_filtre.frequency.value=3500; //Fc de 3500Hz
		audioTX.node_analyseur = audioTX.Ctx.createAnalyser();
        audioTX.node_analyseur.smoothingTimeConstant = 0.9;
        audioTX.node_analyseur.fftSize = audioFFT;

		//Connection des Nodes entre eux. 
		choix_Source();
		audioTX.node_gain.connect(audioTX.node_filtre );
		audioTX.node_filtre.connect( audioTX.node_proces_sortie );
		audioTX.node_proces_sortie.connect(audioTX.Ctx.destination); //Permet de s'ecouter
		audioTX.node_filtre.connect( audioTX.node_analyseur );
		
		
		//Analyseur de spectre
		var buffer_length = audioTX.node_analyseur.frequencyBinCount;
        var array_freq_domain = new Uint8Array(buffer_length);
        var array_time_domain = new Uint8Array(buffer_length);

  
		//Taitement quand Buffer sortie vers TX plein		   
		audioTX.node_proces_sortie.onaudioprocess = function(audioProcessingEvent){
				    var inputBuffer = audioProcessingEvent.inputBuffer;

				    // The output buffer contains the samples that will be modified and played
				    var outputBuffer = audioProcessingEvent.outputBuffer;
				
				
				  
				    var channel = 0; 
					var inputData = inputBuffer.getChannelData(channel);
					var outputData = outputBuffer.getChannelData(channel);
					
					var OutBuffer = new ArrayBuffer(inputBuffer.length*2);
					var OutData = new Int16Array(OutBuffer);
                    
					// Loop through the  samples to look for Maximum and conversion in integer values to be transmitted
					for (var sample = 0; sample < inputBuffer.length; sample++) {					  
						var Level_=inputData[sample];
						var Amp_max=Math.max(Math.abs(Level_),0.1);		//On corrige si supérieur à -20dB			     
						if (audioParaTX.Compresse==1) { //Audio Compressée
							audioTX.RC_Amp=0.005*Amp_max+0.995*audioTX.RC_Amp; //Moyenne sur amplitude max
							audioTX.RC_Amp=Math.max(audioTX.RC_Amp,Amp_max);
						} else if (audioParaTX.Compresse==2) {
							audioTX.RC_Amp=0.02*Amp_max+0.98*audioTX.RC_Amp; //Moyenne sur amplitude max
							audioTX.RC_Amp=Math.max(audioTX.RC_Amp,Amp_max);
						} else { // Volume Manuel
							audioTX.RC_Amp=1;
						}
					
					// Loop through the  samples to convert in integer with amplitude adjusted
						if (CTCSS.deltaPhase==0) { // No CTCSS
							OutData[sample]=Math.floor(29000*Level_/audioTX.RC_Amp); //Données audio à envoyer sur 16 bits . Marge de 1dB si pas trouvé max
						} else {
						  
							CTCSS.phase = ( CTCSS.phase+CTCSS.deltaPhase)%1024;
							OutData[sample]=Math.floor(24650*Level_/audioTX.RC_Amp)+CTCSS.int_sinus[Math.floor(CTCSS.phase)]; //Audio + CTCSS
						}
						if ($("#Audio_TX_HP").prop("checked")) { //Pour s'ecouter en local
						  outputData[sample] = OutData[sample]/32768; //Données cadrées +1,-1
						} else {
						  outputData[sample]=0; //On ecoute pas en local
						}
					}
					
					 if (websocket.audioTXpret && audioTX.Transmit) websocket.audioTX.send(OutData); //L'arret d'envoi des données coupe la puissance de l'emetteur
					 
					 //Trace Amplitude et FFT Audio 
					 audioTX.cptFFT=(audioTX.cptFFT+1)%3;				
					if (audioTX.cptFFT==0){ //On ne trace pas toutes les FFT
						audioTX.node_analyseur.getByteFrequencyData(array_freq_domain);
						audioTX.node_analyseur.getByteTimeDomainData(array_time_domain);
						couleur='white';
						if (Amp_max/audioTX.RC_Amp>0.2) couleur='Aqua'; 
						if (Amp_max/audioTX.RC_Amp>0.7) couleur='orange'; 
						if (Amp_max/audioTX.RC_Amp>0.98) couleur='red'; // saturation
						Dessine_TableauTX("canvasT",array_time_domain,0,0,couleur,audioTX.RC_Amp);
						Dessine_TableauTX("canvasF",array_freq_domain,inputBuffer.sampleRate,4000,couleur,1);
					}
				 
				
				var t=Date.now();
				var dt=Math.floor(inputBuffer.length*1000/(t-websocket.tSortie_Audio));
				websocket.tSortie_Audio=t;
				websocket.deb_moyen=0.01*dt+0.99*websocket.deb_moyen;
				
		}			   
      
 }
function choix_Source(){
	if (audioTX.mic_stream!=null){
		audioTX.Source = $("input[name='Source']:checked").val();
		if (audioTX.Source==0) {  //Micro
			audioTX.mic_stream.connect(audioTX.node_gain);
		} else {
			audioTX.mic_stream.disconnect();
		}
		if (audioTX.Source>0) {   //1 Sinus
			audioTX.osc1.connect(audioTX.node_gain);
			audioTX.osc1.frequency.value=800;
		} else {
			audioTX.osc1.disconnect();
		}
		if (audioTX.Source==2) {  //2 Sinus
			audioTX.osc2.connect(audioTX.node_gain);
			audioTX.osc2.frequency.value=1900;
			audioTX.osc1.frequency.value=500;
		} else {
			audioTX.osc2.disconnect();
		}
		audioTX.node_gain.gain.value=audioTX.VolTx/Math.max(1,audioTX.Source); //Divise par 2 si 2 tone test
	}
}
function choixBandeTX(){	//Suivant freq TX defini les limites
	for (var i=0;i<BandesTX.length;i++){
		if (BandesTX[i][0]<=SDR_TX.Freq && BandesTX[i][1]>=SDR_TX.Freq) {
			SDR_TX.Bande=i;
			SDR_TX.Fmin=BandesTX[i][0];
			SDR_TX.Fmax=BandesTX[i][1];
			SDR_TX.Decal_RX=BandesTX[i][3];
		}
	}
	Trace_EchelleTX();
    ListRelay();	
}
function newBandTX(t){
	SDR_TX.Freq=Math.floor((BandesTX[t.value][0]+BandesTX[t.value][1])/2);
	choixBandeTX();
	$("#slider_Fr_TX").slider("option", "min",  SDR_TX.Fmin);
	$("#slider_Fr_TX").slider("option", "max", SDR_TX.Fmax);
	$("#slider_Fr_TX").slider("option", "value",  SDR_TX.Freq);
	Affich_freq_champs(SDR_TX.Freq,"#FRT");
	Affich_freq_champs(SDR_TX.Offset,"#OFT");//************************************************
	freq_TX();
}
	


// PARAMETRES A PASSER AU SDR
//***************************
function freq_TX() {
	SDR_TX.Freq=Math.floor(SDR_TX.Freq);	
	if (SDR_TX.Freq>SDR_TX.Fmin && SDR_TX.Freq<SDR_TX.Fmax){ //Frequence autorisée 
		var Fcorrige=SDR_TX.Freq+SDR_TX.Offset;
		if (websocket.paraTXpret) {
			websocket.paraTX.send( '{"Fr_TX":"' + Fcorrige+'"}'); //Frequence du SDR corrigé de l'erreur du TCXO eventuelle
			$("#TXonLed").css("background-color","Blue");
		}
		$("#val_Fr_TX").css("background-color","#555");
	} else {
		$("#val_Fr_TX").css("background-color","#F00");
	}
	Affich_Curs_TX();
	if (ZoomFreq.id=="FRT") Affich_freq_champs(SDR_TX.Freq,"#ZFr"); //Zoom display	
	sauvegarde_parametresTX();	
}


function  GainRF_TX(){
		if (websocket.paraTXpret) websocket.paraTX.send( '{"GRF_TX":"' + SDR_TX.GainRF+'"}'); //Gain RF
}
function  GainIF_TX(){
	if (audioTX.Transmit){
		if (websocket.paraTXpret) websocket.paraTX.send( '{"GIF_TX":"' + SDR_TX.GainIF+'"}'); //Gain IF
	}else{
		if (websocket.paraTXpret) websocket.paraTX.send( '{"GIF_TX":"0"}'); //Gain IF a zero pour stopper puissance
	}
}
function  GainBB_TX(){
		if (websocket.paraTXpret) websocket.paraTX.send( '{"GBB_TX":"' + SDR_TX.GainBB+'"}'); //Gain RF
}
function  Mode_TX(){
	console.log("Mode TX",websocket.paraTXpret);
	choix_modulation_TX();
	
}
function choix_modulation_TX(){ //MODE 
	SDR_RX.mode = $("input[name='mode']:checked").val();
	var choix_python_script="stop";
	if (SDR_RX.mode<2 && SDR_RX.sdr=="hackrf") choix_python_script="hack_ssb";
	if (SDR_RX.mode==3  && SDR_RX.sdr=="hackrf") choix_python_script="hack_nbfm";
	if (SDR_RX.mode<2 && SDR_RX.sdr=="pluto") choix_python_script="pluto_ssbnvl";
	if (SDR_RX.mode==3  && SDR_RX.sdr=="pluto") choix_python_script="pluto_nbfmnvl";
	if (choix_python_script!=tx_python_gnuradio_script &&  SDR_TX.IP.length>3) {			
		audioTX.Transmit=false; //Pas d'emission 
		$("#start-audioTX").html("TX AudioOff");
		$("#start-audioTX").removeClass('bt_on').addClass('bt_off');
		if (websocket.audioTXpret) {websocket.audioTX.close();websocket.audioTXpret=false;}	
       		
		if (websocket.paraTXpret) {websocket.paraTX.close();websocket.paraTXpret=false;console.log("Arret envoi para TX");}
		if (ID_TX_Interval != null) clearInterval(ID_TX_Interval);
		tx_python_gnuradio_script=choix_python_script;
		setTimeout("choix_new_modulation_TX();", 140); //Pour laisser le temps arret radio en cours
			
		
	}
}
var sauve_para_RX;
function choix_new_modulation_TX(){	
					sauve_para_RX=web_socket.para_on;
					web_socket.para_on=false; //To stop exchange with RX when TX is loaded
					var adresse="http://"+SDR_TX.IP+"/cgi-bin/SelectTxRadio.py"
					console.log("Modulation TX "+tx_python_gnuradio_script);
					var fct="setTimeout('TX_Sockets_launcher();', 400);";
					var adresse="http://"+SDR_TX.IP+"/cgi-bin/SelectTxRadio.py"
					var loader='<iframe src="' + adresse + '?' + tx_python_gnuradio_script + '" onload="' + fct +'"></iframe>'
					$("#TX_loader").html(loader);
}			
function TX_Sockets_launcher() {
		if (sauve_para_RX) web_socket.para_on=sauve_para_RX;
		if (tx_python_gnuradio_script != "stop"){ //Pas d'emission en WBFM et AM
			setTimeout("Lance_websocket_paraTX();", 500);
			setTimeout("init_para_sdrTX();", 1000);
		} else {
			$("#TXonLed").css("background-color","Grey");
		}

}	
	
//RESIZE
//**********

function window_resize_TX(){
	var W=$("#echelleTX").innerWidth();
	var H=$("#echelleTX").innerHeight();
	$("#echelleTX").html('<canvas id="myEchelleTX" width="'+W+'" height="'+H+'" ></canvas><div id="curseurTX"></div>');
	Trace_EchelleTX();
	Affich_freq_champs(SDR_TX.Freq,"#FRT");
	
	var W=$("#visus_TX").innerWidth()/2;
	var H=$("#visus_TX").innerHeight();
	$("#visus_TXt").html('<canvas id="canvasT" width="'+W+'" height="'+H+'" ></canvas>');
	$("#visus_TXf").html('<canvas id="canvasF" width="'+W+'" height="'+H+'" ></canvas>');
	Affich_Curs_TX();
}
function Init_Page_TX(){				
	window_resize_TX();
	recupere_ancien_parametresTX();
	choixBandeTX();
	Init_Sliders_TX();
	
	Init_champs_freq("FRT","#val_Fr_TX");
	Init_champs_freq("OFT","#val_Of_TX");
	
	Affich_freq_champs(SDR_TX.Freq,"#FRT");
	Affich_freq_champs(SDR_TX.Offset,"#OFT");
	for (var i=1;i<13;i++){
		$('#FRT'+i).on('mousewheel', function(event){ Mouse_Freq_TX(event)});
		$('#OFT'+i).on('mousewheel', function(event){ Mouse_deltaOffsetTX(event)});
		$('#FRT'+i).on('click', function(event){ OpenZoomFreq(event)}); //see remote_sdr.js
		$('#OFT'+i).on('click', function(event){ OpenZoomFreq(event)});
	}
	
	var S='<label for="bandSelect">Select frequency band:</label>';
	S+='<select name="bandSelect" id="bandSelect" onchange="newBandTX(this);">';
	for (var i=0;i<BandesTX.length;i++){
		S+='<option value='+i+'>'+BandesTX[i][2]+'</option>';
	}
	S+='</select>';
	$("#BandeTX").html(S);
	$("#BandeTX option[value='"+SDR_TX.Bande+"']").prop('selected', true);
	
	
	Affich_Curs_TX();
	ValideIP();
	if (  SDR_TX.IP.length>3){
			var adresse="http://"+SDR_TX.IP+"/cgi-bin/SelectTxRadio.py"
			var loader='<iframe src="' + adresse + '?stop" ></iframe>'
			console.log("nvl-tx:"+loader);
			$("#TX_loader").html(loader);		
	}
}
function ListRelay(){
	//Relays list
	var S='<label for="relay">Relays:</label>';
	S+='<select name="relay" id="relay" onchange="ForceRelay(this.value);" onclick="ForceRelay(this.value);">';
	for (var i=0;i<RelayTX.length;i++){
		if (SDR_RX.BandeRXmin<=RelayTX[i][0] && SDR_RX.BandeRXmax>=RelayTX[i][0] && SDR_TX.Fmin <=RelayTX[i][0] && SDR_TX.Fmax >=RelayTX[i][0]) {
			RelayTX[i][4]=true;//on valide ce relais
			S+='<option value='+i+'>'+RelayTX[i][3]+'</option>';
		} else {
			RelayTX[i][4]=false;
		}
	}
	S+='<option value='+RelayTX.length+' selected></option>';
	S+='</select>';
	$("#Relays").html(S);
}
function ForceRelay(v){
	var S="";
	$("#Relays_info").css("display","none");
	if(v<RelayTX.length){
		S="<div>Frequency: "+RelayTX[v][0]+" Hz</div>";
		S+="<div>TX Shift: "+RelayTX[v][1]+" Hz</div>";
		CTCSS.deltaPhase=0;
		if(RelayTX[v][2]>0){ 
			S+="<div>CTCSS: "+RelayTX[v][2]+" Hz</div>";
			CTCSS.deltaPhase=1024*RelayTX[v][2]/10000; // Table length/ sampling frequency
		}
		$("#Relays_info").css("display","block");
		var deltaF=RelayTX[v][0]-SDR_RX.Audio_RX
		Recal_fine_centrale(deltaF);
		SDR_TX.Freq=RelayTX[v][0]+RelayTX[v][1];
		freq_TX();
		Affich_Curs_TX();
		Affich_freq_champs(SDR_TX.Freq,"#FRT");
		$("#slider_Fr_TX").slider('value',SDR_TX.Freq);
	}
	$("#Relays_info").html(S);
	timer_info=2;
}
function AutoRelay(t){
	SDR_TX.relay_auto=$("#relay_auto").prop("checked");
}
function Test_si_relais_TX(){
	if(SDR_TX.relay_auto){
		var its_a_relay=-1;
		for (var i=0;i<RelayTX.length;i++){
			if(RelayTX[i][4]) { //Relays in the band
				if(Math.abs(RelayTX[i][0]-SDR_RX.Audio_RX)<2000) {					
					if (recal_auto_relay!=i) 	{
						ForceRelay(i); //To force freq only once.
						$("#Relays_info").css("display","none");
						$("#relay").val(i);
					}
					its_a_relay=i;
				}
			}
		}
		if (its_a_relay==-1 && recal_auto_relay>=0) {
			$("#relay").val(RelayTX.length); //We leave the relay
			CTCSS.deltaPhase=0;
		}
		recal_auto_relay=its_a_relay;	
	}
}

function Mouse_Freq_TX(ev){ //modif des digits
	var p=parseInt(ev.target.id.substr(3))-1;
	var deltaF=ev.deltaY*Math.pow(10,p);
	Recal_FTX(deltaF);
}
function Recal_FTX(deltaF){
	SDR_TX.Freq=SDR_TX.Freq+deltaF;
	Affich_freq_champs(SDR_TX.Freq,"#FRT");
	freq_TX();
	Affich_Curs_TX();
}
function Mouse_deltaOffsetTX(ev){
	var p=parseInt(ev.target.id.substr(3))-1;
	var deltaF=ev.deltaY*Math.pow(10,p);
	Recal_OFT(deltaF);
}
function Recal_OFT(deltaF){
	SDR_TX.Offset=SDR_TX.Offset+deltaF;
	Affich_freq_champs(SDR_TX.Offset,"#OFT");
	if (ZoomFreq.id=="OFT") Affich_freq_champs(SDR_TX.Offset,"#ZFr"); //Zoom display	
	freq_TX();
	Affich_Curs_TX();
}

// CI DESSOUS FAIRE LES TESTS BANDE RX ET TX COHERENT ET TX ON
function txvrx(){ //Frequence TX envoyé au RX
	SDR_RX.fine=SDR_TX.Freq-SDR_TX.Decal_RX -SDR_RX.centrale_RX;	
	choix_freq_fine();
	Affiche_Curseur();
}
function rxvtx(){
	SDR_TX.Freq=SDR_RX.fine+SDR_TX.Decal_RX +SDR_RX.centrale_RX;
	freq_TX();
	Affich_Curs_TX();
	Affich_freq_champs(SDR_TX.Freq,"#FRT");
	$("#slider_Fr_TX").slider('value',SDR_TX.Freq);
}
//AFFICHAGES
function Affich_Curs_TX(){	
	var W=$("#echelleTX").innerWidth();
	var X=(SDR_TX.Freq-SDR_TX.Fmin)*W/(SDR_TX.Fmax-SDR_TX.Fmin);
	$("#curseurTX").css("left",X);
	//Curseur TX dans la zone RX
	var F=SDR_TX.Freq-SDR_TX.Decal_RX -SDR_RX.centrale_RX;
	var p=ecran.innerW*(0.5+F/(SDR_RX.bande))+ecran.border;
	$("#Curseur_TX").css("left",p);
}


//TRACE DES CANVAS
function Trace_EchelleTX(){
	var canvasEchelle = document.getElementById("myEchelleTX");
	var ctxE = canvasEchelle.getContext("2d");

	var W=$("#echelleTX").innerWidth();
	var H=$("#echelleTX").innerHeight();
	var band=SDR_TX.Fmax-SDR_TX.Fmin
	ctxE.beginPath();
	ctxE.strokeStyle = "#FFFFFF";
	ctxE.fillStyle = "#FFFFFF";
	ctxE.lineWidth = 1;
	ctxE.clearRect(0, 0,W,H);	
	ctxE.font = "9px Arial";
    
	var dF=100000;
	if (band>500000) dF=500000;
	for (var f=SDR_TX.Fmin;f<=SDR_TX.Fmax;f=f+50000){
		var Fint=50000*Math.floor(f/50000);
		var X=(Fint-SDR_TX.Fmin)*W/band;
		ctxE.moveTo(X,0);
		var Y=4;
		var Fintk=Fint/1000;
		if (Fint%dF==0) {
			ctxE.fillText(Fintk, X-ctxE.measureText(Fintk).width/2, 14);
			Y=6
		}
		ctxE.lineTo(X,Y); //traits		
	}
	ctxE.stroke(); // Fin graduations
	
	//Ecriture Labels
	ctxE.beginPath();
	ctxE.font = "8px Arial";
	ctxE.strokeStyle = "#AAF";
	ctxE.fillStyle = "#AAF";
	for (var i=0;i<LabelTX.length;i++){
		if (LabelTX[i][0]>=SDR_TX.Fmin && LabelTX[i][0]<=SDR_TX.Fmax){
			var X=(LabelTX[i][0]-SDR_TX.Fmin)*W/band;
			ctxE.moveTo(X,17);
			ctxE.fillText(LabelTX[i][1], X+5, 22);			
			ctxE.lineTo(X,23); //traits
			
		}
	}
	ctxE.stroke(); // Fin labels
	
	//Ecriture bande en couleur
	ctxE.lineWidth = 2;
	for (var i=0;i<ZoneTX.length;i++){
		if ( (ZoneTX[i][0]>=SDR_TX.Fmin && ZoneTX[i][0]<=SDR_TX.Fmax) || (ZoneTX[i][1]>=SDR_TX.Fmin && ZoneTX[i][1]<=SDR_TX.Fmax)){
			ctxE.beginPath();
			ctxE.strokeStyle = ZoneTX[i][2];
			var X0=(ZoneTX[i][0]-SDR_TX.Fmin)*W/band;
			var X1=(ZoneTX[i][1]-SDR_TX.Fmin)*W/band;
			ctxE.moveTo(X0,0);			
			ctxE.lineTo(X1,0); //traits
			ctxE.stroke();
		}
	}
	
	
}
function Dessine_TableauTX(canvas_ID,tableau,SR,Fmax,couleur,Coef_Ampli) { // dessine une onde (tableau de bytes) dans le canvas
	var canvas = document.getElementById(canvas_ID);
	var ctx = canvas.getContext("2d");
	var Largeur = canvas.width;
	var Hauteur = canvas.height;
	ctx.clearRect(0, 0, Largeur, Hauteur);
     
    ctx.fillStyle = '#000030'; 
    ctx.fillRect(0, 0, Largeur, Hauteur);

    ctx.lineWidth = 1;
    ctx.strokeStyle = couleur;
	ctx.fillStyle = 'white';
    ctx.beginPath();
    var longT=tableau.length;
	if (Fmax>0) { // C'est une FFT. On limite l'axe des F
		longT=Math.floor(longT*2*Fmax/SR);
		var FMX=Fmax/1000;
		for(var f = 0; f < FMX; f++) {
		   var x = Largeur*f/FMX;
		  ctx.moveTo(x, Hauteur);
		  ctx.lineTo(x, 0.95*Hauteur);
		  ctx.fillText(f+"kHz", x, 0.95*Hauteur);
		}
		
	} else { //time domain
		longT=Math.floor(longT/10) ; //moitie du tableau pour dilater axe dex x
	}
  var sliceWidth = Largeur / longT;
  var x = 0;

      for(var i = 0; i < longT; i++) {

        var v = (tableau[i] -128)/ (128*Coef_Ampli);
        var y = -1+Hauteur/2*(1-v );

        if(i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }
	  
	  
      ctx.stroke();
    };

// DTMF
function dtmf_d(x){
	if (audioTX.mic_stream!=null){
		audioTX.Source = $("input[name='Source']:checked").val();
		audioTX.mic_stream.disconnect();
		audioTX.osc1.connect(audioTX.node_gain);
		audioTX.osc2.connect(audioTX.node_gain);		
		audioTX.node_gain.gain.value=audioTX.VolTx/2; //Divise par 2 car 2 tones 
		var Fc=1209;
		if (x=="2" || x=="5" || x=="8" || x=="0" ) Fc=1336; //Hz
		if (x=="3" || x=="6" || x=="9" || x=="#" ) Fc=1477; //Hz
		if (x=="A" || x=="B" || x=="C" || x=="D" ) Fc=1633; //Hz
		var Fl=697;
		if (x=="4" || x=="5" || x=="6" || x=="B" ) Fl=770; //Hz
		if (x=="7" || x=="8" || x=="9" || x=="C" ) Fl=852; //Hz
		if (x=="*" || x=="0" || x=="#" || x=="D" ) Fl=941; //Hz
		audioTX.osc2.frequency.value=Fc;
		audioTX.osc1.frequency.value=Fl;
	}
}
function dtmf_u(){
	choix_Source();
}

function Init_Sliders_TX(){
		$( function() {
			$( "#slider_Vol_TX" ).slider({
			  value:20* Math.log(audioTX.VolTx)/Math.LN10,
			  min: -30,
			  max: 10,
			  step: 1,
			  slide: function( event, ui ) {
				 audioTX.VolTx=Math.pow(10,ui.value/20)  ; //dB
				 choix_Source();
				 $("#val_Vol_TX").html(ui.value+" dB");
			  }
			});
		  } );
		   $("#val_Vol_TX").html(20* Math.log(audioTX.VolTx)/Math.LN10+" dB");
		  
		  $( function() {
			$( "#slider_Fr_TX" ).slider({
			  value:SDR_TX.Freq,
			  min: SDR_TX.Fmin,
			  max: SDR_TX.Fmax,
			  step: 10,
			  slide: function( event, ui ) {
				 SDR_TX.Freq=ui.value;			 
				 Affich_freq_champs(SDR_TX.Freq,"#FRT");
				 freq_TX();
				 sauvegarde_parametresTX();
			  }
			});
		  } );
		  
		  
		  $( function() {
			$( "#slider_GRF_TX" ).slider({
			  value:SDR_TX.GainRF,
			  min: 0,
			  max: 150,
			  step: 1,
			  slide: function( event, ui ) {
				 SDR_TX.GainRF=ui.value;
				 $("#val_GRF_TX").html(ui.value);
				 GainRF_TX();
				 sauvegarde_parametresTX();
			  }
			});
		  } );
		  $("#val_GRF_TX").html(SDR_TX.GainRF);
		  
		   $( function() {
			$( "#slider_GIF_TX" ).slider({
			  value:SDR_TX.GainIF,
			  min: 0,
			  max: 450,
			  step: 1,
			  slide: function( event, ui ) {
				 SDR_TX.GainIF=ui.value;
				 $("#val_GIF_TX").html(ui.value);
				  GainIF_TX();
				  sauvegarde_parametresTX();
			  }
			});
		  } );
		  $("#val_GIF_TX").html(SDR_TX.GainIF);
		  
		   $( function() {
			$( "#slider_GBB_TX" ).slider({
			  value:SDR_TX.GainBB,
			  min: 0,
			  max: 150,
			  step: 1,
			  slide: function( event, ui ) {
				 SDR_TX.GainBB=ui.value;	
				 $("#val_GBB_TX").html(ui.value);
				  GainBB_TX();
				  sauvegarde_parametresTX();
			  }
			});
		  } );
		  $("#val_GBB_TX").html(SDR_TX.GainBB);
		  
		  
		  
		  
		  
}

//ANCIENS PARAMETRES
function recupere_ancien_parametresTX(){
	if (localStorage.getItem("Para_SDR_TX")!=null){ // On a d'anciens parametres en local
		SDR_TX = JSON.parse(localStorage.getItem("Para_SDR_TX"));
		audioParaTX = JSON.parse(localStorage.getItem("Para_Audio_TX"));
		if (audioParaTX.Compresse==0) $("#V_Manuel").prop("checked",true);	
		if (audioParaTX.Compresse==1) $("#V_Auto1").prop("checked",true);
		if (audioParaTX.Compresse==2) $("#V_Auto2").prop("checked",true);		
		$("#TX_IP").val(SDR_TX.IP);
		$("#relay_auto").prop("checked",SDR_TX.relay_auto);
	}
	
}
function sauvegarde_parametresTX(){
	
	localStorage.setItem("Para_SDR_TX", JSON.stringify(SDR_TX));
    localStorage.setItem("Para_Audio_TX", JSON.stringify(audioParaTX));	
	
}
function choix_Volume(){
	audioParaTX.Compresse=$("input[name='Volume']:checked").val();
	sauvegarde_parametresTX();
}

