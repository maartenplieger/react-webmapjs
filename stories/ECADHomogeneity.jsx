import React, { Component } from 'react';
import {
  ReactWMJSLayer,
  ReactWMJSMap,
  generateMapId,
  generateLayerId,
  setFeatureLayers
} from '../src/index';
import { Row, Col } from 'reactstrap';
import SimpleDropDown from '../src/SimpleDropDown';
import { Slider, Rail, Handles, Tracks, Ticks } from 'react-compound-slider';
import { SliderRail, Handle, Track, Tick } from '../src/ReactBootStrapSliderComponents'; // example render components - source below
import './ECADHomogeneity.css';
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

const elementList = [
  { key: 'temp', value: 'Temperature' },
  { key: 'prec', value: 'Precipitation' }
];

const periodList = [
  { key: '1901-1950', value: '1901-1950' },
  { key: '1951-1978', value: '1951-2078' },
  { key: '1851-2018', value: '1851-2018' },
  { key: '1901-2018', value: '1901-2018' },
  { key: '1951-2018', value: '1951-2018' },
  { key: '1979-2018', value: '1979-2018' }
];

export default class ECADHomogeneity extends Component {
  constructor(props) {
    super(props);
    this.changeElement = this.changeElement.bind(this);
    this.changePeriod = this.changePeriod.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onUpdate = this.onUpdate.bind(this);
    this.adagucMouseDown = this.adagucMouseDown.bind(this);
    // this.hoverCallback = this.hoverCallback.bind(this);
    // this.handleHover = this.handleHover.bind(this);
    // this.debouncedHover = this.debouncedHover.bind(this);
    this.handleClickedPoint = this.handleClickedPoint.bind(this);
    this.state = {
      selectedElement: elementList[0].key,
      selectedElementname: elementList[0].value,
      selectedPeriod: periodList[5].key,
      geojson: null,
      hoveredFeatureIndex: null,
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
          const d = distance({ x: event.mouseX, y: event.mouseY }, XYCoords[j] );
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

  changeElement(selected) {
    this.setState({
      selectedElement: selected.key
    }, () => {
      this.fetchHomogeneity();
    });
  }

  changePeriod(selected) {
    this.setState({
      selectedPeriod: selected.key
    }, () => {
      this.fetchHomogeneity();
    });
  }

  fetchStationInfoForId() {
    const ecadURL = 'http://eobsdata.knmi.nl:8080/homogeneityinfo?element=' +
    this.state.selectedElement +
    '&startperiod=' +
    this.state.selectedPeriod.substr(0, 4) +
    '&endperiod=' +
    this.state.selectedPeriod.substr(5, 4) +
    '&station_id=' +
    this.state.geojson.features[this.state.hoveredFeatureIndex].properties;
  }

  handleClickedPoint (featureIndex) {
    if (!this.state.geojson.features[featureIndex]) {
      console.log('Featureindex not found', featureIndex);
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
    // this.fetchStationInfoForId()
  }

  // debouncedHover (args) {
  //   const { feature } = args;
  //   if (!feature || !feature.properties || feature.properties.id === undefined) {
  //     return;
  //   }
  //   debounce(() => {
  //     const key = 'key_' + feature.properties.id;
  //     if (this.debouncedHoverKey === key) {
  //       return;
  //     }
  //     this.debouncedHoverKey = key;
  //     this.handleHover(args);
  //   }, 60)();
  // }

  // hoverCallback (args) {
  //   this.debouncedHover(args);
  // }

  fetchHomogeneity () {
    const ecadURL = 'http://eobsdata.knmi.nl:8080/homogeneity?element=' +
      this.state.selectedElement +
      '&startperiod=' +
      this.state.selectedPeriod.substr(0, 4) +
      '&endperiod=' +
      this.state.selectedPeriod.substr(5, 4);
    const newFeature = (name, lat, lon, id) => {
      return {
        type: 'Feature',
        properties: {
          text: name,
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
    }).then(homogeneityJSON => {
      const pointGeoJson = {
        type: 'FeatureCollection',
        features: []
      };
      homogeneityJSON.forEach(dataPoint => {
        const feature = newFeature(dataPoint.sta_name, dataPoint.lat, dataPoint.lon, dataPoint.sta_id);
        feature.properties.drawFunction = ECADDrawFunctionSolidCircle;
        if (dataPoint.homog === 0) {
          feature.properties.fill = '#008000';
        } else if (dataPoint.homog === 1) {
          feature.properties.fill = '#ffff00';
        } else if (dataPoint.homog === 2) {
          feature.properties.fill = '#ee0000';
        } else {
          feature.properties.fill = '#808080';
        }
        pointGeoJson.features.push(feature);
      });
      this.setState({ geojson: pointGeoJson });
    });
  }

  onUpdate(update) {
    this.fetchHomogeneity();
  }
  onChange(values) {
    this.onUpdate(values);
  }
  render() {
    return (<div>
      <div className={'ECADHomogeneityContainer'}>
        <div className={'ECADHomogeneityMapContainer'}>
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
        <div className={'ECADHomogeneityControlsContainer'}>
          <Row>
            <SimpleDropDown
              selected={this.state.selectedElement}
              list={elementList}
              onChange={(selected) => { this.changeElement(selected); }}
            />
          </Row>
          <Row>
            <SimpleDropDown
              selected={this.state.selectedPeriod}
              list={periodList}
              onChange={(selected) => { this.changePeriod(selected); }}
            />
          </Row>
          <Row>
            <Col>
              {this.state.hoveredFeatureIndex}<hr />
              {this.state.hoveredFeatureIndex && this.state.geojson.features[this.state.hoveredFeatureIndex].properties.text}
            </Col>
          </Row>
        </div>
      </div>
    </div>);
  }
};
