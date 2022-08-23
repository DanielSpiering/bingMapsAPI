var map;
var drawingManager;
var lat;
var long;
var searchQuery;
var key = 'Ai6xwfrpBbIAI-GuuF37V71P4LFid7adlUeqQN9P2GJ32em6ohTUYVu9JmsFyVLu';
var locationInfo = [];
var pushpins = [];
var polygonOn = false;
var routeOn = false;
var directionsManager;
var requestUrl;
var listHTML;
var storageHTML;

const selectButton = document.querySelector('#select');
const locateButton = document.querySelector('#locate');
const clearButton = document.querySelector('#clear');
const displayDiv = document.querySelector('#display-search-results');
const storageDiv = document.querySelector('#previously-visited');


selectButton.addEventListener('click', buttonSelect)
locateButton.addEventListener('click', buttonLocate)
clearButton.addEventListener('click', buttonClear)

function buttonClear(e) {
    e.preventDefault();
    clearLocalStroage();
    updateLocalStorage();
}
function buttonLocate(e) {
    e.preventDefault();
    getCoordinates();
}
function buttonSelect(e) {
    e.preventDefault();//prevents button from reloading page
    returnSearchQuery();
    getPOIData();

}

function getCoordinates() {
    //Request the user's location
    navigator.geolocation.getCurrentPosition(function (position) {
        var loc = new Microsoft.Maps.Location(
            position.coords.latitude,
            position.coords.longitude);
        lat = position.coords.latitude;
        long = position.coords.longitude;

        //Add a pushpin at the user's location.
        var locationPin = new Microsoft.Maps.Pushpin(loc, {color: 'green'});
        map.entities.push(locationPin);

        //Center the map on the user's location.
        map.setView({ center: loc, zoom: 15 });
    });

}//end function
function returnSearchQuery() {
    var select = document.getElementById('menu');
    searchQuery = select.options[select.selectedIndex].value;

}//end function

function loadMapScenario() {

    map = new Microsoft.Maps.Map(document.getElementById('myMap'), {
        
        showLocateMeButton: false,
        zoom: 13
    });  
    
    updateLocalStorage();
    var test = map.getCenter();
    lat = test.latitude;
    long = test.longitude;
}//end function


function getPOIData() {
    //request variables
    const ajax = new XMLHttpRequest;  //asynchronous javascript and xml
    
    requestUrl = `https://dev.virtualearth.net/REST/v1/LocalSearch/?query=${searchQuery}&userLocation=${lat},${long}&key=${key}`;  //location of api
    
    
    const requestMethod = 'GET';  //give me data
    const asyncRequest = true;  //dont hold up wepage when waiting response

    //send ajax request to the url
    ajax.open(requestMethod, requestUrl, asyncRequest);

    //set callback function (this function gets called automatically when the response gets back)
    ajax.onreadystatechange = requestData;

    //send request
    var data = ajax.send();
}//end function
function requestData() {
    var responseStatusOk = this.status === 200;   //STATUS 200 means OK
    var responseComplete = this.readyState === 4; //readyState 4 means response is ready

    if (responseStatusOk && responseComplete) {
        //console.log(this.responseText); //debug

        //PARSE THE RESPONSE
        let responseData = JSON.parse(this.responseText);

        //pass the data to my next function to get parsed and saved for later use
        storeLocationInfo(responseData);
        
    } else {
        //SOMETHING WENT WRONG
        this.onerror = onerror();
    }//end if
}//end function
function onerror() {
    displayDiv.textContent = 'There was an error!';
}//end function
function storeLocationInfo(responseData) {
    //store the data from the api into an array
    locationInfo = [];    
    for (var index = 0; index < responseData.resourceSets[0].resources.length; index++) {
        var name = responseData.resourceSets[0].resources[index].name;
        var address = responseData.resourceSets[0].resources[index].Address.formattedAddress;
        var phoneNumber = responseData.resourceSets[0].resources[index].PhoneNumber;
        var latitude = responseData.resourceSets[0].resources[index].geocodePoints[0].coordinates[0];
        var longitude = responseData.resourceSets[0].resources[index].geocodePoints[0].coordinates[1];
        locationInfo[index] = { name, address, phoneNumber, latitude, longitude };       
    }//end for   
    printLocationInfo();
}//end function
function printLocationInfo() {
    listHTML = ['<table>'];
    for (var index = 0; index < locationInfo.length; index++) {
        listHTML.push(`<tr><td><button onclick="storeFavorite(${index})" id="favorite">Favorite</button></td><td>${index + 1}) </td>`);
        listHTML.push(`<td><a onclick="displayDirections( ${locationInfo[index].latitude}, ${locationInfo[index].longitude})" href="#display-search-results"> ${locationInfo[index].name} --- ${locationInfo[index].address} --- ${locationInfo[index].phoneNumber} </a></td>`);

    }
    //Add closing tag to HTML table 
    listHTML.push('</table>');

    //Display new results onto HTML 
    displayDiv.innerHTML = listHTML.join('');
    
    addPushpins();
}//end function
function addPushpins() {
    //remove any previous search pushpins  
    for (var i = 0; i < pushpins.length; i++) {
        map.entities.remove(pushpins[i]);
    }
    //add current search pushpins to map
    for (var index = 0; index < locationInfo.length; index++) {
        
        var pushpin = new Microsoft.Maps.Pushpin({ latitude: locationInfo[index].latitude, longitude: locationInfo[index].longitude }, { title: locationInfo[index].name, text: `${index + 1}`,id:`pushpin${index}` });
        pushpins[index] = pushpin;       
        map.entities.push(pushpins[index]);
        
    }//end for 

    //set up a click event for each pushpin
    for (let x in pushpins) {
        Microsoft.Maps.Events.addHandler(pushpins[x], 'click', function () { displayDirections(pushpins[x].geometry.y, pushpins[x].geometry.x); });
    }//end for 
}//end function

function storeFavorite(index) {
    //if a pushpin is clicked, it's data is added to local storage
    localStorage.setItem(`${locationInfo[index].name}${index + 1}`,
        JSON.stringify({ name: `${locationInfo[index].name}`, address: `${locationInfo[index].address}`, phoneNumber: `${locationInfo[index].phoneNumber}`, latitude: `${locationInfo[index].latitude}`, longitude: `${locationInfo[index].longitude}` })
    );
}

function displayDirections(latitude, longitude) {
    
    if (routeOn == true) {
        directionsManager.clearAll();
    }
    //Load the directions module.
    Microsoft.Maps.loadModule('Microsoft.Maps.Directions', function () {
        
        //Create an instance of the directions manager.
        directionsManager = new Microsoft.Maps.Directions.DirectionsManager(map);       

        //Create waypoints to route between.
        var yourWaypoint = new Microsoft.Maps.Directions.Waypoint({ address: 'Your Location', location: new Microsoft.Maps.Location(lat, long) });
        directionsManager.addWaypoint(yourWaypoint);

        var locationWaypoint = new Microsoft.Maps.Directions.Waypoint({ address: 'Destination', location: new Microsoft.Maps.Location(latitude, longitude) });
        directionsManager.addWaypoint(locationWaypoint);

        //Specify the element in which the itinerary will be rendered.
        directionsManager.setRenderOptions({ itineraryContainer: '#directions-panel' });

        //Calculate directions.
        directionsManager.calculateDirections();       
    });
    routeOn = true;
    
}//end function


function clearLocalStroage() {
    localStorage.clear();

}
function updateLocalStorage() {
    //displays previous entries in local storage to a text box on the map
    var previousVisit = "";
    var jsonParse = "";
    var values = [], keys = Object.keys(localStorage), i = keys.length;
    while (i--) {

        values.push(localStorage.getItem(keys[i]));
    }//end while
    storageHTML = ['<table>'];
    for (var index = 0; index < values.length; index++) {
        if (values[index][0] == "{") {
            jsonParse = JSON.parse(values[index]);
            storageHTML.push(`<tr><td><button onclick="displayDirections(${jsonParse.latitude}, ${jsonParse.longitude})" id="directions">Get Directions</button></td>`);
            storageHTML.push(`<td>${jsonParse.name} --- ${jsonParse.address} --- ${jsonParse.phoneNumber}</td>`);
            //previousVisit += `NAME: ${jsonParse.name}, PHONENUMBER: ${jsonParse.phoneNumber}, ADDRESS: ${jsonParse.address}, LATITUDE: ${jsonParse.latitude}, LONGITUDE: ${jsonParse.longitude}` + "<br/>";
        }//end if
    }//end for

    //Add closing tag to HTML table 
    storageHTML.push('</table>');

    //Display new results onto HTML 
    storageDiv.innerHTML = storageHTML.join('');

}//end function
