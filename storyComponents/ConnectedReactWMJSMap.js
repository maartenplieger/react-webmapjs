import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { WEBMAPJS_REDUCERNAME, webMapJSReducer, ReactWMJSLayer, ReactWMJSMap } from '../src/index';
class ConnectedReactWMJSMap extends Component {
  render () {
    return (
      <div style={{ height: '100%' }}>
        <ReactWMJSMap bbox={[-541070, 6233113, 1666808, 7555081]} id={'mapid_1'} dispatch={this.props.dispatch} >
          { this.props.baseLayers.map((layer, i) => { return <ReactWMJSLayer key={i} {...layer} />; }) }
          { this.props.layers.map((layer, i) => { return <ReactWMJSLayer key={i} {...layer} />; }) }
        </ReactWMJSMap>
      </div>
    );
  }
};

const mapStateToProps = state => {
  /* Return initial state if not yet set */
  const webMapJSState = state[WEBMAPJS_REDUCERNAME] ? state[WEBMAPJS_REDUCERNAME] : webMapJSReducer();
  return {
    layers: webMapJSState.webmapjs.mapPanel[webMapJSState.webmapjs.activeMapPanelIndex].layers,
    baseLayers: webMapJSState.webmapjs.mapPanel[webMapJSState.webmapjs.activeMapPanelIndex].baseLayers
  };
};

ConnectedReactWMJSMap.propTypes = {
  dispatch: PropTypes.func,
  activeMapPanel: PropTypes.object,
  baseLayers: PropTypes.array,
  layers: PropTypes.array
};

export default connect(mapStateToProps)(ConnectedReactWMJSMap);
