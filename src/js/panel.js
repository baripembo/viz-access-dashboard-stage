/***********************/
/*** PANEL FUNCTIONS ***/
/***********************/
function initKeyFigures() {
  //var data = (currentCountry.code=='') ? regionalData : dataByCountry[currentCountry.code][0];
  var data = (currentCountry.code=='') ? regionalData : subnationalData;

   //humanitarian impact figures
  var impactDiv = $('.key-figure-panel .impact .panel-inner');
  impactDiv.children().remove();  
  //createFigure(impactDiv, {className: 'population', title: 'Population', stat: shortenNumFormat(data['#population']), indicator: '#population'});
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