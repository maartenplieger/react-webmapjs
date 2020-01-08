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
import { ECADDrawFunctionSolidCircle, distance, getPixelCoordFromGeoCoord } from './ECADDrawFunctions';
import produce from 'immer';
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

// const elementList = [
//   { key: 'tn', value: 'Minimum temperature' },
//   { key: 'rr', value: 'Precipitation' },
//   { key: 'tx', value: 'Maximum temperature' }
// ];

const blendList = [
  { key: 'false', value: 'Non-blended stations' },
  { key: 'true', value: 'Blended stations' }
];

export default class ECADDataAvailibility extends Component {
  constructor (props) {
    super(props);
    this.changeElement = this.changeElement.bind(this);
    this.changeBlend = this.changeBlend.bind(this);
    this.fetchDataAvailability = this.fetchDataAvailability.bind(this);
    this.fetchFirstLastDay = this.fetchFirstLastDay.bind(this);
    this.fetchAllElements = this.fetchAllElements.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onUpdate = this.onUpdate.bind(this);
    this.adagucMouseDown = this.adagucMouseDown.bind(this);
    this.handleClickedPoint = this.handleClickedPoint.bind(this);
    this.state = {
      selectedBlend: blendList[0].key,
      selectedBlendname: blendList[0].value,
      selectedElement: '',
      selectedElementname: '',
      elementList: [],
      geojson: null,
      startYear: 1900,
      endYear: moment.utc().year(),
      domainYearStart: 1950,
      domainYearEnd: moment.utc().year(),
      hoveredFeatureIndex: null
    };
  }

  adagucMouseDown (event) {
    const { geojson } = this.state;
    if (!geojson || !this.webMapJS) return;
    let smallestDistance = null;
    let featureIndexWithSmallestDistance = null;
    for (let featureIndex = 0; featureIndex < geojson.features.length; featureIndex++) {
      const feature = geojson.features[featureIndex];
      const featureType = feature.geometry.type;

      if (featureType === 'Point') {
        let featureCoords = feature.geometry.coordinates;
        const XYCoords = getPixelCoordFromGeoCoord([featureCoords], this.webMapJS);
        if (XYCoords.length === 0) {
          continue;
        }
        for (let j = 0; j < XYCoords.length; j++) {
          const d = distance({ x: event.mouseX, y: event.mouseY }, XYCoords[j]);
          if (!smallestDistance || smallestDistance > d) {
            smallestDistance = d;
            featureIndexWithSmallestDistance = featureIndex;
          }
        }
      }
    }
    if (featureIndexWithSmallestDistance !== null && smallestDistance < 8) {
      console.log(featureIndexWithSmallestDistance, smallestDistance);
      console.log(this.state.geojson.features[featureIndexWithSmallestDistance]);
      this.handleClickedPoint(featureIndexWithSmallestDistance);
    }
  }

  changeBlend (selected) {
    this.setState({
      selectedBlend: selected.key
    }, () => {
      this.fetchDataAvailability();
    });
  }
  changeElement (selected) {
    this.setState({
      selectedElement: selected.key
    }, () => {
      this.fetchDataAvailability();
    });
  }

  handleClickedPoint (featureIndex) {
    if (!this.state.geojson.features[featureIndex]) {
      return;
    }
    if (!this.previousHoverProps) {
      this.previousHoverProps = {
        featureIndex: featureIndex,
        fill: this.state.geojson.features[featureIndex].properties.fill
      };
    }
    this.setState(produce(this.state, draft => {
      draft.hoveredFeatureIndex = featureIndex;
      draft.geojson.features[featureIndex].properties.fill = '#000';
      if (this.previousHoverProps) {
        if (this.previousHoverProps.featureIndex !== featureIndex) {
          draft.geojson.features[this.previousHoverProps.featureIndex].properties.fill = this.previousHoverProps.fill;
          this.previousHoverProps = {
            featureIndex: featureIndex,
            fill: this.state.geojson.features[featureIndex].properties.fill
          };
        }
      }
    }));
    //   this.fetchStationInfoForId();
  }

  fetchAllElements () {
    const ecadallelementsURL = 'http://eobsdata.knmi.nl:8080/allelements';
    fetch(ecadallelementsURL, {
      method: 'GET',
      mode: 'cors'
    }).then(data => {
      return data.json();
    }).then(json => {
      const elementList = [];
      for (let j = 0; j < json.length; j++) {
        elementList.push({
          key: json[j].element,
          value: json[j].ele_name
        });
      }

      this.setState({ elementList: elementList }, () => {
        let defaultElement = elementList[0];
        const filteredElements = elementList.filter(element => element.key === 'tg');
        if (filteredElements.length > 0) {
          defaultElement = filteredElements[0];
        }
        this.changeElement(defaultElement);
      });
    });
  }

  fetchFirstLastDay () {
    const ecadfirstlastURL = 'http://eobsdata.knmi.nl:8080/firstlastday?element=' +
      this.state.selectedElement;
    fetch(ecadfirstlastURL, {
      method: 'GET',
      mode: 'cors'
    }).then(data => {
      return data.json();
    }).then(json => {
      this.setState({
        domainYearStart: parseInt(json[0].first.substring(0, 4)),
        domainYearEnd: parseInt(json[0].last.substring(0, 4))
      });
    });
  }

  fetchDataAvailability () {
    const ecadURL = 'http://eobsdata.knmi.nl:8080/dataavailability?element=' +
      this.state.selectedElement +
      '&time_start=' + this.state.startYear + '-01-01T00:00:00Z' +
      '&time_stop=' + this.state.endYear + '-01-01T00:00:00Z' +
      '&blend=' + this.state.selectedBlend;
    const newFeature = (name, id, lat, lon) => {
      return {
        type: 'Feature',
        properties: {
          name: name,
          id: id
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
        const feature = newFeature(dataPoint.sta_name, dataPoint.sta_id, dataPoint.lat, dataPoint.lon);
        feature.properties.drawFunction = ECADDrawFunctionSolidCircle;
        if (!dataPoint.perm_id) feature.properties.fill = '#FF0000'; else feature.properties.fill = '#00FF00';
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
              webMapJS.addListener('beforemousedown', this.adagucMouseDown, true);
              this.webMapJS = webMapJS;
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
              selected={this.state.selectedBlend}
              list={blendList}
              onChange={this.changeBlend}
            />
          </Row>
          <Row>
            <SimpleDropDown
              selected={this.state.selectedElement}
              list={this.state.elementList}
              onChange={this.changeElement}
            />
          </Row>
          <Row>
            <Col xs='12' style={{ height: '60px', paddingTop: '20px' }}>
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
            <Col xs='12'>Found {this.state.geojson ? this.state.geojson.features.length : '0'} {this.state.selectedBlendname.toLowerCase()} stations for {this.state.selectedElementname.toLowerCase()} between {this.state.startYear} and {this.state.endYear}</Col>
          </Row>
          <Row>
            <Col>
              {this.state.hoveredFeatureIndex}<hr />
              {this.state.hoveredFeatureIndex && this.state.geojson.features[this.state.hoveredFeatureIndex].properties.name}
            </Col>
          </Row>
        </div>
      </div>
    </div>);
  }
};
