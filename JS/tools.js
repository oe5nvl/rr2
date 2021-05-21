// ****************
// * REMOTE SDR v2*
// *    F1ATB     *
// ****************
var ecran={large:true,largeur:1,hauteur:1,innerW:1,innerH:1,border:5};
var SDR={RX_IP:"RX Ip",TX_IP:"TX Ip",MY_IP:""};
var audioTX={Ctx:null,mic_stream:null,node_gain:null,node_proces_sortie:null,node_proces_analyse:null,node_analyseur:null,node_filtre:null,BufferSize:256};
//RESIZE
//**********
function Init_Page_Tools(){
	SDR.MY_IP=window.location.hostname;
	SDR.RX_IP=SDR.MY_IP;
	SDR.TX_IP=SDR.RX_IP;	
	if (localStorage.getItem("SDR_RX")!=null){ // On a d'anciens parametres en local
		SDR_RX = JSON.parse(localStorage.getItem("SDR_RX"));
		SDR.RX_IP = SDR_RX.IP; 
	} 
	if (localStorage.getItem("Para_SDR_TX")!=null){ // On a d'anciens parametres en local
		SDR_TX = JSON.parse(localStorage.getItem("Para_SDR_TX"));
		SDR.TX_IP = SDR_TX.IP;
	}
	$("#RX_IP").html(SDR.RX_IP);
	$("#TX_IP").html(SDR.TX_IP);
	$("#RT_IP").html(SDR.RX_IP);
	if(SDR.RX_IP==SDR.TX_IP){
		$(".RX").css("display","none");
		$(".TX").css("display","none");
	} else {
		$(".RT").css("display","none");		
	}
	if (SDR.RX_IP==SDR.MY_IP){
		$(".actifT").css({"background-color":"#bbb",color:"grey","border-color":"grey"});
	} else {
		$(".actifR").css({"background-color":"#bbb",color:"grey","border-color":"grey"});
	}
	
	window_resize();
	
}
function disp_sh(sdr,x){
	
	if (x=="USB") {
		var EN="The name of the connected SDR must appear in the list of USB devices";
		var FR="Le nom du SDR connecté doit apparaitre dans la liste des appareils USB";
	}
	
	if (x=="HackRFinfo") {
		var EN="Info on HackRF One SDR connected to USB";
		var FR="Info sur le HackRF One connecté à l'USB";
	}
	
	if (x=="RTLSDRinfo") {
		var EN="Info on RTL-SDR connected to USB";
		var FR="Info sur le RTL-SDR connecté à l'USB";
	}
	
	if (x=="testpin26") {
		var EN="50Hz square Oscillator on pin 26 (Orange Pi One Plus H6) for 10s";
		var FR="Oscillateur signal carré de 50Hz pendant 10s sur la pin 26 (Orange Pi One Plus H6)";
	}
	
	if (x=="RebootOPI") {
		var EN="Reboot Orange PI";
		var FR="Reboot Orange PI";
	}
	
	$("#info_en").html(EN);
	$("#info_fr").html(FR);
	
	var url_="http://"+SDR.RX_IP+"/cgi-bin/ajax.sh?"+x;
	if (sdr=="Tx") url_="http://"+SDR.TX_IP+"/cgi-bin/ajax.sh?"+x;
	var r=true;
	if (x=="RebootOPI") r= confirm("Confirm Orange Pi Reboot!");
 
	if (r == true) {
		$("#terminal").html("<iframe src='"+url_+"' style='width:100%;position:absolute;top:0px;height:100%;'></iframe>"); //Allow access even in cross origin
	} else {
		$("#info_en").html("");
		$("#info_fr").html("");
	}
}
function disp_py(sdr,x){
	
	if (x=="RxConf") {
		var EN="Use a text editor to edit the /var/www/html/configurationRX.js file as needed.";
		var FR="Utilisez un éditeur de texte pour modifier si besoin le fichier /var/www/html/configurationRX.js.";
	}
	if (x=="TxConf") {
		var EN="Use a text editor to edit the /var/www/html/configurationTX.js file as needed.";
		var FR="Utilisez un éditeur de texte pour modifier si besoin le fichier /var/www/html/configurationTX.js.";
	}
	if (x=="ApacheError") {
		var EN="List of errors of Apache server";
		var FR="Liste des erreurs du serveur Apache";
	}
	if (x=="PlutoHelp") {
		var EN="List of Pluto commands (ip: 192.168.2.1) to test its response";
		var FR="Liste des commandes Pluto (ip: 192.168.2.1) pour tester sa réponse";
	}
	if (x=="PlutoReboot") {
		var EN="Adalm-Pluto reboot (ip: 192.168.2.1). Please wait 10s.";
		var FR="Reboot de l'Adalm Pluto (ip: 192.168.2.1). Attendez 10s.";
	}
	if (x=="RxHistoric") {
		var EN="List of the last parameters sent to the SDR-RX.";
		var FR="Liste des derniers paramètres envoyés au SDR-RX.";
	}
	if (x=="TxHistoric") {
		var EN="List of the last parameters sent to the SDR-TX.";
		var FR="Liste des derniers paramètres envoyés au SDR-TX.";
	}
	if (x=="USB") {
		var EN="The name of the connected SDR must appear in the list of USB devices";
		var FR="Le nom du SDR connecté doit apparaitre dans la liste des appareils USB";
	}
	
	$("#info_en").html(EN);
	$("#info_fr").html(FR);
	
	var url_="http://"+SDR.RX_IP+"/cgi-bin/ajax.py?"+x;
	if (sdr=="Tx") url_="http://"+SDR.TX_IP+"/cgi-bin/ajax.py?"+x;
	$("#terminal").html("<iframe src='"+url_+"' style='width:100%;position:absolute;top:0px;height:100%;'></iframe>"); //Allow access even in cross origin
	
}
function window_resize(){
	ecran.largeur = window.innerWidth; // parametre qui gere le changement des css'
	ecran.hauteur = window.innerHeight;
	var Fs=Math.max(12,ecran.largeur/100);
	$("body").css("font-size",Fs);  //Main Font-Size
}

//Traitement Audio du Microphone
function  test_micro(){
		
		
	var EN="Test access to the microphone. Requires the Orange PI site to be declared secure.";
	var FR="Test l'accès au microphone. Nécessite d'avoir le site de l'Orange PI déclaré sécurisé.";
	
	
	$("#info_en").html(EN);
	$("#info_fr").html(FR);
	$("#terminal").html("");	
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
		console.log("stream",stream);
		//Flux du micro
		audioTX.mic_stream = audioTX.Ctx.createMediaStreamSource(stream);
		//Creation des Nodes de traitement
		audioTX.node_gain = audioTX.Ctx.createGain();          
		audioTX.node_filtre = audioTX.Ctx.createBiquadFilter();
		audioTX.node_filtre.type = "lowpass";
		audioTX.node_filtre.frequency.value=3500; //Fc de 3500Hz
		//Connection des Nodes entre eux. 
		audioTX.mic_stream.connect(audioTX.node_gain);
		audioTX.node_gain.connect(audioTX.node_filtre );
		audioTX.node_filtre.connect( audioTX.Ctx.destination ); //Pour s'ecouter				
		audioTX.node_gain.gain.value=0.1;
	  
 }
		
//Page FULL SCREEN
var FS_On =false;
function switch_page(){
	FS_On=!FS_On;
	var elem = document.documentElement;
	if (FS_On) {
			/* View in fullscreen */		
			  if (elem.requestFullscreen) {
				elem.requestFullscreen();
			  } else if (elem.mozRequestFullScreen) { /* Firefox */
				elem.mozRequestFullScreen();
			  } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
				elem.webkitRequestFullscreen();
			  } else if (elem.msRequestFullscreen) { /* IE/Edge */
				elem.msRequestFullscreen();
			  }
	} else {	
/* Close fullscreen */
			  if (document.exitFullscreen) {
				document.exitFullscreen();
			  } else if (document.mozCancelFullScreen) { /* Firefox */
				document.mozCancelFullScreen();
			  } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
				document.webkitExitFullscreen();
			  } else if (document.msExitFullscreen) { /* IE/Edge */
				document.msExitFullscreen();
			  }
	}
}