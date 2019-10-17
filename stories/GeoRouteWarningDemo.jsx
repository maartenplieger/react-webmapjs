import React, { Component } from 'react';
import {
  ReactWMJSLayer,
  ReactWMJSMap,
  generateMapId,
  generateLayerId,
  SimpleLayerManager,
  setLayers,
  WEBMAPJS_REDUCERNAME,
  webMapJSReducer
} from '../src/index';
import {
  Card, CardBody,
  CardTitle, Button, Row, Col
} from 'reactstrap';
import { lineString } from '../src/AdagucMapDraw';
import { lineChunk, simplify } from '@turf/turf';
import './GeoRouteWarningDemo.css';
import produce from 'immer';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

// import gaforWarnings from './gaforWarnings.json';

const dwdWFSGeoServerURL = 'https://maps.dwd.de/geoserver/dwd/wfs?service=wfs&version=2.0.0&request=GetFeature&outputFormat=application/json&';
const typeName = 'typeName=dwd:GAFOR&';

const dwdGaforLayer = {
  service: 'https://maps.dwd.de/geoserver/dwd/GAFOR/ows?',
  name: 'GAFOR',
  format: 'image/png',
  enabled: true,
  id: generateLayerId()
};

// const dwdFGGWSAirportsLayer = {
//   service: 'https://maps.dwd.de/geoserver/dwd/FG_GWS_Airports/ows?',
//   name: 'FG_GWS_Airports',
//   format: 'image/png',
//   enabled: true,
//   id: generateLayerId()
// };

const baseLayer = {
  name:'OpenStreetMap_Service',
  type: 'twms',
  baseLayer: true,
  enabled:true,
  id: generateLayerId()
};

class GeoRouteWarningDemo extends Component {
  constructor (props) {
    super(props);
    this.triggerIntersection = this.triggerIntersection.bind(this);
    this.renderGaforAreaForecast = this.renderGaforAreaForecast.bind(this);
    this.hightlightWarning = this.hightlightWarning.bind(this);
    this.state = {
      isInEditMode: false,
      geojson: lineString,
      drawMode: 'LINESTRING',
      interSectionResult: null// gaforWarnings
    };
  }

  /**
   * When the flightroute is finished, we form a CQL (Geoserver query language) query and send an intersection request to the backend.
   */
  triggerIntersection () {
    if (this.state.isInEditMode === true) {
      /* Starting to edit */
      this.setState({ geojson: lineString, interSectionResult: null });
      return;
    }

    if (this.state.geojson.features[0].geometry.coordinates.length < 2) {
      console.log('No line drawn');
      return;
    }
    /* Split the line in smaller segments for projection from lat/lon to mercator artifacts */
    const linePointsFeatures = lineChunk(this.state.geojson.features[0], 50);
    /* Merge the features back into one */
    const linePoints = linePointsFeatures.features.map(lineSegment => { return lineSegment.geometry.coordinates[0]; });
    linePoints.push(linePointsFeatures.features[linePointsFeatures.features.length - 1].geometry.coordinates[1]);
    /* Set the new geojson */
    this.setState({
      geojson: produce(this.state.geojson, draft => {
        draft.features[0].geometry.coordinates = linePoints;
      })
    });
    /* Compose CQL query */
    let cqlLineString = 'LINESTRING(';
    for (let j = 0; j < linePoints.length; j++) {
      if (j > 0) cqlLineString += ',%20';
      cqlLineString += linePoints[j][1] + '+' + linePoints[j][0];
    }
    cqlLineString += ')';
    var cqlfilter = '&cql_filter=INTERSECTS(AREA_POLYGON_GEOGRAPHY%2C+' + cqlLineString + ')';
    const wfsQueryURL = dwdWFSGeoServerURL + typeName + cqlfilter;

    /* Do the fetch of the CQL query */
    fetch(wfsQueryURL, {
      method: 'GET',
      mode: 'cors'
    }).then(data => {
      return data.json();
    }).then(interSectedData => {
      console.log(interSectedData);
      const interSectedDataSimple = simplify(interSectedData, { tolerance: 0.01, highQuality: false });
      const gaforResult = produce(interSectedDataSimple, draft => {
        draft.features = draft.features.filter(feature =>
          feature.geometry.type === 'Polygon' &&
          feature.properties.FORECAST_INTERVAL_ID === 1
        );
        draft.features.forEach((feature) => {
          if (!feature.properties) feature.properties = {};
          feature.properties.stroke = '#88F';
          feature.properties['stroke-width'] = 3;
          feature.properties.fill = '#FFF';
          feature.properties['fill-opacity'] = 0.3;
        });
      });
      // console.log('Simpliefied: ', JSON.stringify(gaforResult, null, 2));
      this.setState({ interSectionResult: gaforResult });
    }).catch(e => {
      console.error(e);
    });
  }

  componentDidMount () {
    this.props.dispatch(setLayers({ layers: [dwdGaforLayer], mapPanelId: 'mapid_1' }));
  }

  hightlightWarning (_key) {
    let key = _key;
    if (key && key < 0) key = 0;
    if (this.currentKey === key) return;
    this.currentKey = key;
    this.setState({
      gaforAreaHover: key,
      interSectionResult: produce(this.state.interSectionResult, draft => {
        draft.features.forEach(feature => {
          feature.properties.fill = '#FFF';
          feature.properties['fill-opacity'] = 0.3;
        });
        if (key !== null) {
          draft.features[key].properties['fill-opacity'] = 0.6;
          draft.features[key].properties.fill = '#00F';
        }
      })
    });
  }

  renderGaforAreaForecast (p, key) {
    return (
      <div
        key={key}
        className={'GeoRouteWarningWarningInfoCard'}
        onMouseEnter={() => {
          this.hightlightWarning(key);
        }}
        onMouseLeave={() => {
          this.hightlightWarning(null);
        }}
      >
        <Card style={{ backgroundColor: this.state.gaforAreaHover === key ? '#DDF' : '#FFF' }}>
          <CardBody>
            <CardTitle><b>{'#' + (key + 1) + '): ' + p.AREA_ID + ' - ' + p.AREA_NAME + ' [' + p.ALTITUDE + ']'}</b></CardTitle>
            <Row><Col xs='3'><b>Code:</b></Col><Col xs='9'>{p.GAFOR_CODE_SHORT}</Col></Row>
            <Row><Col xs='3'><b>Weather:</b></Col><Col xs='9'>{p.GERMAN_TRANS} {p.GERMAN_TRANS_1} {p.GERMAN_TRANS_2}</Col></Row>
            <Row><Col xs='3'><b>Clouds:</b></Col><Col xs='9'>{p.CLOUDS_LOWER_LIMIT} Visibility: {p.VISIBILITY}</Col></Row>
          </CardBody>
        </Card>
      </div>
    );
  }

  render () {
    const numFeatures = (this.state.geojson && this.state.geojson.features) ? this.state.geojson.features.length : 0;
    const featureToEditList = [];
    for (let j = 0; j < numFeatures; j++) {
      featureToEditList.push({ key: j + '', value: j });
    }

    const startDate = this.state.interSectionResult && this.state.interSectionResult.features.length > 0 &&
                      this.state.interSectionResult.features[0].properties.START_VALID_DATE;
    const endDate = this.state.interSectionResult && this.state.interSectionResult.features.length > 0 &&
                      this.state.interSectionResult.features[0].properties.END_VALID_DATE;

    return (<div>
      <div className={'GeoRouteWarningContainer'}>
        <div className={'GeoRouteWarningMapContainer'}>
          <ReactWMJSMap id={generateMapId()} bbox={[173136.68613876565, 5766932.466223009, 2236959.1831579944, 7659674.940463012]} enableInlineGetFeatureInfo={false}
            webMapJSInitializedCallback={(webMapJS) => {
              webMapJS.hideMapPin();
            }}
          >
            <ReactWMJSLayer {...baseLayer} />
            {/* The redux layers */}
            { this.props.layers.map((layer, i) => { return <ReactWMJSLayer key={i} {...layer} />; }) }
            {/* <ReactWMJSLayer {...dwdFGGWSAirportsLayer} /> */}
            {/* The geojson layer */}
            <ReactWMJSLayer
              geojson={this.state.geojson}
              isInEditMode={this.state.isInEditMode}
              drawMode={this.state.drawMode}
              updateGeojson={(geojson) => {
                this.setState({
                  geojson:geojson,
                  geojsonText: JSON.stringify(geojson, null, 2)
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
              hoverFeatureCallback={(hoverInfo) => {
                if (hoverInfo.polygonIndex >= 0) {
                  this.hightlightWarning(hoverInfo.polygonIndex);
                }
              }}
            />
          </ReactWMJSMap>
        </div>
        { /* The layermanager */ }
        <div style={{ position:'absolute', left:'10px', top: '60px', zIndex: '10000' }}>
          <SimpleLayerManager
            store={window.store}
            mapId={'mapid_1'}
            layerNameMappings={[
              { layer: dwdGaforLayer, title: 'DWD GAFOR' }
            ]}
          />
        </div>
        { /* The button to start drawing a line */ }
        <div className={'GeoRouteWarningControlsContainer'}>
          <Button onClick={() => {
            this.setState({ isInEditMode: !this.state.isInEditMode }, () => {
              this.triggerIntersection();
            });
          }}>{this.state.isInEditMode ? 'Finish route (esc)' : 'Start drawing route'}</Button>
        </div>
        { /* The list with intersections */ }
        <div className={'GeoRouteWarningWarningInfoContainer'}>
          <div style={{ marginLeft: '10px' }}>
            <h4>GAFOR for flightroute</h4>
            <Row><Col xs={2}>from:</Col><Col xs={10}>{ startDate }</Col></Row>
            <Row><Col xs={2}>to:</Col><Col xs={10}>{ endDate }</Col></Row>
          </div>
          {
            this.state.interSectionResult && this.state.interSectionResult.features.map((feature, key) => {
              return this.renderGaforAreaForecast(feature.properties, key);
            })
          }
        </div>
      </div>
    </div>);
  }
};

GeoRouteWarningDemo.propTypes = {
  dispatch: PropTypes.func,
  layers: PropTypes.array
};
const mapStateToProps = state => {
  /* Return initial state if not yet set */
  const webMapJSState = state[WEBMAPJS_REDUCERNAME] ? state[WEBMAPJS_REDUCERNAME] : webMapJSReducer();
  return {
    layers: webMapJSState.webmapjs.mapPanel[webMapJSState.webmapjs.activeMapPanelIndex].layers
  };
};

export default connect(mapStateToProps)(GeoRouteWarningDemo);
