var map;
var drawingManager;
var lat;
var long;
var polygonLeftLat;
var polygonLeftLat;
var polygonRightLong;
var polygonRightLong;
var searchQuery;
var key = 'Ai6xwfrpBbIAI-GuuF37V71P4LFid7adlUeqQN9P2GJ32em6ohTUYVu9JmsFyVLu';
var locationInfo = [];
var pushpins = [];
var polygonlocations;
var polygonOn = false;

const selectButton = document.querySelector('#select');
const locateButton = document.querySelector('#locate');
const clearButton = document.querySelector('#clear');
const displayDiv = document.querySelector('#display-search-results');
const storageDiv = document.querySelector('#previously-visited');

selectButton.addEventListener('click', buttonSelect)
locateButton.addEventListener('click', buttonLocate)
clearButton.addEventListener('click', buttonClear)

const button = document.querySelector('#polygon');
button.addEventListener('click', extra);
function getLatlng(e) {

    if (e.targetType == "map") {

        var point = new Microsoft.Maps.Point(e.getX(), e.getY());
        var locTemp = e.target.tryPixelToLocation(point);
        var location = new Microsoft.Maps.Location(locTemp.latitude, locTemp.longitude);
        //alert(locTemp.latitude + "&" + locTemp.longitude);


        var pin = new Microsoft.Maps.Pushpin(location, { 'draggable': false });

        map.entities.push(pin);
        //alert("Done");

    }//end if        
}//end fnction
function extra(e) {
    e.preventDefault();
    makePolygon();
}
function makePolygon() {
    polygonOn = true;
    var i = 0, entity;
    while (i < map.entities.getLength()) {
        entity = map.entities.get(i);
        if (i == 0) {
            location1 = new Microsoft.Maps.Location(entity.geometry.y, entity.geometry.x);
            polygonLeftLat = entity.geometry.y;
            polygonLeftLong = entity.geometry.x;

        } else if (i == 1) {
            location2 = new Microsoft.Maps.Location(entity.geometry.y, entity.geometry.x);
        } else if (i == 2) {
            location3 = new Microsoft.Maps.Location(entity.geometry.y, entity.geometry.x);
            polygonRightLat = entity.geometry.y;
            polygonRightLong = entity.geometry.x;
        } else if (i == 3) {
            location4 = new Microsoft.Maps.Location(entity.geometry.y, entity.geometry.x);
        }
        i += 1;
    }

    polygon = new Microsoft.Maps.Polygon([
        new Microsoft.Maps.Location(location1.latitude, location1.longitude),
        new Microsoft.Maps.Location(location2.latitude, location2.longitude),
        new Microsoft.Maps.Location(location3.latitude, location3.longitude),
        new Microsoft.Maps.Location(location4.latitude, location4.longitude)], null);
    map.entities.push(polygon);
}



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
        var locationPin = new Microsoft.Maps.Pushpin(loc);
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
    ////Load the DrawingTools module
    //Microsoft.Maps.loadModule('Microsoft.Maps.DrawingTools', function () {
    //    //Create an instance of the DrawingTools class and bind it to the map.
    //    var tools = new Microsoft.Maps.DrawingTools(map);
    //
    //    //Show the drawing toolbar and enable editting on the map.
    //    tools.showDrawingManager(function (manager) {
    //        //Store a reference to the drawing manager as it will be useful later.
    //        drawingManager = manager;
    //    })
    //});
    Microsoft.Maps.Events.addHandler(map, 'dblclick', getLatlng);
    updateLocalStorage();
    var test = map.getCenter();
    lat = test.latitude;
    long = test.longitude;
}//end function

var requestUrl;
function getPOIData() {
    //request variables
    const ajax = new XMLHttpRequest;  //asynchronous javascript and xml
    if (polygonOn == false) {
         requestUrl = `https://dev.virtualearth.net/REST/v1/LocalSearch/?query=${searchQuery}&userLocation=${lat},${long}&key=${key}`;  //location of api
    } else {
         requestUrl = `https://dev.virtualearth.net/REST/v1/LocalSearch/?query=${searchQuery}&userMapView=${polygonLeftLat,polygonLeftLong,polygonRightLat,polygonRightLong}&key=${key}`;  //location of api
    }
    
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
    //print the most prevalent to a text box above the map
    var infoString = "";
    displayDiv.innerHTML = "";
    for (var index = 0; index < locationInfo.length; index++) {
        infoString += index+1+": ";
        infoString += "NAME: " + locationInfo[index].name+", ";
        infoString += "ADDRESS: " + locationInfo[index].address+", ";
        infoString += "PHONE NUMBER: " + locationInfo[index].phoneNumber+"<br/>";
        //infoString += "LATITUDE: " +locationInfo[index].latitude+", ";
        //infoString += "LONGITUDE: " + locationInfo[index].longitude+"<br/>";                 
    }//end for
    displayDiv.innerHTML = infoString;
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
    Microsoft.Maps.Events.addHandler(pushpins[0], 'click', function () { storePushpinLocation(0); });
    Microsoft.Maps.Events.addHandler(pushpins[1], 'click', function () { storePushpinLocation(1); });
    Microsoft.Maps.Events.addHandler(pushpins[2], 'click', function () { storePushpinLocation(2); });
    Microsoft.Maps.Events.addHandler(pushpins[3], 'click', function () { storePushpinLocation(3); });
    Microsoft.Maps.Events.addHandler(pushpins[4], 'click', function () { storePushpinLocation(4); });
    Microsoft.Maps.Events.addHandler(pushpins[5], 'click', function () { storePushpinLocation(5); });
    Microsoft.Maps.Events.addHandler(pushpins[6], 'click', function () { storePushpinLocation(6); });
    Microsoft.Maps.Events.addHandler(pushpins[7], 'click', function () { storePushpinLocation(7); });
    Microsoft.Maps.Events.addHandler(pushpins[8], 'click', function () { storePushpinLocation(8); });
    Microsoft.Maps.Events.addHandler(pushpins[9], 'click', function () { storePushpinLocation(9); });
    //for each pushpin make a click event
    //for (var index = 0; index < pushpins.length-1; index++) {
    //    var events = Microsoft.Maps.Events.addHandler(pushpins[index], 'click', function () { storePushpinLocation(index); });
    //}
    //events;
}//end function
function storePushpinLocation(index) {
    //console.log(`you clicked pin ${pushpins[index].entity.title}`)
    
    //if a pushpin is clicked, it's data is added to local storage
    localStorage.setItem(`${locationInfo[index].name}`,
        JSON.stringify({ name: `${locationInfo[index].name}`, address: `${locationInfo[index].address}`, phoneNumber: `${locationInfo[index].phoneNumber}`, latitude: `${locationInfo[index].latitude}`, longitude: `${locationInfo[index].longitude}` })
    );
    var latitude = pushpins[index].geometry.y;
    var longitude = pushpins[index].geometry.x;
    var title = pushpins[index].entity.title;
    displayDirections(latitude, longitude, title);
}//end function
var directionsManager;
function displayDirections(latitude, longitude, title) {

    //Load the directions module.
    Microsoft.Maps.loadModule('Microsoft.Maps.Directions', function () {
        //directionsManager.clearAll(); maybe works
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
    
}//end function
//function test() {
//    var i = 0, entity;
//    while (i < map.entities.getLength()) {
//        entity = map.entities.get(i);
//        i += 1;
//    }
//}

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
    for (var index = 0; index < values.length; index++) {
        if (values[index][0] == "{") {
            jsonParse = JSON.parse(values[index]);
            previousVisit += `NAME: ${jsonParse.name}, PHONENUMBER: ${jsonParse.phoneNumber}, ADDRESS: ${jsonParse.address}, LATITUDE: ${jsonParse.latitude}, LONGITUDE: ${jsonParse.longitude}` + "<br/>";
        }//end if
    }//end for
    storageDiv.innerHTML = previousVisit;
}//end function