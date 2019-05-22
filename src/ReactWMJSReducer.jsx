import { WEBMAPJS_LAYER_CHANGE_OPACITY,
  WEBMAPJS_LAYER_CHANGE_NAME,
  WEBMAPJS_LAYER_CHANGE_STYLE,
  WEBMAPJS_LAYER_CHANGE_DIMENSION,
  WEBMAPJS_LAYER_CHANGE_ENABLED,
  WEBMAPJS_SERVICE_SET_LAYERS,
  WEBMAPJS_SERVICE_LAYER_SET_STYLES,
  WEBMAPJS_SERVICE_LAYER_SET_DIMENSIONS,
  WEBMAPJS_LAYER_DELETE,
  WEBMAPJS_LAYER_MOVE,
  WEBMAPJS_SET_LAYERS,
  WEBMAPJS_SET_FEATURE_LAYERS,
  WEBMAPJS_SET_BASELAYERS
} from './ReactWMJSConstants';

import { generateMapId, generateLayerId, getLayerIndexFromAction, getDimensionIndexFromAction, getMapPanelIndexFromAction } from './ReactWMJSTools.jsx';
import produce from 'immer';

const initialState = {
  webmapjs:{
    activeMapPanelIndex: 0,
    services: {},
    mapPanel: [
      {
        id: generateMapId(),
        // bbox: [0, 40, 10, 60],
        // srs: 'EPSG:4326',
        bbox: [-2439977.836801867,2292675.187961922,7220923.985435895,9229121.851961922],
        srs: 'EPSG:3857',
        baseLayers:[{
          service:'http://geoservices.knmi.nl/cgi-bin/worldmaps.cgi?',
          name:'ne_10m_admin_0_countries_simplified',
          format:'image/png',
          keepOnTop:true,
          baseLayer:true,
          enabled:true,
          id:generateLayerId()
        }, {
          id:generateLayerId(),
          name:'WorldMap_Light_Grey_Canvas',
          type:'twms',
          baseLayer:true,
          enabled:true
        }
        ],
        layers:[],
        featureLayers:[]
      }, {
        id: generateMapId(),
        baseLayers:[
          {
            service:'http://geoservices.knmi.nl/cgi-bin/worldmaps.cgi?',
            name:'ne_10m_admin_0_countries_simplified',
            format:'image/png',
            keepOnTop:true,
            baseLayer:true,
            id:generateLayerId()
          }
        ],
        layers:[],
        featureLayers:[]
      }
    ]
  }
};

export const WEBMAPJS_REDUCERNAME = 'react-webmapjs';

export const webMapJSReducer = (state = initialState, action = { type:null }) => {
  switch (action.type) {
    case WEBMAPJS_LAYER_MOVE:
      return produce(state, draft => {
        draft.webmapjs.mapPanel[getMapPanelIndexFromAction(action, state.webmapjs.mapPanel)].layers[action.payload.oldIndex] =
          state.webmapjs.mapPanel[getMapPanelIndexFromAction(action, state.webmapjs.mapPanel)].layers[action.payload.newIndex];
        draft.webmapjs.mapPanel[getMapPanelIndexFromAction(action, state.webmapjs.mapPanel)].layers[action.payload.newIndex] =
          state.webmapjs.mapPanel[getMapPanelIndexFromAction(action, state.webmapjs.mapPanel)].layers[action.payload.oldIndex];
      });
    case WEBMAPJS_LAYER_CHANGE_NAME:
      return produce(state, draft => { draft.webmapjs.mapPanel[getMapPanelIndexFromAction(action, state.webmapjs.mapPanel)].layers[action.payload.layerIndex].name = action.payload.name; });
    case WEBMAPJS_LAYER_CHANGE_ENABLED:
      return produce(state, draft => { draft.webmapjs.mapPanel[getMapPanelIndexFromAction(action, state.webmapjs.mapPanel)].layers[action.payload.layerIndex].enabled = action.payload.enabled; });
    case WEBMAPJS_LAYER_CHANGE_STYLE:
      return produce(state, draft => {
        let layerIndex = getLayerIndexFromAction(action, state.webmapjs.mapPanel[getMapPanelIndexFromAction(action, state.webmapjs.mapPanel)].layers);
        if (layerIndex === null) return;
        draft.webmapjs.mapPanel[getMapPanelIndexFromAction(action, state.webmapjs.mapPanel)].layers[layerIndex].style = action.payload.style;
      });
    case WEBMAPJS_LAYER_CHANGE_DIMENSION:
      return produce(state, draft => {
        let layerIndex = getLayerIndexFromAction(action, state.webmapjs.mapPanel[getMapPanelIndexFromAction(action, state.webmapjs.mapPanel)].layers);
        if (layerIndex === null) return;
        const dimensions = draft.webmapjs.mapPanel[getMapPanelIndexFromAction(action, state.webmapjs.mapPanel)].layers[layerIndex].dimensions || [];
        let dimensionIndex = getDimensionIndexFromAction(action, dimensions);
        if (dimensionIndex === null) {
          dimensions.push(action.payload.dimension);
        } else {
          dimensions[dimensionIndex] = action.payload.dimension;
        }
        draft.webmapjs.mapPanel[getMapPanelIndexFromAction(action, state.webmapjs.mapPanel)].layers[layerIndex].dimensions = dimensions;
      });
    case WEBMAPJS_LAYER_DELETE:
      return produce(state, draft => {
        draft.webmapjs.mapPanel[getMapPanelIndexFromAction(action, state.webmapjs.mapPanel)].layers.splice(action.payload.layerIndex, 1);
      });
    case WEBMAPJS_SERVICE_SET_LAYERS:
      return produce(state, draft => {
        if (!draft.webmapjs.services[action.payload.service]) draft.webmapjs.services[action.payload.service] = {};
        draft.webmapjs.services[action.payload.service].layers = action.payload.layers;
      });
    case WEBMAPJS_LAYER_CHANGE_OPACITY:
      const mapPanelIndex = getMapPanelIndexFromAction(action, state.webmapjs.mapPanel);
      const layerIndex = getLayerIndexFromAction(action, state.webmapjs.mapPanel[mapPanelIndex].layers);
      return produce(state, draft => { draft.webmapjs.mapPanel[mapPanelIndex].layers[layerIndex].opacity = action.payload.opacity; });
    case WEBMAPJS_SERVICE_LAYER_SET_STYLES:
      return produce(state, draft => {
        if (!action.payload.service || !action.payload.name) { return; }
        if (!draft.webmapjs.services[action.payload.service]) draft.webmapjs.services[action.payload.service] = {};
        if (!draft.webmapjs.services[action.payload.service].layer) draft.webmapjs.services[action.payload.service].layer = {};
        if (!draft.webmapjs.services[action.payload.service].layer[action.payload.name]) draft.webmapjs.services[action.payload.service].layer[action.payload.name] = {};
        draft.webmapjs.services[action.payload.service].layer[action.payload.name].styles = action.payload.styles;
      });
    case WEBMAPJS_SERVICE_LAYER_SET_DIMENSIONS:
      return produce(state, draft => {
        if (!action.payload.service || !action.payload.name) { return; }
        if (!draft.webmapjs.services[action.payload.service]) draft.webmapjs.services[action.payload.service] = {};
        if (!draft.webmapjs.services[action.payload.service].layer) draft.webmapjs.services[action.payload.service].layer = {};
        if (!draft.webmapjs.services[action.payload.service].layer[action.payload.name]) draft.webmapjs.services[action.payload.service].layer[action.payload.name] = {};
        let dimensions = [];
        for (let j = 0; j < action.payload.dimensions.length; j++) {
          dimensions.push({
            name: action.payload.dimensions[j].name,
            units: action.payload.dimensions[j].units,
            currentValue: action.payload.dimensions[j].currentValue
          });
        }
        draft.webmapjs.services[action.payload.service].layer[action.payload.name].dimensions = dimensions;
      });
    case WEBMAPJS_SET_LAYERS:
      const layersWithIds = createLayersWithIds(action.payload.layers);
      return produce(state, draft => { draft.webmapjs.mapPanel[getMapPanelIndexFromAction(action, state.webmapjs.mapPanel)].layers = layersWithIds; });
    case WEBMAPJS_SET_BASELAYERS:
      const baseLayersWithIds = createLayersWithIds(action.payload.baseLayers);
      return produce(state, draft => { draft.webmapjs.mapPanel[getMapPanelIndexFromAction(action, state.webmapjs.mapPanel)].baseLayers = baseLayersWithIds; });
    case WEBMAPJS_SET_FEATURE_LAYERS:
      const featureLayersWithIds = createLayersWithIds(action.payload.featureLayers);
      return produce(state, draft => { draft.webmapjs.mapPanel[getMapPanelIndexFromAction(action, state.webmapjs.mapPanel)].featureLayers = featureLayersWithIds; });
    default:
      return state;
  }

  function createLayersWithIds (layers) {
    return produce(layers, draft => {
      for (let j = 0; j < draft.length; j++) {
        const layer = draft[j];
        if (!layer.id) {
          layer.id = generateLayerId();
        }
      }
    });
  }
};
