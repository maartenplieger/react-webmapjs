import {
  LAYERMANAGER_TOGGLE_LAYERSELECTOR,
  LAYERMANAGER_TOGGLE_STYLESSELECTOR,
  LAYERMANAGER_SET_NUMBER_OF_LAYERS,
  LAYERMANAGER_SET_TIMERESOLUTION,
  LAYERMANAGER_SET_TIMEVALUE
} from './LayerManagerConstants';
export const layerManagerToggleLayerSelector = obj => ({ type: LAYERMANAGER_TOGGLE_LAYERSELECTOR, payload: obj });
export const layerManagerToggleStylesSelector = obj => ({ type: LAYERMANAGER_TOGGLE_STYLESSELECTOR, payload: obj });
export const layerManagerSetNumberOfLayers = obj => ({ type: LAYERMANAGER_SET_NUMBER_OF_LAYERS, payload: obj });
export const layerManagerSetTimeResolution = obj => ({ type: LAYERMANAGER_SET_TIMERESOLUTION, payload: obj });
export const layerManagerSetTimeValue = obj => ({ type: LAYERMANAGER_SET_TIMEVALUE, payload: obj });
