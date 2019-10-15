import React, { Component } from 'react';
import {
  ReactWMJSLayer,
  ReactWMJSMap,
  generateMapId,
  generateLayerId
} from '../src/index';
import { simpleLineStringGeoJSON, simplePolygonGeoJSON, simplePointsGeojson, simpleBoxGeoJSON } from './geojsonExamples';
import { Button } from 'reactstrap';
import SimpleDropDown from '../src/SimpleDropDown';
import { lineString } from '../src/AdagucMapDraw';

const baseLayer = {
  name:'arcGisSat',
  title:'arcGisSat',
  type: 'twms',
  baseLayer: true,
  enabled:true,
  id: generateLayerId()
};

const preStyle = {
  position:'absolute',
  right:'10px',
  top: '70px',
  zIndex: '10000',
  backgroundColor: '#000000C0',
  color: 'white',
  fontSize: '12px',
  height: '400px',
  padding:'0px',
  overflowY: 'scroll',
  width:'300px'
};

const editModes = [
  { key: 'POLYGON', value: 'Polygon' },
  { key: 'POINT', value: 'Point' },
  // { key: 'MULTIPOINT', value: 'MultiPoint' },
  { key: 'BOX', value: 'Box' },
  { key: 'LINESTRING', value: 'LineString' }
];

export default class drawPolyStory extends Component {
  constructor (props) {
    super(props);
    this.changeDrawMode = this.changeDrawMode.bind(this);
    this.state = {
      isInEditMode: false,
      geojson: simpleLineStringGeoJSON,
      drawMode: 'LINESTRING',
      currentFeatureNrToEdit: 0

    };
  }
  changeDrawMode (selected) {
    if (selected.key === 'POLYGON') {
      this.setState({
        drawMode: selected.key,
        geojson: simplePolygonGeoJSON
      });
    }
    if (selected.key === 'BOX') {
      this.setState({
        drawMode: selected.key,
        geojson: simpleBoxGeoJSON
      });
    }
    if (selected.key === 'LINESTRING') {
      this.setState({
        drawMode: selected.key,
        geojson: lineString
      });
    }
    if (selected.key === 'POINT') {
      this.setState({
        drawMode: selected.key,
        geojson: simplePointsGeojson
      });
    }
    if (selected.key === 'MULTIPOINT') {
      this.setState({
        drawMode: selected.key,
        geojson: simplePointsGeojson
      });
    }
  }
  render () {
    const numFeatures = (this.state.geojson && this.state.geojson.features) ? this.state.geojson.features.length : 0;
    const featureToEditList = [];
    for (let j = 0; j < numFeatures; j++) {
      featureToEditList.push({ key: j + '', value: j });
    }

    return (<div>
      <div style={{ height: '100vh' }}>
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
            updateGeojson={(geojson) => { this.setState({ geojson:geojson }); }}
            exitDrawModeCallback={() => { this.setState({ isInEditMode: false }); }}
            featureNrToEdit={this.state.currentFeatureNrToEdit}
          />
        </ReactWMJSMap>
      </div>
      <textarea style={preStyle}
        onChange={(e) => { this.setState({ geojson: JSON.parse(e.target.value) }); }}
        value={JSON.stringify(this.state.geojson, null, 2)}
      />
      <div style={{ position:'absolute', left:'10px', top: '10px', zIndex: '10000' }}>
        <Button onClick={() => {
          this.setState({ isInEditMode: !this.state.isInEditMode });
        }}>{this.state.isInEditMode ? 'Finish edit' : 'Start edit'}</Button>
        <SimpleDropDown
          selected={this.state.drawMode}
          list={editModes}
          onChange={(selected) => { this.changeDrawMode(selected); }}
        />
        <SimpleDropDown
          selected={this.state.currentFeatureNrToEdit + ''}
          list={featureToEditList}
          onChange={(selected) => { this.setState({ currentFeatureNrToEdit: selected.key }); }}
        />
      </div>
    </div>);
  }
};
