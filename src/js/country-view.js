/*****************************/
/*** COUNTRY MAP FUNCTIONS ***/
/*****************************/
function initCountryLayer() {
  //define selected filter values
  var filterVals = getFilterVals();

  //color scale
  var countryColorScale = d3.scaleOrdinal().domain([filterVals[filterVals.length-1], filterVals[0]]).range(colorRange);
  
  //create legend
  createCountryLegend(countryColorScale);

  //mouse events
  map.on('mouseenter', subnationalLayer, onMouseEnter);
  map.on('mouseleave', subnationalLayer, onMouseLeave);
  map.on('mousemove', subnationalLayer, onMouseMove);    
}


function updateCountryLayer() {
  //define selected filter values
  var filterVals = getFilterVals();

  //set layer visiblity
  map.setLayoutProperty(globalLayer, 'visibility', 'none');
  map.setLayoutProperty(subnationalLayer, 'visibility', 'visible');
  map.setLayoutProperty(subnationalBoundaryLayer, 'visibility', 'visible');
  map.setLayoutProperty(subnationalLabelLayer, 'visibility', 'visible');
  map.setLayoutProperty(subnationalMarkerLayer, 'visibility', 'visible');

  //update key figures
  initKeyFigures();

  //update legend scale
  var currenColorRange = (currentIndicator.filter).includes('high') ? colorRange : lowColorRange;
  var countryColorScale = d3.scaleOrdinal().domain([filterVals[filterVals.length-1], filterVals[0]]).range(currenColorRange)
  updateCountryLegend(countryColorScale);

  //update mouse event
  map.on('mousemove', subnationalLayer, onMouseMove);         

  //filter data
  let filteredData = subnationalData.filter((d) => {
    return (d[currentIndicator.id]==filterVals[1] || d[currentIndicator.id]==filterVals[0]);
  });

  //marker scale
  var markerScale = getMarkerScale();

  //data join
  colorNoData = '#F9F9F9';
  var expression = ['match', ['get', 'ADM_PCODE']];
  var expressionBoundary = ['match', ['get', 'ADM_PCODE']];
  var expressionOpacity = ['match', ['get', 'ADM_PCODE']];
  var expressionMarkers = ['match', ['get', 'ADM_PCODE']];
  var expressionMarkerOpacity = ['match', ['get', 'ADM_PCODE']];
  subnationalData.forEach(function(d) {
    var color, boundaryColor, layerOpacity, markerSize, markerOpacity;
    if (d[currentIndicator.id]==filterVals[1] || d[currentIndicator.id]==filterVals[0]) {
      var val = d[currentIndicator.id];
      layerOpacity = 1;
      color = (val==undefined) ? colorNoData : countryColorScale(val);

      //markers
      var targetVal = +d['#targeted'];
      markerSize = markerScale(targetVal);
      markerOpacity = 1;
    }
    else {
      color = colorNoData;
      layerOpacity = 1;
      markerOpacity = 0;
      targetVal = null;
      markerSize = 0;
    }


    expression.push(d['#adm2+code'], color);
    //expressionBoundary.push(d['#adm1+code'], boundaryColor);
    expressionOpacity.push(d['#adm2+code'], layerOpacity);

    //markers
    expressionMarkers.push(d['#adm2+code'], markerSize);
    expressionMarkerOpacity.push(d['#adm2+code'], markerOpacity);
  });
  //set expression defaults
  expression.push(colorDefault);
  expressionBoundary.push('#E0E0E0');
  expressionOpacity.push(0);
  expressionMarkers.push(0);

  map.setPaintProperty(subnationalLayer, 'fill-color', expression);
  map.setPaintProperty(subnationalLayer, 'fill-opacity', 1);
  map.setPaintProperty(subnationalBoundaryLayer, 'line-opacity', expressionOpacity);
  map.setPaintProperty(subnationalLabelLayer, 'text-opacity', expressionOpacity);

  map.setPaintProperty(subnationalMarkerLayer, 'circle-stroke-opacity', 1);
  map.setPaintProperty(subnationalMarkerLayer, 'circle-opacity', 0.75);
  map.setPaintProperty(subnationalMarkerLayer, 'circle-radius', expressionMarkers);
  map.setPaintProperty(subnationalMarkerLayer, 'circle-translate', [0,-7]);
}


function createCountryLegend(scale) {
  //set data sources
  // createSource($('.map-legend.country .ipc-source'), '#affected+food+ipc+p3plus+num');
  // createSource($('.map-legend.country .population-source'), '#population');

  var legend = d3.legendColor()
    .cells(colorRange.length)
    .scale(scale);

  var div = d3.select('.map-legend .legend-scale');
  var svg = div.append('svg')
    .attr('class', 'legend-container');

  svg.append('g')
    .attr('class', 'scale')
    .call(legend);

  //people targeted
  $('.map-legend .legend-scale').append('<h4>Number of People Targeted</h4>');
  $('.map-legend .legend-scale').append('<div class="source-container targeted-source"><p class="small source"><span class="date">Jun 2, 2023</span> | <span class="source-name">Source</span> | <a href="#" class="dataURL" target="_blank" rel="noopener">DATA</a></p></div>');
  //createSource($('.map-legend'), '#targeted');


  var markersvg = div.append('svg')
    .attr('height', '55px')
    .attr('class', 'targeted-scale');
  markersvg.append('g')
    .attr("transform", "translate(5, 10)")
    .attr('class', 'marker-size');

  var markerScale = getMarkerScale();
  var markerLegend = d3.legendSize()
    .scale(markerScale)
    .shape('circle')
    .shapePadding(40)
    .labelFormat(numFormat)
    .labelOffset(15)
    .cells(2)
    .orient('horizontal');

  markersvg.select('.marker-size')
    .call(markerLegend);

  //boundaries disclaimer
  createFootnote('.map-legend', '', 'The boundaries and names shown and the designations used on this map do not imply official endorsement or acceptance by the United Nations.');

  //expand/collapse functionality
  $('.map-legend .toggle-icon, .map-legend .collapsed-title').on('click', function() {
    $(this).parent().toggleClass('collapsed');
    $('.legend-gradient').toggleClass('collapsed');
  });
}


function updateCountryLegend(scale) {
  //update legend
  var legend = d3.legendColor()
    .cells(colorRange.length)
    .scale(scale);

  var g = d3.select('.map-legend .scale');
  g.call(legend);

  //update marker legend
  var test = getMarkerScale();
  var markerLegend = d3.legendSize()
    .scale(test)
    .shape('circle')
    .shapePadding(40)
    .labelFormat(numFormat)
    .labelOffset(15)
    .cells(2)
    .orient('horizontal');

  var markerSize = d3.select('.marker-size');
  markerSize.select('.legendCells').remove();
  markerSize.call(markerLegend);
}


function getCountryIndicatorMax() {
  var max =  d3.max(subnationalData, function(d) { 
    if (d['#country+code']==currentCountry.code) {
      return +d[currentIndicator.id]; 
    }
  });
  return max;
}

function getFilterVals() {
  return currentIndicator['filter'].split('-');
}

function getMarkerScale() {
  var filterVals = getFilterVals();

  //filter data
  let filteredData = subnationalData.filter((d) => {
    return (d[currentIndicator.id]==filterVals[1] || d[currentIndicator.id]==filterVals[0]);
  });

  //marker scale
  var maxTarget = d3.max(filteredData, (d) => +d['#targeted']);
  var minTarget = d3.min(filteredData, (d) => +d['#targeted']);
  var scale = d3.scaleSqrt().domain([minTarget, maxTarget]).range([4, 20]);
  return scale;
}


function resetLayers() {
  map.setLayoutProperty(countryLayer, 'visibility', 'visible')
  map.setLayoutProperty('acled-dots', 'visibility', 'none');
  map.setLayoutProperty('border-crossings-layer', 'visibility', 'visible');
  map.setLayoutProperty('hostilities-layer', 'visibility', 'visible');
  map.setLayoutProperty('macro-regions', 'visibility', 'none');
}


//mouse event/leave events
function onMouseEnter(e) {
  map.getCanvas().style.cursor = 'pointer';
  tooltip.addTo(map);
}
function onMouseLeave(e) {
  map.getCanvas().style.cursor = '';
  tooltip.remove();
}
function onMouseMove(e) {
  //define selected filter values
  var filterVals = getFilterVals();

  var f = map.queryRenderedFeatures(e.point)[0];
  var adm2 = subnationalData.filter(function(c) {
    if (c['#adm2+code']==f.properties.ADM_PCODE)
      return c;
  });

  if (f.properties.ADM_PCODE!=undefined && f.properties.ADM0_REF==currentCountry.name && filterVals.includes(adm2[0]['#crisis'])) {
    map.getCanvas().style.cursor = 'pointer';
    createCountryMapTooltip(f.properties.ADM_REF, f.properties.ADM_PCODE, e.point);
    tooltip
      .addTo(map)
      .setLngLat(e.lngLat);
  }
  else {
    map.getCanvas().style.cursor = '';
    tooltip.remove();
  }
}