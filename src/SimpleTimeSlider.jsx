import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { WEBMAPJS_REDUCERNAME, webMapJSReducer, mapChangeDimension } from './index';
import './SimpleTimeSlider.css';
import ReactSlider from 'react-slider';
import '../src/react-slider.css';
import moment from 'moment';
import { Row, Col, Button } from 'reactstrap';
import { getLayerTitle } from './SimpleLayerManager.jsx';
import { Icon } from 'react-fa';
import { mapStartAnimation, mapStopAnimation } from './ReactWMJSActions';
import { getWMJSMapById } from './ReactWMJSTools';

class SimpleTimeSlider extends Component {
  constructor (props) {
    super(props);
    this.toggleAnimation = this.toggleAnimation.bind(this);
  }
  toggleAnimation () {
    const { dispatch, mapId, startValue, endValue, interval } = this.props;
    if (this.props.isAnimating !== true) {
      dispatch(mapStartAnimation({
        mapPanelId: mapId,
        start: startValue,
        end: endValue,
        interval: interval || 300
      }));
    } else {
      dispatch(mapStopAnimation({
        mapPanelId: mapId
      }));
    }
    getWMJSMapById(mapId).draw();
  }
  render () {
    const { dispatch, mapId, startValue, endValue, dimensions, layerNameMappings } = this.props;
    const timeIndex = dimensions ? dimensions.findIndex(value => value.name === 'time') : -1;
    const reduxMapTimeDimension = timeIndex >= 0 ? dimensions[timeIndex] : null;
    const mapTimeValue = reduxMapTimeDimension !== null ? reduxMapTimeDimension.currentValue : null;
    const unixStart = moment(startValue).utc().unix();
    const unixEnd = moment(endValue).utc().unix();
    let timeSliderValue = mapTimeValue ? moment(mapTimeValue).utc().unix() : parseFloat(unixStart);
    if (isNaN(timeSliderValue)) timeSliderValue = 0;
    return (<div className={'reactwebmapjs-simpletimeslider'}>
      <Row>
        <Col xs='11'>
          <ReactSlider
            className={'horizontal-slider reactwebmapjs-simpletimeslidercomponent'}
            thumbClassName={'horizontal-slider-track'}
            trackClassName={'horizontal-slider-thumb'}
            min={unixStart} max={unixEnd} step={1}
            value={timeSliderValue}
            onChange={(v) => {
              if (this.props.isAnimating === true) {
                dispatch(mapStopAnimation({
                  mapPanelId: mapId
                }));
                getWMJSMapById(mapId).draw();
              }
              dispatch(mapChangeDimension({
                mapPanelId: mapId,
                dimension: {
                  name: 'time',
                  currentValue: moment.unix(v).toISOString()
                }
              }));
            }} />
        </Col>
        <Col xs='1'>
          <Button onClick={() => { this.toggleAnimation(); }}><Icon name={this.props.isAnimating ? 'pause' : 'play'} /></Button>
        </Col>
      </Row>
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
  interval: PropTypes.number, /* In seconds */
  layerNameMappings: PropTypes.array,
  dimensions: PropTypes.array,
  isAnimating: PropTypes.bool
};

const mapStateToProps = state => {
  /* Return initial state if not yet set */
  const webMapJSState = state[WEBMAPJS_REDUCERNAME] ? state[WEBMAPJS_REDUCERNAME] : webMapJSReducer();
  return {
    isAnimating: webMapJSState.webmapjs.mapPanel[webMapJSState.webmapjs.activeMapPanelIndex].isAnimating,
    dimensions: webMapJSState.webmapjs.mapPanel[webMapJSState.webmapjs.activeMapPanelIndex].dimensions,
    layers: webMapJSState.webmapjs.mapPanel[webMapJSState.webmapjs.activeMapPanelIndex].layers,
    baseLayers: webMapJSState.webmapjs.mapPanel[webMapJSState.webmapjs.activeMapPanelIndex].baseLayers
  };
};

export default connect(mapStateToProps)(SimpleTimeSlider);
