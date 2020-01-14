import React, { Component } from 'react';
import {
  ReactWMJSLayer,
  ReactWMJSMap,
  generateMapId,
  generateLayerId
  // setFeatureLayers
} from '../../src/index';
import { Row, Col } from 'reactstrap';
import SimpleDropDown from '../../src/SimpleDropDown';
// import { Slider, Rail, Handles, Tracks, Ticks } from 'react-compound-slider';
// import { SliderRail, Handle, Track, Tick } from '../src/ReactBootStrapSliderComponents'; // example render components - source below
import './ECADTrends.css';
// import { debounce } from 'debounce';
import { ECADDrawFunctionSolidCircle, distance, getPixelCoordFromGeoCoord } from './ECADDrawFunctions';
import produce from 'immer';

// import moment from 'moment';

// const sliderStyle = {
//   position: 'relative',
//   width: '100%',
//   touchAction: 'none'
// };

const baseLayer = {
  name: 'arcGisSat',
  title: 'arcGisSat',
  type: 'twms',
  baseLayer: true,
  enabled: true,
  id: generateLayerId()
};

const indexList = [
  { key: 'ID', value: 'Ice Days' },
  { key: 'PRCPTOT', value: 'Total precipitation amount' }
];

const periodList = [
  { key: '19511978', value: '1951-1978' },
  { key: '19792018', value: '1979-2018' }
];

const seasonList = [
  { key: '0', value: 'Annual' },
  { key: '1', value: 'Winter-half (ONDJFM)' },
  { key: '2', value: 'Summer-half (AMJJAS)' },
  { key: '3', value: 'DJF' },
  { key: '4', value: 'MAM' },
  { key: '5', value: 'JJA' },
  { key: '6', value: 'SON' }
];

export default class ECADTrends extends Component {
  constructor (props) {
    super(props);
    this.changeIndex = this.changeIndex.bind(this);
    this.changePeriod = this.changePeriod.bind(this);
    this.changeSeason = this.changeSeason.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onUpdate = this.onUpdate.bind(this);
    this.adagucMouseDown = this.adagucMouseDown.bind(this);
    // this.hoverCallback = this.hoverCallback.bind(this);
    // this.handleHover = this.handleHover.bind(this);
    // this.debouncedHover = this.debouncedHover.bind(this);
    this.handleClickedPoint = this.handleClickedPoint.bind(this);
    this.state = {
      selectedIndex: indexList[0].key,
      selectedIndexname: indexList[0].value,
      selectedPeriod: periodList[0].key,
      selectedSeason: seasonList[0].key,
      selectedSeasonname: seasonList[0].value,
      geojson: null,
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

  changeIndex (selected) {
    this.setState({
      selectedIndex: selected.key
    }, () => {
      this.fetchTrends();
    });
  }

  changePeriod (selected) {
    this.setState({
      selectedPeriod: selected.key
    }, () => {
      this.fetchTrends();
    });
  }

  changeSeason (selected) {
    this.setState({
      selectedSeason: selected.key
    }, () => {
      this.fetchTrends();
    });
  }

  // fetchStationInfoForId () {
  //   const stationinfoURL = 'http://birdexp07.knmi.nl/ecadbackend/stationinfo?' +
  //     '&station_id=' +
  //     this.state.geojson.features[this.state.hoveredFeatureIndex].properties;
  //   // const newFeature = (name, id) => {
  //   //   return {
  //   //     type: 'Feature',
  //   //     properties: {
  //   //       name: name,
  //   //       id: id
  //   //     }
  //   //   };
  //   // };
  //   fetch(stationinfoURL, {
  //     method: 'GET',
  //     mode: 'cors'
  //   });
  //   console.log('testing');
  // }

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
    //   this.fetchStationInfoForId();
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

  fetchTrends () {
    const ecadURL = 'http://birdexp07.knmi.nl/ecadbackend/trends?index=' +
      this.state.selectedIndex +
      '&period=' +
      this.state.selectedPeriod +
      '&season=' +
      this.state.selectedSeason;
    const newFeature = (name, lat, lon, id, trendvalue, unit) => {
      return {
        type: 'Feature',
        properties: {
          name: name,
          id: id,
          trendvalue: trendvalue,
          unit: unit
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
    }).then(TrendsJSON => {
      const pointGeoJson = {
        type: 'FeatureCollection',
        features: []
      };
      TrendsJSON.forEach(dataPoint => {
        const feature = newFeature(dataPoint.sta_name, dataPoint.lat, dataPoint.lon, dataPoint.sta_id, dataPoint.trendvalue, dataPoint.trendlabel);
        feature.properties.drawFunction = ECADDrawFunctionSolidCircle;
        if (dataPoint.ind_value < 10) {
          feature.properties.fill = '#008000';
        } else if (dataPoint.ind_value >= 10) {
          feature.properties.fill = '#ffff00';
        // } else if (dataPoint.homog === 2) {
        //   feature.properties.fill = '#ee0000';
        // } else {
        //   feature.properties.fill = '#808080';
        }
        pointGeoJson.features.push(feature);
      });
      this.setState({ geojson: pointGeoJson });
    });
  }

  onUpdate (update) {
    this.fetchTrends();
  }
  onChange (values) {
    this.onUpdate(values);
  }
  render () {
    return (<div>
      <div className={'ECADTrendsContainer'}>
        <div className={'ECADTrendsMapContainer'}>
          <ReactWMJSMap id={generateMapId()} bbox={[-2000000, 4000000, 3000000, 10000000]} enableInlineGetFeatureInfo={false}
            webMapJSInitializedCallback={(webMapJS) => {
              webMapJS.hideMapPin();
              webMapJS.addListener('beforemousedown', this.adagucMouseDown, true);
              this.webMapJS = webMapJS;
            }}
          >
            <ReactWMJSLayer {...baseLayer} />
            <ReactWMJSLayer
              id={generateLayerId()}
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
        <div className={'ECADTrendsControlsContainer'}>
          <Row>
            <SimpleDropDown
              selected={this.state.selectedIndex}
              list={indexList}
              onChange={(selected) => { this.changeIndex(selected); }}
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
            <SimpleDropDown
              selected={this.state.selectedSeason}
              list={seasonList}
              onChange={(selected) => { this.changeSeason(selected); }}
            />
          </Row>
          <Row>
            <Col>
              {this.state.hoveredFeatureIndex}<hr />
              {this.state.hoveredFeatureIndex && this.state.geojson.features[this.state.hoveredFeatureIndex].properties.name}
              {this.state.hoveredFeatureIndex && this.state.geojson.features[this.state.hoveredFeatureIndex].properties.trendvalue}
              {this.state.hoveredFeatureIndex && this.state.geojson.features[this.state.hoveredFeatureIndex].properties.unit}
              {this.state.hoveredFeatureIndex && this.state.selectedYear}
              {this.state.hoveredFeatureIndex && this.state.selectedSeasonname} {this.state.hoveredFeatureIndex && this.state.selectedIndexname}
            </Col>
          </Row>
        </div>
      </div>
    </div>);
  }
};
