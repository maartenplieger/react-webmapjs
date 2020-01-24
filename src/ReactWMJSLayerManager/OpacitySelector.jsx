import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import produce from 'immer';
import { connect } from 'react-redux';
import { layerChangeOpacity } from '@adaguc/react-webmapjs';

/* Constants */
const LAYERMANAGER_TOGGLE_OPACITYSELECTOR = 'LAYERMANAGER_TOGGLE_OPACITYSELECTOR';
const OPACITYSELECTOR_REDUCERNAME = 'layermanager.opacityselector';
const opacities = [
  { name:0.0, title: '0 %' },
  { name:0.1, title: '10 %' },
  { name:0.2, title: '20 %' },
  { name:0.3, title: '30 %' },
  { name:0.4, title: '40 %' },
  { name:0.5, title: '50 %' },
  { name:0.6, title: '60 %' },
  { name:0.7, title: '70 %' },
  { name:0.8, title: '80 %' },
  { name:0.8, title: '90 %' },
  { name:1.0, title: '100 %' }
];
opacities.reverse();

/* Action creators */
const layerManagerToggleOpacitySelectorAction = obj => ({ type: LAYERMANAGER_TOGGLE_OPACITYSELECTOR, payload: obj });

/* Reducer which adds its data into the store; the location inside the store is specified by the reducer name and the id from the action */
const opacitySelectorReducer = (state = { }, action = { type:null }) => {
  if (!action.id) { return state; }

  /* Standard reducer handling where the required id is abstracted away for convenience */
  const handleReducer = (state = { }, action = { type:null }) => {
    switch (action.type) {
      case LAYERMANAGER_TOGGLE_OPACITYSELECTOR:
        return produce(state, draft => { draft.isOpen = !draft.isOpen; });
      default:
        return state;
    }
  };

  /* Update the state at the correct location given by the id property from the action */
  return produce(state, draft => { draft[action.id] = handleReducer(state[action.id], action); });
};

/* Our custom mapStateToProps for this component */
const mapStateToProps = state => {
  return { opacitySelector: state[OPACITYSELECTOR_REDUCERNAME] };
};

/* The initial state for this component */
const initialState = {
  isOpen:false
};

class OpacitySelector extends Component {
  constructor (props) {
    super(props);
    const { layer, dispatch } = this.props;

    /* Some checks */
    if (!layer || !layer.id) { console.warn('OpacitySelector misconfigured, layer missing'); return null; }

    /* Register this new opacitySelector reducer with the reducerManager */
    window.reducerManager.add(OPACITYSELECTOR_REDUCERNAME, opacitySelectorReducer);

    /* Create our own convenience dispatch function which never forgets to add the requested id to the action */
    this.localDispatch = (action) => { dispatch(produce(action, draft => { draft.id = this.props.id; })); };

    this.selectOpacity = this.selectOpacity.bind(this);
  }

  selectOpacity (opacity) {
    const { dispatch, mapPanel, layer } = this.props;
    dispatch(layerChangeOpacity({ mapPanelId:mapPanel.id, layerId: layer.id, opacity: opacity }));
  }

  render () {
    const { layer, opacitySelector } = this.props;
    const { localDispatch, selectOpacity } = this;
    if (!layer || !layer.id || !layer.dimensions || !opacitySelector) return null;
    if (!this.props.id) return null;
    const state = opacitySelector[this.props.id] || initialState;
    let currentOpacity = layer && layer.opacity !== undefined ? layer.opacity : 1.0;
    const currentValue = Math.round(currentOpacity * 100) + ' %';
    return (
      <Dropdown isOpen={state.isOpen} toggle={() => { localDispatch(layerManagerToggleOpacitySelectorAction()); }}>
        <DropdownToggle caret>
          { currentValue }
          <span className='ReactWMJSDropDownTooltipText'>
            Select opacity, currently it is set to <strong>{currentValue}</strong>
          </span>
        </DropdownToggle>
        <DropdownMenu>
          <DropdownItem header>Select opacity</DropdownItem>
          {
            opacities.map((l, i) => {
              return (<DropdownItem active={l.title === currentValue} key={i} onClick={() => { selectOpacity(l.name); }}>{l.title}</DropdownItem>);
            })
          }
        </DropdownMenu>
      </Dropdown>
    );
  }
}

OpacitySelector.propTypes = {
  layer: PropTypes.object.isRequired,
  mapPanel: PropTypes.object.isRequired,
  id: PropTypes.string.isRequired,
  opacitySelector: PropTypes.object,
  dispatch: PropTypes.func.isRequired
};

export default connect(mapStateToProps)(OpacitySelector);
