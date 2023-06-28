var map, mapFeatures, globalLayer, globalBoundaryLayer, subnationalLayer, subnationalBoundaryLayer, subnationalLabelLayer, subnationalMarkerLayer, tooltip;
var adm0SourceLayer = 'wrl_polbnda_1m_ungis';
var adm1SourceLayer = 'access_polbndl_int_uncs-cja3rr';
var hoveredStateId = null;
function initMap() {
  console.log('Loading map...')
  map = new mapboxgl.Map({
    container: 'global-map',
    style: 'mapbox://styles/humdata/cl3lpk27k001k15msafr9714b',
    center: [43, 5],
    minZoom: minZoom,
    zoom: zoomLevel,
    attributionControl: false
  });

  map.addControl(new mapboxgl.NavigationControl({showCompass: false}))
     .addControl(new mapboxgl.AttributionControl(), 'bottom-right');

  map.on('load', function() {
    console.log('Map loaded')
    
    mapLoaded = true;
    if (dataLoaded==true) displayMap();
  });
}

function displayMap() {
  console.log('Display map');

  //remove loader and show vis
  $('.loader, #static-map').remove();
  $('#global-map, .map-legend').css('opacity', 1);

  //set initial indicator
  currentIndicator = {
    id: $('input[name="countryIndicators"]:checked').val(), 
    name: $('input[name="countryIndicators"]:checked').attr('data-legend'), 
    filter: $('input[name="countryIndicators"]:checked').attr('id')
  };

  //init element events
  createEvents();

  //get layers
  const layers = map.getStyle().layers;
  let labelLayer;
  for (const layer of layers) {
    if (layer.id==='Countries 2-4') {
      labelLayer = layer.id;
      break;
    }
  }

  //add map layers
  //country fills
  map.addSource('country-polygons', {
    'url': 'mapbox://humdata.dozf288z',
    'type': 'vector'
  });
  map.addLayer({
    'id': 'country-fills',
    'type': 'fill',
    'source': 'country-polygons',
    'source-layer': 'access_polbnda_int_uncs-9mvk3r',
    'paint': {
      'fill-color': '#f1f1ee',
      'fill-opacity': 1
    }
  }, labelLayer);
  globalLayer = 'country-fills';

  //country boundaries
  map.addSource('country-lines', {
    'url': 'mapbox://humdata.dd6zo5ht',
    'type': 'vector'
  });
  map.addLayer({
    'id': 'country-boundaries',
    'type': 'line',
    'source': 'country-lines',
    'source-layer': 'access_polbndl_int_uncs-cja3rr',
    'paint': {
      'line-color': '#E0E0E0',
      'line-opacity': 1
    }
  }, labelLayer);
  globalBoundaryLayer = 'country-boundaries';


  //subnational fills
  map.addSource('subnational-polygons', {
    'url': 'mapbox://humdata.69v4osjh',
    'type': 'vector'
  });
  map.addLayer({
    'id': 'subnational-fills',
    'type': 'fill',
    'source': 'subnational-polygons',
    'source-layer': 'access_polbnda_subnational-awnqao',
    'paint': {
      'fill-color': '#f1f1ee',
      'fill-opacity': 1,
    }
  }, labelLayer);
  subnationalLayer = 'subnational-fills';
  map.setLayoutProperty(subnationalLayer, 'visibility', 'none');

  //subnational boundaries
  map.addSource('subnational-lines', {
    'url': 'mapbox://humdata.69v4osjh',
    'type': 'vector'
  });
  map.addLayer({
    'id': 'subnational-boundaries',
    'type': 'line',
    'source': 'subnational-lines',
    'source-layer': 'access_polbnda_subnational-awnqao',
    'paint': {
      'line-color': '#E0E0E0',
      'line-opacity': 1
    }
  }, labelLayer);
  subnationalBoundaryLayer = 'subnational-boundaries';
  map.setLayoutProperty(subnationalBoundaryLayer, 'visibility', 'none');


  //subnational centroids
  map.addSource('subnational-centroids', {
    'url': 'mapbox://humdata.8fwurkgg',
    'type': 'vector'
  });
  map.addLayer({
    'id': 'subnational-labels',
    'type': 'symbol',
    'source': 'subnational-centroids',
    'source-layer': 'access_polbndp_subnational-2u17fm',
    'layout': {
      'text-field': ['get', 'ADM_REF'],
      'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 0, 12, 4, 14],
      'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
      'text-radial-offset': 0.4
    },
    paint: {
      'text-color': '#888',
      'text-halo-color': '#EEE',
      'text-halo-width': 1,
      'text-halo-blur': 1
    }
  });
  subnationalLabelLayer = 'subnational-labels';
  map.setLayoutProperty(subnationalLabelLayer, 'visibility', 'none');

  //subnational markers
  map.addLayer({
    'id': 'subnational-markers',
    'type': 'circle',
    'source': 'subnational-centroids',
    'source-layer': 'access_polbndp_subnational-2u17fm',
    paint: {
      'circle-color': '#888888',
      'circle-stroke-color': '#CCCCCC'
    }
  });
  subnationalMarkerLayer = 'subnational-markers';
  map.setLayoutProperty(subnationalMarkerLayer, 'visibility', 'none');

  mapFeatures = map.queryRenderedFeatures();


  //zoom into region
  // var offset = 100;
  // map.fitBounds(regionBoundaryData[0].bbox, {
  //   padding: {top: offset, right: 0, bottom: offset, left: $('.key-figure-panel').outerWidth()},
  //   linear: true
  // });


  //init global and country layers
  //initGlobalLayer();
  initCountryLayer();

  //deeplink to country if parameter exists
  if (viewInitialized==true) deepLinkView();

  //create tooltip
  tooltip = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    className: 'map-tooltip'
  });
}

function deepLinkView() {
  var location = window.location.search;
  //deep link to country view
  // if (location.indexOf('?c=')>-1) {
  //   var countryCode = location.split('c=')[1].toUpperCase();
  //   if (countryCodeList.hasOwnProperty(countryCode)) {    
  //     $('.country-select').val(countryCode);
  //     currentCountry.code = countryCode;
  //     currentCountry.name = d3.select('.country-select option:checked').text();

  //     //find matched features and zoom to country
  //     var selectedFeatures = matchMapFeatures(currentCountry.code);
  //     selectCountry(selectedFeatures);
  //   }
  // }
  var selectedFeatures = matchMapFeatures(currentCountry.code);
  selectCountry(selectedFeatures);

  //deep link to specific layer in global view
  if (location.indexOf('?layer=')>-1) {
    var layer = location.split('layer=')[1];
    // var menuItem = $('.menu-indicators').find('li[data-layer="'+layer+'"]');
    // menuItem = (menuItem.length<1) ? $('.menu-indicators').find('li[data-layer="covid-19_cases_and_deaths"]') : menuItem;
    // selectLayer(menuItem);
  }
}

function matchMapFeatures(country_code) {
  //loop through mapFeatures to find matches to currentCountry.code
  var selectedFeatures = [];
  mapFeatures.forEach(function(feature) {
    if (feature.sourceLayer==adm0SourceLayer && feature.properties.ISO3_CODE==currentCountry.code) {
      selectedFeatures.push(feature)
    }
  });
  return selectedFeatures;
}

function createEvents() {
  //map legend radio events
  $('input[type="radio"]').click(function(){
    var selected = $('input[name="countryIndicators"]:checked');
    currentIndicator = {id: selected.val(), name: selected.attr('data-legend'), filter: selected.attr('id')};
    //selectLayer(selected);
    if (currentCountry.code=='') {
      updateGlobalLayer();
    }
    else {
      var selectedFeatures = matchMapFeatures(currentCountry.code);
      selectCountry(selectedFeatures);
    }
  });

  //chart view trendseries select event
  // d3.select('.trendseries-select').on('change',function(e) {
  //   var selected = d3.select('.trendseries-select').node().value;
  //   updateTimeseries(selected);
  //   if (currentCountry.code!==undefined && selected!==undefined)
  //     vizTrack(`chart ${currentCountry.code} view`, selected);
  // });


  //country select event
  // d3.select('.country-select').on('change',function(e) {
  //   currentCountry.code = d3.select('.country-select').node().value;
  //   currentCountry.name = d3.select('.country-select option:checked').text();
  //   if (currentCountry.code==='') {
  //     resetMap();
  //     updateGlobalLayer(currentCountry.code);
  //   }
  //   else {
  //     //find matched features and zoom to country
  //     var selectedFeatures = matchMapFeatures(currentCountry.code);
  //     selectCountry(selectedFeatures);
  //   }
  // });
}


function selectLayer(layer) {
  currentIndicator = {id: layer.val(), name: layer.parent().text(), filter: layer.attr('id')};
  updateGlobalLayer();
  //vizTrack(`main ${currentCountry.code} view`, currentCountryIndicator.name);

//   //reset any deep links
//   let layerID = layer.attr('data-layer');
//   let location = (layerID==undefined) ? window.location.pathname : window.location.pathname+'?layer='+layerID;
//   window.history.replaceState(null, null, location);
}


function selectCountry(features) {
  updateCountryLayer();
  // let target = bbox.default(turfHelpers.featureCollection(features));
  // let padding = 40;
  // let mapPadding = (isMobile) ?
  //   {
  //       top: 0,
  //       right: -100,
  //       left: -200,
  //       bottom: 0
  //   } :
  //   { 
  //     top: $('.tab-menubar').outerHeight(),
  //     right: $('.map-legend').outerWidth(),
  //     bottom: padding,
  //     left: $('.key-figure-panel').outerWidth() + padding,
  //   };

  // map.fitBounds(target, {
  //   offset: [0, 0] ,
  //   padding: {top: mapPadding.top, right: mapPadding.right, bottom: mapPadding.bottom, left: mapPadding.left},
  //   linear: true
  // });

  // map.once('moveend', updateCountryLayer);
}




function resetMap() {
  //reset layers
  map.setLayoutProperty(globalLayer, 'visibility', 'visible');
  map.setLayoutProperty(subnationalLayer, 'visibility', 'none');
  map.setLayoutProperty(subnationalBoundaryLayer, 'visibility', 'none');
  map.setLayoutProperty(subnationalLabelLayer, 'visibility', 'none');
  map.setLayoutProperty(subnationalMarkerLayer, 'visibility', 'none');

  var offset = 100;
  map.fitBounds(regionBoundaryData[0].bbox, {
    padding: {top: offset, right: 0, bottom: offset, left: $('.key-figure-panel').outerWidth()},
    linear: true
  });
  map.once('moveend', initKeyFigures);
}
