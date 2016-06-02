
var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";


/**
 * Prijava v sistem z privzetim uporabnikom za predmet OIS in pridobitev
 * enolične ID številke za dostop do funkcionalnosti
 * @return enolični identifikator seje za dostop do funkcionalnosti
 */
function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}


/**
 * Generator podatkov za novega pacienta, ki bo uporabljal aplikacijo. Pri
 * generiranju podatkov je potrebno najprej kreirati novega pacienta z
 * določenimi osebnimi podatki (ime, priimek in datum rojstva) ter za njega
 * shraniti nekaj podatkov o vitalnih znakih.
 * @param stPacienta zaporedna številka pacienta (1, 2 ali 3)
 * @return ehrId generiranega pacienta
 */
function generirajPaciente(callback) {
	var napaka;
	var ehrid;
	var ime, priimek, datum_rojstva;
	for(var i = 1; i<4; i++){
		switch(i){
			
			//bolnik, povisan krvni tlak
			case 1:
				ime = "Janez";
				priimek = "Bolan";
				spol = "Moški";
				datum_rojstva = "1954-02-08T06:20";
				var meritev1;
				ehrid = novEHR(ime, priimek, spol, datum_rojstva);
				break;			
			//sportnica
			case 2:
				ime = "Marija";
				priimek = "Kovač"
				spol = "Ženski";
				datum_rojstva = "1981-05-15T02:15";
				ehrid = novEHR(ime, priimek, spol, datum_rojstva);
				break;
			//mladenic
			case 3:
				ime = "Matic";
				priimek = "Oblak";
				spol = "Moški";
				datum_rojstva = "1998-01-01T14:37";
				ehrid = novEHR(ime, priimek, spol, datum_rojstva);
				break;
		}

		generirajPodatke(i, ehrid, function(stanje){
					if(stanje)
						napaka = false;
		});
	}
	callback(napaka);
  // TODO: Potrebno implementirati
}

function generirajPodatke(stPacienta, ehrid, callback){
	var sistolicni_spodnja;
	var sistolicni_zgornja;
	var diastolicni_spodnja;
	var diastolicni_zgornja;
	var polozaj;
	switch(stPacienta){
		case 1:
			sistolicni_spodnja = 139;
			sistolicni_zgornja = 180;
			diastolicni_spodnja = 90;
			diastolicni_zgornja = 110;
			break;
		case 2:
			sistolicni_spodnja = 110;
			sistolicni_zgornja = 140;
			diastolicni_spodnja = 60;
			diastolicni_zgornja = 90;
			break;
		 case 3:
		 	sistolicni_spodnja = 110;
			sistolicni_zgornja = 140;
			diastolicni_spodnja = 60;
			diastolicni_zgornja = 90;
			break;
	}
	var sis, dia;
	for(var i = 0; i<15; i++){
		sis = Math.floor(Math.random()* (sistolicni_zgornja - sistolicni_spodnja) + sistolicni_spodnja + 1);
		dia = Math.floor(Math.random()* (diastolicni_zgornja - diastolicni_spodnja) + diastolicni_spodnja + 1);
		polozaj = "*Sitting(en)";
		if(ehrid== null){ ehrid=$("#ehrid_izpis").val(); pacienti[stPacienta-1].ehrid = ehrid; }
		vnosPodatkov(ehrid, sis, dia, polozaj, null, function(status){
			if(status) callback(true);
			else callback(false);
		});
	}
}

function novEHR(ime, priimek, spol, datum_rojstva){
	var sessionID = getSessionId();
	var sporocilo = "";
	var ehrId;
	
	$.ajaxSetup({
		    headers: {"Ehr-Session": sessionID}
	});
	$.ajax({
		    url: baseUrl + "/ehr",
		    type: 'POST',
		    success: function (data) {
		        ehrId = data.ehrId;
		        var partyData = {
		            firstNames: ime,
		            lastNames: priimek,
		            gender: (spol == "Moški") ? "MALE" : "FEMALE",
		            dateOfBirth: datum_rojstva,
		            partyAdditionalInfo: [{key: "ehrId", value: ehrId}]
		        };
		        $.ajax({
		            url: baseUrl + "/demographics/party",
		            type: 'POST',
		            contentType: 'application/json',
		            data: JSON.stringify(partyData),
		            success: function (party) {
		                if (party.action == 'CREATE') {
		                    $("#sporocilo_ustvari").append("<div class='alert alert-success fade in'>" +
                          "<a href='#' class='close' data-dismiss='alert' aria-label='close'>&times;</a>\
                          	Uspešno kreiran EHR za " + ime + " " + priimek + ":\n" + ehrId + ".</div>");
		                    $("#ehrid_izpis").val(ehrId);
		                    
		                }
		            },
		            error: function(err) {
		            	$("#sporocilo_ustvari").append("<div class='alert alert-danger fade in'>" +
                          "<a href='#' class='close' data-dismiss='alert' aria-label='close'>&times;</a>\
                          	Napaka " +
                    		JSON.parse(err.responseText).userMessage + "!</div>");
		            }
		        });
		    }
		});

		return ehrId;
}

function vnosPodatkov(ehrid, sistolicni, diastolicni, polozaj, datumUra, callback){
	var sessionId = getSessionId();
	if(!datumUra){
		var datum = new Date();
		var datumUra = datum.getFullYear() + "-" + datum.getMonth() + "-" + datum.getDate() + "T"
						+ datum.getHours() + ":" + datum.getMinutes();
	}
	
	$.ajaxSetup({
		headers: {"Ehr-Session": sessionId}
	});
	var podatki = {
		"ctx/language": "en",
		"ctx/territory": "SI",
		"ctx/time": datumUra,
		"vital_signs/blood_pressure/any_event/systolic|magnitude": sistolicni,
		"vital_signs/blood_pressure/any_event/diastolic|magnitude": diastolicni,
		"vital_signs/blood_pressure/any_event/position": {
			"|code": "at1001",
			"|value": polozaj,
			"|terminology": "local"
		}
	};
	var parametri = {
		ehrId : ehrid,
		templateId: "Vital Signs",
		format: "FLAT",
	};
	console.log($.param(parametri));

	$.ajax({
		url: baseUrl + "/composition?" + $.param(parametri),
		type: "POST",
		contentType: "application/json",
		data: JSON.stringify(podatki),
		success: function(rezultat){
			$("#sporocilo_vnos").html("<div class='alert alert-success fade in'>" +
                          "<a href='#' class='close' data-dismiss='alert' aria-label='close'>&times;</a>\
                          	Uspešno vneseno</div>");
			callback(true);
		},
		error: function(napaka){
			$("#sporocilo_vnos").html("<div class='alert alert-danger fade in'>" +
                          "<a href='#' class='close' data-dismiss='alert' aria-label='close'>&times;</a>\
                          	Napaka!" + JSON.parse(napaka.responseText).userMessage + " </div>");
			callback(false);
		}
	});

}


function izpisPodatkov(ehrid, callback){
	var sessionid = getSessionId();
	$.ajax({
		url: baseUrl + "/demographics/ehr/" + ehrid + "/party",
		type: "GET",
		headers: {"Ehr-Session": sessionid},
		success: function (podatki){
			var oseba = podatki.party;
			$("#accordion").html("<h5>Podatki za " + oseba.firstNames + " " + oseba.lastNames + "</h5>");
			$.ajax({
				url: baseUrl + "/view/" + ehrid + "/blood_pressure",
				type: "GET",
				headers: {"Ehr-Session" : sessionid},
				success: function(rezultat){
					if(rezultat.length>0){
						for(var i in rezultat){
							console.log(rezultat[i]);
							izpis = '<div class="panel panel-default">\
            					<div class="panel-heading">\
              					<h4 class="panel-title">\
               					<a data-toggle="collapse" data-parent="#accordion" href="#collapse' + (parseInt(i)+1) +'">\
              					Meritev' + (parseInt(i)+ 1) + '</a></h4>\
            					</div><div id="collapse' + (parseInt(i)+1) + '" class="panel-collapse collapse">\
              					<div class="panel-body"><ul><li>Sistolični: ' + rezultat[i].systolic + 
              					'</li><li>Diastolični: ' + rezultat[i].diastolic + '</li></ul></div></div></div>';
              				$("#accordion").append(izpis);
          				}


						
						
					}
					else
						$("#accordion").html("<div class='alert alert-danger fade in'>" +
                          "<a href='#' class='close' data-dismiss='alert' aria-label='close'>&times;</a>\
                          	Ni zapisov </div>");
				},
				error: function(napaka){
					$("#accordion").html("<div class='alert alert-danger fade in'>" +
                          "<a href='#' class='close' data-dismiss='alert' aria-label='close'>&times;</a>\
                          	Napaka!" + JSON.parse(napaka.responseText).userMessage + " </div>");
				}
			});
		}
	});
	callback(true);
}


var pacienti = [
	{
		ime: "Janez Bolan",
		ehrid: "8b2514c4-2d2e-45b1-9c0e-dba790c30bfc"
	},
	{
		ime: "Marija Kovač",
		ehrid: "ab825179-8a1f-47d0-9062-2a782c263ba7"
	},
	{
		ime: "Matic Oblak",
		ehrid: "cae5c359-5ed3-4b18-a75a-edb5a476aa19"
	}
];

$(function(){

	var c = confirm("Želiš najprej generirati nekaj pacientov?");
	if(c) generirajPaciente(function(napaka){
		
	});

	$("#prikazGraf").click(function(){
		
	})

	$("#pacient").change(function(){
		var pacient = $(this).val();
		var ehr;
		switch(pacient){
			case "Janez Bolan":
				ehr = pacienti[0].ehrid; break;
			case "Marija Kovač":
				ehr = pacienti[1].ehrid; break;
			case "Matic Oblak":
				ehr = pacienti[2].ehrid; break;
		}
		$("#ehrid_izpis").val(ehr);
	})
	
	$("#generiraj").click(function(){
		generirajPaciente(function(status){
			if(status){

			}
			//add to dropdown list
		});
	});

	$("#preberiZapis").click(function(){
		var ehrid = $("#ehrid_izpis").val();
		izpisPodatkov(ehrid, function(data){

		});
	});

	$("#ustvariVnos").click(function(){
		var ehrid = $("#ehrid_vnos").val();
		var sis = $("#sistolicni_vnos").val();
		var dia = $("#diastolicni_vnos").val();
		var polozaj = $("#polozaj").val();
		var datum = $("#datum_meritve").val();
		vnosPodatkov(ehrid, sis, dia, polozaj, null, function(success){
			if(success){
			}
		});
	});
	
	$("#ustvariZapis").click(function(){
		var ime = $("#ime").val();
		var spol = $("#spol_vnos").val();
		var priimek = $("#priimek").val();
		var datum_rojstva = $("#datum_rojstva").val();
		var ehr = novEHR(ime, priimek, spol, datum_rojstva);
		console.log(ime + " " + priimek);
	});
	
});
