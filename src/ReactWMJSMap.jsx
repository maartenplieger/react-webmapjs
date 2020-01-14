/* eslint-disable react/no-unused-prop-types */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { debounce } from 'throttle-debounce';
import { WMJSMap, WMJSLayer, WMJSBBOX } from 'adaguc-webmapjs';
import tileRenderSettings from './tilesettings.json';
import ReactWMJSLayer from './ReactWMJSLayer.jsx';
import { layerSetStyles, layerChangeStyle, layerSetDimensions, mapChangeDimension, mapStopAnimation } from './ReactWMJSActions';
import { registerWMJSLayer, getWMJSLayerById, registerWMJSMap } from './ReactWMJSTools.jsx';
import { parseWMJSLayerAndDispatchActions } from './ReactWMJSParseLayer.jsx';
import { webMapJSReducer, WEBMAPJS_REDUCERNAME } from './ReactWMJSReducer';
import AdagucMapDraw from './AdagucMapDraw';
import './main.css';
import { Button } from 'reactstrap';
import { Icon } from 'react-fa';
import produce from 'immer';
import cloneDeep from 'lodash.clonedeep';

let Proj4js = window.proj4;
// Cache for for storing and reusing Proj4 instances
var projectorCache = {};

// Ensure that you have a Proj4 object, pulling from the cache if necessary
var getProj4 = (projection) => {
  if (projection instanceof Proj4js.Proj) {
    return projection;
  } else if (projection in projectorCache) {
    return projectorCache[projection];
  } else {
    projectorCache[projection] = new Proj4js.Proj(projection);
    return projectorCache[projection];
  }
};


const simplifyGeoJSON = (layer, webMapJS) => {
  if (!layer.simplifyResolutionInDegrees) {
    return layer;
  } else {
    const projectionBBox = webMapJS.getBBOX();
    const proj = webMapJS.getProj4();
    var to = getProj4(proj.lonlat);
    var from = getProj4(proj.crs);
    let lowerLeft = { x: projectionBBox.left, y: projectionBBox.bottom };
    lowerLeft = proj.proj4.transform(from, to, lowerLeft);
    let upperRight = { x: projectionBBox.right, y: projectionBBox.top };
    upperRight = proj.proj4.transform(from, to, upperRight);

    const gridRes = 15;
    const latLonBBOX = [lowerLeft.x, lowerLeft.y, upperRight.x, upperRight.y];
    if (latLonBBOX[0] > latLonBBOX[2]) { latLonBBOX[0] -= 360; latLonBBOX[2] += 360; }
    const bboxW = latLonBBOX[2] - latLonBBOX[0];
    const bboxH = latLonBBOX[3] - latLonBBOX[1];
    const grid = []; let b;
    while (grid.push(b = []) < (gridRes + 1)) while (b.push(0) < (gridRes + 1));
    if (!layer.geojson) {
      console.error('Geojson not defined in layer ', layer);
      return layer;
    }
    return produce(layer, draft => {
      draft.test = true;
      if (!draft.cachedGeojson) {
        draft.cachedGeojson = cloneDeep(layer.geojson);
      }
      draft.cachedGeojson.features.length = 0;
      layer.geojson.features.forEach(feature => {
        const coordX = feature.geometry.coordinates[0];
        const coordY = feature.geometry.coordinates[1];
        if (coordX > latLonBBOX[0] && coordX < latLonBBOX[2] && coordY > latLonBBOX[1] && coordY < latLonBBOX[3]) {
          let keyX = Math.round(((coordX - latLonBBOX[0]) / bboxW) * gridRes); // if (keyX < 0) keyX = 0; if (keyX > gridRes) keyX = gridRes;
          let keyY = Math.round(((coordY - latLonBBOX[1]) / bboxH) * gridRes); // if (keyY < 0) keyY = 0; if (keyY > gridRes) keyY = gridRes;
          if (grid[keyX][keyY] < 20) {
            grid[keyX][keyY]++;
            draft.cachedGeojson.features.push(feature);
          }
        }
      });
    });
  }
};

const simplifyFeatureLayers = (webMapJS, layers) => {
  return produce(layers, draft => {
    for (let j = 0; j < layers.length; j++) {
      draft[j] = simplifyGeoJSON(layers[j], webMapJS);
    }
  });
};

let xml2jsonrequestURL = 'http://localhost:10000/XML2JSON?';

export default class ReactWMJSMap extends Component {
  constructor (props) {
    super(props);
    this.adaguc = {
      webMapJSCreated:false,
      initialized: false,
      baseLayers:[]
    };
    this.state = {
      featureLayers:[]
    };
    this.resize = this.resize.bind(this);
    this._handleWindowResize = this._handleWindowResize.bind(this);
    this.drawDebounced = debounce(600, this.drawDebounced);
    this.checkNewProps = this.checkNewProps.bind(this);
    this.checkAdaguc = this.checkAdaguc.bind(this);
    this.drawFeatures = this.drawFeatures.bind(this);
    this.timer = this.timer.bind(this);
    this.currentWMJSProps = {};
    if (window.reducerManager) {
      window.reducerManager.add(WEBMAPJS_REDUCERNAME, webMapJSReducer);
    } else {
      console.error('No reducermanager to register the webMapJSReducer to.');
    }
  }
  _handleWindowResize () {
    this.resize();
  }

  drawDebounced () {
    this.adaguc.webMapJS.suspendEvent('onmaploadingcomplete'); // TODO: Should suspend maybe all events
    this.adaguc.webMapJS.draw();
    this.adaguc.webMapJS.resumeEvent('onmaploadingcomplete');
  };

  getWMJSLayerFromReactLayer (wmjsLayers, reactWebMapJSLayer, index) {
    let foundLayer = null;
    if (reactWebMapJSLayer.props.name && reactWebMapJSLayer.props.id) {
      if (index >= 0 && index < wmjsLayers.length) {
        for (let layerIndex = 0; layerIndex < wmjsLayers.length; layerIndex++) {
          let secondIndex = ((wmjsLayers.length - 1) - index);
          let layer = wmjsLayers[layerIndex];
          if (layer === getWMJSLayerById(reactWebMapJSLayer.props.id)) {
            foundLayer = layer;
            if (!reactWebMapJSLayer.props.baseLayer && layerIndex !== secondIndex) {
              console.log('UPDATE_LAYER: swapping layer indices ', layerIndex, secondIndex);
              this.adaguc.webMapJS.swapLayers(wmjsLayers[layerIndex], wmjsLayers[secondIndex]);
              this.adaguc.webMapJS.draw();
              return { layer: foundLayer, layerArrayMutated: true };
            }
          }
        }
      }
    }
    return { layer: foundLayer, layerArrayMutated: false };
  }

  checkAdaguc () {
    if (this.adaguc.webMapJSCreated) {
      return;
    }
    const dispatch = this.props.dispatch ? this.props.dispatch : () => { };
    this.adaguc.webMapJSCreated = true;
    // eslint-disable-next-line no-undef
    this.adaguc.webMapJS = new WMJSMap(this.refs.adagucwebmapjs);
    registerWMJSMap(this.adaguc.webMapJS, this.props.id);
    this.adaguc.webMapJS.removeAllLayers();
    this.adaguc.webMapJS.setBaseURL('./adagucwebmapjs/');
    this.adaguc.webMapJS.setXML2JSONURL(xml2jsonrequestURL);
    this.adaguc.webMapJS.setProjection({ srs:this.props.srs || 'EPSG:3857', bbox:this.props.bbox || [-19000000, -19000000, 19000000, 19000000] });
    this.adaguc.webMapJS.setWMJSTileRendererTileSettings(tileRenderSettings);

    if (this.props.listeners) {
      this.props.listeners.forEach((listener) => {
        this.adaguc.webMapJS.addListener(listener.name, (data) => { listener.callbackfunction(this.adaguc.webMapJS, data); }, listener.keep);
      });
    }

    this.adaguc.webMapJS.addListener('ondimchange', () => {
      // console.log('ondimchange' + this.adaguc.webMapJS.getDimension('time').currentValue);
      if (this.adaguc && this.adaguc.webMapJS) {
        const timeDimension = this.adaguc.webMapJS.getDimension('time');
        if (timeDimension) {
          dispatch(mapChangeDimension({
            mapPanelId: this.props.id,
            dimension: {
              name: 'time',
              currentValue: timeDimension.currentValue
            }
          }));
        }
      }
    }, true);

    this.adaguc.webMapJS.addListener('onupdatebbox', (bbox) => {
      const oldbbox = this.adaguc.oldbbox || {};
      if (oldbbox.left !== bbox.left ||
          oldbbox.right !== bbox.right ||
          oldbbox.top !== bbox.top ||
          oldbbox.bottom !== bbox.bottom) {
        oldbbox.left = bbox.left;
        oldbbox.right = bbox.right;
        oldbbox.top = bbox.top;
        oldbbox.bottom = bbox.bottom;
        this.adaguc.oldbbox = oldbbox;
        this.featureLayerUpdateTimer = 6;
      }
    }, true);

    this.resize();
    // this.componentDidUpdate();
    this.adaguc.webMapJS.draw();

    // TODO: Now the map resizes when the right panel opens, (called via promise at EProfileTest.jsx) that is nice. But this reference is Ugly! How do we see a resize if no event is triggered?
    this.adaguc.webMapJS.handleWindowResize = this._handleWindowResize;
  }

  checkNewProps (prevProps, props) {
    if (!props) { return; }
    /* Check map props */
    if (!prevProps || prevProps.showLegend !== props.showLegend) {
      this.adaguc.webMapJS.displayLegendInMap(props.showLegend !== false);
    }
    if (!prevProps || prevProps.showScaleBar !== props.showScaleBar) {
      this.adaguc.webMapJS.displayScaleBarInMap(props.showScaleBar !== false);
    }

    if (!prevProps || prevProps.enableInlineGetFeatureInfo !== props.enableInlineGetFeatureInfo) {
      this.adaguc.webMapJS.enableInlineGetFeatureInfo(props.enableInlineGetFeatureInfo !== false);
    }
    /* Check children */
    if (props.children) {
      const { children } = props;
      const dispatch = props.dispatch ? props.dispatch : () => { };
      if (children !== this.currentWMJSProps.children) {
        let wmjsLayers = this.adaguc.webMapJS.getLayers();
        let wmjsBaseLayers = this.adaguc.webMapJS.getBaseLayers();
        let adagucWMJSLayerIndex = 0;
        let adagucWMJSBaseLayerIndex = 0;
        let needsRedraw = false;
        let myChilds = [];

        React.Children.forEach(children, (child, i) => {
          if (child.props && child.props.id) {
            myChilds.push(child);
          } else {
            console.error('ReactWMJSLayer ignored', child);
          }
        });
        myChilds.reverse();

        /* Detect all ReactLayers connected to WMJSLayers, remove WMJSLayer if there is no ReactLayer */
        for (let l = 0; l < wmjsLayers.length; l++) {
          if (myChilds.filter(c => c && c.props && c.props.id === wmjsLayers[l].ReactWMJSLayerId).length === 0) {
            /* This will call the remove property of the WMJSLayer, which will adjust the layers array of WebMapJS */
            wmjsLayers[l].remove();
            this.checkNewProps(prevProps, props);
            return;
          }
        }
        /* For the baseLayers, detect all ReactLayers connected to WMJSLayers, remove WMJSLayer if there is no ReactLayer */
        for (let l = 0; l < wmjsBaseLayers.length; l++) {
          if (myChilds.filter(c => c && c.props ? c.props.id === wmjsBaseLayers[l].ReactWMJSLayerId : false).length === 0) {
            /* TODO: The remove property for the baselayer is not working yet */
            wmjsBaseLayers.splice(l, 1);
            this.adaguc.webMapJS.setBaseLayers(wmjsBaseLayers);
            wmjsBaseLayers = this.adaguc.webMapJS.getBaseLayers();
            this.checkNewProps(prevProps, props);
            return;
          }
        }
        const featureLayers = (myChilds.filter(c => c && c.props && c.props.geojson).map(c => c.props)).reverse();

        if (!this.prevFeatureLayers) this.prevFeatureLayers = {};

        const featureLayersWithCache = produce(featureLayers, draft => {
          featureLayers.forEach((_, index) => {
            const draftFeatureLayer = draft[index];
            const orgFeatureLayer = featureLayers[index];
            if (this.prevFeatureLayers[orgFeatureLayer.id] && this.prevFeatureLayers[orgFeatureLayer.id].geojson && orgFeatureLayer.geojson &&
              this.prevFeatureLayers[orgFeatureLayer.id].geojson.features === orgFeatureLayer.geojson.features) {
              // console.log('[OK] already doen', orgFeatureLayer.id);
              draftFeatureLayer.cachedGeojson = this.prevFeatureLayers[orgFeatureLayer.id].cachedGeojson;
            } else {
              this.prevFeatureLayers[orgFeatureLayer.id] = {};
              this.prevFeatureLayers[orgFeatureLayer.id].geojson = orgFeatureLayer.geojson;
              this.prevFeatureLayers[orgFeatureLayer.id].cachedGeojson = orgFeatureLayer.geojson;
              // console.log('[NEW] Need to make a new one', orgFeatureLayer.id);
              const cachedGeojson = simplifyGeoJSON(orgFeatureLayer, this.adaguc.webMapJS).cachedGeojson;
              draftFeatureLayer.cachedGeojson = cachedGeojson;
              this.prevFeatureLayers[orgFeatureLayer.id].cachedGeojson = cachedGeojson;
            }
          });
        });
        this.setState({ featureLayers: featureLayersWithCache });

        /* Loop through all layers and update WMJSLayer properties where needed */
        for (let c = 0; c < myChilds.length; c++) {
          let child = myChilds[c];
          if (!child) {
            continue;
          }
          if (!child.type) {
            continue;
          }
          if (child.type) {
            /* Check layers */
            if (typeof child.type === typeof ReactWMJSLayer) {
              if (child.props.geojson) {
                /* Feature layer, these are handled collectively by the setState commando above. */
                continue;
              }
              if (child.props.baseLayer) {
                /* Base layer */
                wmjsBaseLayers = this.adaguc.webMapJS.getBaseLayers();
                let obj = this.getWMJSLayerFromReactLayer(wmjsBaseLayers, child, adagucWMJSBaseLayerIndex);
                if (obj.layerArrayMutated) {
                  this.checkNewProps(prevProps, props);
                  return;
                }
                let wmjsLayer = obj.layer;
                adagucWMJSBaseLayerIndex++;
                if (wmjsLayer === null) {
                  wmjsLayer = new WMJSLayer({ ...child.props });
                  wmjsLayer.ReactWMJSLayerId = child.props.id;
                  registerWMJSLayer(wmjsLayer, child.props.id);
                  this.adaguc.baseLayers.push(wmjsLayer);
                  wmjsLayer.reactWebMapJSLayer = child;
                  this.adaguc.webMapJS.setBaseLayers(this.adaguc.baseLayers.reverse());
                  wmjsBaseLayers = this.adaguc.webMapJS.getBaseLayers();
                  needsRedraw = true;
                  // console.log('ok', this.adaguc.baseLayers);
                } else {
                  // console.log('wmjsLayer is not null', this.adaguc.baseLayers);
                }
              } else if (child.props.service) {
                /* Standard layer */
                wmjsLayers = this.adaguc.webMapJS.getLayers();
                let obj = this.getWMJSLayerFromReactLayer(wmjsLayers, child, adagucWMJSLayerIndex);
                if (obj.layerArrayMutated) {
                  this.checkNewProps(prevProps, props);
                  return;
                }
                let wmjsLayer = obj.layer;
                adagucWMJSLayerIndex++;
                if (wmjsLayer === null) {
                  wmjsLayer = new WMJSLayer({ ...child.props });
                  registerWMJSLayer(wmjsLayer, child.props.id);
                  wmjsLayer.ReactWMJSLayerId = child.props.id;
                  this.adaguc.webMapJS.addLayer(wmjsLayer);
                  wmjsLayer.reactWebMapJSLayer = child;
                  parseWMJSLayerAndDispatchActions(wmjsLayer, dispatch, this.props.id, xml2jsonrequestURL).then(() => {
                    if (child.props.onLayerReady) {
                      child.props.onLayerReady(wmjsLayer, this.adaguc.webMapJS);
                    }
                  });
                  needsRedraw = true;
                } else {
                  /* Set the name of the ADAGUC WMJSLayer */
                  if (child.props.name !== undefined && wmjsLayer.name !== child.props.name) {
                    console.log('UPDATE_LAYER: setting name to [' + child.props.name + ']');
                    wmjsLayer.setName(child.props.name); needsRedraw = true;
                    dispatch(layerSetStyles({ service: wmjsLayer.service, name:wmjsLayer.name, styles:wmjsLayer.getStyles() }));
                    dispatch(layerSetDimensions({ service: wmjsLayer.service, name:wmjsLayer.name, dimensions:wmjsLayer.dimensions, id: wmjsLayer.ReactWMJSLayerId }));
                    dispatch(layerChangeStyle({
                      mapPanelId: this.props.id,
                      service: wmjsLayer.service,
                      layerId:wmjsLayer.ReactWMJSLayerId,
                      style:wmjsLayer.getStyles().length === 0 ? 'default' : wmjsLayer.getStyles()[0].Name.value }));
                  }

                  /* Set the Opacity of the ADAGUC WMJSLayer */
                  if (child.props.opacity !== undefined && parseFloat(wmjsLayer.opacity) !== parseFloat(child.props.opacity)) {
                    // console.log('UPDATE_LAYER: setting opacity to [' + child.props.opacity + '] - ' + wmjsLayer.opacity);
                    wmjsLayer.setOpacity(child.props.opacity);
                    needsRedraw = false;
                  }

                  /* Set the haders of the ADAGUC WMJSLayer */
                  if (child.props.headers !== undefined && wmjsLayer.headers !== child.props.headers) {
                    console.log('UPDATE_LAYER: setting headers to [', child.props.headers);
                    wmjsLayer.headers = child.props.headers;
                    parseWMJSLayerAndDispatchActions(wmjsLayer, dispatch, this.props.id, xml2jsonrequestURL, true).then(() => {
                      if (child.props.onLayerReady) {
                        child.props.onLayerReady(wmjsLayer, this.adaguc.webMapJS);
                      }
                      this.adaguc.webMapJS.draw();
                    });
                    this.adaguc.webMapJS.draw();
                    needsRedraw = true;
                  }

                  /* Set the Style of the ADAGUC WMJSLayer */
                  if (child.props.style !== undefined && wmjsLayer.currentStyle !== child.props.style) {
                    console.log('UPDATE_LAYER: setting style to [' + child.props.style + '] was ' + wmjsLayer.currentStyle);
                    wmjsLayer.setStyle(child.props.style);
                    needsRedraw = true;
                  }

                  /* Set the Enabled prop of the ADAGUC WMJSLayer */
                  if (child.props.enabled !== undefined && wmjsLayer.enabled !== child.props.enabled) {
                    console.log('UPDATE_LAYER: setting enabled to [' + child.props.enabled + ']');
                    wmjsLayer.display(child.props.enabled);
                    needsRedraw = true;
                  }

                  /* Set the dimensions of the ADAGUC WMJSLayer */
                  if (child.props.dimensions !== undefined) {
                    for (let d = 0; d < child.props.dimensions.length; d++) {
                      const dim = child.props.dimensions[d];
                      const wmjsDim = wmjsLayer.getDimension(dim.name);
                      if (wmjsDim && wmjsDim.currentValue !== dim.currentValue) {
                        console.log('UPDATE_LAYER: setting dimension to [' + dim.name + '=' + dim.currentValue + ']');
                        wmjsDim.setValue(dim.currentValue);
                        needsRedraw = true;
                      }
                    }
                  }

                  if (child.props.isProfileLayer) {
                    const currentBbox = this.adaguc.webMapJS.getBBOX();
                    const newBbox = new WMJSBBOX(props.bbox);
                    if (currentBbox !== newBbox) {
                      this.adaguc.webMapJS.suspendEvent('onupdatebbox');
                      this.adaguc.webMapJS.setBBOX(props.bbox);
                      needsRedraw = true;
                      this.adaguc.webMapJS.resumeEvent('onupdatebbox');
                    }
                  }
                }
              }
            }
          }
        };
        if (needsRedraw) {
          this.adaguc.webMapJS.draw();
        }
        /* Childs have been processed */
        this.currentWMJSProps.children = children;
      }
    }
  }

  componentWillReceiveProps (nextProps) {
    // console.log('shouldComponentUpdate', this.props);
    this.checkNewProps(this.props, nextProps);
  }

  componentDidMount () {
    this.checkAdaguc();
    this.checkNewProps(null, this.props);
    window.addEventListener('resize', this._handleWindowResize);
    if (this.adaguc.initialized === false && this.props.webMapJSInitializedCallback && this.adaguc.webMapJS) {
      this.adaguc.initialized = true;
      this.props.webMapJSInitializedCallback(this.adaguc.webMapJS, true);
    }
    this.mapTimer = setInterval(this.timer, 100);
  }

  timer () {
    if (this.featureLayerUpdateTimer > 0) this.featureLayerUpdateTimer--;
    if (this.featureLayerUpdateTimer === 1) {
      console.log('refr');
      const newFeatureLayers = simplifyFeatureLayers(this.adaguc.webMapJS, this.state.featureLayers);
      for (let j = 0; j< newFeatureLayers.length; j++) {
        if (this.prevFeatureLayers[newFeatureLayers[j].id]) {
          this.prevFeatureLayers[newFeatureLayers[j].id].cachedGeojson = newFeatureLayers[j].cachedGeojson;
        }
      }
      this.setState({ featureLayers: newFeatureLayers });
    }
  }

  componentWillUnmount () {
    clearInterval(this.mapTimer);
    // console.log('componentWillUnmount');
    window.removeEventListener('resize', this._handleWindowResize);
    if (this.props.webMapJSInitializedCallback && this.props.layers && this.props.layers.length > 0) {
      this.props.webMapJSInitializedCallback(this.adaguc.webMapJS, false);
    }
    const dispatch = this.props.dispatch ? this.props.dispatch : () => { };
    dispatch(mapStopAnimation({ mapPanelId: this.props.id }));
    this.adaguc.webMapJS.destroy();
  }
  resize () {
    const element = this.refs.adaguccontainer;
    if (element) {
      const newWidth = element.clientWidth;
      const newHeight = element.clientHeight;
      if (this.currentWidth !== newWidth || this.currentHeight !== newHeight) {
        this.currentWidth = newWidth;
        this.currentHeight = newHeight;
        this.adaguc.webMapJS.setSize(newWidth, newHeight);
      }
    }
  }
  drawFeatures (featureLayers) {
    if (!featureLayers) {
      return null;
    }

    return featureLayers.map((layer, index) => {
      return (
        <div key={index} style={{ display: 'none' }}>
          <AdagucMapDraw
            geojson={layer.cachedGeojson || layer.geojson}
            isInEditMode={layer.isInEditMode}
            isInDeleteMode={layer.isInDeleteMode}
            drawMode={layer.drawMode}
            webmapjs={this.adaguc.webMapJS}
            hoverFeatureCallback={(hoverInfo) => {
              if (layer.hoverFeatureCallback) {
                layer.hoverFeatureCallback(hoverInfo);
              }
            }}
            updateGeojson={(geojson) => {
              if (layer.updateGeojson) layer.updateGeojson(geojson);
            }}
            exitDrawModeCallback={() => {
              if (layer.exitDrawModeCallback) layer.exitDrawModeCallback();
            }}
            featureNrToEdit={parseInt(layer.featureNrToEdit || 0)}
          />
        </div>);
    });
  }

  render () {
    const controls = this.props.controls || {
      buttonZoomOut: true,
      buttonZoomHome: true,
      buttonZoomIn: true
    };
    return (<div className={'ReactWMJSMap'}
      style={{ height:'100%', width:'100%', border:'none', display:'block', overflow:'hidden' }} >
      <div ref='adaguccontainer' style={{
        minWidth: 'inherit',
        minHeight: 'inherit',
        width: 'inherit',
        height: 'inherit',
        overflow: 'hidden',
        display:'block',
        border: 'none'
      }}>
        <div className={'ReactWMJSMapComponent'}>
          <div ref='adagucwebmapjs' />
        </div>
        {/* <div className={'ReactWMJSMapTimeValue'} style={{ color: 'black' }}>
          { this.adaguc.webMapJS && this.adaguc.webMapJS.getDimension('time') &&
          moment.utc(this.adaguc.webMapJS.getDimension('time').currentValue).format('YYYY-MM-DD HH:mm:SS') + ' UTC'
          }
        </div> */}
        {/* ReactWMJSZoomPanel */}
        <div className={'ReactWMJSZoomPanel'} style={{ color: 'black' }}>
          { controls.buttonZoomOut && <Button onClick={() => {
            this.adaguc.webMapJS && this.adaguc.webMapJS.zoomOut();
          }}><Icon name='minus' /></Button> }
          { controls.buttonZoomHome && <Button onClick={() => {
            this.adaguc.webMapJS && this.adaguc.webMapJS.zoomToLayer(this.adaguc.webMapJS.getActiveLayer());
          }}><Icon name='home' /></Button> }
          { controls.buttonZoomIn && <Button onClick={() => {
            this.adaguc.webMapJS && this.adaguc.webMapJS.zoomIn();
          }}><Icon name='plus' /></Button> }

        </div>
        <div className='ReactWMJSLayerProps'>
          <div>{this.props.children}</div>
          <div>{this.drawFeatures(this.state.featureLayers)}</div>
        </div>
        { this.props.passiveMap && <div className='ReactWMJSLayerProps' onClick={this.props.onClick} style={{ width: '100%', height: '100%' }} /> }
      </div>
    </div>);
  }
};

ReactWMJSMap.propTypes = {
  layers: PropTypes.array,
  listeners: PropTypes.array,
  bbox: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  webMapJSInitializedCallback: PropTypes.func,
  srs: PropTypes.string,
  children: PropTypes.array,
  id: PropTypes.string.isRequired,
  dispatch: PropTypes.func,
  controls: PropTypes.object,
  showScaleBar: PropTypes.bool,
  showLegend: PropTypes.bool,
  passiveMap: PropTypes.bool,
  onClick: PropTypes.func
};
