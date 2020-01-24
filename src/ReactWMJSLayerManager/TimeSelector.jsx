import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { getWMJSMapById, getWMJSLayerById, layerChangeDimension } from '@adaguc/react-webmapjs';
import { layerManagerSetTimeResolution, layerManagerSetTimeValue } from './LayerManagerActions';
import produce from 'immer';
import { Icon } from 'react-fa';
import { Button } from 'reactstrap';
const moment = window.moment;

class ReactWMJSTimeSelector extends Component {
  constructor (props) {
    super(props);
    this.click = this.click.bind(this);
    this.resize = this.resize.bind(this);
    // this.onWheel = this.onWheel.bind(this);
    this.timeBlockContainer = React.createRef();
    this.resizeCalled = false;
    this.getTimeDim = this.getTimeDim.bind(this);
    this.getFocusTimeButton = this.getFocusTimeButton.bind(this);
    this.getLayerManagerStartTime = this.getLayerManagerStartTime.bind(this);
    this.getDecreaseTimeButton = this.getDecreaseTimeButton.bind(this);
    this.getIncreaseTimeButton = this.getIncreaseTimeButton.bind(this);
    this.focusTimeInTimeSelector = this.focusTimeInTimeSelector.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.decreaseTime = this.decreaseTime.bind(this);
    this.increaseTime = this.increaseTime.bind(this);
    this.timeBlockSize = 5;
  }
  handleKeyDown (e) {
    if (e.keyCode === 37 || e.deltaY > 1) {
      this.decreaseTime();
    } else if (e.keyCode === 39 || e.deltaY < -1) {
      this.increaseTime();
    }
  }

  getLayerManagerStartTime (startTime) {
    const width = this.maxWidth !== -1 ? this.maxWidth : 200;
    const currentTimeResolution = this.props.layerManager.timeResolution;
    let secondsTimeStart = parseInt(((width / 2) / this.timeBlockSize));
    return moment.utc(moment.utc(startTime).add(currentTimeResolution * (-secondsTimeStart), 'second'), 'YYYY-MM-DDTHH:mm:SS');
  }

  focusTimeInTimeSelector () {
    const timeDim = this.getTimeDim(); if (!timeDim) { console.warn('No time dimension found'); return; }
    const currentValue = timeDim.currentValue;
    if (moment.utc(currentValue) < moment.utc(this.props.layerManager.timeStart) ||
      moment.utc(currentValue) >= moment.utc(this.previousLastFoundTime)) {
      this.props.dispatch(layerManagerSetTimeResolution({
        timeStart: this.getLayerManagerStartTime(currentValue),
        timeEnd: this.getLayerManagerStartTime(this.lastFoundTime)
      }));
    }
  }

  decreaseTime () {
    const timeDim = this.getTimeDim(); if (!timeDim) { console.warn('No time dimension found'); return; }
    let newIndex = timeDim.getIndexForValue(timeDim.currentValue, true) - 1;
    if (newIndex < 0) { console.log('Already at earliest date'); return; }
    if (newIndex >= timeDim.size()) { console.log('Already at latest date'); return; }
    const newValue = timeDim.getValueForIndex(newIndex);
    this.click(newValue);
    this.focusTimeInTimeSelector();
  }

  increaseTime () {
    const timeDim = this.getTimeDim(); if (!timeDim) { console.warn('No time dimension found'); return; }
    let newIndex = timeDim.getIndexForValue(timeDim.currentValue, true) + 1;
    if (newIndex < 0) { return; }
    if (newIndex >= timeDim.size()) { return; }
    this.click(timeDim.getValueForIndex(newIndex));
    this.focusTimeInTimeSelector();
  }

  getDecreaseTimeButton (key, leftPosition) {
    return (<Button
      onClick={this.decreaseTime}
      onKeyDown={this.handleKeyDown}
      onWheel={this.handleKeyDown}
      className={'ReactWMJSLayerTimeFocusButton'}
      key={key}
      style={{ left: leftPosition + 'px', padding: 0 }}
    >
      <Icon name='chevron-left' />
      <span className={'ReactWMJSLayerTimeFocusButtonTooltipText'}>
        Previous time step
      </span>
    </Button>);
  }

  getIncreaseTimeButton (key, leftPosition) {
    return (<Button
      onClick={this.increaseTime}
      onKeyDown={this.handleKeyDown}
      onWheel={this.handleKeyDown}
      className={'ReactWMJSLayerTimeFocusButton'}
      key={key}
      style={{ left: leftPosition + 'px', padding: 0 }}
    >
      <Icon name='chevron-right' />
      <span className={'ReactWMJSLayerTimeFocusButtonTooltipText'}>
        Next time step
      </span>
    </Button>);
  }

  getFocusTimeButton (key, leftPosition) {
    return (<Button
      onClick={() => {
        this.click(moment.utc(this.layerDefaultTime).format('YYYY-MM-DDTHH:mm:SS'));
        this.props.dispatch(layerManagerSetTimeResolution({
          timeStart: moment.utc(this.getLayerManagerStartTime(this.layerEndTime)),
          timeEnd: moment.utc(this.layerEndTime)
        }));
      }}
      onKeyDown={this.handleKeyDown}
      onWheel={this.handleKeyDown}
      className={'ReactWMJSLayerTimeFocusButton'}
      key={key}
      style={{ left: leftPosition + 'px', padding: 0 }}
    >
      <Icon name='circle-thin' />
      <span className={'ReactWMJSLayerTimeFocusButtonTooltipText'}>
        First time step
      </span>
    </Button>);
  }

  getFocusBeginButton (key, leftPosition) {

    const timeDim = this.getTimeDim();
    const startTime = timeDim.getValueForIndex(0);

    return (<Button
      onClick={() => {
        this.click(moment.utc(startTime).format('YYYY-MM-DDTHH:mm:SS'));
        this.focusTimeInTimeSelector();
      }}
      onKeyDown={this.handleKeyDown}
      onWheel={this.handleKeyDown}
      className={'ReactWMJSLayerTimeFocusButton'}
      key={key}
      style={{ left: leftPosition + 'px', padding: 0 }}
    >
      <Icon name='circle-thin' />
      <span className={'ReactWMJSLayerTimeFocusButtonTooltipText'}>
        Last time step
      </span>
    </Button>);
  }
  // onWheel (e) {
  //   e.preventDefault();
  //   const momentStart = moment.utc(this.props.layerManager.timeStart, 'YYYY-MM-DDTHH:mm:SS');
  //   const momentEnd = moment.utc(this.lastFoundTime, 'YYYY-MM-DDTHH:mm:SS');
  //   const currentTimeResolution = this.props.layerManager.timeResolution;
  //   let index = timeResolutionGetIndexForValue(currentTimeResolution);
  //   const { dispatch } = this.props;
  //   if (e.deltaY > 1) index++;
  //   if (e.deltaY < -1) index--;
  //   if (index < 0) index = 0;
  //   if (index > timeResolutionSteps.length - 1) index = timeResolutionSteps.length - 1;
  //   const newTimeResolution = timeResolutionSteps[index].value;
  //   let currentValue = moment.utc(this.props.layerManager.timeValue, 'YYYY-MM-DDTHH:mm:SS');
  //   let newStart = currentValue + (((momentStart - currentValue) * newTimeResolution) / currentTimeResolution);
  //   let newEnd = currentValue + (((momentEnd - currentValue) * newTimeResolution) / currentTimeResolution);
  //   const d = (newEnd - newStart) / 20;
  //   if (e.deltaX > 1) {
  //     newStart += d;
  //     newEnd += d;
  //     // this.click(moment.utc(currentValue + d).format('YYYY-MM-DDTHH:mm:SS'));
  //   }
  //   if (e.deltaX < -1) {
  //     newStart -= d;
  //     newEnd -= d;
  //     // this.click(moment.utc(currentValue - d).format('YYYY-MM-DDTHH:mm:SS'));
  //   }
  //   dispatch(layerManagerSetTimeResolution({
  //     timeResolution: newTimeResolution,
  //     timeStart: moment.utc(newStart),
  //     timeEnd: moment.utc(newEnd)
  //   }));
  // }

  click (value) {
    const dimension = this.timeDimension;
    const { dispatch, activeMapPanel } = this.props;
    dispatch(layerManagerSetTimeValue({ timeValue: value }));
    const wmjsMap = getWMJSMapById(activeMapPanel.id);
    wmjsMap.setDimension(dimension.name, value, false);
    const wmjsLayers = wmjsMap.getLayers();
    for (let d = 0; d < wmjsLayers.length; d++) {
      const layer = wmjsLayers[d];
      if (layer.getDimension(dimension.name)) {
        dispatch(layerChangeDimension({
          mapPanelId: activeMapPanel.id,
          layerId: layer.ReactWMJSLayerId,
          dimension: produce(dimension, draft => { draft.currentValue = layer.getDimension(dimension.name).currentValue; })
        }));
      }
    }
    wmjsMap.draw('ReactWMJSLayerRow');
  }

  componentDidMount () {
    window.addEventListener('resize', this.resize);

    if (!this.resizeCalled) {
      this.resize();
    }
  }

  componentDidUpdate () {
    const { dispatch } = this.props;
    if (!this.resizeCalled) {
      this.resize();
    }
    if (!this.props.layerManager.timeStart && this.maxWidth !== -1) {
      const wmjsTimeDimension = this.getTimeDim();
      if (wmjsTimeDimension) {
        this.layerStartTime = moment.utc(wmjsTimeDimension.getValueForIndex(0), 'YYYY-MM-DDTHH:mm:SS');
        this.layerDefaultTime = moment.utc(wmjsTimeDimension.defaultValue, 'YYYY-MM-DDTHH:mm:SS');
        this.layerCurrentValue = moment.utc(wmjsTimeDimension.currentValue, 'YYYY-MM-DDTHH:mm:SS');
        this.layerEndTime = moment.utc(wmjsTimeDimension.getValueForIndex(wmjsTimeDimension.size() - 1), 'YYYY-MM-DDTHH:mm:SS');
        dispatch(layerManagerSetTimeResolution({
          timeStart: moment.utc(this.getLayerManagerStartTime(this.layerEndTime)),
          timeEnd: moment.utc(this.layerEndTime),
          timeValue: moment.utc(this.layerCurrentValue)
        }));
      }
    }
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.resize);
  }

  resize () {
    if (this.timeBlockContainer && this.timeBlockContainer.current) {
      const element = this.timeBlockContainer.current;
      if (element) {
        const newWidth = element.clientWidth;
        const newHeight = element.clientHeight;
        if (this.currentWidth !== newWidth || this.currentHeight !== newHeight) {
          this.resizeCalled = true;
          this.currentWidth = newWidth;
          this.currentHeight = newHeight;
          this.forceUpdate();
        }
      }
    }
  }

  getTimeDim () {
    const { layer } = this.props;

    if (!layer || !layer.dimensions) return null;
    const { dimensions } = layer;
    const timeDim = dimensions.filter(dimension => dimension.name === 'time')[0];
    if (!timeDim) return null;
    this.timeDimension = timeDim;
    let wmjsLayer = getWMJSLayerById(layer.id);
    if (!wmjsLayer) return null;
    const wmjsTimeDimension = wmjsLayer.getDimension(timeDim.name);
    if (!wmjsTimeDimension) return null;
    return wmjsTimeDimension;
  }

  render () {
    const wmjsTimeDimension = this.getTimeDim();
    if (!wmjsTimeDimension) {
      return (<div>No dims</div>);
    }
    const { layer } = this.props;
    const { dimensions } = layer;
    const timeDim = dimensions.filter(dimension => dimension.name === 'time')[0];
    if (!timeDim) return null;

    const currentIndex = wmjsTimeDimension.getIndexForValue(timeDim.currentValue);
    const momentStart = moment.utc(this.props.layerManager.timeStart, 'YYYY-MM-DDTHH:mm:SS');
    let time = moment.utc(momentStart);
    let momentCalls = 0;
    let timeBlockArray = [];
    let w = 0;
    let x = 0;
    this.maxWidth = this.currentWidth ? (this.currentWidth - (32 * 4)) : -1; // 32 * 3 is for the three time buttons
    let loopIndex = wmjsTimeDimension.getIndexForValue(momentStart.format('YYYY-MM-DDTHH:mm:SS'));
    let startX = 0;
    let lastBlockWidth = 0;
    let hasSelected = false;
    this.previousLastFoundTime = this.lastFoundTime;
    let index = 0;
    do {
      momentCalls++;
      time = time.add(this.props.layerManager.timeResolution, 'second');
      let timeString = time.format('YYYY-MM-DDTHH:mm:SS');
      index = wmjsTimeDimension.getIndexForValue(timeString);
      if (index !== loopIndex) {
        let concat = false;
        if (index - loopIndex > 1) concat = true;
        const selected = loopIndex === currentIndex;
        let b = loopIndex;
        let contents = null;
        if (b >= 0 && b < wmjsTimeDimension.size()) {
          if (selected) hasSelected = true;
          let timeBlockWidth = (w - (concat ? 0 : 0));
          if (timeBlockWidth < 1) timeBlockWidth = 1;
          if (startX < 0) { timeBlockWidth += startX; startX = 0; }
          if (startX + timeBlockWidth > this.maxWidth) timeBlockWidth = this.maxWidth - startX;
          this.previousLastFoundTime = (wmjsTimeDimension.getValueForIndex(b));
          const className = selected ? 'ReactWMJSLayerRowTimeBlockSelected' : 'ReactWMJSLayerRowTimeBlock';
          let previousTime = moment.utc(wmjsTimeDimension.getValueForIndex(loopIndex));
          if (timeBlockWidth > 16 * 10) {
            contents = previousTime.format('YYYY-MM-DD HH:mm');
          } else if (timeBlockWidth > 4 * 10) {
            contents = previousTime.format('HH:mm');
          } else if (timeBlockWidth > 2 * 7) {
            contents = previousTime.format('mm');
          }
          if (selected) { timeBlockWidth += 2; startX -= 1; }
          timeBlockArray.push(<button
            onClick={() => { this.click(wmjsTimeDimension.getValueForIndex(b)); }}
            className={className}
            key={timeBlockArray.length}
            style={{
              // borderLeft: selected && concat ? '1px solid white' : 'none',
              left: startX + 'px',
              width: (timeBlockWidth) + 'px'
            }}
          >{contents}<span className='ReactWMJSLayerRowTimeBlockTooltipText'>{previousTime.format('YYYY-MM-DD HH:mm')} UTC</span>
          </button>);
        }
        lastBlockWidth = w;
        w = 0;
        startX = x;
        loopIndex = index;
      }
      w += this.timeBlockSize;
      x += this.timeBlockSize;
    } while (momentCalls < 1000 && x < this.maxWidth + lastBlockWidth && index !== -1);

    this.lastFoundTime = moment(momentStart).add((this.maxWidth / this.timeBlockSize) * this.props.layerManager.timeResolution, 'second');

    // console.log(momentCalls);
    this.layerStartTime = moment.utc(wmjsTimeDimension.getValueForIndex(0), 'YYYY-MM-DDTHH:mm:SS');
    this.layerDefaultTime = moment.utc(wmjsTimeDimension.defaultValue, 'YYYY-MM-DDTHH:mm:SS');
    this.layerCurrentValue = moment.utc(wmjsTimeDimension.currentValue, 'YYYY-MM-DDTHH:mm:SS');
    this.layerEndTime = moment.utc(wmjsTimeDimension.getValueForIndex(wmjsTimeDimension.size() - 1), 'YYYY-MM-DDTHH:mm:SS');

    if (this.maxWidth > 0) {
      /* Draw one block if no blocks were drawn in previous loop */
      if (timeBlockArray.length === 0) {
        if ((this.layerStartTime > momentStart) ||
          (this.layerEndTime > momentStart)) {
          let startX = parseInt(((this.layerStartTime - momentStart) / (this.lastFoundTime - momentStart)) * this.maxWidth);
          let width = parseInt(((this.layerEndTime - this.layerStartTime) / (this.lastFoundTime - momentStart)) * this.maxWidth);
          if (startX + width > 0 && startX < this.maxWidth) {
            if (startX < 0) { width += startX; startX = 0; }
            if (startX + width > this.maxWidth) width = this.maxWidth - startX;
            if (width < 1) width = 1;
            timeBlockArray.push(<div
              // onMouseEnter={() => { this.click(wmjsTimeDimension.getValueForIndex(b)); }}
              className={'ReactWMJSLayerRowTimeBlock'}
              key={timeBlockArray.length}
              style={{
                left: startX + 'px',
                width: width + 'px'
              }}
            />);
          }
        }
      }

      /* Draw selected time if selected time was not drawn in previous loop */
      if (!hasSelected) {
        let startX = parseInt(((this.layerCurrentValue - momentStart) / (this.lastFoundTime - momentStart)) * this.maxWidth);
        if (startX >= 0 && startX < this.maxWidth) {
          timeBlockArray.push(<div
            className={'ReactWMJSLayerRowTimeBlockSelected'}
            key={timeBlockArray.length}
            style={{
              width: (this.timeBlockSize + 2) + 'px',
              left: (startX - 1) + 'px'
            }}
          />);
        }
      }

      /* Draw current time */
      {
        let startX = parseInt(((moment.now() - momentStart) / (this.lastFoundTime - momentStart)) * this.maxWidth);
        if (startX >= 0 && startX < this.maxWidth) {
          timeBlockArray.push(<div
            className={'ReactWMJSLayerRowTimeBlockCurrentTime'}
            key={timeBlockArray.length}
            style={{
              width: this.timeBlockSize + 'px',
              left: startX + 'px'
            }}
          />);
        }
      }
    }
    return (
      <div>
        <div
          onKeyDown={this.handleKeyDown}
          onWheel={this.handleKeyDown}
          // onWheel={this.onWheel}
          ref={this.timeBlockContainer}
          className='ReduxWMJSLayerManagerTimeSelectorContentRef'>
          <div className='ReduxWMJSLayerManagerTimeSelectorContent' style={{ width: (this.maxWidth) + 'px' }}
            onKeyDown={this.handleKeyDown}
            onWheel={this.handleKeyDown}
          />
          {timeBlockArray}
        </div>
        <div>{this.getFocusBeginButton(0, this.currentWidth - 98)}</div>
        <div>{this.getDecreaseTimeButton(1, this.currentWidth - 72)}</div>
        <div>{this.getIncreaseTimeButton(2, this.currentWidth - 48)}</div>
        <div>{this.getFocusTimeButton(3, this.currentWidth - 24)}</div>
      </div>);
  };
};

ReactWMJSTimeSelector.propTypes = {
  layer: PropTypes.object,
  dispatch: PropTypes.func,
  layerManager: PropTypes.object,
  activeMapPanel: PropTypes.object
};

export default ReactWMJSTimeSelector;
