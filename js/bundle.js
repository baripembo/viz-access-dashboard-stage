window.$ = window.jQuery = require('jquery');
var bbox = require('@turf/bbox');
var turfHelpers = require('@turf/helpers');
/******************/
/*** SPARKLINES ***/
/******************/
function createSparkline(data, div, size) {
  var width = (isMobile) ? 30 : 60;
  var height = 20;
  var x = d3.scaleLinear().range([0, width]);
  var y = d3.scaleLinear().range([height, 0]);
  var parseDate = d3.timeParse("%Y-%m-%d");
  var line = d3.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.value); })
    .curve(d3.curveBasis);

  data.forEach(function(d) {
    d.date = parseDate(d.date);
    d.value = +d.value;
  });

  x.domain(d3.extent(data, function(d) { return d.date; }));
  y.domain(d3.extent(data, function(d) { return d.value; }));

  var svg = d3.select(div)
    .append('svg')
    .attr('class', 'sparkline')
    .attr('width', width)
    .attr('height', height+5)
    .append('g')
      .attr('transform', 'translate(0,4)');
    
  svg.append('path')
   .datum(data)
   .attr('class', 'sparkline')
   .attr('d', line);
}


/****************************************/
/*** TIMESERIES CHART FUNCTIONS ***/
/****************************************/
function initTimeseries(data, div) {
  let formattedData = formatData(data);
  $('.trendseries-title').html('<h6>Total Number of Conflict Events</h6><div class="num">'+numFormat(data.length)+'</div>');
  createTimeSeries(formattedData, div);
}

let eventsArray;
function formatData(data) {
  let events = d3.nest()
    .key(function(d) { return d['#event+type']; })
    .key(function(d) { return d['#date+occurred']; })
    .rollup(function(leaves) { return leaves.length; })
    .entries(data);
  events.sort((a, b) => (a.key > b.key) ? 1 : -1);

  let dates = [... new Set(acledData.map((d) => d['#date+occurred']))];
  let totals = [];

  eventsArray = [];
  events.forEach(function(event) {
    let array = [];
    dates.forEach(function(date, index) {
      let val = 0;
      event.values.forEach(function(e) {
        if (e.key==date)
          val = e.value;
      });
      totals[index] = (totals[index]==undefined) ? val : totals[index]+val; //save aggregate of all events per day
      array.push(val); //save each event per day
    });
    array.reverse();
    array.unshift(event.key);
    eventsArray.push(array);
  });

  //format for c3
  dates.unshift('x');
  totals.unshift('All');
  return {series: [dates, totals], events: eventsArray};
}


function createTimeSeries(data, div) {
  const chartWidth = viewportWidth - $('.key-figure-panel').width() - 100;
  const chartHeight = 280;
  let colorArray = ['#F8B1AD'];

  var chart = c3.generate({
    size: {
      width: chartWidth,
      height: chartHeight
    },
    padding: {
      bottom: (isMobile) ? 60 : 0,
      top: 10,
      left: (isMobile) ? 30 : 35,
      right: (isMobile) ? 200 : 200
    },
    bindto: div,
    data: {
      x: 'x',
      columns: data.series,
      type: 'bar'
    },
    bar: {
        width: {
            ratio: 0.5
        }
    },
    color: {
      pattern: colorArray
    },
    point: { show: false },
    grid: {
      y: {
        show: true
      }
    },
    axis: {
      x: {
        type: 'timeseries',
        tick: { 
          outer: false
        }
      },
      y: {
        min: 0,
        padding: { 
          top: (isMobile) ? 20 : 50, 
          bottom: 0 
        },
        tick: { 
          outer: false,
          //format: d3.format('d')
          format: function(d) {
            if (Math.floor(d) != d){
              return;
            }
            return d;
          }
        }
      }
    },
    legend: {
      show: false
    },
    transition: { duration: 500 },
    tooltip: {
      contents: function (d, defaultTitleFormat, defaultValueFormat, color) {
        let events = eventsArray;
        let id = d[0].index + 1;
        let date = new Date(d[0].x);
        let total = 0;
        let html = `<table><thead><tr><th colspan="2">${moment(date).format('MMM D, YYYY')}</th></tr><thead>`;
        for (var i=0; i<=events.length-1; i++) {
          if (events[i][id]>0) {
            html += `<tr><td>${events[i][0]}</td><td>${events[i][id]}</td></tr>`;
            total += events[i][id];
          }
        };
        html += `<tr><td><b>Total</b></td><td><b>${total}</b></td></tr></table>`;
        return html;
      }
    }
  });

  countryTimeseriesChart = chart;
  createSource($('#chart-view .source-container'), '#date+latest+acled');
}


function updateTimeseries(selected) {
  let filteredData = (selected!='All') ? acledData.filter((d) => d['#adm1+code'] == selected) : acledData;
  let data = formatData(filteredData);
  eventsArray = data.events;
  $('.trendseries-title').find('.num').html(numFormat(filteredData.length));

  if (filteredData.length<=0)
    $('.trendseries-chart').hide();
  else 
    $('.trendseries-chart').show();

  countryTimeseriesChart.load({
    columns: data.series
  });
}


/***************************/
/*** PIE CHART FUNCTIONS ***/
/***************************/
function createPieChart(data, div) {
  let requirement = data[0];
  let funded = data[1];
  let fundedPercent = funded/requirement;

  let width = (isMobile) ? 25 : 30
      height = width
      margin = 1

  let radius = Math.min(width, height)/2 - margin

  let svg = d3.select(div)
    .append('svg')
      .attr('class', 'pie-chart')
      .attr('width', width)
      .attr('height', height)
    .append('g')
      .attr('transform', `translate(${width/2}, ${height/2})`);

  let dataArray = {a: fundedPercent, b: 1-fundedPercent};

  let color = d3.scaleOrdinal()
    .domain(data)
    .range(['#418FDE', '#DFDFDF'])

  let pie = d3.pie()
    .value(function(d) { return d.value; }).sort(null);
  let formatData = pie(d3.entries(dataArray));

  svg
    .selectAll('g')
    .data(formatData)
    .enter()
    .append('path')
    .attr('d', d3.arc()
      .innerRadius(0)
      .outerRadius(radius)
    )
    .attr('fill', function(d){ return( color(d.data.key)) })
    .style('stroke-width', 0)
}


/*************************/
/*** RANKING BAR CHART ***/
/*************************/
var rankingX, rankingY, rankingBars, rankingData, rankingBarHeight, valueFormat;
function createRankingChart() {
  //clear chart
  $('.ranking-chart').empty();
  
  //set title
  var rankingTitle = $('.key-figure-panel').find('.ranking-title');
  rankingTitle.text('Top 10 Areas with High/Extreme Access Constraint Levels by Number of People Targeted');

  //filter data
  var filterVals = getFilterVals();
  let rankingData = subnationalData.filter((d) => {
    return (d[currentIndicator.id]==filterVals[1] || d[currentIndicator.id]==filterVals[0]);
  });

  //get max value
  var valueMax = d3.max(rankingData, function(d) { return +d['#targeted']; });

  //define color range
  var currentColorRange = (currentIndicator.filter).includes('high') ? colorRange : lowColorRange;
  var countryColorScale = d3.scaleOrdinal().domain([filterVals[filterVals.length-1], filterVals[0]]).range(currentColorRange)

  //sort and take top 10
  rankingData.sort(function(a, b){ return d3.descending(+a['#targeted'], +b['#targeted']); });
  rankingData = rankingData.slice(0, 10);

  //draw chart
  rankingBarHeight = 13;
  var barPadding = 9;

  //determine height available for chart
  var availSpace = viewportHeight - $('.ranking-chart').position().top - 40;
  var numRows = Math.floor(availSpace/(rankingBarHeight+barPadding));
  var rankingChartHeight = ((rankingBarHeight+barPadding) * numRows) + 14;
  $('.ranking-chart').css('height', rankingChartHeight);

  var margin = {top: 0, right: 70, bottom: 15, left: 100},
      width = $('.key-figure-panel').width() - margin.left - margin.right,
      height = (rankingBarHeight + barPadding) * rankingData.length;

  var svg = d3.select('.ranking-chart').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  rankingX = d3.scaleLinear()
    .range([0, width])
    .domain([0, valueMax]);

  rankingY = d3.scaleBand()
    .range([0, height])
    .domain(rankingData.map(function (d) {
      return d['#adm2+name'];
    }));

  var yAxis = d3.axisLeft(rankingY)
    .tickSize(0);

  var gy = svg.append('g')
    .attr('class', 'y axis')
    .call(yAxis)

  rankingBars = svg.selectAll('.bar')
    .data(rankingData)
    .enter().append('g')
    .attr('class', 'bar-container')
    .attr('fill', function(d, i) { return countryColorScale(d['#crisis']); })
    .attr('transform', function(d, i) { return 'translate(1,' + (rankingY(d['#adm2+name']) + rankingBarHeight/2) + ')'; });

  //append rects
  rankingBars.append('rect')
    .attr('class', 'bar')
    .attr('height', rankingBarHeight)
    .attr('width', function (d) {
      return (d['#targeted']<=0) ? 0 : rankingX(d['#targeted']);
    });

  //add country names
  rankingBars.append('text')
    .attr('class', 'name')
    .attr('x', -3)
    .attr('y', 9)
    // .text(function (d) {
    //   return truncateString(d['#adm2+name'], 15);
    // })
    .append('svg:title')
    .text(function(d) { return d['#adm2+name']; });

  //add a value label to the right of each bar
  rankingBars.append('text')
    .attr('class', 'label')
    .attr('fill', '#000')
    .attr('y', 9)
    .attr('x', function (d) {
      var xpos = (d['#targeted']<=0) ? 0 : rankingX(d['#targeted']);
      return xpos + 3;
    })
    .text(function (d) {
      return numFormat(d['#targeted']);
    });
}

// function formatRankingData(indicator, sorter) {
//   var rankingByCountry = d3.nest()
//     .key(function(d) {
//       if (regionMatch(d['#region+name'])) return d['#country+name']; 
//     })
//     .rollup(function(v) {
//       if (regionMatch(v[0]['#region+name'])) return v[0][indicator];
//     })
//     .entries(nationalData);

//   var data = rankingByCountry.filter(function(item) {
//     return isVal(item.value) && !isNaN(item.value);
//   });
//   data.sort(function(a, b){ return d3.descending(+a.value, +b.value); });
//   return data;
// }

function updateRankingChart(sortMode, secondarySortMode) {
  if (sortMode=='ascending' || sortMode=='descending') {
    //sort the chart
    rankingData.sort(function(a, b){
      if (sortMode=='ascending')
        return d3.ascending(+a.value, +b.value); 
      else
        return d3.descending(+a.value, +b.value);
    });
    rankingY.domain(rankingData.map(function (d) { return d.key; }));
    rankingBars.transition()
      .duration(400)
      .attr('transform', function(d, i) { 
        return 'translate(1,' + (rankingY(d.key) + rankingBarHeight/2) + ')'; 
      });
  }
  else {
    //empty and redraw chart with new indicator
    $('.key-figure-panel').find('.ranking-chart').empty();

    rankingData = formatRankingData(sortMode, secondarySortMode);
    rankingData.sort(function(a, b){
       return d3.descending(+a.value, +b.value);
    });

    if (rankingData.length<1) {
      $('.ranking-chart').append('<p>No Data</p>');
      $('.ranking-chart > p').css('text-align', 'center');
    }

    var valueMax = d3.max(rankingData, function(d) { return +d.value; });
    valueFormat = (sortMode.indexOf('pct')>-1) ? d3.format('.2%') : d3.format(',.0f');

    //draw chart
    rankingBarHeight = 13;
    var barPadding = 9;

    //determine height available for chart
    var availSpace = viewportHeight - $('.ranking-chart').position().top - 40;
    var numRows = Math.floor(availSpace/(rankingBarHeight+barPadding));
    var rankingChartHeight = ((rankingBarHeight+barPadding) * numRows) + 14;
    $('.ranking-chart').css('height', rankingChartHeight);

    var margin = {top: 0, right: 70, bottom: 15, left: 100},
        width = $('.secondary-panel').width() - margin.left - margin.right,
        height = (rankingBarHeight + barPadding) * rankingData.length;

    var svg = d3.select('.ranking-chart').append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    rankingX = d3.scaleLinear()
      .range([0, width])
      .domain([0, valueMax]);

    rankingY = d3.scaleBand()
      .range([0, height])
      .domain(rankingData.map(function (d) {
        return d.key;
      }));

    var yAxis = d3.axisLeft(rankingY)
      .tickSize(0);

    var gy = svg.append('g')
      .attr('class', 'y axis')
      .call(yAxis)

    rankingBars = svg.selectAll('.bar')
      .data(rankingData)
      .enter().append('g')
      .attr('class', 'bar-container')
      .attr('transform', function(d, i) { return 'translate(1,' + (rankingY(d.key) + rankingBarHeight/2) + ')'; });

    //append rects
    rankingBars.append('rect')
      .attr('class', 'bar')
      .attr('height', rankingBarHeight)
      .transition()
        .duration(400)
      .attr('width', function (d) {
        return (d.value<=0) ? 0 : rankingX(d.value);
      });

    //add country names
    rankingBars.append('text')
      .attr('class', 'name')
      .attr('x', -3)
      .attr('y', 9)
      .text(function (d) {
        return truncateString(d.key, 15);
      })

    //add a value label to the right of each bar
    rankingBars.append('text')
      .attr('class', 'label')
      .attr('y', 9)
      .attr('x', function (d) {
        var xpos = (d.value<=0) ? 0 : rankingX(d.value);
        return xpos + 3;
      })
      .text(function (d) {
        if (sortMode.indexOf('pct')>-1 && d.value>1) d.value = 1;
        return valueFormat(d.value);
      });
  }
}

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
  var currentColorRange = (currentIndicator.filter).includes('high') ? colorRange : lowColorRange;
  var countryColorScale = d3.scaleOrdinal().domain([filterVals[filterVals.length-1], filterVals[0]]).range(currentColorRange)
  updateCountryLegend(countryColorScale);

  //update mouse event
  map.on('mousemove', subnationalLayer, onMouseMove);

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

  let legendTitle = $('input[name="countryIndicators"]:checked').attr('data-legend');
  $('.map-legend .legend-title').html(legendTitle);


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
    .attr("transform", "translate(15, 10)")
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
/****************************/
/*** GLOBAL MAP FUNCTIONS ***/
/****************************/
function handleGlobalEvents(layer) {
  map.on('mouseenter', globalLayer, function(e) {
    map.getCanvas().style.cursor = 'pointer';
    tooltip.addTo(map);
  });

  map.on('mousemove', globalLayer, function(e) {
    var features = map.queryRenderedFeatures(e.point, { layers: [globalLayer] });
    var target;
    features.forEach(function(feature) {
      if (feature.sourceLayer==adm1SourceLayer)
        target = feature;
    });      
    if (target!=undefined) {
      tooltip.setLngLat(e.lngLat);
      createMapTooltip(target.properties.ISO_3, target.properties.Terr_Name, e.point);
    }
  });
     
  map.on('mouseleave', globalLayer, function() {
    map.getCanvas().style.cursor = '';
    tooltip.remove();
  });
}


function initGlobalLayer() {
  initKeyFigures();

  //color scale
  colorScale = getGlobalLegendScale();
  createMapLegend(colorScale);

  //data join
  var expression = ['match', ['get', 'ISO_3']];
  nationalData.forEach(function(d) {
    var val = d[currentIndicator.id];
    var color = (val==null) ? colorNoData : colorScale(val);
    expression.push(d['#country+code'], color);
  });

  //default value for no data
  expression.push(colorDefault);
  
  //set properties
  map.setPaintProperty(globalLayer, 'fill-color', expression);

  //define mouse events
  handleGlobalEvents();
}


function updateGlobalLayer() {
  //color scale
  colorScale = getGlobalLegendScale();

  //data join
  var expression = ['match', ['get', 'ISO_3']];
  nationalData.forEach(function(d) {
    var val = d[currentIndicator.id];
    var color = (val==null) ? colorNoData : colorScale(val);
    expression.push(d['#country+code'], color);
  });

  //default value for no data
  expression.push(colorDefault);
  
  //update map and legend
  map.setPaintProperty(globalLayer, 'fill-color', expression);
  updateMapLegend(colorScale);

  //toggle pop density rasters
  var countryList = Object.keys(countryCodeList);
  let state = (currentIndicator.id=='#population') ? 'visible' : 'none';
  countryList.forEach(function(country_code) {
    if (currentCountry.code=='' || country_code==currentCountry.code) {
      var id = country_code.toLowerCase();
      if (map.getLayer(id+'-popdensity'))
        map.setLayoutProperty(id+'-popdensity', 'visibility', state);
    }
  });
}


function createMapLegend(scale) {
  //set legend title
  let legendTitle = $('input[name="countryIndicators"]:checked').attr('data-legend');
  $('.map-legend .legend-title').html(legendTitle);

  //set data sources
  createSource($('.map-legend .ipc-source'), '#affected+food+ipc+p3plus+num');
  createSource($('.map-legend .population-source'), '#population');

  var legend = d3.legendColor()
    .labelFormat(shortenNumFormat)
    .cells(colorRange.length)
    .scale(scale);

  var div = d3.select('.map-legend .legend-scale');
  var svg = div.append('svg')
    .attr('class', 'legend-container');

  svg.append('g')
    .attr('class', 'scale')
    .call(legend);

  //no data
  var nodata = div.append('svg')
    .attr('class', 'no-data-key');

  nodata.append('rect')
    .attr('width', 15)
    .attr('height', 15);

  nodata.append('text')
    .attr('class', 'label')
    .text('No Data');

  //boundaries disclaimer
  createFootnote('.map-legend', '', 'The boundaries and names shown and the designations used on this map do not imply official endorsement or acceptance by the United Nations.');

  //expand/collapse functionality
  $('.map-legend .toggle-icon, .map-legend .collapsed-title').on('click', function() {
    $(this).parent().toggleClass('collapsed');
    $('.legend-gradient').toggleClass('collapsed');
  });
}


function updateMapLegend(scale) {
  //set legend title
  let legendTitle = $('input[name="countryIndicators"]:checked').attr('data-legend');
  $('.map-legend .legend-title').html(legendTitle);

  //update legend
  var legend = d3.legendColor()
    .labelFormat(shortenNumFormat)
    .cells(colorRange.length)
    .scale(scale);

  var g = d3.select('.map-legend .scale');
  g.call(legend);
}


function getGlobalLegendScale() {
  //get min/max
  var min = d3.min(nationalData, function(d) { 
    return +d[currentIndicator.id]; 
  });
  var max = d3.max(nationalData, function(d) { 
    return +d[currentIndicator.id];
  });

  //set color range
  var clrRange;
  switch(currentIndicator.id) {
    case '#population':
      clrRange = populationColorRange;
      break;
    default:
      clrRange = colorRange;
  }

  //set scale
  var scale = d3.scaleQuantize().domain([0, max]).range(clrRange);

  return (max==undefined) ? null : scale;
}

function setGlobalLegend(scale) {
  var div = d3.select('.map-legend');
  var svg;
  var indicator = currentIndicator.id;
  $('.map-legend .source-secondary').empty();

  //SETUP
  if ($('.map-legend .scale').empty()) {
    //current indicator
    createSource($('.map-legend .indicator-source'), indicator);
    svg = div.append('svg')
      .attr('class', 'legend-container');
    svg.append('g')
      .attr('class', 'scale');

    //expand/collapse functionality
    $('.map-legend .toggle-icon, .map-legend .collapsed-title').on('click', function() {
      $(this).parent().toggleClass('collapsed');
    });
  }
  else {
    updateSource($('.indicator-source'), indicator);
  }

  //set legend title
  let legendTitle = $('input[name="countryIndicators"]:checked').attr('data-legend');
  $('.map-legend .legend-title').html(legendTitle);

  //current indicator
  if (scale==null) {
    $('.map-legend .legend-container').hide();
  }
  else {
    $('.map-legend .legend-container').show();
    var layerID = currentIndicator.id.replaceAll('+','-').replace('#','');
    $('.map-legend .legend-container').attr('class', 'legend-container '+ layerID);

    var legendFormat = (currentIndicator.id.indexOf('pct')>-1 || currentIndicator.id.indexOf('ratio')>-1) ? d3.format('.0%') : shortenNumFormat;
    var legend = d3.legendColor()
      .labelFormat(legendFormat)
      .cells(colorRange.length)
      .scale(scale);
    var g = d3.select('.map-legend .scale');
    g.call(legend);
  }

  //no data
  var noDataKey = $('.map-legend .no-data-key');
  noDataKey.find('.label').text('No Data');
  noDataKey.find('rect').css('fill', '#FFF');
}

function vizTrack(view, content) {
  // mpTrack(view, content);
  // gaTrack('viz interaction hdx', 'switch viz', 'access dashboard', content);
}

function mpTrack(view, content) {
  //mixpanel event
  mixpanel.track('viz interaction', {
    'page title': document.title,
    'embedded in': window.location.href,
    'action': 'switch viz',
    'viz type': 'access dashboard',
    'current view': view,
    'content': content
  });
}

function gaTrack(eventCategory, eventAction, eventLabel, type) {
  dataLayer.push({
    'event': eventCategory,
    'label': eventAction,
    'type': eventLabel
  });
}


function truncateString(str, num) {
  if (str.length <= num) {
    return str;
  }
  return str.slice(0, num) + '...';
}


function formatValue(val) {
  var format = d3.format('$.3s');
  var value;
  if (!isVal(val)) {
    value = 'NA';
  }
  else {
    value = (isNaN(val) || val==0) ? val : format(val).replace(/G/, 'B');
  }
  return value;
}


function roundUp(x, limit) {
  return Math.ceil(x/limit)*limit;
}


function isVal(value) {
  return (value===undefined || value===null || value==='') ? false : true;
}

function randomNumber(min, max) { 
  return Math.random() * (max - min) + min;
}

function createFootnote(target, indicator, text) {
  var indicatorName = (indicator==undefined) ? '' : indicator;
  var className = (indicatorName=='') ? 'footnote' : 'footnote footnote-indicator';
  var footnote = $(`<p class='${className}' data-indicator='${indicatorName}'>${truncateString(text, 65)}<a href='#' class='expand'>MORE</a></p>`);
  $(target).append(footnote);
  footnote.click(function() {
    if ($(this).find('a').hasClass('collapse')) {
      $(this).html(`${truncateString(text, 65)}<a href='#' class='expand'>MORE</a>`);
    }
    else {
      $(this).html(`${text}<a href='#' class='collapse'>LESS</a>`);
    }
  });
}


function getCurvedLine(start, end) {
  const radius = turf.rhumbDistance(start, end);
  const midpoint = turf.midpoint(start, end);
  const bearing = turf.rhumbBearing(start, end) - 89; // <-- not 90˚
  const origin = turf.rhumbDestination(midpoint, radius, bearing);

  const curvedLine = turf.lineArc(
    origin,
    turf.distance(origin, start),
    turf.bearing(origin, end),
    turf.bearing(origin, start),
    { steps: 128 }
  );

  return { line: curvedLine, bearing: bearing };
}


//country codes and raster ids
const countryCodeList = {
  ETH: '8l382re2',
  KEN: '2e1m7o07',
  SOM: '3s7xeitz'
};


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

/***********************/
/*** PANEL FUNCTIONS ***/
/***********************/
function initKeyFigures() {
  // //var data = (currentCountry.code=='') ? regionalData : dataByCountry[currentCountry.code][0];
  // var data = (currentCountry.code=='') ? regionalData : subnationalData;

  //  //humanitarian impact figures
  // var impactDiv = $('.key-figure-panel .impact .panel-inner');
  // impactDiv.children().remove();  
  // createFigure(impactDiv, {className: 'population', title: 'Population', stat: shortenNumFormat(data['#population']), indicator: '#population'});

    //ranking chart
  createRankingChart();
}



function createFigure(div, obj) {
  div.append('<div class="figure '+ obj.className +'"><div class="figure-inner"></div></div>');
  var divInner = $('.'+ obj.className +' .figure-inner');
  if (obj.title != undefined) divInner.append('<h6 class="title">'+ obj.title +'</h6>');
  divInner.append('<p class="stat">'+ obj.stat +'</p>');

  // if (obj.indicator!='')
  //   createSource(divInner, obj.indicator);
}


/************************/
/*** SOURCE FUNCTIONS ***/
/************************/
function createSource(div, indicator) {
  // var sourceObj = getSource(indicator);
  // var date = (sourceObj['#date']==undefined) ? '' : dateFormat(new Date(sourceObj['#date']));

  // var sourceName = (sourceObj['#meta+source']==undefined) ? '' : sourceObj['#meta+source'];
  // var sourceURL = (sourceObj['#meta+url']==undefined) ? '#' : sourceObj['#meta+url'];
  // let sourceContent = `<p class='small source'><span class='date'>${date}</span> | <span class='source-name'>${sourceName}</span>`;
  // if (sourceURL!=='#') sourceContent += ` | <a href='${sourceURL}' class='dataURL' target='_blank' rel='noopener'>DATA</a>`;
  // sourceContent += `</p>`;
  // div.append(sourceContent);
}

function updateSource(div, indicator) {
  var sourceObj = getSource(indicator);
  var date = (sourceObj['#date']==undefined) ? '' : dateFormat(new Date(sourceObj['#date']));
  var sourceName = (sourceObj['#meta+source']==undefined) ? '' : sourceObj['#meta+source'];
  var sourceURL = (sourceObj['#meta+url']==undefined) ? '#' : sourceObj['#meta+url'];
  div.find('.date').text(date);
  div.find('.source-name').text(sourceName);
  div.find('.dataURL').attr('href', sourceURL);
}

function getSource(indicator) {
  var isGlobal = ($('.content').hasClass('country-view')) ? false : true;
  var obj = {};
  sourcesData.forEach(function(item) {
    if (item['#indicator+name']==indicator) {
      obj = item;
    }
  });
  return obj;
}
/*************************/
/*** TOOLTIP FUNCTIONS ***/
/*************************/
function createMapTooltip(country_code, country_name, point) {
  var country = nationalData.filter(c => c['#country+code'] == country_code);
  if (country[0]!=undefined) {
    var val = country[0][currentIndicator.id];

    //format content for tooltip
    if (isVal(val)) {
      val = shortenNumFormat(val);
    }
    else {
      val = 'No Data';
    }

    //format content for display
    var content = '<h2>'+ country_name +'</h2>';

    //ipc layer
    if (currentIndicator.id=='#affected+food+ipc+p3plus+num') {
      var dateSpan = '';
      if (country[0]['#date+ipc+start']!=undefined) {
        var startDate = new Date(country[0]['#date+ipc+start']);
        var endDate = new Date(country[0]['#date+ipc+end']);
        startDate = (startDate.getFullYear()==endDate.getFullYear()) ? d3.utcFormat('%b')(startDate) : d3.utcFormat('%b %Y')(startDate);
        var dateSpan = '<span class="subtext">('+ startDate +'-'+ d3.utcFormat('%b %Y')(endDate) +' - '+ country[0]['#date+ipc+period'] +')</span>';
      }
      var shortVal = (isNaN(val)) ? val : shortenNumFormat(val);
      content += 'Total Population in IPC Phase 3+ '+ dateSpan +':<div class="stat">' + shortVal + '</div>';
      if (val!='No Data') {
        if (country[0]['#affected+food+ipc+analysed+num']!=undefined) content += '<span>('+ shortenNumFormat(country[0]['#affected+food+ipc+analysed+num']) +' of total country population analysed)</span>';
        var tableArray = [{label: 'IPC Phase 3 (Critical)', value: country[0]['#affected+food+ipc+p3+num']},
                          {label: 'IPC Phase 4 (Emergency)', value: country[0]['#affected+food+ipc+p4+num']},
                          {label: 'IPC Phase 5 (Famine)', value: country[0]['#affected+food+ipc+p5+num']}];
        content += '<div class="table-display">Breakdown:';
        tableArray.forEach(function(row) {
          if (row.value!=undefined) {
            var shortRowVal = (row.value==0) ? 0 : shortenNumFormat(row.value);
            content += '<div class="table-row"><div>'+ row.label +':</div><div>'+ shortRowVal +'</div></div>';
          }
        });
        content += '</div>';
      }
    }
    //all other layers
    else {
      content += currentIndicator.name + ':<div class="stat">' + val + '</div>';
    }

    //set content for tooltip
    tooltip.setHTML(content);

    setTooltipPosition(point);
  }
}


function createCountryMapTooltip(adm2_name, adm2_pcode, point) {
  var adm2 = subnationalData.filter(function(c) {
    if (c['#adm2+code']==adm2_pcode) // && c['#country+code']==currentCountry.code
      return c;
  });

  if (adm2[0]!=undefined) {
    var val = adm2[0]['#crisis'];//currentIndicator.id
    var label = currentIndicator.name;

    //format content for tooltip
    // if (val!=undefined && val!='' && !isNaN(val)) {
    //   val = shortenNumFormat(val);
    // }
    // else {
    //   val = 'No Data';
    // }

    let content = '';
    content = `<h2>${adm2_name}, Somalia</h2>${label}:<div class="stat">${val}</div>`;
    content += `<div class="table-display">`;
    content += `<div class="table-row"><div>People Targeted:</div><div>${numFormat(adm2[0]['#targeted'])}</div></div>`;
    content += `</div>`;

    tooltip.setHTML(content);
    //if (!isMobile) setTooltipPosition(point)
  }
}


function setTooltipPosition(point) {
  var tooltipWidth = $('.map-tooltip').width();
  var tooltipHeight = $('.map-tooltip').height();
  var anchorDirection = (point.x + tooltipWidth > viewportWidth) ? 'right' : 'left';
  var yOffset = 0;
  if (point.y + tooltipHeight/2 > viewportHeight) yOffset = viewportHeight - (point.y + tooltipHeight/2);
  if (point.y - tooltipHeight/2 < 0) yOffset = tooltipHeight/2 - point.y;
  var popupOffsets = {
    'right': [0, yOffset],
    'left': [0, yOffset]
  };
  tooltip.options.offset = popupOffsets;
  tooltip.options.anchor = anchorDirection;

  if (yOffset>0) {
    $('.mapboxgl-popup-tip').css('align-self', 'flex-start');
    $('.mapboxgl-popup-tip').css('margin-top', point.y);
  }
  else if (yOffset<0)  {
    $('.mapboxgl-popup-tip').css('align-self', 'flex-end');
    $('.mapboxgl-popup-tip').css('margin-bottom', viewportHeight-point.y-10);
  }
  else {
    $('.mapboxgl-popup-tip').css('align-self', 'center');
    $('.mapboxgl-popup-tip').css('margin-top', 0);
    $('.mapboxgl-popup-tip').css('margin-bottom', 0);
  }
}
var numFormat = d3.format(',');
var shortenNumFormat = d3.format('.2s');
var percentFormat = d3.format('.1%');
var dateFormat = d3.utcFormat("%b %d, %Y");
var chartDateFormat = d3.utcFormat("%-m/%-d/%y");
var colorRange = ['#C25048','#F2645A'];
var lowColorRange = ['#F7A29C','#FCE0DE'];
var colorDefault = '#F2F2EF';
var colorNoData = '#FFF';
var regionBoundaryData, regionalData, nationalData, subnationalDataByCountry, dataByCountry, colorScale, viewportWidth, viewportHeight = '';
var countryTimeseriesChart = '';
var mapLoaded = false;
var dataLoaded = false;
var viewInitialized = false;
var isMobile = false;
var zoomLevel = 5.3;
var minZoom = 2;

var globalCountryList = [];
var currentIndicator = {};
var currentCountry = {};

mapboxgl.baseApiUrl='https://data.humdata.org/mapbox';
mapboxgl.accessToken = 'cacheToken';

$( document ).ready(function() {
  var prod = (window.location.href.indexOf('ocha-dap')>-1 || window.location.href.indexOf('data.humdata.org')>-1) ? true : false;
  //console.log(prod);

  var tooltip = d3.select('.tooltip');
  var minWidth = 1000;
  viewportWidth = (window.innerWidth<minWidth) ? minWidth : window.innerWidth;
  viewportHeight = window.innerHeight;


  function init() {
    //detect mobile users
    if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
      $('.mobile-message').show();
      isMobile = true;
      minZoom = 1;
      zoomLevel = 3;
    }
    $('.mobile-message').on('click', function() {
      $(this).remove();
    });

    //set content sizes based on viewport
    $('.content').width(viewportWidth);
    $('.content').height(viewportHeight);
    $('.content-right').width(viewportWidth);
    $('.key-figure-panel .panel-content').height(viewportHeight - $('.key-figure-panel .panel-content').position().top);
    $('.map-legend.country').css('max-height', viewportHeight - 200);
    if (viewportHeight<696) {
      zoomLevel = 1.4;
    }
    $('#chart-view').height(viewportHeight-$('.tab-menubar').outerHeight()-30);

    //load static map -- will only work for screens smaller than 1280
    if (viewportWidth<=1280) {
      var staticURL = 'https://api.mapbox.com/styles/v1/humdata/cl0cqcpm4002014utgdbhcn4q/static/-25,0,2/'+viewportWidth+'x'+viewportHeight+'?access_token='+mapboxgl.accessToken;
      $('#static-map').css('background-image', 'url('+staticURL+')');
    }

    getData();
    initMap();
  }

  function getData() {
    console.log('Loading data...')
    let dataURL = 'https://proxy.hxlstandard.org/data.objects.json?dest=data_view&url=https://docs.google.com/spreadsheets/d/e/2PACX-1vTJp-5o-vhEXB9G5TBHmIj3TV80Grin3mF4tkE-czZPSkwj30xr6ygFGka2QYsT4Q/pub?gid%3D1938495719%26single%3Dtrue%26output%3Dcsv';
    //'https://proxy.hxlstandard.org/data.objects.json?dest=data_view&url=https://docs.google.com/spreadsheets/d/e/2PACX-1vQYGRkpT63nUR5AUg9LVh0bUu1nlxUwL9UEGYtukZXiVHPMSd1SQpTEgYhmwxrjGA/pub?output%3Dcsv'
    Promise.all([
      d3.json(dataURL),
      d3.csv('https://unitednations.sharepoint.com/:x:/r/sites/test728/_layouts/15/Doc.aspx?sourcedoc=%7B6F9458F5-F898-4982-979C-C838ACAD1A86%7D&file=test%20private%20data.xlsx&action=default&mobileredirect=true')
    ]).then(function(data) {
      console.log('Data loaded');
      $('.loader span').text('Initializing map...');


      //parse data
      var allData = data[0];
      console.log('xls',data[1])
      // regionalData = allData.regional_data[0];
      // nationalData = allData.national_data;
      subnationalData = data[0];
      // sourcesData = allData.sources_data;
      // regionBoundaryData = data[1].features; 

      //format data
      subnationalData.forEach(function(item) {
        item['#targeted'] = parseInt(item['#targeted'].replace(/,/g, ''), 10);
      });

      // //parse national data
      // nationalData.forEach(function(item) {
      //   //keep global list of countries
      //   globalCountryList.push({
      //     'name': item['#country+name'],
      //     'code': item['#country+code']
      //   });
      //   globalCountryList.sort(function(a,b) {
      //     return (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0;
      //   });
      // });

      // //group national data by country -- drives country panel    
      // dataByCountry = d3.nest()
      //   .key(function(d) { return d['#country+code']; })
      //   .object(nationalData);


      dataLoaded = true;
      if (mapLoaded==true) displayMap();
      initView();
    });
  }


  function initView() {
    //check map loaded status
    if (mapLoaded==true && viewInitialized==false)
      deepLinkView();

    //create tab events
    // $('.tab-menubar .tab-button').on('click', function() {
    //   $('.tab-button').removeClass('active');
    //   $(this).addClass('active');
    //   if ($(this).data('id')=='chart-view') {
    //     $('#chart-view').show();
    //   }
    //   else {
    //     $('#chart-view').hide();
    //   }
    //   vizTrack($(this).data('id'), currentIndicator.name);
    // });

    //create country dropdown
    // $('.country-select').empty();
    // var countrySelect = d3.select('.country-select')
    //   .selectAll('option')
    //   .data(Object.entries(dataByCountry))
    //   .enter().append('option')
    //     .text(function(d) { return d[1][0]['#country+name']; })
    //     .attr('value', function (d) { return d[1][0]['#country+code']; });
    //insert default option    
    // $('.country-select').prepend('<option value="">All Countries</option>');
    // $('.country-select').val($('.country-select option:first').val());
    currentCountry = {code: 'SOM', name:'Somalia'}

    //create chart view country select
    // $('.trendseries-select').append($('<option value="All">All Clusters</option>')); 
    // var trendseriesSelect = d3.select('.trendseries-select')
    //   .selectAll('option')
    //   .data(subnationalData)
    //   .enter().append('option')
    //     .text(function(d) {
    //       let name = (d['#adm1+code']=='UA80') ? d['#adm1+name'] + ' (city)' : d['#adm1+name'];
    //       return name; 
    //     })
    //     .attr('value', function (d) { return d['#adm1+code']; });

    viewInitialized = true;
  }


  function initTracking() {
    //initialize mixpanel
    var MIXPANEL_TOKEN = window.location.hostname=='data.humdata.org'? '5cbf12bc9984628fb2c55a49daf32e74' : '99035923ee0a67880e6c05ab92b6cbc0';
    mixpanel.init(MIXPANEL_TOKEN);
    mixpanel.track('page view', {
      'page title': document.title,
      'page type': 'datavis'
    });
  }

  init();
  initTracking();
});