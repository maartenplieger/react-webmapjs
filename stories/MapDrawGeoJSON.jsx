import React, { Component } from 'react';
import {
  ReactWMJSLayer,
  ReactWMJSMap,
  generateMapId,
  generateLayerId
} from '../src/index';
import { simplePolygonGeoJSON, simplePointsGeojson, simpleBoxGeoJSON } from './geojsonExamples';
import { Button, Form, FormGroup, Label } from 'reactstrap';
import SimpleDropDown from '../src/UIComponents/SimpleDropDown';
import { lineString } from '../src/ReactWMJSMap/AdagucMapDraw';
import './MapDrawGeoJSON.css';

const baseLayer = {
  name:'arcGisSat',
  title:'arcGisSat',
  type: 'twms',
  baseLayer: true,
  enabled:true,
  id: generateLayerId()
};

const editModes = [
  { key: 'POLYGON', value: 'Polygon' },
  { key: 'POINT', value: 'Point' },
  { key: 'BOX', value: 'Box' },
  { key: 'LINESTRING', value: 'LineString' }
];

export default class drawPolyStory extends Component {
  constructor (props) {
    super(props);
    this.changeDrawMode = this.changeDrawMode.bind(this);
    this.state = {
      isInEditMode: false,
      geojson: lineString,
      drawMode: 'LINESTRING',
      currentFeatureNrToEdit: 0

    };
  }
  changeDrawMode (selected) {
    if (selected.key === 'POLYGON') {
      this.setState({
        drawMode: selected.key,
        geojson: simplePolygonGeoJSON,
        geojsonText: JSON.stringify(simplePolygonGeoJSON, null, 2)
      });
    }
    if (selected.key === 'BOX') {
      this.setState({
        drawMode: selected.key,
        geojson: simpleBoxGeoJSON,
        geojsonText: JSON.stringify(simpleBoxGeoJSON, null, 2)
      });
    }
    if (selected.key === 'LINESTRING') {
      this.setState({
        drawMode: selected.key,
        geojson: lineString,
        geojsonText: JSON.stringify(lineString, null, 2)
      });
    }
    if (selected.key === 'POINT') {
      this.setState({
        drawMode: selected.key,
        geojson: simplePointsGeojson,
        geojsonText: JSON.stringify(simplePointsGeojson, null, 2)
      });
    }
    if (selected.key === 'MULTIPOINT') {
      this.setState({
        drawMode: selected.key,
        geojson: simplePointsGeojson,
        geojsonText: JSON.stringify(simplePointsGeojson, null, 2)
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
      <div className={'MapDrawGeoJSONContainer'}>
        <div className={'MapDrawGeoJSONMapContainer'}>
          <ReactWMJSMap id={generateMapId()} bbox={[-2000000, 4000000, 3000000, 10000000]} enableInlineGetFeatureInfo={false}
            webMapJSInitializedCallback={(webMapJS) => {
              webMapJS.hideMapPin();
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
                  geojson:geojson,
                  geojsonText: JSON.stringify(this.state.geojson, null, 2)
                });
              }}
              exitDrawModeCallback={() => { this.setState({ isInEditMode: false }); }}
              featureNrToEdit={this.state.currentFeatureNrToEdit}
            />
          </ReactWMJSMap>
        </div>
        <div className={'MapDrawGeoJSONControlsContainer'}>
          <Form>
            <FormGroup>
              <Label xs='6'>Feature type</Label>
              <SimpleDropDown
                selected={this.state.drawMode}
                list={editModes}
                onChange={(selected) => { this.changeDrawMode(selected); }}
              />
            </FormGroup>
            <FormGroup>
              <Label xs='6'>Feature number</Label>
              <SimpleDropDown
                selected={this.state.currentFeatureNrToEdit + ''}
                list={featureToEditList}
                onChange={(selected) => { this.setState({ currentFeatureNrToEdit: selected.key }); }}
              />
            </FormGroup>
            <FormGroup>
              <Label xs='6'>Edit mode</Label>
              <Button onClick={() => {
                this.setState({ isInEditMode: !this.state.isInEditMode });
              }}>{this.state.isInEditMode ? 'Finish edit' : 'Start edit'}</Button>
            </FormGroup>
          </Form>
        </div>
        <div className={'MapDrawGeoJSONTextAreaContainer'}>
          <textarea className={'MapDrawGeoJSONTextArea'}
            style={{ border: this.state.valid === false ? '5px solid red' : '5px solid lightgreen' }}
            onChange={(e) => {
              this.setState({ geojsonText: e.target.value });
              try {
                this.setState({ geojson: JSON.parse(e.target.value), valid: true });
              } catch (e) {
                this.setState({ geojson: null, valid: false });
              }
            }}
            value={this.state.geojsonText || JSON.stringify(this.state.geojson, null, 2)}
          />
        </div>
      </div>
    </div>);
  }
};
