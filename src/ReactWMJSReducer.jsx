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
  WEBMAPJS_SET_BASELAYERS,
  WEBMAPJS_SET_ACTIVE_MAPPANEL_INDEX,
  WEBMAPJS_MAP_CHANGE_DIMENSION,
  WEBMAPJS_LAYER_SETHEADERS,
  WEBMAPJS_START_ANIMATION,
  WEBMAPJS_STOP_ANIMATION

} from './ReactWMJSConstants';

import { generateMapId, generateLayerId, getLayerIndexFromAction, getDimensionIndexFromAction, getMapPanelIndexFromAction, getWMJSMapById } from './ReactWMJSTools.jsx';
import produce from 'immer';
import moment from 'moment';

const initialState = {
  webmapjs:{
    activeMapPanelIndex: 0,
    services: {},
    mapPanel: [
      {
        id: generateMapId(),
        isAnimating: false,
        // bbox: [0, 40, 10, 60],
        // srs: 'EPSG:4326',
        bbox: [-2439977.836801867, 2292675.187961922, 7220923.985435895, 9229121.851961922],
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
        isAnimating: false,
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
    case WEBMAPJS_SET_ACTIVE_MAPPANEL_INDEX:
      return produce(state, draft => {
        draft.webmapjs.activeMapPanelIndex = action.payload.activeMapPanelIndex;
      });
    case WEBMAPJS_LAYER_MOVE:
      return produce(state, draft => {
        const mapPanelIndexFromAction = getMapPanelIndexFromAction(action, draft.webmapjs.mapPanel); if (mapPanelIndexFromAction === null) { return state; }
        draft.webmapjs.mapPanel[mapPanelIndexFromAction].layers[action.payload.oldIndex] =
          state.webmapjs.mapPanel[mapPanelIndexFromAction].layers[action.payload.newIndex];
        draft.webmapjs.mapPanel[mapPanelIndexFromAction].layers[action.payload.newIndex] =
          state.webmapjs.mapPanel[mapPanelIndexFromAction].layers[action.payload.oldIndex];
      });
    case WEBMAPJS_LAYER_CHANGE_NAME:
      return produce(state, draft => {
        const mapPanelIndexFromAction = getMapPanelIndexFromAction(action, draft.webmapjs.mapPanel); if (mapPanelIndexFromAction === null) { return state; }
        draft.webmapjs.mapPanel[mapPanelIndexFromAction].layers[action.payload.layerIndex].name = action.payload.name;
      });
    case WEBMAPJS_LAYER_CHANGE_ENABLED:
      return produce(state, draft => {
        const mapPanelIndexFromAction = getMapPanelIndexFromAction(action, draft.webmapjs.mapPanel); if (mapPanelIndexFromAction === null) { return state; }
        const layerIndex = getLayerIndexFromAction(action, draft.webmapjs.mapPanel[mapPanelIndexFromAction].layers);
        draft.webmapjs.mapPanel[mapPanelIndexFromAction].layers[layerIndex].enabled = action.payload.enabled;
      });
    case WEBMAPJS_LAYER_CHANGE_STYLE:
      return produce(state, draft => {
        const mapPanelIndexFromAction = getMapPanelIndexFromAction(action, draft.webmapjs.mapPanel); if (mapPanelIndexFromAction === null) { return state; }
        let layerIndex = getLayerIndexFromAction(action, state.webmapjs.mapPanel[mapPanelIndexFromAction].layers);
        if (layerIndex === null) return state;
        draft.webmapjs.mapPanel[mapPanelIndexFromAction].layers[layerIndex].style = action.payload.style;
      });
    case WEBMAPJS_LAYER_CHANGE_DIMENSION:
      /**
       * THis will change the dimension inside the redux state of the layer.
       * ReactWMJSMap will see that the dimension has changed and will update the layers dimension value accordingly.
       */
      return produce(state, draft => {
        const mapPanelIndexFromAction = getMapPanelIndexFromAction(action, draft.webmapjs.mapPanel); if (mapPanelIndexFromAction === null) { return state; }
        const mapPanel = draft.webmapjs.mapPanel[mapPanelIndexFromAction];
        const wmjsMap = getWMJSMapById(action.payload.mapPanelId);
        let layerIndex = getLayerIndexFromAction(action, mapPanel.layers);
        if (layerIndex === null) return state;
        const dimensions = mapPanel.layers[layerIndex].dimensions || [];
        let dimensionIndex = getDimensionIndexFromAction(action, dimensions);
        if (dimensionIndex === null) {
          dimensions.push(action.payload.dimension);
        } else {
          dimensions[dimensionIndex] = action.payload.dimension;
        }
        mapPanel.layers[layerIndex].dimensions = dimensions;
        /* Also set the dimensions object for the map */
        const mapDimension = wmjsMap.getDimension(action.payload.dimension.name);
        if (mapDimension) {
          const reduxMapDimensions = mapPanel.dimensions || [];
          let dimensionIndex = getDimensionIndexFromAction(action, reduxMapDimensions);
          if (dimensionIndex === null) {
            reduxMapDimensions.push({
              name: mapDimension.name,
              units: mapDimension.units,
              currentValue: mapDimension.currentValue
            });
          } else {
            reduxMapDimensions[dimensionIndex].currentValue = mapDimension.currentValue;
          }
          draft.webmapjs.mapPanel[mapPanelIndexFromAction].dimensions = reduxMapDimensions;
        }
      });
    case WEBMAPJS_MAP_CHANGE_DIMENSION:
      return produce(state, draft => {
        const mapPanelIndexFromAction = getMapPanelIndexFromAction(action, draft.webmapjs.mapPanel); if (mapPanelIndexFromAction === null) { return state; }
        const mapPanel = draft.webmapjs.mapPanel[mapPanelIndexFromAction];
        const wmjsMap = getWMJSMapById(action.payload.mapPanelId);
        if (!wmjsMap || !mapPanel) return;
        const mapDimension = wmjsMap.getDimension(action.payload.dimension.name);
        if (!mapDimension) {
          console.warn('Map has no dimension with name ' + action.payload.dimension.name);
          return state;
        }
        /* Check the mapdimension redux state */
        const reduxMapDimensions = mapPanel.dimensions || [];
        let dimensionIndex = getDimensionIndexFromAction(action, reduxMapDimensions);
        if (dimensionIndex === null) {
          reduxMapDimensions.push({
            name: mapDimension.name,
            units: mapDimension.units,
            currentValue: action.payload.dimension.currentValue
          });
        } else {
          if (reduxMapDimensions[dimensionIndex].currentValue === action.payload.dimension.currentValue &&
            mapDimension.currentValue === action.payload.dimension.currentValue) {
            return state;
          }
          reduxMapDimensions[dimensionIndex].currentValue = action.payload.dimension.currentValue;
        }
        /* Set the dimensions object for the map in the redux state */
        draft.webmapjs.mapPanel[mapPanelIndexFromAction].dimensions = reduxMapDimensions;

        /* Set the dimension value in the map, the map will figure out the valid dim values for each layer */
        wmjsMap.getListener().suspendEvents();
        wmjsMap.setDimension(action.payload.dimension.name, action.payload.dimension.currentValue, false);
        wmjsMap.getListener().resumeEvents();
        wmjsMap.draw();
        /* Now list all dimensions of each layer and set the state to the values from the layers */
        const wmjsLayers = wmjsMap.getLayers();
        for (let d = 0; d < wmjsLayers.length; d++) {
          const layer = wmjsLayers[d];
          const layerDimension = layer.getDimension(action.payload.dimension.name);
          if (layerDimension) {
            let layerIndex = getLayerIndexFromAction({ payload: { layerId: layer.id } }, mapPanel.layers);
            const dimensions = mapPanel.layers[layerIndex].dimensions || [];
            let dimensionIndex = getDimensionIndexFromAction(action, dimensions);
            if (dimensionIndex === null) {
              dimensions.push({
                name: layerDimension.name,
                units: layerDimension.units,
                currentValue: layerDimension.currentValue
              });
            } else {
              dimensions[dimensionIndex].currentValue = layerDimension.currentValue;
            }
          }
        }
      });
    case WEBMAPJS_LAYER_DELETE:
      return produce(state, draft => {
        const mapPanelIndexFromAction = getMapPanelIndexFromAction(action, draft.webmapjs.mapPanel); if (mapPanelIndexFromAction === null) { return state; }
        draft.webmapjs.mapPanel[mapPanelIndexFromAction].layers.splice(action.payload.layerIndex, 1);
      });
    case WEBMAPJS_SERVICE_SET_LAYERS:
      return produce(state, draft => {
        if (!draft.webmapjs.services[action.payload.service]) draft.webmapjs.services[action.payload.service] = {};
        draft.webmapjs.services[action.payload.service].layers = action.payload.layers;
      });
    case WEBMAPJS_LAYER_CHANGE_OPACITY:
      return produce(state, draft => {
        const mapPanelIndexFromAction = getMapPanelIndexFromAction(action, draft.webmapjs.mapPanel); if (mapPanelIndexFromAction === null) { return state; }
        const layerIndex = getLayerIndexFromAction(action, draft.webmapjs.mapPanel[mapPanelIndexFromAction].layers);
        draft.webmapjs.mapPanel[mapPanelIndexFromAction].layers[layerIndex].opacity = action.payload.opacity;
      });
    case WEBMAPJS_LAYER_SETHEADERS:
      return produce(state, draft => {
        return produce(state, draft => {
          const mapPanelIndexFromAction = getMapPanelIndexFromAction(action, draft.webmapjs.mapPanel); if (mapPanelIndexFromAction === null) { return state; }
          const layerIndex = getLayerIndexFromAction(action, state.webmapjs.mapPanel[mapPanelIndexFromAction].layers);
          draft.webmapjs.mapPanel[mapPanelIndexFromAction].layers[layerIndex].headers = action.payload.headers;
        });
      });
    case WEBMAPJS_SERVICE_LAYER_SET_STYLES:
      return produce(state, draft => {
        if (!action.payload.service || !action.payload.name) { return state; }
        if (!draft.webmapjs.services[action.payload.service]) draft.webmapjs.services[action.payload.service] = {};
        if (!draft.webmapjs.services[action.payload.service].layer) draft.webmapjs.services[action.payload.service].layer = {};
        if (!draft.webmapjs.services[action.payload.service].layer[action.payload.name]) draft.webmapjs.services[action.payload.service].layer[action.payload.name] = {};
        draft.webmapjs.services[action.payload.service].layer[action.payload.name].styles = action.payload.styles;
      });
    case WEBMAPJS_SERVICE_LAYER_SET_DIMENSIONS:
      return produce(state, draft => {
        if (!action.payload.service || !action.payload.name) { return state; }
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
      if (!layersWithIds) {
        console.error('WEBMAPJS_SET_LAYERS, no layers defined');
        return state;
      }
      /* Check for duplicate id's */
      const s = {};
      for (let j = 0; j < layersWithIds.length; j++) {
        if (s[layersWithIds[j].id]) {
          console.error('WEBMAPJS_SET_LAYERS, no layers have dupicate id\'s [' + layersWithIds[j].id + ']');
          return state;
        }
        s[layersWithIds[j].id] = true;
      }
      return produce(state, draft => {
        const mapPanelIndexFromAction = getMapPanelIndexFromAction(action, draft.webmapjs.mapPanel); if (mapPanelIndexFromAction === null) { return state; }
        const mapPanel = draft.webmapjs.mapPanel[mapPanelIndexFromAction];
        if (!mapPanel) {
          console.error('WEBMAPJS_SET_LAYERS, mapPanel not found', action);
          return state;
        }
        mapPanel.layers = layersWithIds;
      });
    case WEBMAPJS_SET_BASELAYERS:
      const baseLayersWithIds = createLayersWithIds(action.payload.baseLayers);
      if (!baseLayersWithIds || !baseLayersWithIds.length) {
        console.error('WEBMAPJS_SET_BASELAYERS: baselayers not set or is not an array');
        return state;
      }
      return produce(state, draft => {
        const mapPanelIndexFromAction = getMapPanelIndexFromAction(action, draft.webmapjs.mapPanel); if (mapPanelIndexFromAction === null) { return state; }
        draft.webmapjs.mapPanel[mapPanelIndexFromAction].baseLayers = baseLayersWithIds;
      });
    case WEBMAPJS_SET_FEATURE_LAYERS:
      const featureLayersWithIds = createLayersWithIds(action.payload.featureLayers);
      return produce(state, draft => {
        const mapPanelIndexFromAction = getMapPanelIndexFromAction(action, draft.webmapjs.mapPanel); if (mapPanelIndexFromAction === null) { return state; }
        draft.webmapjs.mapPanel[mapPanelIndexFromAction].featureLayers = featureLayersWithIds;
      });
    case WEBMAPJS_START_ANIMATION:
      return produce(state, draft => {
        const timeList = [];
        const unixStart = moment(action.payload.start).utc().unix();
        const unixEnd = moment(action.payload.end).utc().unix();
        for (let j = unixStart; j < unixEnd; j = j + action.payload.interval) {
          timeList.push({ name:'time', value: moment.unix(j).toISOString() });
        }
        const webMapJS = getWMJSMapById(action.payload.mapPanelId);
        webMapJS.getListener().suspendEvents();
        webMapJS.stopAnimating();
        webMapJS.draw(timeList);
        webMapJS.getListener().resumeEvents();
        const mapPanelIndexFromAction = getMapPanelIndexFromAction(action, draft.webmapjs.mapPanel); if (mapPanelIndexFromAction === null) { return state; }
        const mapPanel = draft.webmapjs.mapPanel[mapPanelIndexFromAction];
        mapPanel.isAnimating = true;
      });
    case WEBMAPJS_STOP_ANIMATION:
      return produce(state, draft => {
        const webMapJS = getWMJSMapById(action.payload.mapPanelId);
        webMapJS.getListener().suspendEvents();
        webMapJS.stopAnimating();
        webMapJS.draw();
        webMapJS.getListener().resumeEvents();
        const mapPanelIndexFromAction = getMapPanelIndexFromAction(action, draft.webmapjs.mapPanel); if (mapPanelIndexFromAction === null) { return state; }
        const mapPanel = draft.webmapjs.mapPanel[mapPanelIndexFromAction];
        mapPanel.isAnimating = false;
      });
    default:
      return state;
  }

  function createLayersWithIds (layers) {
    if (!layers) return layers;
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
