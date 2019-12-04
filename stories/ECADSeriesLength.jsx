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
import './ECADSeriesLength.css';
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

const blendList = [
  { key: 'false', value: 'Non-blended stations' },
  { key: 'true', value: 'Blended stations' }
];

export default class ECADSeriesLength extends Component {
  constructor (props) {
    super(props);
    this.changeElement = this.changeElement.bind(this);
    this.changeBlend = this.changeBlend.bind(this);
    this.fetchAllElements = this.fetchAllElements.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onUpdate = this.onUpdate.bind(this);
    this.state = {
      selectedBlend: blendList[0].key,
      selectedBlendname: blendList[0].value,
      selectedElement: elementList[0].key,
      selectedElementname: elementList[0].value,
      geojson: null,
    };
  }

  changeBlend (selected) {
    this.setState({
      selectedBlend: selected.key
    }, () => {
      this.fetchSeriesLength();
    });
  }
  changeElement (selected) {
    this.setState({
      selectedElement: selected.key
    }, () => {
      this.fetchSeriesLength();
    });
  }

  fetchAllElements () {
    const ecadallelementsURL = 'http://eobsdata.knmi.nl:8080/allelements';
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

  fetchSeriesLength () {
    const ecadURL = 'http://eobsdata.knmi.nl:8080/serieslength?element=' +
      this.state.selectedElement +
      '&blend=' + this.state.selectedBlend;
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
    }).then(seriesLengthJSON => {
      const pointGeoJson = {
        type: 'FeatureCollection',
        features: []
      };
      seriesLengthJSON.forEach(dataPoint => {
        const feature = newFeature(dataPoint.sta_name, dataPoint.lat, dataPoint.lon);
        if (dataPoint.length<50) feature.properties.fill = '#FF0000'; else feature.properties.fill = '#00FF00';
        pointGeoJson.features.push(feature);
      });
      this.setState({ geojson: pointGeoJson });
    });
  }

  onUpdate (update) {
      this.fetchSeriesLength();
  }
  onChange (values) {
    this.onUpdate(values);
  }
  componentDidMount () {
    this.fetchAllElements();
  }
  render () {
    return (<div>
      <div className={'ECADSeriesLengthContainer'}>
        <div className={'ECADSeriesLengthMapContainer'}>
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
        <div className={'ECADSeriesLengthControlsContainer'}>
          <Row>
            <SimpleDropDown
              selected={this.state.selectedBlend}
              list={blendList}
              onChange={(selected) => { this.changeBlend(selected); }}
            />
          </Row>
          <Row>
            <SimpleDropDown
              selected={this.state.selectedElement}
              list={elementList}
              onChange={(selected) => { this.changeElement(selected); }}
            />
          </Row>
        </div>
      </div>
    </div>);
  }
};
