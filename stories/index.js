/* eslint-disable max-len */
import React, { Component } from 'react';
import { createStore } from 'redux';
import { storiesOf, specs, describe, it } from '../.storybook/facade';
import {
  SimpleLayerManager,
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
import ReduxConnectedReactWMJSMap from '../src/ReactWMJSMap/ReduxConnectedReactWMJSMap';
import { mount } from 'enzyme';
import { Button, Input, Label } from 'reactstrap';
import '../storyComponents/storybook.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { connect } from 'react-redux';
import moment from 'moment';
import PropTypes from 'prop-types';
import ReactBootstrapSlider from '../src/UIComponents/ReactBootStrapSlider';
import ReduxReactCounterDemo from '../src/ReduxDemo/ReduxReactCounterDemo';
import ExperimentDemo from '../src/MapAnimationExperiment/ExperimentDemo';
import tilesettings from '../src/ReactWMJSMap/tilesettings';
import MapDrawGeoJSON from './MapDrawGeoJSON';
import { simplePointsGeojson, simpleSmallLineStringGeoJSON } from './geojsonExamples';
import WMJSLayerManager from '../src/ReactWMJSLayerManager/WMJSLayerManager';

import '../styles/stories.css';
const $ = window.jQuery || window.$ || global.$ || global.jQuery;
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

const reduxReactCounterDemo = {
  title: 'ReduxReactCounterDemo',
  storyFn: () => {
    /* Just a button inside a component to connect it to redux */
    const story = (
      <Provider store={window.store}>
        <ReduxReactCounterDemo />
      </Provider>
    );
    return story;
  }
};

/* random assortion of stories */

storiesOf('Simple layer manager', module).add('Simple Layer manager and Time slider', () => {
  const story = (
    <Provider store={window.store}>
      <div style={{ height: '100vh' }}>
        <ReduxConnectedReactWMJSMap />
      </div>
      <div style={{ position:'absolute', left:'10px', top: '10px', zIndex: '10000' }}>
        <SimpleLayerManager
          store={window.store}
          layers={[radarLayer]}
          mapId='mapid_1'
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
          mapId='mapid_1'
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
    </Provider>
  );
  return story;
});

storiesOf('ReactWMJSMap', module)
  .add('Map with radar data', () => {
    const story = (
      <div style={{ height: '100vh' }}>
        <ReactWMJSMap id={generateMapId()}>
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
  .add('Map with radar animation', () => {
    var currentLatestDate;
    return (
      <div style={{ height: '100vh' }}>
        <ReactWMJSMap id={generateMapId()}>
          <ReactWMJSLayer {...baseLayer} />
          <ReactWMJSLayer
            {...radarLayer}
            onLayerReady={(layer, webMapJS) => {
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
            }}
          />
          <ReactWMJSLayer {...overLayer} />
        </ReactWMJSMap>
      </div>
    );
  })
  .add('Passive map without controls', () => {
    const story = (
      <div style={{ height: '100vh' }}>
        <ReactWMJSMap
          id={generateMapId()}
          controls={{}}
          showLegend={false}
          showScaleBar={false}
          passiveMap
          onClick={() => { console.log('Passive map clicked'); }}
        >
          <ReactWMJSLayer {...baseLayer} />
          <ReactWMJSLayer {...radarLayer} onLayerReady={(layer, webMapJS) => { layer.zoomToLayer(); }} />
          <ReactWMJSLayer {...overLayer} />
        </ReactWMJSMap>
      </div>
    );
    return story;
  }).add('Drawing and editing GeoJSON', () => {
    const story = (
      <div style={{ height: '100vh' }}>
        <MapDrawGeoJSON />
      </div>
    );
    return story;
  }).add('Display GeoJSON Points', () => {
    const story = (
      <div style={{ height: '100vh' }}>
        <ReactWMJSMap id={generateMapId()} bbox={[-2000000, 4000000, 3000000, 10000000]} enableInlineGetFeatureInfo={false}>
          <ReactWMJSLayer {...baseLayer} />
          <ReactWMJSLayer {...overLayer} />
          <ReactWMJSLayer id={generateLayerId()} geojson={simplePointsGeojson} />
        </ReactWMJSMap>
      </div>
    );
    return story;
  }).add('Synops along buffered route via WFS CQL', () => {
    class Map extends Component {
      constructor (props) {
        super(props);
        this.state = {
          // dwd:MOSMIX_L_Punktterminprognosen can be used as well but will offer mulitple features per forecast point (timesteps), dwd:RBSN_T2m, Wetter_Beobachtungen
          // could be further restricted via &propertyName=NAME&sortBy=NAME+A
          wfsUrl: 'https://maps.dwd.de/geoserver/dwd/ows?request=GetFeature&service=WFS&version=1.0.0&typeName=dwd:RBSN_T2m&maxFeatures=999' +
            '&outputFormat=text/javascript&format_options=callback:resultsJsonp',
          cqlfilter: '',
          featureInfo: [{ name: 'Stationname', temp: 'Temperature [°C]' }]
        };
      }

      componentDidMount () {
        console.log('getting Synop');
        this.getWFSdata();
      }

      round (date, duration, method) {
        return moment(Math[method]((+date) / (+duration)) * (+duration));
      }

      getWFSdata () {
        // limit query to one observation timepoint
        let querytime = '2019-10-14T10:00:00.000Z';
        // for Beobachtungen get timestamp 0-1 hours in the past rounded to 10 minutes, for RBSN use past day and round to hour
        querytime = this.round(moment().add(-1, 'd'), moment.duration(1, 'hours'), 'ceil').toISOString();

        // M_DATE for RBSN-layers, OBSERVATION_TIME for Beobachtungen
        const cqlexpression = '&cql_filter=INTERSECTS(THE_GEOM, BUFFER(LINESTRING(13.00565 53.6181, 8.732724 48.28535), 0.2))' +
        ' AND M_DATE = ' + querytime;
        console.log('request url for synop with buffer', this.state.wfsUrl + cqlexpression);
        this.setState({ cqlfilter: cqlexpression });

        $.ajax({
          jsonpCallback: 'resultsJsonp',
          type: 'GET',
          url: this.state.wfsUrl + cqlexpression,
          dataType: 'jsonp',
          success: (data) => {
            this.setState({ gaforResult: data });
            console.log('resultsJsonp synop', data);

            const featureInfo = [];
            Object.keys(data.features).forEach((key) => {
              featureInfo.push({ name: data.features[key].properties.NAME, temp: data.features[key].properties.TEMPERATURE });
            });
            this.setState({ featureInfo: featureInfo });
          }
        });
      }

      render () {
        console.log('rendering');
        return (
          <div>
            <div style={{ height: '100vh' }}>
              <ReactWMJSMap id={generateMapId()} enableInlineGetFeatureInfo={false} bbox={[-2000000, 4000000, 3000000, 10000000]}>
                <ReactWMJSLayer {...overLayer} />
                <ReactWMJSLayer id={generateLayerId()} geojson={simpleSmallLineStringGeoJSON} />
                <ReactWMJSLayer id={generateLayerId()} geojson={this.state.gaforResult} />
              </ReactWMJSMap>
            </div>
            <div style={{ position:'absolute', left:'10px', top: '10px', zIndex: '10000', backgroundColor: '#CCCCCCC0', padding: '20px', overflow: 'auto', width: '33%', fontSize: '11px' }}>
              <div><h5>Query features along buffered line using WFS and CQL</h5></div>
              <div>WFS JSONP URL: <pre>{this.state.wfsUrl}</pre></div>
              <div>CQL expression: <pre>{this.state.cqlfilter}</pre></div>
              <div><pre>{JSON.stringify(this.state.featureInfo, null, 2)}</pre></div>
            </div>
          </div>
        );
      }
    };
    return (<Map />);
  }).add('Custom GetFeatureInfo as JSON', () => {
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
        return (
          <div>
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
                }}
              >
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
        return (
          <div>
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
                }}
              >
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
  .add('Map DWD Warning WMS', () => {
    const story = (
      <div style={{ height: '100vh' }}>
        <ReactWMJSMap id={generateMapId()}>
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
      <Provider store={window.store}>
        <div style={{ height: '100vh' }}>
          <ReduxConnectedReactWMJSMap />
        </div>
        <div style={{ position:'absolute', left:'10px', top: '10px', zIndex: '10000' }}>
          <Button onClick={() => { store.dispatch(setLayers({ layers: [radarLayer], mapPanelId: 'mapid_1' })); }}>SetLayer Radar</Button>
          <Button onClick={() => { store.dispatch(setLayers({ layers: [msgCppLayer], mapPanelId: 'mapid_1' })); }}>SetLayer MSGCPP</Button>
          <Button onClick={() => { store.dispatch(setLayers({ layers: [dwdWarningLayer], mapPanelId: 'mapid_1' })); }}>SetLayer DWD Warnings</Button>
        </div>

      </Provider>
    );
    return story;
  }).add('setBaseLayers action', () => {
    const { dispatch } = store;
    dispatch(setLayers({ layers: [radarLayer], mapPanelId: 'mapid_1' }));
    const story = (
      <Provider store={window.store}>
        <div style={{ height: '100vh' }}>
          <ReduxConnectedReactWMJSMap />
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
                      onClick={() => { dispatch(setBaseLayers({ baseLayers: [{ baseLayer: true, name:tilesettingName, type:'twms' }], mapPanelId: 'mapid_1' })); }}
                    >
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
        const layers = store.getState()['react-webmapjs'].webmapjs.mapPanel[0].layers[0];
        if (layers.length === 0) return (<div>No layers</div>);
        const isLayerEnabled = layers.enabled;
        return (<div>
          <Button onClick={() => {
            store.dispatch(layerChangeEnabled({ layerId: radarLayer.id, mapPanelId: 'mapid_1', enabled: !isLayerEnabled }));
          }}>{!isLayerEnabled ? 'Enable' : 'Disable'}
          </Button>
        </div>);
      }
    };
    const ConnectedLayerEnableButton = connect(mapStateToProps)(LayerEnableButton);
    const story = (
      <Provider store={window.store} >
        <div style={{ height: '100vh' }}>
          <ReduxConnectedReactWMJSMap />
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
        /* console.log('Render: layerOpacity from redux state ' + layerOpacity); */
        if (!layerOpacity && layerOpacity !== 0) layerOpacity = 1.0;
        return (<div style={{ border: '1px solid black', width:'200px', padding: '20px', backgroundColor: 'white' }}>
          <ReactBootstrapSlider
            min={0} max={1} step={0.1} value={parseFloat(this.state.opacity)}
            change={(value) => {
              this.setState({ opacity: value });
              let opacity = parseInt(parseFloat(value) * 10) / 10;
              store.dispatch(layerChangeOpacity({ layerId: radarLayer.id, mapPanelId: 'mapid_1', opacity: opacity }));
            }} /><span>Current opacity: {layerOpacity}</span>
        </div>);
      }
    };
    const ConnectedLayerChangeOpacityInput = connect(mapStateToProps)(LayerChangeOpacityInput);
    const story = (
      <Provider store={window.store} >
        <div style={{ height: '100vh' }}>
          <ReduxConnectedReactWMJSMap />
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
          <ReactBootstrapSlider
            min={unixStart} max={unixEnd} step={300}
            value={moment(timeDimension && timeDimension.currentValue).utc().unix()}
            change={(value) => {
              const timeValue = timeDimension.getClosestValue(moment.unix(value).toISOString());
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
          <ReduxConnectedReactWMJSMap />
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
          <ReduxConnectedReactWMJSMap />
        </div>
        <div style={{ position:'absolute', left:'10px', top: '10px', zIndex: '10000' }}>
          <ConnectedUserNamePasswordModal store={window.store} />
        </div>
      </Provider>
    );
    return story;
  });

storiesOf('React Redux example', module)
  .add(reduxReactCounterDemo.title, reduxReactCounterDemo.storyFn);

storiesOf('React WMJS Layermanager', module)
  .add('React WMJS Layermanager', () => {
    store.dispatch(setLayers({ layers: [radarLayer], mapPanelId: 'mapid_1' }));
    class SimpleGeoWebPresets extends Component {
      render () {
        const harmonieAirTemperature = {
          service: 'https://adaguc-services-geoweb.knmi.nl//adaguc-services//adagucserver?dataset=HARM_N25&',
          name: 'air_temperature__at_2m',
          id: generateLayerId()
        };
        const harmoniePrecipitation = {
          service: 'https://adaguc-services-geoweb.knmi.nl//adaguc-services//adagucserver?dataset=HARM_N25&',
          name: 'precipitation_flux',
          id: generateLayerId()
        };
        const harmoniePressure = {
          service: 'https://adaguc-services-geoweb.knmi.nl//adaguc-services//adagucserver?dataset=HARM_N25&',
          name: 'air_pressure_at_sea_level',
          id: generateLayerId()
        };
        const obsTemperature = {
          service: 'https://adaguc-services-geoweb.knmi.nl//adaguc-services//adagucserver?dataset=OBS&',
          name: '10M/ta',
          id: generateLayerId()
        };
        const presetHarmonie = {
          layers: [harmonieAirTemperature]
        };
        const presetRadar = {
          layers: [radarLayer]
        };
        const presetHarmoniePrecipAndObs = {
          layers: [harmoniePrecipitation, obsTemperature, radarLayer, harmoniePressure]
        };
        const layers = store.getState()['react-webmapjs'].webmapjs.mapPanel[0].layers[0];
        if (!layers || layers.length === 0) return (<div>No layers</div>);
        return (
          <div>
            <Button onClick={() => { store.dispatch(setLayers({ layers: presetHarmonie.layers, mapPanelId: 'mapid_1' })); }}>Harmonie</Button>
            <Button onClick={() => { store.dispatch(setLayers({ layers: presetRadar.layers, mapPanelId: 'mapid_1' })); }}>Radar</Button>
            <Button onClick={() => { store.dispatch(setLayers({ layers: presetHarmoniePrecipAndObs.layers, mapPanelId: 'mapid_1' })); }}>Precip + Obs</Button>
          </div>);
      }
    };
    const ConnectedSimpleGeoWebPresets = connect(mapStateToProps)(SimpleGeoWebPresets);
    const story = (
      <Provider store={window.store} >
        <div style={{ height: '70vh' }}>
          <ReduxConnectedReactWMJSMap />
        </div>
        <div style={{ height: '30vh' }}>
          <WMJSLayerManager />
        </div>
        <div style={{ position:'absolute', left:'0px', top: '10px', zIndex: '10000' }}>
          <ConnectedSimpleGeoWebPresets store={window.store} />
        </div>
        <div style={{ position:'absolute', left:'10px', top: '100px', zIndex: '10000' }}>
          <SimpleLayerManager
            store={window.store}
            mapId='mapid_1'
            layerNameMappings={[
              { layer: dwdWarningLayer, title: 'DWD Warnings' },
              { layer: radarLayer, title: 'KNMI precipitation radar' },
              { layer: msgCppLayer, title: 'MSG-CPP precipitation' },
              { layer: dwdRadarLayer, title: 'DWD Radar' }
            ]}
          />
        </div>
        <div style={{ position:'absolute', left:'350px', top: '10px', zIndex: '10000', right:'200px' }}>
          <SimpleTimeSlider
            store={window.store}
            mapId='mapid_1'
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
      </Provider>
    );
    return story;
  });

const experimentDemo = {
  title: 'experimentDemo',
  storyFn: () => {
    /* Just a button inside a component to connect it to redux */
    const story = (
      <Provider store={window.store} >
        <ExperimentDemo />
      </Provider>
    );
    return story;
  }
};

storiesOf('Map experiment', module)
  .add(experimentDemo.title, experimentDemo.storyFn);
