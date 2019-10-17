import React, { Component } from 'react';
import { Slider, Rail, Handles, Tracks } from 'react-compound-slider';
import { SliderRail, Handle, Track } from './ReactBootStrapSliderComponents'; // example render components - source below
import PropTypes from 'prop-types';

const sliderStyle = {
  position: 'relative',
  width: '100%',
  touchAction: 'none'
};

class ReactBootStrapSlider extends Component {
  constructor (props) {
    super(props);
    this.onUpdate = this.onUpdate.bind(this);
    this.onChange = this.onChange.bind(this);
  }
  onUpdate (update) {
    if (this.props.change) {
      this.props.change(update);
    }
  }
  onChange (values) {
    console.log(values);
    if (this.props.change) {
      this.props.change(values);
    }
  }
  render () {
    const values = [this.props.value || 0];
    // const update = [this.props.value || 0];
    const domain = [this.props.min || 0, this.props.max || 0];
    return (
      <div style={{ padding: '10px', width: '100%' }}>
        <Slider
          mode={1}
          step={this.props.step || 1}
          domain={domain}
          rootStyle={sliderStyle}
          onUpdate={this.onUpdate}
          onChange={this.onChange}
          values={values}
        >
          <Rail>
            {({ getRailProps }) => <SliderRail getRailProps={getRailProps} />}
          </Rail>
          <Handles>
            {({ handles, getHandleProps }) => (
              <div className='slider-handles'>
                {handles.map(handle => (
                  <Handle
                    key={handle.id}
                    handle={handle}
                    domain={domain}
                    getHandleProps={getHandleProps}
                  />
                ))}
              </div>
            )}
          </Handles>
          <Tracks right={false}>
            {({ tracks, getTrackProps }) => (
              <div className='slider-tracks'>
                {tracks.map(({ id, source, target }) => (
                  <Track
                    key={id}
                    source={source}
                    target={target}
                    getTrackProps={getTrackProps}
                  />
                ))}
              </div>
            )}
          </Tracks>
        </Slider>
      </div>
    );
  }
};
ReactBootStrapSlider.propTypes = {
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  value: PropTypes.number,
  change: PropTypes.func
};

export default ReactBootStrapSlider;
