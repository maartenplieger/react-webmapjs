import produce from 'immer';
import {
  LAYERMANAGER_TOGGLE_LAYERSELECTOR,
  LAYERMANAGER_TOGGLE_STYLESSELECTOR,
  LAYERMANAGER_SET_NUMBER_OF_LAYERS,
  LAYERMANAGER_SET_TIMERESOLUTION,
  LAYERMANAGER_SET_TIMEVALUE,
  LAYER_MANAGER_EMPTY_LAYER
} from './LayerManagerConstants';

import { WEBMAPJS_LAYER_DELETE, WEBMAPJS_SET_LAYERS } from '@adaguc/react-webmapjs';

const moment = window.moment;

const initialState = {
  layerManager:{
    layers: [],
    timeResolution: 60,
    timeStart: null,
    timeEnd: null,
    timeValue: null
  }
};

export const LAYERMANAGER_REDUCERNAME = 'webmapjs-layermanager';
export const layerManagerReducer = (state = initialState, action = { type:null }) => {
  switch (action.type) {
    case WEBMAPJS_LAYER_DELETE:
      return produce(state, draft => {
        draft.layerManager.layers.splice(action.payload.layerIndex, 1);
      });
    case LAYERMANAGER_TOGGLE_STYLESSELECTOR:
      return produce(state, draft => { draft.layerManager.layers[action.payload.layerIndex].styleSelectorOpen = !draft.layerManager.layers[action.payload.layerIndex].styleSelectorOpen; });
    case LAYERMANAGER_TOGGLE_LAYERSELECTOR:
      return produce(state, draft => { draft.layerManager.layers[action.payload.layerIndex].layerSelectorOpen = !draft.layerManager.layers[action.payload.layerIndex].layerSelectorOpen; });
    case LAYERMANAGER_SET_NUMBER_OF_LAYERS:
      return produce(state, draft => {
        draft.layerManager.layers.length = 0;
        for (let j = 0; j < action.payload; j++) {
          draft.layerManager.layers.push(LAYER_MANAGER_EMPTY_LAYER);
        }
      });
    case WEBMAPJS_SET_LAYERS:
      return produce(state, draft => {
        draft.layerManager.layers.length = 0;
        for (let j = 0; j < action.payload.layers.length; j++) {
          draft.layerManager.layers.push(LAYER_MANAGER_EMPTY_LAYER);
        }
      });
    case LAYERMANAGER_SET_TIMERESOLUTION:
      return produce(state, draft => {
        // console.log('timeStart', actio/n.payload.timeStart);
        if (action.payload.timeResolution) draft.layerManager.timeResolution = action.payload.timeResolution;
        // const currentTimeResolution = state.layerManager.timeResolution;
        // const newTimeResolution = action.payload.timeResolution;
        // let currentValue = moment.utc(state.layerManager.timeValue, 'YYYY-MM-DDTHH:mm:SS');
        // const momentStart = moment.utc(state.layerManager.timeStart, 'YYYY-MM-DDTHH:mm:SS');
        // const momentEnd = moment.utc(state.layerManager.timeEnd, 'YYYY-MM-DDTHH:mm:SS');
        // // let newStart = moment.utc(currentValue + (((momentStart - currentValue) * newTimeResolution) / currentTimeResolution));
        // let newEnd = moment.utc(currentValue + (((momentEnd - currentValue) * newTimeResolution) / currentTimeResolution));
        if (action.payload.timeStart && action.payload.timeStart.isValid()) draft.layerManager.timeStart = action.payload.timeStart;// else draft.layerManager.timeStart = newStart;
        if (action.payload.timeEnd && action.payload.timeEnd.isValid()) draft.layerManager.timeEnd = action.payload.timeEnd;// else draft.layerManager.timeEnd = newEnd;
        if (action.payload.timeValue && action.payload.timeValue.isValid()) draft.layerManager.timeValue = action.payload.timeValue;
      });
    case LAYERMANAGER_SET_TIMEVALUE:
      return produce(state, draft => { draft.layerManager.timeValue = action.payload.timeValue; });
    default:
      return state;
  }
};
