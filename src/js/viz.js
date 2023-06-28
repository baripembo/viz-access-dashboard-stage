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
var zoomLevel = 5.6;
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
      d3.json(dataURL)
    ]).then(function(data) {
      console.log('Data loaded');
      $('.loader span').text('Initializing map...');


      //parse data
      var allData = data[0];
      console.log(allData)
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