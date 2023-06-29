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
