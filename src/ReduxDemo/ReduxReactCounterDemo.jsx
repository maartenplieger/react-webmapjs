import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import produce from 'immer';
import { Button } from 'reactstrap';
import { WEBMAPJS_REDUCERNAME, webMapJSReducer } from '@adaguc/react-webmapjs';
/* Constants */
const REDUXREACTCOUNTERDEMO_INIT = 'COUNTERDEMO_INIT';
const REDUXREACTCOUNTERDEMO_ADD = 'COUNTERDEMO_ADD';
const REDUXREACTCOUNTERDEMO_REDUCERNAME = 'COUNTERDEMO';

/* Action creators */
// eslint-disable-next-line no-unused-vars
const initAction = obj => ({ type: REDUXREACTCOUNTERDEMO_INIT, payload: obj });
const addAction = obj => ({ type: REDUXREACTCOUNTERDEMO_ADD, payload: obj });

/* Define the initial state */
const initialState = {
  value : 123
};

/* Reducer which adds its data into the store; the location inside the store is specified by the reducer name and the id from the action */
const reduxReactCounterDemoReducer = (state = initialState, action = { type:null }) => {
  switch (action.type) {
    case REDUXREACTCOUNTERDEMO_INIT:
      return produce(state, draft => { draft.value = action.payload; });
    case REDUXREACTCOUNTERDEMO_ADD:
      return produce(state, draft => { draft.value += action.payload; });
    default:
      return state;
  }
};

class ReduxReactCounterDemo extends Component {
  constructor (props) {
    console.log('constructor');
    super(props);
    /* Register this new reduxReactCounterDemoReducer reducer with the reducerManager */
    window.reducerManager.add(REDUXREACTCOUNTERDEMO_REDUCERNAME, reduxReactCounterDemoReducer);
  }
  componentDidMount () {
    console.log('componentDidMount. You can attach your events now');
  }
  componentWillUnmount () {
    console.log('componentWillUnmount. You can detach your events now');
  }
  componentDidUpdate (prevProps) {
    console.log('componentDidUpdate:', prevProps.value, this.props.value);
  }
  render () {
    return (
      <div style={{ height: '100%' }}>
        <div>I am a counter and my value is {this.props.value}. </div>
        <span><Button onClick={() => { this.props.dispatch(addAction(1)); }}>Add one</Button></span>
        <span><Button onClick={() => { this.props.dispatch(addAction(2)); }}>Add two</Button></span>
        <span><Button onClick={() => { this.props.dispatch(addAction(-1)); }}>Substract one</Button></span>
        <div>
          The layers from the webMapJSState are:
          <ul>
            {
              this.props.mylayers.map((layer, key) => {
                return (<li key={key}>{layer.name}</li>);
              })
            }
          </ul>
        </div>
      </div>
    );
  }
};

/* this maps the properties in the redux state to the properties of the component */
const mapStateToProps = state => {
  /* Return initial state if not yet set */
  const ReduxReactCounterDemoState = state[REDUXREACTCOUNTERDEMO_REDUCERNAME] || reduxReactCounterDemoReducer();
  const webMapJSState = state[WEBMAPJS_REDUCERNAME] || webMapJSReducer();

  return {
    value: ReduxReactCounterDemoState.value,
    mylayers: webMapJSState.webmapjs.mapPanel[webMapJSState.webmapjs.activeMapPanelIndex].layers
  };
};

ReduxReactCounterDemo.propTypes = {
  dispatch: PropTypes.func,
  value: PropTypes.number,
  mylayers: PropTypes.array
};

export default connect(mapStateToProps)(ReduxReactCounterDemo);
