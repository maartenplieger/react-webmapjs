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
  WEBMAPJS_SET_ACTIVE_MAPPANEL_INDEX,
  WEBMAPJS_MAP_CHANGE_DIMENSION
} from './ReactWMJSConstants';

/**
 * Sets opacity for a layer in the map
 * @param {*} obj Object with a layerId/layerIndex, mapPanelId and opacity between 0.0 and 1.0 property.
 */
export const layerChangeOpacity = obj => ({ type: WEBMAPJS_LAYER_CHANGE_OPACITY, payload: obj });

/**
 * Shows or hide a layer in the map.
 * @param {*} obj Object with a layerId/layerIndex, mapPanelId and enabled property.
 */
export const layerChangeEnabled = obj => ({ type: WEBMAPJS_LAYER_CHANGE_ENABLED, payload: obj });

/**
 * Set the layers for a map. Erases all previous layers.
 * The following action types are triggerd after the getCapabilities are parsed:
 * - serviceSetLayers
 * - layerSetStyles
 * - layerChangeStyle
 * - layerSetDimensions
 * - layerChangeDimension
 * @param {*} obj Object with a array of layers and mapPanelId {layers:[<layer object>], mapPanelId:<string>}
 */
export const setLayers = obj => ({ type: WEBMAPJS_SET_LAYERS, payload: obj });

export const mapChangeDimension = obj => ({ type: WEBMAPJS_MAP_CHANGE_DIMENSION, payload: obj });

export const layerMoveLayer = obj => ({ type: WEBMAPJS_LAYER_MOVE, payload: obj });

export const layerDelete = obj => ({ type: WEBMAPJS_LAYER_DELETE, payload: obj });

export const layerChangeDimension = obj => ({ type: WEBMAPJS_LAYER_CHANGE_DIMENSION, payload: obj });

export const layerChangeName = obj => ({ type: WEBMAPJS_LAYER_CHANGE_NAME, payload: obj });

export const layerChangeStyle = obj => ({ type: WEBMAPJS_LAYER_CHANGE_STYLE, payload: obj });

export const setBaseLayers = obj => ({ type: WEBMAPJS_SET_BASELAYERS, payload: obj });

export const setFeatureLayers = obj => ({ type: WEBMAPJS_SET_FEATURE_LAYERS, payload: obj });

export const setActiveMapPanelIndex = obj => ({ type: WEBMAPJS_SET_ACTIVE_MAPPANEL_INDEX, payload: obj });

// export const layerFocus = obj => ({ type: LAYER_FOCUS, payload: obj });

/**
 * layerSetDimensions is used automatically after calling the setLayers action. Contents is based on WMS GetCapabilities
 * @param {*} obj
 */
export const layerSetDimensions = obj => ({ type: WEBMAPJS_SERVICE_LAYER_SET_DIMENSIONS, payload: obj });
/**
 * serviceSetLayers is used automatically after calling the setLayers action. Contents is based on WMS GetCapabilities
 * @param {*} obj
 */
export const serviceSetLayers = obj => ({ type: WEBMAPJS_SERVICE_SET_LAYERS, payload: obj });
/**
 * layerSetStyles is used automatically after calling the setLayers action. Contents is based on WMS GetCapabilities
 * @param {*} obj
 */
export const layerSetStyles = obj => ({ type: WEBMAPJS_SERVICE_LAYER_SET_STYLES, payload: obj });
