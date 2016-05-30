
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
function generirajPodatke(stPacienta) {
	var ehrid;
	var ime, priimek, datum_rojstva;
	switch(stPacienta){
		
		//bolnik, povisan krvni tlak
		case 1:
			ime = "Janez";
			priimek = "Bolan";
			datum_rojstva = "1954-02-08T06:20";
			var meritev1;
			ehrid = novEHR(ime, priimek, datum_rojstva);


			break;
		//sportnica
		case 2:
			ime = "Marija";
			priimek = "Kovač"
			datum_rojstva = "1981-05-15T02:15";

			ehrid = novEHR(ime, priimek, datum_rojstva);


			break;
		case 3:
			ime = "Matic";
			priimek = "Oblak";
			datum_rojstva = "1998-01-01T14:37";

			ehrid = novEHR(ime, priimek, datum_rojstva);
			break;
	}
  // TODO: Potrebno implementirati

  return ehrId;
}

function novEHR(ime, priimek, datum_rojstva){
	var sessionID = getSessionId();
	var sporocilo = "";
	
	$.ajaxSetup({
		headers: {"Ehr-Session": sessionID}
	});
	$.ajax({
		url: baseUrl + "/ehr",
		type: "POST",
		success: function(data){
			var ehrid = data.ehrId;
			var party_data = {
				firstNames: ime,
				lastNames: priimek,
				dateOfBirth: datum_rojstva,
				partyAdditionalInfo: [{key: "ehrid", value: ehrid}]
			};
			$.ajax({
				url: baseUrl + "/demographics/party",
				type: "POST",
				contentType: "application/json",
				data: JSON.stringify(party_data),
				success: function(party){
					if(party.action == "CREATE"){
						sporocilo = "Uspešno kreirah EHR zapis za " + ime + " " +
								priimek + ". EHRID = " + ehrid;
						return ehrid;
					}
				},
				error: function(err){
					sporocilo = "Napaka! Poskusite ponovno. " + JSON.parse(err.responseText).userMessage;
				}
			});
		}
	});
}


function preberiPodatkeJSON(){
	

}


// TODO: Tukaj implementirate funkcionalnost, ki jo podpira vaša aplikacija
$(function(){

	$("#prikazGraf").click(function(){
		preberiPodatkeJSON();
		console.log("demo");
	})
	
	$("#generiraj").click(function(){
		for(var i = 1; i<4; i++)
			ehrid = generirajPodatke(i);
			//add to dropdown list
	});
	
	$("#ustvariZapis").click(function(){
		var ime = $("#ime").val();
		var priimek = $("#priimek").val();
		var datum_rojstva = $("#datum_rojstva").val();
		console.log(ime + " " + priimek);
	});
	
});
