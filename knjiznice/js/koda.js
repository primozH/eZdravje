
var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";

var baseUrlWiki = "https://sl.wikipedia.org/w/api.php"


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
		novEHR("Janez", "Bolan", "Moški", "1954-02-08T06:20", function(ehr){
			generirajPodatke(1, ehr, function(stanje){
				console.log(ehr);
				if(stanje)
					napaka = false;
				else
					napaka = true;
			});
		});
		novEHR("Marija", "Kovač", "Ženski", "1981-05-15T02:15", function(ehr){
			generirajPodatke(2, ehr, function(stanje){
				console.log(ehr);
				if(stanje)
					napaka = false;
				else
					napaka = true;
			});
		});
		novEHR("Matic", "Oblak", "Moški", "1998-01-01T14:37", function(ehr){
			generirajPodatke(3, ehr, function(stanje){
				console.log(ehr);
				if(stanje)
					napaka = false;
				else
					napaka = true;
			});
		});
	callback(napaka);
  // TODO: Potrebno implementirati
}

function generirajPodatke(stPacienta, ehrid, callback){
	var sistolicni_spodnja;
	var sistolicni_zgornja;
	var diastolicni_spodnja;
	var diastolicni_zgornja;
	var polozaj;
	var datum = new Date();

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
	console.log(sistolicni_zgornja + " " + stPacienta);
	for(var i = 0; i<15; i++){
		sis = Math.floor(Math.random()* (sistolicni_zgornja - sistolicni_spodnja) + sistolicni_spodnja + 1);
		dia = Math.floor(Math.random()* (diastolicni_zgornja - diastolicni_spodnja) + diastolicni_spodnja + 1);
		polozaj = "*Sitting(en)";
		var datumUra = datum.getFullYear() + "-" + datum.getMonth() + "-" + (datum.getDate() + i) + "T"
						+ datum.getHours() + ":" + datum.getMinutes();
		vnosPodatkov(ehrid, sis, dia, polozaj, datumUra, function(status){
			if(status) callback(true);
			else callback(false);
		});
	}
}

function novEHR(ime, priimek, spol, datum_rojstva, callback){
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
		                   	switch(ime){
		                   		case "Janez": pacienti.JanezBolan.ehrid = ehrId; break;
		                   		case "Marija": pacienti.MarijaKovac.ehrid = ehrId; break;
		                   		case "Matic": pacienti.MaticOblak.ehrid = ehrId; break;
		                   } 
		                   	callback(ehrId);
		                }
		            },
		            error: function(err) {
		            	$("#sporocilo_ustvari").append("<div class='alert alert-danger fade in'>" +
                          "<a href='#' class='close' data-dismiss='alert' aria-label='close'>&times;</a>\
                          	Napaka " +
                    		JSON.parse(err.responseText).userMessage + "!</div>");
		            	callback(false);
		            }
		        });
		    }
		});
}

function vnosPodatkov(ehrid, sistolicni, diastolicni, polozaj, datumUra, callback){
	var sessionId = getSessionId();
	if(datumUra == null){
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
	
	$.ajax({
		url: baseUrl + "/composition?" + $.param(parametri),
		type: "POST",
		contentType: "application/json",
		data: JSON.stringify(podatki),
		success: function(rezultat){
			$("#sporocilo_vnos").html("<div class='alert alert-success fade in'>" +
                          "<a href='#' class='close' data-dismiss='alert' aria-label='close'>&times;</a>\
                          	Uspešno vneseno" + "</div>");
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
	tabela = [];
	$.ajax({
		url: baseUrl + "/demographics/ehr/" + ehrid + "/party",
		type: "GET",
		headers: {"Ehr-Session": sessionid},
		success: function (podatki){
			var oseba = podatki.party;
			$("#accordion").html("<h5>Podatki za " + oseba.firstNames + " " + oseba.lastNames + "</br>" + ehrid + "</h5>");
			$.ajax({
				url: baseUrl + "/view/" + ehrid + "/blood_pressure",
				type: "GET",
				headers: {"Ehr-Session" : sessionid},
				success: function(rezultat){
					if(rezultat.length>0){
						for(var i in rezultat){
							sis = rezultat[i].systolic;
							dia = rezultat[i].diastolic;
							dt = rezultat[i].time;
							datum = new Date(dt);
							izpis = '<div class="panel panel-default">\
            					<div class="panel-heading">\
              					<h4 class="panel-title">\
               					<a data-toggle="collapse" data-parent="#accordion" href="#collapse' + (parseInt(i)+1) +'">\
              					Meritev' + (parseInt(i)+ 1) + '</a></h4>\
            					</div><div id="collapse' + (parseInt(i)+1) + '" class="panel-collapse collapse">\
              					<div class="panel-body"><ul><li>Sistolični: ' + sis + 
              					'</li><li>Diastolični: ' + dia + '</li><li>Datum: ' + datum +'</li></ul></div></div></div>';
              				$("#accordion").append(izpis);
              				napolniTabelo(sis, dia, dt);
          				}
          				preveriTlak();
          				drawCrosshairs();
          				callback(rezultat);					
					}
					else
						$("#accordion").append("<div class='alert alert-danger fade in'>" +
                          "<a href='#' class='close' data-dismiss='alert' aria-label='close'>&times;</a>\
                          	Ni zapisov </div>");
				},
				error: function(napaka){
					$("#accordion").html("<div class='alert alert-danger fade in'>" +
                          "<a href='#' class='close' data-dismiss='alert' aria-label='close'>&times;</a>\
                          	Napaka!" + JSON.parse(napaka.responseText).userMessage + " </div>");
				}
			});
		},
		error: function(napaka){
			console.log(JSON.stringify(napaka));
		}
	});
	callback(false);
}

function napolniTabelo(sis, dia, dt){
	var dat = new Date(dt.split("T")[0]);

	tabela.push([dat, sis, dia]);
}

function preveriTlak(){
	var sis = 0;
	var dia = 0;
	var st = 0;
	for(var i in tabela){
		sis += tabela[i][1];
		dia += tabela[i][2];
		st++;
	}
	sis/=st;
	dia/=st;
	if(sis > 140 || dia > 90){
		podatkiWiki();
		$("#accordion").append("<div class='alert alert-danger fade in'>" +
                          "<a href='#' class='close' data-dismiss='alert' aria-label='close'>&times;</a>\
                          	Povišan krvni tlak! Priporočamo obisk zdravnika." + "</div>");
	}
	else
		$("#info_box").empty();
}


function drawCrosshairs() {
      var data = new google.visualization.DataTable();
      data.addColumn('date', 'X');
      data.addColumn('number', 'Sistolični');
      data.addColumn('number', 'Diastolični');

      data.addRows(tabela);
      var options = {
        hAxis: {
          title: 'Datum'
        },
        vAxis: {
          title: 'mm[Hg]'
        },
        colors: ['#a52714', '#097138'],
        crosshair: {
          color: '#000',
          trigger: 'selection'
        }
      };

      var chart = new google.visualization.LineChart(document.getElementById('graf'));

      chart.draw(data, options);
      chart.setSelection([{row: 38, column: 1}]);

}


function podatkiWiki(){

	$.getJSON(baseUrlWiki+"?action=query&format=json&callback=?", 
		{titles:"Visok krvni tlak", prop: "extracts", exintro: "", explaintext: ""},
		function(data) {
			var stran = data.query.pages;
			var extract = stran[245675].extract;
			extract = extract.replace("}", "");
			
			$("#info_box").html('<blockquote><p class="text-justify small">'+extract+'</p>\
				<footer>Wikipedia</footer></blockquote>');
		});
}


var tabela = [];



var pacienti = {
	
	"JanezBolan" : {
		ehrid: "02b2181e-2a22-4862-95c0-935eb113bbc9"
	},
	"MarijaKovac" : {
		ehrid: "cffa8328-b11e-493b-81e9-458d617fceb8"
	},
	"MaticOblak" : {
		ehrid: "515227e2-132b-4f04-9e8e-ceedb097e69a"
	}
};




$(function(){
	console.log("start");

	google.charts.load('current', {packages: ['corechart', 'line']});
google.charts.setOnLoadCallback(drawCrosshairs);

	$("#pacient").change(function(){
		var pacient = $(this).val();
		var ehr;
		switch(pacient){
			case "Janez Bolan":
				ehr = pacienti.JanezBolan.ehrid; break;
			case "Marija Kovač":
				ehr = pacienti.MarijaKovac.ehrid; break;
			case "Matic Oblak":
				ehr = pacienti.MaticOblak.ehrid; break;
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
		if(ehrid == null || ehrid.length == 0){
			$("#ehrid_izpis").attr("placeholder", "Napaka!");

		}
		else
			izpisPodatkov(ehrid, function(data){
		
		});
	});

	$("#ustvariVnos").click(function(){
		var ehrid = $("#ehrid_vnos").val();
		var sis = $("#sistolicni_vnos").val();
		var dia = $("#diastolicni_vnos").val();
		var polozaj = "*Sitting(en)";
		var datum = $("#datum_meritve").val();
		vnosPodatkov(ehrid, sis, dia, polozaj, datum, function(success){
			if(success){
			}
		});
	});
	
	$("#ustvariZapis").click(function(){
		var ime = $("#ime").val();
		var spol = $("#spol_vnos").val();
		var priimek = $("#priimek").val();
		var datum_rojstva = $("#datum_rojstva").val();
		novEHR(ime, priimek, spol, datum_rojstva, function(ehr){
		});
		console.log(ime + " " + priimek);
	});
	
});
