import React, { Component } from 'react';
import { createStore } from 'redux';
import { storiesOf, specs, describe, it } from '../.storybook/facade';
import { SimpleLayerManager,
  SimpleTimeSlider,
  setLayers,
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
  getWMJSLayerById } from '../src/index';
import Provider from '../storyComponents/Provider';
import ConnectedReactWMJSMap from '../storyComponents/ConnectedReactWMJSMap';
import { mount } from 'enzyme';
import { Button } from 'reactstrap';
import '../storyComponents/storybook.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { connect } from 'react-redux';
import moment from 'moment';
import PropTypes from 'prop-types';
import ReactSlider from 'react-slider';
import '../src/react-slider.css';
import ReduxReactCounterDemo from '../src/ReduxReactCounterDemo';

// Initialize the store.
const rootReducer = (state = {}, action = { type:null }) => { return state; };
const reducerManager = createReducerManager({ root: rootReducer });
const store = createStore(reducerManager.reduce, window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__());
store.reducerManager = reducerManager;

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
  style: 'warnungen_gemeinden_vereinigt_event_seamless_param',
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
      <Provider store={store} >
        <div style={{ height: '100vh' }}>
          <ConnectedReactWMJSMap />
        </div>
        <div style={{ position:'absolute', left:'10px', top: '10px', zIndex: '10000' }}>
          <SimpleLayerManager
            store={store}
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
      <Provider store={store} >
        <div style={{ height: '100vh' }}>
          <ConnectedReactWMJSMap />
        </div>
        <div style={{ position:'absolute', left:'10px', top: '10px', zIndex: '10000' }}>
          <SimpleLayerManager
            store={store}
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
        <div style={{ position:'absolute', left:'200px', bottom: '10px', zIndex: '10000', right:'200px' }}>
          <SimpleTimeSlider
            store={store}
            mapId={'mapid_1'}
            startValue={moment.utc().subtract(6, 'h').toISOString()}
            endValue={moment.utc().add(-30, 'm').toISOString()}
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

/* assemble stories from prebuilt elements */

storiesOf('KNMI-DWD Demo 04-10-2019', module)
  .add(obsStory.title, obsStory.storyfn)
  .add(radarloopStory.title, radarloopStory.storyfn)
  .add(warningStory.title, warningStory.storyfn)
  .add(timesliderdemoStory.title, timesliderdemoStory.storyfn);

/* random assortion of stories */

storiesOf('Simple layer manager', module).add('layerChangeEnabled action', () => {
  const story = (
    <Provider store={store} >
      <div style={{ height: '100vh' }}>
        <ConnectedReactWMJSMap />
      </div>
      <div style={{ position:'absolute', left:'10px', top: '10px', zIndex: '10000' }}>
        <SimpleLayerManager
          store={store}
          layers={[ radarLayer, dwdRadarLayer ]}
          mapId={'mapid_1'}
          layerNameMappings={[
            { layer: dwdWarningLayer, title: 'DWD Warnings' },
            { layer: radarLayer, title: 'KNMI precipitation radar' },
            { layer: msgCppLayer, title: 'MSG-CPP precipitation' },
            { layer: dwdRadarLayer, title: 'DWD Radar' }
          ]}
        />
      </div>
      <div style={{ position:'absolute', left:'200px', bottom: '10px', zIndex: '10000', right:'200px' }}>
        <SimpleTimeSlider
          store={store}
          mapId={'mapid_1'}
          startValue={moment.utc().subtract(6, 'h').toISOString()}
          endValue={moment.utc().add(-5, 'm').toISOString()}
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
          store={store}
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
  }).add('setLayers action', () => {
    const story = (
      <Provider store={store} >
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
      <Provider store={store} >
        <div style={{ height: '100vh' }}>
          <ConnectedReactWMJSMap />
        </div>
        <div style={{ position:'absolute', left:'10px', top: '10px', zIndex: '10000' }}>
          <ConnectedLayerEnableButton store={store} />
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
      <Provider store={store} >
        <div style={{ height: '100vh' }}>
          <ConnectedReactWMJSMap />
        </div>
        <div style={{ position:'absolute', left:'10px', top: '10px', zIndex: '10000' }}>
          <ConnectedLayerChangeOpacityInput store={store} />
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
    const ConnectedMapChangeDimension = connect(mapStateToProps)(MapChangeDimension);
    const story = (
      <Provider store={store} >
        <div style={{ height: '100vh' }}>
          <ConnectedReactWMJSMap />
        </div>
        <div style={{ position:'absolute', left:'10px', top: '10px', zIndex: '10000' }}>
          <ConnectedMapChangeDimension store={store} />
        </div>
      </Provider>
    );
    return story;
  }).add('Simple layer component', () => {
    store.dispatch(setLayers({ layers: [radarLayer, dwdRadarLayer, msgCppLayer], mapPanelId: 'mapid_1' }));
    const story = (
      <Provider store={store} >
        <div style={{ height: '100vh' }}>
          <ConnectedReactWMJSMap />
        </div>
        <div style={{ position:'absolute', left:'10px', top: '10px', zIndex: '10000' }}>
          <SimpleLayerManager
            store={store}
            mapId={'mapid_1'}
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
  }).add('ReduxReactCounterDemo', () => {
    /* Just a button inside a component to connect it to redux */
    const story = (
      <Provider store={store} >
        <ReduxReactCounterDemo />
      </Provider>
    );
    return story;
  });
