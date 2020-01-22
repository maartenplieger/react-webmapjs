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
  WEBMAPJS_MAP_CHANGE_DIMENSION,
  WEBMAPJS_LAYER_SETHEADERS,
  WEBMAPJS_START_ANIMATION,
  WEBMAPJS_STOP_ANIMATION
} from './ReactWMJSConstants';

/**
 * Sets opacity for a layer in the map
 * @param {*} obj Object with a layerId/layerIndex, mapPanelId and opacity between 0.0 and 1.0 property.
 * Example: {mapPanelId:'map_id1', layerId: 'layerid1', opacity: 0.5}
 */
export const layerChangeOpacity = obj => ({ type: WEBMAPJS_LAYER_CHANGE_OPACITY, payload: obj });

/**
 * Shows or hide a layer in the map.
 * @param {*} obj Object with a layerId/layerIndex, mapPanelId and enabled property.
 * Example: {mapPanelId:'map_id1', layerId: 'layerid1', enabled: false}
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
 * @param {*} obj Object with a array of layers and mapPanelId
 * Example: {layers:[<layer object>], mapPanelId:<string>}
 */
export const setLayers = obj => ({ type: WEBMAPJS_SET_LAYERS, payload: obj });

/**
 * Set the headers to be sent with the requests of the layer (GetMap, GetCapabilities). Can for example be used to set an authorization header.
 * @param {*} obj Object with a layerId/layerIndex, mapPanelId, and a headers array of object which consist of a name and a value.
 * Example: {mapPanelId:'map_id1', layerId: 'layerid1', headers: [{'name': <header name>, 'value': <value name>}]}
 */
export const layerSetHeaders = obj => ({ type: WEBMAPJS_LAYER_SETHEADERS, payload: obj });

/**
 * Set the dimension for the map. Can be used to change the time. All layers in the map will follow (if linking is set) accordingly.
 * @param {*} obj Object with mapPanelId and a dimension object with name and currentValue.
 * Example: {mapPanelId:'map_id1', dimension:{name'time', value:'2019-10-08T10:00:00Z'}}
 */
export const mapChangeDimension = obj => ({ type: WEBMAPJS_MAP_CHANGE_DIMENSION, payload: obj });

/**
 * Set the baselayers for a map. Erases all previous baselayers.
 * @param {*} obj Object with a array of baselayers and mapPanelId.
 * Example: {baseLayers:[<layer object>], mapPanelId:<string>}
 */
export const setBaseLayers = obj => ({ type: WEBMAPJS_SET_BASELAYERS, payload: obj });

/**
 * Starts the animation for a map.
 * @param {*} obj Object with mapPanelId, start, stop and interval
 * Example: {mapPanelId:<string>, start: <ISO8601 string>, end: <ISO8601 string>, interval: seconds}
 */
export const mapStartAnimation = obj => ({ type: WEBMAPJS_START_ANIMATION, payload: obj });

/**
 * Stops the animation for a map.
 * @param {*} obj Object with mapPanelId
 */
export const mapStopAnimation = obj => ({ type: WEBMAPJS_STOP_ANIMATION, payload: obj });

export const layerMoveLayer = obj => ({ type: WEBMAPJS_LAYER_MOVE, payload: obj });

export const layerDelete = obj => ({ type: WEBMAPJS_LAYER_DELETE, payload: obj });

export const layerChangeDimension = obj => ({ type: WEBMAPJS_LAYER_CHANGE_DIMENSION, payload: obj });

export const layerChangeName = obj => ({ type: WEBMAPJS_LAYER_CHANGE_NAME, payload: obj });

export const layerChangeStyle = obj => ({ type: WEBMAPJS_LAYER_CHANGE_STYLE, payload: obj });

export const setFeatureLayers = obj => ({ type: WEBMAPJS_SET_FEATURE_LAYERS, payload: obj });

export const setActiveMapPanelIndex = obj => ({ type: WEBMAPJS_SET_ACTIVE_MAPPANEL_INDEX, payload: obj });

// export const layerFocus = obj => ({ type: LAYER_FOCUS, payload: obj });

/**
 * layerSetDimensions is used automatically after calling the setLayers action.
 * It is populating the intial list of dimensions for the layer.
 * Contents is based on WMS GetCapabilities
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
