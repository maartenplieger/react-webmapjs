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
  WEBMAPJS_SET_BASELAYERS,
  WEBMAPJS_SET_FEATURE_LAYERS,
  WEBMAPJS_SET_ACTIVE_MAPPANEL_INDEX
} from './ReactWMJSConstants';

export const layerChangeOpacity = obj => ({ type: WEBMAPJS_LAYER_CHANGE_OPACITY, payload: obj });
export const layerChangeName = obj => ({ type: WEBMAPJS_LAYER_CHANGE_NAME, payload: obj });
export const layerChangeStyle = obj => ({ type: WEBMAPJS_LAYER_CHANGE_STYLE, payload: obj });
export const layerChangeDimension = obj => ({ type: WEBMAPJS_LAYER_CHANGE_DIMENSION, payload: obj });
export const layerChangeEnabled = obj => ({ type: WEBMAPJS_LAYER_CHANGE_ENABLED, payload: obj });
export const serviceSetLayers = obj => ({ type: WEBMAPJS_SERVICE_SET_LAYERS, payload: obj });
export const layerSetStyles = obj => ({ type: WEBMAPJS_SERVICE_LAYER_SET_STYLES, payload: obj });
export const layerSetDimensions = obj => ({ type: WEBMAPJS_SERVICE_LAYER_SET_DIMENSIONS, payload: obj });
export const layerDelete = obj => ({ type: WEBMAPJS_LAYER_DELETE, payload: obj });
export const layerMoveLayer = obj => ({ type: WEBMAPJS_LAYER_MOVE, payload: obj });
export const setLayers = obj => ({ type: WEBMAPJS_SET_LAYERS, payload: obj });
export const setBaseLayers = obj => ({ type: WEBMAPJS_SET_BASELAYERS, payload: obj });
export const setFeatureLayers = obj => ({ type: WEBMAPJS_SET_FEATURE_LAYERS, payload: obj });
export const setActiveMapPanelIndex = obj => ({ type: WEBMAPJS_SET_ACTIVE_MAPPANEL_INDEX, payload: obj });
// export const layerFocus = obj => ({ type: LAYER_FOCUS, payload: obj });
