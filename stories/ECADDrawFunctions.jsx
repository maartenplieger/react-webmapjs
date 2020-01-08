let Proj4js = window.proj4;
// Cache for for storing and reusing Proj4 instances
var projectorCache = {};

// Ensure that you have a Proj4 object, pulling from the cache if necessary
var getProj4 = (projection) => {
  if (projection instanceof Proj4js.Proj) {
    return projection;
  } else if (projection in projectorCache) {
    return projectorCache[projection];
  } else {
    projectorCache[projection] = new Proj4js.Proj(projection);
    return projectorCache[projection];
  }
};

export const distance = (a, b) => {
  return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
};

export const ECADDrawFunctionSolidCircle = (args) => {
  const { context, coord, feature } = args;
  const { properties } = feature;
  context.beginPath();
  context.arc(coord.x, coord.y, 8, 0, 2 * Math.PI, false);
  context.fillStyle = properties.fill;
  context.fill();
};

export const getPixelCoordFromGeoCoord = (featureCoords, webmapjs) => {
  const { width, height } = webmapjs.getSize();
  const bbox = webmapjs.getBBOX();
  const proj = webmapjs.getProj4();
  const XYCoords = [];

  var from = getProj4(proj.lonlat);
  var to = getProj4(proj.crs);

  for (let j = 0; j < featureCoords.length; j++) {
    if (featureCoords[j].length < 2) continue;
    let coordinates = { x: featureCoords[j][0], y: featureCoords[j][1] };
    coordinates = proj.proj4.transform(from, to, coordinates);
    const x = (width * (coordinates.x - bbox.left)) / (bbox.right - bbox.left);
    const y = (height * (coordinates.y - bbox.top)) / (bbox.bottom - bbox.top);
    XYCoords.push({ x: x, y: y });
  }
  return XYCoords;
};

export const fetchStationInfoForId = (stationid) => {
  const stationinfoURL = 'http://eobsdata.knmi.nl:8080/stationinfo?' +
      '&station_id=' +
      stationid;
    // const newFeature = (name, id) => {
    //   return {
    //     type: 'Feature',
    //     properties: {
    //       name: name,
    //       id: id
    //     }
    //   };
    // };
  fetch(stationinfoURL, {
    method: 'GET',
    mode: 'cors'
  });
  console.log('testing');
};
