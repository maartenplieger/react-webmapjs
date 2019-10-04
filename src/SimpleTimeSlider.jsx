import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { WEBMAPJS_REDUCERNAME, webMapJSReducer, mapChangeDimension } from '@adaguc/react-webmapjs';
import './SimpleTimeSlider.css';
import ReactSlider from 'react-slider';
import '../src/react-slider.css';
import moment from 'moment';
import { Row, Col } from 'reactstrap';
import {getLayerTitle} from './SimpleLayerManager.jsx';

class SimpleTimeSlider extends Component {
  render () {
    const { dispatch, mapId, startValue, endValue, dimensions, layerNameMappings } = this.props;
    const timeIndex = dimensions ? dimensions.findIndex(value => value.name === 'time') : -1;
    const reduxMapTimeDimension = timeIndex >= 0 ? dimensions[timeIndex] : null;
    const mapTimeValue = reduxMapTimeDimension !== null ? reduxMapTimeDimension.currentValue : null;
    const timeSliderStep = 300;
    const unixStart = moment(startValue).utc().unix();
    const unixEnd = moment(endValue).utc().unix();
    let timeSliderValue = mapTimeValue ? moment(mapTimeValue).utc().unix() : parseFloat(unixStart);
    timeSliderValue = parseFloat(parseInt((timeSliderValue / timeSliderStep) + 0.5) * timeSliderStep);
    if (isNaN(timeSliderValue)) timeSliderValue = 0;
    return (<div className={'reactwebmapjs-simpletimeslider'}>
      <ReactSlider
        className={'horizontal-slider reactwebmapjs-simpletimeslidercomponent'}
        thumbClassName={'horizontal-slider-track'}
        trackClassName={'horizontal-slider-thumb'}
        min={unixStart} max={unixEnd} step={timeSliderStep}
        value={timeSliderValue}
        onChange={(v) => {
          dispatch(mapChangeDimension({
            mapPanelId: mapId,
            dimension: {
              name: 'time',
              currentValue: moment.unix(v).toISOString()
            }
          }));
        }} />
      {/* <div>StartValue: {startValue}</div>
      <div>endValue: {endValue}</div> */}
      {
        this.props.layers.map((layer, index) => {
          return (<Row key={index}>
            <Col xs='7'>{getLayerTitle(layerNameMappings, layer)}:</Col>
            <Col xs='5' style={{ paddingLeft:'10px' }}>{layer.dimensions && layer.dimensions.length && layer.dimensions[0].currentValue}</Col>
          </Row>);
        })
      }
    </div>);
  }
};
SimpleTimeSlider.propTypes = {
  dispatch: PropTypes.func,
  layers: PropTypes.array,
  mapId: PropTypes.string,
  startValue: PropTypes.string,
  endValue: PropTypes.string,
  layerNameMappings: PropTypes.array,
  dimensions: PropTypes.array
};

const mapStateToProps = state => {
  /* Return initial state if not yet set */
  const webMapJSState = state[WEBMAPJS_REDUCERNAME] ? state[WEBMAPJS_REDUCERNAME] : webMapJSReducer();
  return {
    dimensions: webMapJSState.webmapjs.mapPanel[webMapJSState.webmapjs.activeMapPanelIndex].dimensions,
    layers: webMapJSState.webmapjs.mapPanel[webMapJSState.webmapjs.activeMapPanelIndex].layers,
    baseLayers: webMapJSState.webmapjs.mapPanel[webMapJSState.webmapjs.activeMapPanelIndex].baseLayers
  };
};

export default connect(mapStateToProps)(SimpleTimeSlider);
