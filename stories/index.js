import React, { Component } from 'react';
import { createStore } from 'redux';
import { storiesOf, specs, describe, it } from '../.storybook/facade';
import { SimpleLayerManager,
  SimpleTimeSlider,
  setLayers,
  setBaseLayers,
  layerChangeEnabled,
  layerChangeOpacity,
  mapChangeDimension,
  ReactWMJSLayer,
  ReactWMJSMap,
  generateLayerId,
  generateMapId,
  WEBMAPJS_REDUCERNAME,
  webMapJSReducer,
  createReducerManager,
  getWMJSLayerById,
  layerSetHeaders,
  getWMJSMapById
} from '../src/index';
import Provider from '../storyComponents/Provider';
import ConnectedReactWMJSMap from '../storyComponents/ConnectedReactWMJSMap';
import { mount } from 'enzyme';
import { Modal, ModalBody, ModalHeader, ModalFooter, Button, Input, Label, Container } from 'reactstrap';
import '../storyComponents/storybook.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { connect } from 'react-redux';
import moment from 'moment';
import PropTypes from 'prop-types';
import ReactSlider from 'react-slider';
import '../src/react-slider.css';
import ReduxReactCounterDemo from '../src/ReduxReactCounterDemo';
import tilesettings from '../src/tilesettings';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { simplePolygonGeoJSON, simplePointsGeojson, simpleFlightRoutePointsGeoJSON, simpleFlightRouteLineStringGeoJSON } from './geojsonExamples';

import { meteoModal } from '../styles/stories.css'

// Initialize the store.
const rootReducer = (state = {}, action = { type:null }) => { return state; };
const reducerManager = createReducerManager({ root: rootReducer });
const store = createStore(reducerManager.reduce, window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__());
store.reducerManager = reducerManager;
window.store = store;

reducerManager.add(WEBMAPJS_REDUCERNAME, webMapJSReducer);

// Add the reducermanager to the window
window.reducerManager = reducerManager;

/* define layers to be used
    - http endpoints might cause a 'mixed content' error if a built storybook is hosted externally
    - some layers require authorization
*/

const baseLayer = {
  name:'arcGisSat',
  title:'arcGisSat',
  type: 'twms',
  baseLayer: true,
  enabled:true,
  id: generateLayerId()
};

const overLayer = {
  service: 'http://geoservices.knmi.nl/cgi-bin/worldmaps.cgi?',
  name: 'ne_10m_admin_0_countries_simplified',
  format: 'image/png',
  keepOnTop: true,
  baseLayer: true,
  enabled: true,
  id: generateLayerId()
};

const radarLayer = {
  service: 'https://geoservices.knmi.nl/cgi-bin/RADNL_OPER_R___25PCPRR_L3.cgi?',
  name: 'RADNL_OPER_R___25PCPRR_L3_COLOR',
  format: 'image/png',
  enabled: true,
  style: 'knmiradar/nearest',
  id: generateLayerId()
};

const msgCppLayer = {
  service: 'http://msgcpp-ogc-realtime.knmi.nl/msgrt.cgi',
  name: 'lwe_precipitation_rate',
  format: 'image/png',
  enabled: true,
  style: 'precip/nearest',
  id: generateLayerId()
};

const dwdWarningLayer = {
  service: 'https://maps.dwd.de/geoserver/dwd/Warnungen_Gemeinden_vereinigt/ows?',
  name: 'Warnungen_Gemeinden_vereinigt',
  format: 'image/png',
  // style: 'warnungen_gemeinden_vereinigt_event_seamless_param',
  enabled: true,
  id: generateLayerId()
};

const dwdGaforLayer = {
  service: 'https://maps.dwd.de/geoserver/dwd/GAFOR/ows?',
  name: 'GAFOR',
  format: 'image/png',
  enabled: true,
  id: generateLayerId()
};

const dwdRadarLayer = {
  service: 'https://maps.dwd.de/geoserver/dwd/WX-Produkt/ows?',
  name: 'WX-Produkt',
  format: 'image/png',
  enabled: true,
  id: generateLayerId()
};

// this needs authentication to work
const dwdObservationsWetterLayer = {
  service: 'https://maps.dwd.de/geoserver/dwd/Wetter_Beobachtungen/ows?',
  name: 'Wetter_Beobachtungen',
  style: 'Wetter_Symbole',
  format: 'image/png',
  enabled: true,
  id: generateLayerId()
  // headers: [{ name: 'Authorization', value: 'Basic ...' }]
};

const dwdObservationsWetterLayerWithHeader = {
  service: 'https://maps.dwd.de/geoserver/dwd/Wetter_Beobachtungen/ows?',
  name: 'Wetter_Beobachtungen',
  style: 'Wetter_Symbole',
  format: 'image/png',
  enabled: true,
  id: generateLayerId(),
  headers: [{ name: 'authorization', value: 'Basic aW50cmFuZXQtdXNlcjpDQnMjMTEh' }]
};
// this needs authentication to work
const dwdObservationsWindLayer = {
  service: 'https://maps.dwd.de/geoserver/dwd/Wetter_Beobachtungen/ows?',
  name: 'Wetter_Beobachtungen',
  style: 'Wetter_Wind',
  format: 'image/png',
  enabled: true,
  id: generateLayerId()
};

const mapStateToProps = state => {
  /* Return initial state if not yet set */
  const webMapJSState = state[WEBMAPJS_REDUCERNAME] ? state[WEBMAPJS_REDUCERNAME] : webMapJSReducer();
  return {
    layers: webMapJSState.webmapjs.mapPanel[webMapJSState.webmapjs.activeMapPanelIndex].layers,
    baseLayers: webMapJSState.webmapjs.mapPanel[webMapJSState.webmapjs.activeMapPanelIndex].baseLayers
  };
};

/* construct story elements for later use */

const warningStory = {
  title:  'DWD warning map WMS',
  storyfn:  () => {
    const story = (
      <Provider store={window.store} >
        <div style={{ height: '100vh' }}>
          <ConnectedReactWMJSMap />
        </div>
        <div style={{ position:'absolute', left:'10px', top: '10px', zIndex: '10000' }}>
          <SimpleLayerManager
            store={window.store}
            layers={[ dwdWarningLayer, dwdGaforLayer ]}
            mapId={'mapid_1'}
            layerNameMappings={[
              { layer: dwdWarningLayer, title: 'DWD Warnings' },
              { layer: dwdGaforLayer, title: 'DWD GAFOR' }
            ]}
          />
        </div>
      </Provider>
    );
    return story;
  }
};

const radarloopStory = {
  title: 'DWD radar loop',
  storyfn: () => {
    var currentLatestDate;
    return (
      <div style={{ height: '100vh' }}>
        <ReactWMJSMap id={generateMapId()} >
          <ReactWMJSLayer {...baseLayer} />
          <ReactWMJSLayer {...dwdRadarLayer} onLayerReady={(layer, webMapJS) => {
            webMapJS.setAnimationDelay(150);
            if (layer) {
              var timeDim = layer.getDimension('time');
              if (timeDim) {
                var numTimeSteps = timeDim.size();
                if (timeDim.getValueForIndex(numTimeSteps - 1) !== currentLatestDate) {
                  currentLatestDate = timeDim.getValueForIndex(numTimeSteps - 1);
                  // var currentBeginDate = timeDim.getValueForIndex(numTimeSteps - 48);
                  var dates = [];
                  for (var j = numTimeSteps - 72; j < numTimeSteps; j++) {
                    dates.push({ name:'time', value:timeDim.getValueForIndex(j) });
                  }
                  webMapJS.stopAnimating();
                  layer.zoomToLayer();
                  webMapJS.draw(dates);
                }
              }
            }
          }} />
        </ReactWMJSMap>
      </div>
    );
  }
};

const obsStory = {
  title:  'DWD obs map WMS (needs login)',
  storyfn:   () => {
    const story = (
      <div style={{ height: '100vh' }}>
        <ReactWMJSMap id={generateMapId()} >
          <ReactWMJSLayer {...dwdObservationsWindLayer} />
          <ReactWMJSLayer {...dwdObservationsWetterLayer} onLayerReady={(layer, webMapJS) => { layer.zoomToLayer(); }} />
          <ReactWMJSLayer {...overLayer} />
        </ReactWMJSMap>
      </div>
    );
    return story;
  }
};

const timesliderdemoStory = {
  title:  'Simple map with timeslider',
  storyfn:  () => {
    const story = (
      <Provider store={window.store} >
        <div style={{ height: '100vh' }}>
          <ConnectedReactWMJSMap />
        </div>
        <div style={{ position:'absolute', left:'10px', top: '10px', zIndex: '10000' }}>
          <SimpleLayerManager
            store={window.store}
            layers={[ radarLayer, dwdRadarLayer, msgCppLayer ]}
            mapId={'mapid_1'}
            layerNameMappings={[
              { layer: dwdWarningLayer, title: 'DWD Warnings' },
              { layer: radarLayer, title: 'KNMI precipitation radar' },
              { layer: msgCppLayer, title: 'MSG-CPP precipitation' },
              { layer: dwdRadarLayer, title: 'DWD Radar' }
            ]}
          />
        </div>
        <div style={{ position:'absolute', left:'200px', bottom: '20px', zIndex: '10000', right:'200px' }}>
          <SimpleTimeSlider
            store={window.store}
            mapId={'mapid_1'}
            startValue={moment.utc().subtract(6, 'h').toISOString()}
            endValue={moment.utc().add(-30, 'm').toISOString()}
            interval={300}
            layerNameMappings={[
              { layer: dwdWarningLayer, title: 'DWD Warnings' },
              { layer: radarLayer, title: 'KNMI precipitation radar' },
              { layer: msgCppLayer, title: 'MSG-CPP precipitation' },
              { layer: dwdRadarLayer, title: 'DWD Radar' }
            ]}
          />
        </div>
      </Provider>
    );
    return story;
  }
};

const reduxReactCounterDemo = {
  title: 'ReduxReactCounterDemo',
  storyFn: () => {
    /* Just a button inside a component to connect it to redux */
    const story = (
      <Provider store={window.store} >
        <ReduxReactCounterDemo />
      </Provider>
    );
    return story;
  }
};

storiesOf('React Redux example', module)
  .add(reduxReactCounterDemo.title, reduxReactCounterDemo.storyFn);

/* assemble stories from prebuilt elements */

storiesOf('KNMI-DWD Demo 04-10-2019', module)
  .add(obsStory.title, obsStory.storyfn)
  .add(radarloopStory.title, radarloopStory.storyfn)
  .add(warningStory.title, warningStory.storyfn)
  .add(timesliderdemoStory.title, timesliderdemoStory.storyfn);

/* random assortion of stories */

storiesOf('Simple layer manager', module).add('Simple Layer manager and Time slider', () => {
  const story = (
    <Provider store={window.store} >
      <div style={{ height: '100vh' }}>
        <ConnectedReactWMJSMap />
      </div>
      <div style={{ position:'absolute', left:'10px', top: '10px', zIndex: '10000' }}>
        <SimpleLayerManager
          store={window.store}
          layers={[ radarLayer ]}
          mapId={'mapid_1'}
          layerNameMappings={[
            { layer: dwdWarningLayer, title: 'DWD Warnings' },
            { layer: radarLayer, title: 'KNMI precipitation radar' },
            { layer: msgCppLayer, title: 'MSG-CPP precipitation' },
            { layer: dwdRadarLayer, title: 'DWD Radar' }
          ]}
        />
      </div>
      <div style={{ position:'absolute', left:'200px', bottom: '20px', zIndex: '10000', right:'200px' }}>
        <SimpleTimeSlider
          store={window.store}
          mapId={'mapid_1'}
          startValue={moment.utc().subtract(6, 'h').toISOString()}
          endValue={moment.utc().add(-5, 'm').toISOString()}
          interval={300}
          layerNameMappings={[
            { layer: dwdWarningLayer, title: 'DWD Warnings' },
            { layer: radarLayer, title: 'KNMI precipitation radar' },
            { layer: msgCppLayer, title: 'MSG-CPP precipitation' },
            { layer: dwdRadarLayer, title: 'DWD Radar' }
          ]}
        />
      </div>
      { // second timeslider element can be used
        /* <div style={{ position:'absolute', left:'10px', bottom: '150px', zIndex: '10000', width:'500px' }}>
        <SimpleTimeSlider
          interval={300}
          store={window.store}
          mapId={'mapid_1'}
          startValue={moment.utc().subtract(6, 'h').toISOString()}
          endValue={moment.utc().add(-5, 'm').toISOString()}
        />
      </div> */}
    </Provider>
  );
  return story;
});

storiesOf('ReactWMJSMap', module)
  .add('Map with radar data', () => {
    const story = (
      <div style={{ height: '100vh' }}>
        <ReactWMJSMap id={generateMapId()} >
          <ReactWMJSLayer {...baseLayer} />
          <ReactWMJSLayer {...radarLayer} onLayerReady={(layer, webMapJS) => { layer.zoomToLayer(); }} />
          <ReactWMJSLayer {...overLayer} />
        </ReactWMJSMap>
      </div>
    );
    // Test which tries to mount the story to verify if this is possible.
    specs(() => describe('reactWMJSTest', function () {
      it('Should be able to mount', function () {
        const div = global.document.createElement('div');
        global.document.body.appendChild(div);
        const output = mount(story, { attachTo: div });
        output.detach();
        global.document.body.removeChild(div);
      });
    }));
    return story;
  })
  .add('Passive map without controls', () => {
    const story = (
      <div style={{ height: '100vh' }}>
        <ReactWMJSMap id={generateMapId()}
          controls={{}}
          showLegend={false}
          showScaleBar={false}
          passiveMap
          onClick={() => { console.log('Passive map clicked'); }}>
          <ReactWMJSLayer {...baseLayer} />
          <ReactWMJSLayer {...radarLayer} onLayerReady={(layer, webMapJS) => { layer.zoomToLayer(); }} />
          <ReactWMJSLayer {...overLayer} />
        </ReactWMJSMap>
      </div>
    );
    return story;
  }).add('Drawing GeoJSON Polygons', () => {
    const story = (
      <div style={{ height: '100vh' }}>
        <ReactWMJSMap id={generateMapId()} bbox={[-2000000, 4000000, 3000000, 10000000]} enableInlineGetFeatureInfo={false}>
          <ReactWMJSLayer {...baseLayer} />
          <ReactWMJSLayer {...overLayer} />
          <ReactWMJSLayer geojson={simplePolygonGeoJSON} isInEditMode drawMode={'POLYGON'} />
        </ReactWMJSMap>
      </div>
    );
    return story;
  }).add('Drawing GeoJSON Points', () => {
    const story = (
      <div style={{ height: '100vh' }}>
        <ReactWMJSMap id={generateMapId()} bbox={[-2000000, 4000000, 3000000, 10000000]} enableInlineGetFeatureInfo={false}>
          <ReactWMJSLayer {...baseLayer} />
          <ReactWMJSLayer {...overLayer} />
          <ReactWMJSLayer geojson={simplePointsGeojson} />
        </ReactWMJSMap>
      </div>
    );
    return story;
  }).add('Drawing FlightRoute via GeoJSON Points', () => {
    const story = (
      <div style={{ height: '100vh' }}>
        <ReactWMJSMap id={generateMapId()} bbox={[-2000000, 4000000, 3000000, 10000000]} enableInlineGetFeatureInfo={false}>
          <ReactWMJSLayer {...baseLayer} />
          <ReactWMJSLayer {...overLayer} />
          <ReactWMJSLayer geojson={simpleFlightRoutePointsGeoJSON} />
        </ReactWMJSMap>
      </div>
    );
    return story;
  })
  
  
  
  .add('Drawing FlightRoute via GeoJSON LineString', () => {
    const story = (
      <div style={{ height: '100vh' }}>
        <ReactWMJSMap id={generateMapId()} bbox={[-2000000, 4000000, 3000000, 10000000]} enableInlineGetFeatureInfo={false}>
          <ReactWMJSLayer {...baseLayer} />
          <ReactWMJSLayer {...overLayer} />
          <ReactWMJSLayer geojson={simpleFlightRouteLineStringGeoJSON} />
        </ReactWMJSMap>
      </div>
    );
    return story;
  })
  
  
  
  .add('Custom GetFeatureInfo as JSON', () => {
    class Map extends Component {
      constructor (props) {
        console.log('constructing');
        super(props);
        this.mapMouseClicked = this.mapMouseClicked.bind(this);
        this.state = {
          gfiUrl: 'Click on the map to trigger a getfeatureinfo.',
          gfiResult: null
        };
      }
      /**
       * This function is triggered when the map is clicked
       * @param {*} webMapJS The WebMapJS instance
       * @param {*} mouse The mouse object from the webMapJS, contains the following props:
       * {
       *  map: <the same webmapjs instance>,
       *  x: <X pixel coordinate on the map>,
       *  y, <Y pixel coodinate on the map>
       *  shiftKeyPressed: Whether the shiftkey is pressed or not
       * }
       */
      mapMouseClicked (webMapJS, mouse) {
        console.log('mouseclicked', mouse);
        /* Compose the getfeatureinfo URL for a layer based on the map's pixel coordinates, use json as format */
        const gfiUrl = webMapJS.getWMSGetFeatureInfoRequestURL(
          getWMJSLayerById(radarLayer.id),
          mouse.x,
          mouse.y,
          'application/json');
        this.setState({ gfiUrl: gfiUrl });

        /* Start fetching the obtained getfeatureinfo url */
        fetch(gfiUrl, {
          method: 'GET',
          mode: 'cors'
        }).then(data => {
          return data.json();
        }).then(data => {
          this.setState({ gfiResult: data });
        });
      }
      render () {
        return (<div>
          <div style={{ height: '100vh' }}>
            <ReactWMJSMap
              id={generateMapId()}
              enableInlineGetFeatureInfo={false}
              webMapJSInitializedCallback={(webMapJS) => {
                /* Disable the map popup getfeatureinfo window */
                webMapJS.enableInlineGetFeatureInfo(false);
                /* Add a listener which is triggered when you click on the map */
                webMapJS.addListener('mouseclicked', (mouse) => {
                  this.mapMouseClicked(webMapJS, mouse);
                }, true);
              }}>
              <ReactWMJSLayer {...baseLayer} />
              <ReactWMJSLayer {...radarLayer} onLayerReady={(layer, webMapJS) => { layer.zoomToLayer(); }} />
              <ReactWMJSLayer {...overLayer} />
            </ReactWMJSMap>
          </div>
          <div style={{ position:'absolute', left:'10px', top: '10px', zIndex: '10000', backgroundColor: '#CCCCCCC0', padding: '20px', overflow: 'auto', width: '80%', fontSize: '11px' }}>
            <div>URL: <pre>{this.state.gfiUrl}</pre></div>
            <div>GetFeatureInfo result: <pre>{JSON.stringify(this.state.gfiResult, null, 2)}</pre></div>
          </div>
        </div>
        );
      }
    };
    return (<Map />);
  })
  .add('Custom GetFeatureInfo as HTML', () => {
    class Map extends Component {
      constructor (props) {
        console.log('constructing');
        super(props);
        this.mapMouseClicked = this.mapMouseClicked.bind(this);
        this.state = {
          gfiUrl: 'Click on the map to trigger a getfeatureinfo.\nShift-click to trigger a full info.',
          gfiResult: null
        };
      }
      /**
       * This function is triggered when the map is clicked
       * @param {*} webMapJS The WebMapJS instance
       * @param {*} mouse The mouse object from the webMapJS, contains the following props:
       * {
       *  map: <the same webmapjs instance>,
       *  x: <X pixel coordinate on the map>,
       *  y, <Y pixel coodinate on the map>
       *  shiftKeyPressed: Whether the shiftkey is pressed or not
       * }
       */
      mapMouseClicked (webMapJS, mouse) {
        console.log('mouseclicked', mouse);
        /* Compose the getfeatureinfo URL for a layer based on the map's pixel coordinates, use json as format */
        let gfiUrl = webMapJS.getWMSGetFeatureInfoRequestURL(
          getWMJSLayerById(dwdWarningLayer.id),
          mouse.x,
          mouse.y);
        // restrict the getFeatureInfo by default to interesting properties only if geoserver is used
        if (!mouse.shiftKeyPressed) { gfiUrl += '&propertyName=SEVERITY,EVENT,HEADLINE,SENT,ONSET,EXPIRES'; }
        // tell geoserver to return multiple features if necessary (e.g. overlapping warnings)
        gfiUrl += '&FEATURE_COUNT=999';
        // this.setState({ gfiUrl: gfiUrl });

        /* Start fetching the obtained getfeatureinfo url */
        fetch(gfiUrl, {
          method: 'GET',
          mode: 'cors'
        }).then(data => {
          return data.text();
        }).then(data => {
          this.setState({ gfiResult: data });
        });
      }
      render () {
        return (<div>
          <div style={{ height: '100vh' }}>
            <ReactWMJSMap
              id={generateMapId()}
              enableInlineGetFeatureInfo={false}
              webMapJSInitializedCallback={(webMapJS) => {
                /* Disable the map popup getfeatureinfo window */
                webMapJS.enableInlineGetFeatureInfo(false);
                /* Add a listener which is triggered when you click on the map */
                webMapJS.addListener('mouseclicked', (mouse) => {
                  this.mapMouseClicked(webMapJS, mouse);
                }, true);
              }}>
              <ReactWMJSLayer {...baseLayer} />
              <ReactWMJSLayer {...dwdWarningLayer} onLayerReady={(layer, webMapJS) => { layer.zoomToLayer(); }} />
              <ReactWMJSLayer {...overLayer} />
            </ReactWMJSMap>
          </div>
          <div style={{ position:'absolute', left:'10px', top: '10px', zIndex: '10000', backgroundColor: '#CCCCCCC0', padding: '20px', overflow: 'auto', width: '80%', fontSize: '11px' }}>
            <div>URL: <pre>{this.state.gfiUrl}</pre></div>
            <div>GetFeatureInfo result: <div dangerouslySetInnerHTML={{ __html:this.state.gfiResult }} /></div>
          </div>
        </div>
        );
      }
    };
    return (<Map />);
  })
  .add('Map with radar animation', () => {
    var currentLatestDate;
    return (
      <div style={{ height: '100vh' }}>
        <ReactWMJSMap id={generateMapId()} >
          <ReactWMJSLayer {...baseLayer} />
          <ReactWMJSLayer {...radarLayer} onLayerReady={(layer, webMapJS) => {
            webMapJS.setAnimationDelay(100);
            if (layer) {
              var timeDim = layer.getDimension('time');
              if (timeDim) {
                var numTimeSteps = timeDim.size();
                if (timeDim.getValueForIndex(numTimeSteps - 1) !== currentLatestDate) {
                  currentLatestDate = timeDim.getValueForIndex(numTimeSteps - 1);
                  // var currentBeginDate = timeDim.getValueForIndex(numTimeSteps - 48);
                  var dates = [];
                  for (var j = numTimeSteps - 48; j < numTimeSteps; j++) {
                    dates.push({ name:'time', value:timeDim.getValueForIndex(j) });
                  }
                  webMapJS.stopAnimating();
                  layer.zoomToLayer();
                  webMapJS.draw(dates);
                }
              }
            }
          }} />
          <ReactWMJSLayer key={'3'} {...overLayer} />
        </ReactWMJSMap>
      </div>
    );
  }).add('Map DWD Warning WMS', () => {
    const story = (
      <div style={{ height: '100vh' }}>
        <ReactWMJSMap id={generateMapId()} >
          <ReactWMJSLayer {...baseLayer} />
          <ReactWMJSLayer {...dwdWarningLayer} onLayerReady={(layer, webMapJS) => { layer.zoomToLayer(); }} />
          <ReactWMJSLayer {...overLayer} />
        </ReactWMJSMap>
      </div>
    );
    return story;
  });
storiesOf('ReactWMJSMap with redux', module)
  .add('setLayers action', () => {
    store.dispatch(setLayers({ layers: [], mapPanelId: 'mapid_1' }));
    const story = (
      <Provider store={window.store} >
        <div style={{ height: '100vh' }}>
          <ConnectedReactWMJSMap />
        </div>
        <div style={{ position:'absolute', left:'10px', top: '10px', zIndex: '10000' }}>
          <Button onClick={() => {
            store.dispatch(setLayers({ layers: [radarLayer], mapPanelId: 'mapid_1' }));
          }}>SetLayer Radar</Button>
          <Button onClick={() => {
            store.dispatch(setLayers({ layers: [msgCppLayer], mapPanelId: 'mapid_1' }));
          }}>SetLayer MSGCPP</Button>
          <Button onClick={() => {
            store.dispatch(setLayers({ layers: [dwdWarningLayer], mapPanelId: 'mapid_1' }));
          }}>SetLayer DWD Warnings</Button>
        </div>

      </Provider>
    );
    return story;
  }).add('setBaseLayers action', () => {
    const { dispatch } = store;
    dispatch(setLayers({ layers: [radarLayer], mapPanelId: 'mapid_1' }));
    const story = (
      <Provider store={window.store} >
        <div style={{ height: '100vh' }}>
          <ConnectedReactWMJSMap />
        </div>
        <div style={{ position:'absolute', left:'10px', top: '10px', zIndex: '10000' }}>
          <ul>
            <li><Button onClick={() => { dispatch(setBaseLayers({ baseLayers: [baseLayer], mapPanelId: 'mapid_1' })); }}>SetBaseLayer ArcGIS satellite</Button></li>
            <li><Button onClick={() => { dispatch(setBaseLayers({ baseLayers: [overLayer], mapPanelId: 'mapid_1' })); }}>SetLayer KNMI Overlay</Button></li>
            <li>From tilesettings:</li>
            {
              Object.keys(tilesettings).map((tilesettingName, key) => {
                if (!tilesettings[tilesettingName]['EPSG:3857']) return (null);
                return (
                  <li key={key}>
                    <Button
                      style={{ height: '30px' }}
                      onClick={() => { dispatch(setBaseLayers({ baseLayers: [{ baseLayer: true, name:tilesettingName, type:'twms' }], mapPanelId: 'mapid_1' })); }}>
                      {tilesettingName}
                    </Button>
                  </li>
                );
              })
            }
          </ul>
        </div>

      </Provider>
    );
    return story;
  }).add('layerChangeEnabled action', () => {
    store.dispatch(setLayers({ layers: [radarLayer], mapPanelId: 'mapid_1' }));
    /* Just a button inside a component to connect it to redux */
    class LayerEnableButton extends Component {
      render () {
        const isLayerEnabled = store.getState()['react-webmapjs'].webmapjs.mapPanel[0].layers[0].enabled;
        return (<div>
          <Button onClick={() => {
            store.dispatch(layerChangeEnabled({ layerId: radarLayer.id, mapPanelId: 'mapid_1', enabled: !isLayerEnabled }));
          }}>{!isLayerEnabled ? 'Enable' : 'Disable'}</Button>
        </div>);
      }
    };
    const ConnectedLayerEnableButton = connect(mapStateToProps)(LayerEnableButton);
    const story = (
      <Provider store={window.store} >
        <div style={{ height: '100vh' }}>
          <ConnectedReactWMJSMap />
        </div>
        <div style={{ position:'absolute', left:'10px', top: '10px', zIndex: '10000' }}>
          <ConnectedLayerEnableButton store={window.store} />
        </div>
      </Provider>
    );
    return story;
  }).add('layerChangeOpacity action', () => {
    store.dispatch(setLayers({ layers: [radarLayer], mapPanelId: 'mapid_1' }));
    /* Just a button inside a component to connect it to redux */
    class LayerChangeOpacityInput extends Component {
      constructor () {
        super();
        this.state = {
          opacity: '1.0'
        };
      }
      render () {
        let layerOpacity = store.getState()['react-webmapjs'].webmapjs.mapPanel[0].layers[0].opacity;
        console.log('Render: layerOpacity from redux state ' + layerOpacity);
        if (!layerOpacity && layerOpacity !== 0) layerOpacity = 1.0;
        return (<div style={{ border: '1px solid black', width:'200px', padding: '20px', backgroundColor: 'white' }}>
          <ReactSlider
            className={'horizontal-slider'}
            thumbClassName={'horizontal-slider-track'}
            trackClassName={'horizontal-slider-thumb'}
            min={0} max={1} step={0.1} defaultValue={parseFloat(this.state.opacity)}
            onChange={(v) => {
              this.setState({ opacity: v });
              let opacity = parseFloat(v);
              store.dispatch(layerChangeOpacity({ layerId: radarLayer.id, mapPanelId: 'mapid_1', opacity: opacity }));
            }} /><span>Current opacity: {layerOpacity}</span>
        </div>);
      }
    };
    const ConnectedLayerChangeOpacityInput = connect(mapStateToProps)(LayerChangeOpacityInput);
    const story = (
      <Provider store={window.store} >
        <div style={{ height: '100vh' }}>
          <ConnectedReactWMJSMap />
        </div>
        <div style={{ position:'absolute', left:'10px', top: '10px', zIndex: '10000' }}>
          <ConnectedLayerChangeOpacityInput store={window.store} />
        </div>
      </Provider>
    );
    return story;
  }).add('mapChangeDimension action', () => {
    store.dispatch(setLayers({ layers: [radarLayer, msgCppLayer], mapPanelId: 'mapid_1' }));
    /* Just a button inside a component to connect it to redux */
    class MapChangeDimension extends Component {
      render () {
        const wmjsLayer = getWMJSLayerById(radarLayer.id);
        if (!wmjsLayer) {
          return (<div>Layer is loading...</div>);
        }
        const timeDimension = wmjsLayer.getDimension('time');
        const startValue = timeDimension.getValueForIndex(timeDimension.size() - 12);
        const endValue = timeDimension.getValueForIndex(timeDimension.size());
        const unixStart = moment(startValue).utc().unix();
        const unixEnd = moment(endValue).utc().unix();
        return (<div style={{ border: '1px solid black', padding: '20px', width:'800px', backgroundColor: 'white' }}>
          <ReactSlider
            className={'horizontal-slider'}
            thumbClassName={'horizontal-slider-track'}
            trackClassName={'horizontal-slider-thumb'}
            min={unixStart} max={unixEnd} step={300}
            defaultValue={parseFloat(unixStart)}
            onChange={(v) => {
              const timeValue = timeDimension.getClosestValue(moment.unix(v).toISOString());
              store.dispatch(mapChangeDimension({
                mapPanelId: 'mapid_1',
                dimension: {
                  name: 'time',
                  currentValue: timeValue
                }
              }));
            }} />
          <div>Num time steps: {timeDimension.size()}</div>
          <div>StartValue: {startValue}</div>
          <div>endValue: {endValue}</div>
          {
            this.props.layers.map((layer, index) => {
              return (<div key={index}>
                <div>Layer {layer.name}:</div>
                <div style={{ paddingLeft:'10px' }}>Dim time: {layer.dimensions && layer.dimensions.length && layer.dimensions[0].currentValue}</div>
              </div>);
            })
          }
        </div>);
      }
    };
    MapChangeDimension.propTypes = {
      layers: PropTypes.array
    };
    const ConnectedChangeDimension = connect(mapStateToProps)(MapChangeDimension);
    const story = (
      <Provider store={window.store} >
        <div style={{ height: '100vh' }}>
          <ConnectedReactWMJSMap />
        </div>
        <div style={{ position:'absolute', left:'10px', top: '10px', zIndex: '10000' }}>
          <ConnectedChangeDimension store={window.store} />
        </div>
      </Provider>
    );
    return story;
  }).add('layerSetHeaders action', () => {
    const layersWithAuthenticationArray = [dwdObservationsWetterLayer, dwdObservationsWindLayer];
    const layersWithoutAuthenticationArray = [radarLayer];
    store.dispatch(setLayers({ layers: [...layersWithAuthenticationArray, ...layersWithoutAuthenticationArray], mapPanelId: 'mapid_1' }));
    class UserNamePasswordComponent extends Component {
      constructor (props) {
        super(props);
        this.submit = this.submit.bind(this);
        this.state = {
          username: null,
          password: null
        };
      }
      submit () {
        const base64Encoded = btoa(this.state.username + ':' + this.state.password);
        layersWithAuthenticationArray.forEach((layer) => {
          this.props.dispatch(
            layerSetHeaders({
              layerId: layer.id,
              mapPanelId: 'mapid_1',
              headers: [{ name: 'Authorization', value: 'Basic ' + base64Encoded }]
            })
          );
        });
        window.setTimeout(() => { getWMJSMapById('mapid_1').draw(); }, 1500);
      }
      render () {
        return (<div style={{ backgroundColor: '#CCCCCCC0', padding: '20px' }}>
          <span><Label>User name:</Label><Input type='text' onChange={(e) => { this.setState({ username: e.currentTarget.value }); }} /></span>
          <span><Label>Password:</Label><Input type='password' onChange={(e) => { this.setState({ password: e.currentTarget.value }); }} /></span>
          <span><Button onClick={() => { this.submit(); }}>Submit</Button></span>
          <span><Button onClick={() => {
            store.dispatch(setLayers({ layers: [ dwdObservationsWetterLayerWithHeader ], mapPanelId: 'mapid_1' }));
          }}>SetLayers </Button></span>
        </div>);
      }
    };
    UserNamePasswordComponent.propTypes = {
      dispatch: PropTypes.func
    };
    const ConnectedUserNamePasswordModal = connect(mapStateToProps)(UserNamePasswordComponent);
    const story = (
      <Provider store={window.store} >
        <div style={{ height: '100vh' }}>
          <ConnectedReactWMJSMap />
        </div>
        <div style={{ position:'absolute', left:'10px', top: '10px', zIndex: '10000' }}>
          <ConnectedUserNamePasswordModal store={window.store} />
        </div>
      </Provider>
    );
    return story;
  }).add('login modal', () => {
    class UserNamePasswordComponent extends Component {
      constructor (props) {
        super(props);
        this.submit = this.submit.bind(this);
        this.state = {
          username: null,
          password: null
        };
        this.isOpen = true;
        this.toggleModal = this.toggleModal.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
      }
      toggleModal () {
        console.log('this should set the state to isOpen=false');
        this.isOpen = false;
        // this.setState({ isOpen: false });
        this.setState({ username: false });
      }
      submit () {
        console.log(this.state.username + ':' + this.state.password);
      }
      render () {
        return (
          <Modal isOpen={this.isOpen} toggle={this.toggleModal}>
            <ModalHeader toggle={this.toggleModal}>
              Please sign in to use the application
            </ModalHeader>
            <ModalBody>
              <Container>
                <div style={{ backgroundColor: '#CCCCCCC0', padding: '20px' }}>
                  <span><Label>User name:</Label><Input type='text' onChange={(e) => { this.setState({ username: e.currentTarget.value }); }} /></span>
                  <span><Label>Password:</Label><Input type='password' onChange={(e) => { this.setState({ password: e.currentTarget.value }); }} /></span>
                  <span><Button onClick={() => { this.submit(); }}>Submit</Button></span>
                </div>
              </Container>
            </ModalBody>
          </Modal>);
      }
    };
    UserNamePasswordComponent.propTypes = {
      // dispatch: PropTypes.func
    };
    const ConnectedUserNamePasswordModal = connect(mapStateToProps)(UserNamePasswordComponent);
    const story = (
      <Provider store={window.store} >
        <div style={{ height: '100vh' }}>
          <ConnectedReactWMJSMap />
        </div>
        <div style={{ position:'absolute', left:'10px', top: '10px', zIndex: '10000' }}>
          <ConnectedUserNamePasswordModal store={window.store} />
        </div>
      </Provider>
    );
    return story;
  }).add('recharts meteogram', () => {
    class rechartsMeteogramComponent extends Component {
      constructor (props) {
        super(props);
        this.submit = this.submit.bind(this);
        this.state = {
          newPlace: 'DE BILT',
          displayPlace: 'DE BILT',
          data: [{ name: 'Page A', uv: 400, pv: 2400, amt: 2400 }, { name: 'Page B', uv: 500, pv: 2500, amt: 2500 }]
        };
        this.isOpen = true;
        this.toggleModal = this.toggleModal.bind(this);
        this.submit();
      }
      toggleModal () {
        console.log('this should set the state to isOpen=false');
        this.isOpen = false;
        // this.setState({ isOpen: false });
        this.setState({ username: false });
      }
      handleKeyPress(target) {
        if(target.charCode==13){
          this.submit();    
        } 
      }
      submit () {
        console.log('loadMeteoData()');
        var dwdGeoserverBaseurl = 'https://maps.dwd.de/geoserver/dwd/';
        var place = '\'' + this.state.newPlace + '\'';
        var cqlfilter = '&CQL_FILTER=NAME = ' + place;
        // JSONP via text/javascript
        // JSON via application/json
        var type = '&outputFormat=text/javascript' 
        var options = '&format_options=callback:weatherJsonp'
        /* Start fetching the obtained getfeatureinfo url */
        var weatherUrl = dwdGeoserverBaseurl + 'wfs' + '?version=1.0.0&request=GetFeature&typeName=dwd%3AMOSMIX_L_Punktterminprognosen&maxFeatures=5000' + cqlfilter + type + options;

        // fetch(weatherUrl, {
        //   method: 'GET',
        //   mode: 'cors'
        // }).then(data => {
        //   // return data.json();
        // }).then(data => {
        //   console.log('fetch response: ', data);
        // });

        var jquery = window.jQuery || window.$ || global.$ || global.jQuery;
        // TODO switch to fetch for query
        $.ajax({
          jsonpCallback: 'weatherJsonp',
          type: 'GET',
          url: weatherUrl,
          dataType: 'jsonp',
          success: (data) => {
            var metData = [];
            Object.keys(data.features).forEach((key) => {
              metData.push(
                {
                  'date': data.features[key].properties.FORECAST_TIME,
                  // 'ttt': (data.features[key].properties.TTT - 273.15).toFixed(2)
                  'ttt': data.features[key].properties.TTT - 273.15
                  // "rr1c": data.features[key].properties.RR1c,
                  // "ff":  data.features[key].properties.FF
                });
            });
            console.log('metData', metData);
            this.setState({ data: metData });
            this.setState({ displayPlace: this.state.newPlace });
            if ( metData.length === 0 ) {
              this.setState({ displayPlace: 'No results for ' + this.state.newPlace });
              console.log('no results found');
            }
          },
          error: (data) => {
            console.log('getMeteoData failed');
            this.setState({ displayPlace: 'ERROR (request failed, geoserver login is required)' });
          }
        });
      }
      render () {
        return (
          <Modal size='xl' isOpen={this.isOpen} toggle={this.toggleModal}>
            <ModalHeader toggle={this.toggleModal}>
              Meteogram for {this.state.displayPlace}
            </ModalHeader>
            <ModalBody style={{height: '300px'}}>
              <ResponsiveContainer height='100%' width='100%'>
                <LineChart data={this.state.data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <Line type='monotone' dataKey='ttt' stroke='#8884d8' dot={false} isAnimationActive={false}/>
                  <CartesianGrid stroke='#ccc' strokeDasharray='5 5' />
                  <XAxis dataKey='date' dy={10} tickFormatter = {(unixTime) => moment(unixTime).format('DD. HH[h]')}/>
                  {/* <YAxis label='Temperature 2m' angle={-90} /> */}
                  <YAxis />
                  <Tooltip formatter={(value) => value.toFixed(2)}/>
                </LineChart>
              </ResponsiveContainer>
            </ModalBody>
            <ModalFooter>
            <span><Input type='text' placeholder='Query other location' onKeyPress={(e) => { this.handleKeyPress(e); }} onChange={(e) => { this.setState({ newPlace: e.currentTarget.value.toUpperCase() }); }} /></span>
            <span><Button onClick={() => { this.submit(); }}>Get forecast</Button></span>
            </ModalFooter>
          </Modal>);
      }
    };
    rechartsMeteogramComponent.propTypes = {
      // dispatch: PropTypes.func
    };
    const ConnectedRechartsMeteogramModal = connect(mapStateToProps)(rechartsMeteogramComponent);
    const story = (
      <Provider store={window.store} >
        <div style={{ position:'absolute', left:'10px', top: '10px', zIndex: '10000' }}>
          <ConnectedRechartsMeteogramModal store={window.store} />
        </div>
      </Provider>
    );
    return story;
  });
