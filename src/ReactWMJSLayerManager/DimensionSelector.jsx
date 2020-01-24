import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Row, Col, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import produce from 'immer';
import { connect } from 'react-redux';
import { getWMJSLayerById, layerChangeDimension } from '@adaguc/react-webmapjs';
/* Constants */
const LAYERMANAGER_DIMENSIONSELECTOR_TOGGLE = 'LAYERMANAGER_DIMENSIONSELECTOR_TOGGLE';
const LAYERMANAGER_DIMENSIONSELECTOR_TOGGLE_VALUE = 'LAYERMANAGER_DIMENSIONSELECTOR_TOGGLE_VALUE';
const LAYERMANAGER_DIMENSIONSELECTOR_SETACTIVEDIM = 'LAYERMANAGER_DIMENSIONSELECTOR_SETACTIVEDIM';

const DIMENSIONSELECTOR_REDUCERNAME = 'layermanager.dimensionselector';

/* Action creators */
const layerManagerToggleDimensionSelectorAction = obj => ({ type: LAYERMANAGER_DIMENSIONSELECTOR_TOGGLE, payload: obj });
const toggleValueSelector = obj => ({ type: LAYERMANAGER_DIMENSIONSELECTOR_TOGGLE_VALUE, payload: obj });
const setActiveDim = obj => ({ type: LAYERMANAGER_DIMENSIONSELECTOR_SETACTIVEDIM, payload: obj });

/* Reducer which adds its data into the store; the location inside the store is specified by the reducer name and the id from the action */
const layerManagerDimensionSelectorReducer = (state = { }, action = { type:null }) => {
  const id = action.id || (action.payload && action.payload.id);
  if (!id) { return state; }
  /* Standard reducer handling where the required id is abstracted away for convenience */
  const handleReducer = (state = { }, action = { type:null }) => {
    switch (action.type) {
      case LAYERMANAGER_DIMENSIONSELECTOR_TOGGLE:
        return produce(state, draft => { draft.isOpen = !draft.isOpen; });
      case LAYERMANAGER_DIMENSIONSELECTOR_TOGGLE_VALUE:
        return produce(state, draft => { draft.isValueSelectorOpen = !draft.isValueSelectorOpen; });
      case LAYERMANAGER_DIMENSIONSELECTOR_SETACTIVEDIM:
        return produce(state, draft => { draft.activeDim = action.payload; });
      default:
        return state;
    }
  };

  /* Update the state at the correct location given by the id property from the action */
  return produce(state, draft => { draft[id] = handleReducer(state[id], action); });
};

/* Our custom mapStateToProps for this component */
const mapStateToProps = state => {
  return { dimensionSelectorState: state[DIMENSIONSELECTOR_REDUCERNAME] };
};

/* The initial state for this component */
const initialState = {
  isOpen:false,
  isValueSelectorOpen: false
};

class DimensionSelector extends Component {
  constructor (props) {
    super(props);
    const { layer, dispatch } = this.props;

    /* Some checks */
    if (!layer || !layer.id) { console.warn('DimensionSelector misconfigured, layer missing'); return null; }

    /* Register this new dimensionSelector reducer with the reducerManager */
    window.reducerManager.add(DIMENSIONSELECTOR_REDUCERNAME, layerManagerDimensionSelectorReducer);

    /* Create our own convenience dispatch function which never forgets to add the requested id to the action */
    this.localDispatch = (action) => { dispatch(produce(action, draft => { draft.id = this.props.id; })); };
  }

  getDimsForLayer (layer) {
    const selectedDims = [];
    if (!layer || !layer.dimensions) return selectedDims;
    const { dimensions } = layer;
    for (let d = 0; d < dimensions.length; d++) {
      if (dimensions[d].name !== 'time') {
        selectedDims.push(dimensions[d]);
      }
    }
    selectedDims.sort();
    return selectedDims;
  }

  render () {
    const { mapPanel, layer, dimensionSelectorState, services, dispatch } = this.props;
    const { localDispatch } = this;
    if (!layer || !layer.id || !layer.dimensions || !dimensionSelectorState) return null;
    if (!this.props.id) return null;
    /* Get all metadata from the services object */
    let serviceLayer = null;
    if (services && services[layer.service] && services[layer.service].layer) {
      serviceLayer = services[layer.service].layer[layer.name];
    }
    if (!serviceLayer) return null;
    const wmjsLayer = getWMJSLayerById(layer.id);
    if (!wmjsLayer) return null;
    const state = dimensionSelectorState[this.props.id] || initialState;
    const availableLayerDimensions = this.getDimsForLayer(serviceLayer);
    if (availableLayerDimensions.length === 0) return null;
    let activeDimName = state.activeDim ? state.activeDim.name : availableLayerDimensions[0].name;
    let selectedDim = wmjsLayer.getDimension(activeDimName);
    if (!selectedDim) {
      activeDimName = availableLayerDimensions[0].name;
      selectedDim = wmjsLayer.getDimension(activeDimName);
    }
    const currentValue = '(' + (1 + availableLayerDimensions.findIndex((d) => d.name === activeDimName)) + '/' + availableLayerDimensions.length + ') ' + activeDimName || '(0/0) No dimensions';
    const availableDimValues = [];
    if (state.isValueSelectorOpen) {
      for (let j = 0; j < selectedDim.size() && j < 40; j++) {
        availableDimValues.push(selectedDim.getValueForIndex(j));
      }
      availableDimValues.reverse();
    }
    return (
      <Col style={{ padding: 0, margin: 0 }}>
        <Row style={{ padding: 0, margin: 0 }}>
          <Dropdown style={{ display:'grid' }} isOpen={state.isOpen} toggle={() => { localDispatch(layerManagerToggleDimensionSelectorAction()); }}>
            <DropdownToggle caret>
              <div className={'ReactWMJSDropDown'} >
                { currentValue }
                <span className='ReactWMJSDropDownTooltipText'>
                  Select the dimension to adjust, currently it is set to <strong>{ activeDimName }</strong> with value <strong>{selectedDim.currentValue}</strong>
                </span>
              </div>
            </DropdownToggle>
            <DropdownMenu>
              <DropdownItem header>Select dimension</DropdownItem>
              {
                availableLayerDimensions.map((l, i) => {
                  const wmjsDim = wmjsLayer && wmjsLayer.getDimension && wmjsLayer.getDimension(l.name);
                  return (<DropdownItem active={l.name === currentValue} key={i} onClick={() => { this.localDispatch(setActiveDim(l)); }}>
                    {l.name} [{wmjsDim && wmjsDim.currentValue}]
                  </DropdownItem>);
                })
              }
            </DropdownMenu>
          </Dropdown>
        </Row>
        <Row style={{ padding: 0, margin: 0 }}>
          <Dropdown style={{ display:'grid' }} isOpen={state.isValueSelectorOpen} toggle={() => { localDispatch(toggleValueSelector()); }}>
            <DropdownToggle caret>
              <div className={'ReactWMJSDropDown'} >
                { selectedDim.currentValue + ' ' + selectedDim.units }
                <span className='ReactWMJSDropDownTooltipText'>{ 'Dimension ' + activeDimName + ' is set to ' + selectedDim.currentValue + ' with units ' + selectedDim.units }</span>
              </div>
            </DropdownToggle>
            <DropdownMenu>
              <DropdownItem header>Select dimension value. ({selectedDim.size()} options)</DropdownItem>
              {
                availableDimValues.map((l, i) => {
                  return (<DropdownItem active={l === selectedDim.currentValue} key={i} onClick={() => {
                    dispatch(layerChangeDimension({
                      mapPanelId: mapPanel.id,
                      layerId: layer.id,
                      dimension: {
                        currentValue: l,
                        name: selectedDim.name,
                        units:  selectedDim.units
                      }
                    }));
                  }}>{l}</DropdownItem>);
                })
              }
            </DropdownMenu>
          </Dropdown>
        </Row>
      </Col>
    );
  }
}

DimensionSelector.propTypes = {
  layer: PropTypes.object.isRequired,
  mapPanel: PropTypes.object.isRequired,
  services: PropTypes.object.isRequired,
  id: PropTypes.string.isRequired,
  dimensionSelectorState: PropTypes.object,
  dispatch: PropTypes.func.isRequired
};

export default connect(mapStateToProps)(DimensionSelector);
