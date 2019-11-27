import React, { Component } from 'react';
import {
  ReactWMJSLayer,
  ReactWMJSMap,
  generateMapId,
  generateLayerId
} from '../src/index';
import { Row, Col } from 'reactstrap';
import SimpleDropDown from '../src/SimpleDropDown';
import { Slider, Rail, Handles, Tracks, Ticks } from 'react-compound-slider';
import { SliderRail, Handle, Track, Tick } from '../src/ReactBootStrapSliderComponents'; // example render components - source below
import './ECADDataAvailability.css';
import { debounce } from 'debounce';

import moment from 'moment';

const sliderStyle = {
  position: 'relative',
  width: '100%',
  touchAction: 'none'
};

const baseLayer = {
  name: 'arcGisSat',
  title: 'arcGisSat',
  type: 'twms',
  baseLayer: true,
  enabled: true,
  id: generateLayerId()
};

const elementList = [
  { key: 'tn', value: 'Minimum temperature' },
  { key: 'rr', value: 'Precipitation' },
  { key: 'tx', value: 'Maximum temperature' }
];

export default class ECADDataAvailibility extends Component {
  constructor (props) {
    super(props);
    this.changeElement = this.changeElement.bind(this);
    this.fetchDataAvailability = this.fetchDataAvailability.bind(this);
    this.fetchFirstLastDay = this.fetchFirstLastDay.bind(this);
    this.fetchAllElements = this.fetchAllElements.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onUpdate = this.onUpdate.bind(this);
    this.state = {
      selectedElement: elementList[0].key,
      geojson: null,
      startYear: 1900,
      endYear: moment.utc().year(),
      domainYearStart: 1900,
      domainYearEnd: moment.utc().year()
    };
  }

  changeElement (selected) {
    this.setState({
      selectedElement: selected.key
    }, () => {
      this.fetchDataAvailability();
    });
  }

  fetchAllElements () {
    const ecadallelementsURL = 'http://localhost:8080/allelements';
    fetch(ecadallelementsURL, {
      method: 'GET',
      mode: 'cors'
    }).then(data => {
      return data.json();
    }).then(json => {
      console.log(json);
      const elementList = {
        key: json.element,
        value: json.ele_name
      };
      this.setState({ elementList });
    });
  }

  fetchFirstLastDay () {
    const ecadfirstlastURL = 'http://localhost:8080/firstlastday?element=' +
      this.state.selectedElement;
    fetch(ecadfirstlastURL, {
      method: 'GET',
      mode: 'cors'
    }).then(data => {
      return data.json();
    }).then(json => {
      this.setState({
        domainYearStart:parseInt(json[0].first.substring(0, 4)),
        domainYearEnd:parseInt(json[0].last.substring(0, 4))
      });
    });
  }

  fetchDataAvailability () {
    const ecadURL = 'http://localhost:8080/dataavailability?element=' +
      this.state.selectedElement +
      '&time_start=' + this.state.startYear + '-01-01T00:00:00Z' +
      '&time_stop=' + this.state.endYear + '-01-01T00:00:00Z' +
      '&blend=false';
    const newFeature = (name, lat, lon) => {
      return {
        type: 'Feature',
        properties: {
          text: name
        },
        geometry: {
          type: 'Point',
          coordinates: [
            lon,
            lat
          ]
        }
      };
    };
    fetch(ecadURL, {
      method: 'GET',
      mode: 'cors'
    }).then(data => {
      return data.json();
    }).then(dataAvailabilityJSON => {
      const pointGeoJson = {
        type: 'FeatureCollection',
        features: []
      };
      dataAvailabilityJSON.forEach(dataPoint => {
        const feature = newFeature(dataPoint.sta_name, dataPoint.lat, dataPoint.lon);
        if (!dataPoint.perm_id) feature.properties.fill = '#FF8888'; else feature.properties.fill = '#88FF88';
        pointGeoJson.features.push(feature);
      });
      this.setState({ geojson: pointGeoJson });
    });
  }

  debouncedFetchDataAvailability () {
    debounce(() => {
      const key = 'key_' + this.state.startYear + '_' + this.state.endYear;
      if (this.fetchedSettingsKey === key) {
        return;
      }
      this.fetchedSettingsKey = key;
      this.fetchDataAvailability();
    }, 600)();
  }

  onUpdate (update) {
    this.setState({
      startYear: update[0] < this.state.endYear ? update[0] : this.state.endYear,
      endYear: update[1] > this.state.startYear ? update[1] : this.state.startYear
    }, () => {
      this.debouncedFetchDataAvailability();
    });
  }
  onChange (values) {
    this.onUpdate(values);
  }
  componentDidMount () {
    this.fetchAllElements();
    this.fetchFirstLastDay();
  }
  render () {
    const domain = [this.state.domainYearStart, this.state.domainYearEnd];
    const values = [this.state.startYear, this.state.endYear];
    return (<div>
      <div className={'ECADDataAvailabilityContainer'}>
        <div className={'ECADDataAvailabilityMapContainer'}>
          <ReactWMJSMap id={generateMapId()} bbox={[-2000000, 4000000, 3000000, 10000000]} enableInlineGetFeatureInfo={false}
            webMapJSInitializedCallback={(webMapJS) => {
              webMapJS.hideMapPin();
            }}
          >
            <ReactWMJSLayer {...baseLayer} />
            <ReactWMJSLayer
              geojson={this.state.geojson}
              isInEditMode={this.state.isInEditMode}
              drawMode={this.state.drawMode}
              updateGeojson={(geojson) => {
                this.setState({
                  geojson: geojson,
                  geojsonText: JSON.stringify(this.state.geojson, null, 2)
                });
              }}
              exitDrawModeCallback={() => { this.setState({ isInEditMode: false }); }}
              featureNrToEdit={this.state.currentFeatureNrToEdit}
            />
          </ReactWMJSMap>
        </div>
        <div className={'ECADDataAvailabilityControlsContainer'}>
          <Row>
            <SimpleDropDown
              selected={this.state.selectedElement}
              list={elementList}
              onChange={(selected) => { this.changeElement(selected); }}
            />
          </Row>
          <Row>
            <Col xs='12' style={{ height:'60px', paddingTop:'20px' }}>
              <Slider
                mode={1}
                step={1}
                domain={domain}
                reversed={false}
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
                <Tracks left={false} right={false}>
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
                <Ticks count={10}>
                  {({ ticks }) => (
                    <div className='"slider-ticks'>
                      {ticks.map(tick => (
                        <Tick key={tick.id} tick={tick} count={ticks.length} />
                      ))}
                    </div>
                  )}
                </Ticks>
              </Slider>

            </Col>
          </Row>
          <Row>
            <Col xs='12'>Found {this.state.geojson ? this.state.geojson.features.length : '0'} stations between {this.state.startYear} and {this.state.endYear}</Col>
          </Row>
        </div>
      </div>
    </div>);
  }
};
