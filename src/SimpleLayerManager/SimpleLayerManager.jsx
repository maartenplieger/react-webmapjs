import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import produce from 'immer';
import { WEBMAPJS_REDUCERNAME, webMapJSReducer, setLayers, layerChangeEnabled, getWMJSLayerById, layerChangeOpacity } from '../index';
import './SimpleLayerManager.css';
import ReactBootstrapSlider from '../UIComponents/ReactBootStrapSlider';

/* Constants */
const REDUXREACTCOUNTERDEMO_ADD = 'COUNTERDEMO_ADD';
const SIMPLELAYERMANAGER_REDUCERNAME = 'COUNTERDEMO';

/* Action creators */
// eslint-disable-next-line no-unused-vars
const addAction = obj => ({ type: REDUXREACTCOUNTERDEMO_ADD, payload: obj });

/* Define the initial state */
const initialState = {
};

/* Reducer which adds its data into the store; the location inside the store is specified by the reducer name and the id from the action */
const simpleLayerManagerReducer = (state = initialState, action = { type:null }) => {
  switch (action.type) {
    case REDUXREACTCOUNTERDEMO_ADD:
      return produce(state, draft => { draft.value += action.payload; });
    default:
      return state;
  }
};

export const getLayerTitle = (nameMappings, layer) => {
  const wmjsLayer = getWMJSLayerById(layer.id);
  /* Get the layer title from the WMJSLayer with fallbacks to layer name */
  let title = wmjsLayer ? wmjsLayer.title || layer.name : layer.name;
  if (!nameMappings || nameMappings.length === 0) return title;
  /* Override the retrieved title by using the provided nameMappings */
  const foundLayers = nameMappings.filter(l => l.layer.id === layer.id);
  if (foundLayers.length === 1) {
    return foundLayers[0].title;
  }
  return title;
};

class SimpleLayerManager extends Component {
  constructor (props) {
    super(props);
    /* Register this new simpleLayerManagerReducer reducer with the reducerManager */
    window.reducerManager.add(SIMPLELAYERMANAGER_REDUCERNAME, simpleLayerManagerReducer);
    if (this.props.layers) {
      this.props.dispatch(setLayers({ layers: this.props.layers, mapPanelId: this.props.mapId }));
    }
  }

  render () {
    const { dispatch, mapId, layerNameMappings } = this.props;
    return (
      <div className={'reactwebmapjs-simplelayermanager'}>
        <div>
          {
            this.props.webmapjslayers.map((layer, key) => {
              return (
                <div className='reactwebmapjs-simplelayermanager-layercontainer' key={key}>
                  <div>
                    <input type='checkbox' checked={layer.enabled} onChange={() => { dispatch(layerChangeEnabled({ layerId: layer.id, mapPanelId: mapId, enabled: !layer.enabled })); }} />
                    <label className='reactwebmapjs-simplelayermanager-layerlabel'>{getLayerTitle(layerNameMappings, layer)}</label>
                  </div>
                  <div>
                    <ReactBootstrapSlider
                      min={0} max={1} step={0.1}
                      value={parseFloat(!layer.opacity && layer.opacity !== 0 ? 1 : layer.opacity)}
                      change={(value) => {
                        let opacity = parseFloat(value);
                        dispatch(layerChangeOpacity({ layerId: layer.id, mapPanelId: mapId, opacity: opacity }));
                      }} />
                  </div>
                </div>
              );
            })
          }
        </div>
      </div>
    );
  }
};

/* this maps the properties in the redux state to the properties of the component */
const mapStateToProps = state => {
  /* Return initial state if not yet set */
  const simpleLayerManagerState = state[SIMPLELAYERMANAGER_REDUCERNAME] || simpleLayerManagerReducer();
  const webMapJSState = state[WEBMAPJS_REDUCERNAME] || webMapJSReducer();

  return {
    value: simpleLayerManagerState.value,
    webmapjslayers: webMapJSState.webmapjs.mapPanel[webMapJSState.webmapjs.activeMapPanelIndex].layers
  };
};

SimpleLayerManager.propTypes = {
  dispatch: PropTypes.func,
  webmapjslayers: PropTypes.array,
  layers: PropTypes.array,
  layerNameMappings: PropTypes.array,
  mapId: PropTypes.string
};

export default connect(mapStateToProps)(SimpleLayerManager);
