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