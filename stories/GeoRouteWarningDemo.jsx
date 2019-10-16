import React, { Component } from 'react';
import {
  ReactWMJSLayer,
  ReactWMJSMap,
  generateMapId,
  generateLayerId
} from '../src/index';
import { simplePolygonGeoJSON, simplePointsGeojson, simpleBoxGeoJSON } from './geojsonExamples';
import { Button, Form, FormGroup, Label } from 'reactstrap';
import SimpleDropDown from '../src/SimpleDropDown';
import { lineString } from '../src/AdagucMapDraw';
import './MapDrawGeoJSON.css';

const dwdWFSGeoServerURL = 'https://maps.dwd.de/geoserver/dwd/wfs?service=wfs&version=2.0.0&request=GetFeature&outputFormat=application/json&';
const typeName = 'typeName=dwd:GAFOR&';

const dwdGaforLayer = {
  service: 'https://maps.dwd.de/geoserver/dwd/GAFOR/ows?',
  name: 'GAFOR',
  format: 'image/png',
  enabled: true,
  id: generateLayerId()
};

const baseLayer = {
  name:'arcGisSat',
  title:'arcGisSat',
  type: 'twms',
  baseLayer: true,
  enabled:true,
  id: generateLayerId()
};

export default class drawPolyStory extends Component {
  constructor (props) {
    super(props);
    this.triggerIntersection = this.triggerIntersection.bind(this);
    this.state = {
      isInEditMode: false,
      geojson: lineString,
      drawMode: 'LINESTRING',
      interSectionResult: null
    };
  }

  /**
   * When the flightroute is finished, we form a CQL (Geoserver query language) query and send an intersection request to the backend.
   */
  triggerIntersection () {
    console.log('triggerIntersection', this.state.geojson);
    const linePoints = this.state.geojson.features[0].geometry.coordinates;
    if (linePoints.length < 2) {
      console.log('No line drawn');
      return;
    }
    /* Compose CQL query */
    let lineString = 'LINESTRING(';
    for (let j = 0; j< linePoints.length; j++) {
      if (j > 0) lineString += ',%20';
      lineString += linePoints[j][1] + '+' + linePoints[j][0];
    }
    lineString += ')';
    var cqlfilter = '&cql_filter=INTERSECTS(AREA_POLYGON_GEOGRAPHY%2C+' + lineString + ')';
    const wfsQueryURL = dwdWFSGeoServerURL + typeName + cqlfilter;
    console.log(wfsQueryURL);

    /* Do the fetch of the CQL query */
    fetch(wfsQueryURL, {
      method: 'GET',
      mode: 'cors'
    }).then(data => {
      return data.json();
    }).then(data => {
      console.log(data);
      this.setState({ interSectionResult: data });
    }).catch(e => {
      console.error(e);
    });
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
            { this.state.interSectionResult ? null : <ReactWMJSLayer {...dwdGaforLayer} /> }
            <ReactWMJSLayer
              geojson={this.state.geojson}
              isInEditMode={this.state.isInEditMode}
              drawMode={this.state.drawMode}
              updateGeojson={(geojson) => {
                this.setState({
                  geojson:geojson,
                  geojsonText: JSON.stringify(this.state.geojson, null, 2)
                });
              }}
              exitDrawModeCallback={() => {
                this.setState({ isInEditMode: false }, () => {
                  this.triggerIntersection();
                });
              }}
              featureNrToEdit={this.state.currentFeatureNrToEdit}
            />
            <ReactWMJSLayer
              geojson={this.state.interSectionResult}
            />
          </ReactWMJSMap>
        </div>
        <div className={'MapDrawGeoJSONControlsContainer'}>
          <Form>
            <FormGroup>
              <Label xs='6'>Edit mode</Label>
              <Button onClick={() => {
                this.setState({ isInEditMode: !this.state.isInEditMode }, () => {
                  this.triggerIntersection();
                });
              }}>{this.state.isInEditMode ? 'Finish route' : 'Start drawing route'}</Button>
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
