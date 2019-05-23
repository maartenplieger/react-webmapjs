import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { debounce } from 'throttle-debounce';
import { WMJSMap, WMJSLayer, WMJSBBOX } from 'adaguc-webmapjs';
import tileRenderSettings from './tilesettings.json';
import ReactWMJSLayer from './ReactWMJSLayer.jsx';
import { layerSetStyles, layerChangeStyle, layerSetDimensions } from './ReactWMJSActions';
import { registerWMJSLayer, getWMJSLayerById, registerWMJSMap } from './ReactWMJSTools.jsx';
import { parseWMJSLayerAndDispatchActions } from './ReactWMJSParseLayer.jsx';
import { webMapJSReducer, WEBMAPJS_REDUCERNAME } from './ReactWMJSReducer';
import AdagucMapDraw from './AdagucMapDraw';
let xml2jsonrequestURL = 'http://localhost:10000/XML2JSON?';
import './main.css';

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
    this.currentWMJSProps = {};
    if (window.reducerManager) {
      window.reducerManager.add(WEBMAPJS_REDUCERNAME, webMapJSReducer)
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
    this.adaguc.webMapJSCreated = true;
    // eslint-disable-next-line no-undef
    this.adaguc.webMapJS = new WMJSMap(this.refs.adagucwebmapjs);
    registerWMJSMap(this.adaguc.webMapJS, this.props.id);
    console.log('new WMJSMAP instance with id [' + this.adaguc.webMapJS.getId() + ']');
    this.adaguc.webMapJS.setBaseURL('./adagucwebmapjs/');
    this.adaguc.webMapJS.setXML2JSONURL(xml2jsonrequestURL);
    this.adaguc.webMapJS.setProjection({ srs:this.props.srs || 'EPSG:3857', bbox:this.props.bbox || [-19000000, -19000000, 19000000, 19000000] });
    this.adaguc.webMapJS.setWMJSTileRendererTileSettings(tileRenderSettings);

    if (this.props.listeners) {
      this.props.listeners.forEach((listener) => {
        this.adaguc.webMapJS.addListener(listener.name, (data) => { listener.callbackfunction(this.adaguc.webMapJS, data); }, listener.keep);
      });
    }

    this.resize();
    // this.componentDidUpdate();
    this.adaguc.webMapJS.draw();

    // TODO: Now the map resizes when the right panel opens, (called via promise at EProfileTest.jsx) that is nice. But this reference is Ugly! How do we see a resize if no event is triggered?
    this.adaguc.webMapJS.handleWindowResize = this._handleWindowResize;

  
  }

  checkNewProps (props) {
    if (!props) { return; }
    /* Check children */
    if (props.children) {
      const { children } = props;
      const dispatch = props.dispatch ? props.dispatch : () => {}
      if (children !== this.currentWMJSProps.children) {
        let wmjsLayers = this.adaguc.webMapJS.getLayers();
        let wmjsBaseLayers = this.adaguc.webMapJS.getBaseLayers();
        let adagucWMJSLayerIndex = 0;
        let adagucWMJSBaseLayerIndex = 0;
        let needsRedraw = false;
        let myChilds = [];

        React.Children.forEach(children, (child, i) => myChilds.push(child));
        myChilds.reverse();

        /* Detect all ReactLayers connected to WMJSLayers, remove WMJSLayer if there is no ReactLayer */
        for (let l = 0; l < wmjsLayers.length; l++) {
          if (myChilds.filter(c => c.props.id === wmjsLayers[l].ReactWMJSLayerId).length === 0) {
            wmjsLayers[l].remove();
            this.checkNewProps(props);
            return;
          }
        }

        this.setState({ featureLayers: myChilds.filter(c => c.props.geojson).map(c => c.props) });

        /* Loop through all layers and update WMJSLayer properties where needed */
        for (let c = 0; c < myChilds.length; c++) {
          let child = myChilds[c];
          if (child.type) {
            /* Check layers */
            if (typeof child.type === typeof ReactWMJSLayer) {
              if (child.props.geojson) {
                /* Feature layer, these are handled collectively by the setState commando above. */
              }
              if (child.props.baseLayer) {
                /* Base layer */
                let obj = this.getWMJSLayerFromReactLayer(wmjsBaseLayers, child, adagucWMJSBaseLayerIndex);
                if (obj.layerArrayMutated) {
                  this.checkNewProps(props);
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
                  needsRedraw = true;
                }
              } else if (child.props.service) {
                /* Standard layer */
                let obj = this.getWMJSLayerFromReactLayer(wmjsLayers, child, adagucWMJSLayerIndex);
                if (obj.layerArrayMutated) {
                  this.checkNewProps(props);
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
                    console.log('UPDATE_LAYER: setting opacity to [' + child.props.opacity + '] - ' + wmjsLayer.opacity);
                    wmjsLayer.setOpacity(child.props.opacity);
                    needsRedraw = false;
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
                    if (currentBbox != newBbox) {
                      this.adaguc.webMapJS.suspendEvent('onupdatebbox');
                      this.adaguc.webMapJS.setBBOX(props.bbox);
                      needsRedraw=true;
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
    this.checkNewProps(nextProps);
  }

  componentDidMount () {
    this.checkAdaguc();
    this.checkNewProps(this.props);
    window.addEventListener('resize', this._handleWindowResize);
    if (this.adaguc.initialized === false && this.props.webMapJSInitializedCallback && this.adaguc.webMapJS) {
      this.adaguc.initialized = true;
      this.props.webMapJSInitializedCallback(this.adaguc.webMapJS, true);
    }
  }

  componentWillUnmount () {
    // console.log('componentWillUnmount');
    window.removeEventListener('resize', this._handleWindowResize);
    if (this.props.webMapJSInitializedCallback && this.props.layers && this.props.layers.length > 0) {
      this.props.webMapJSInitializedCallback(this.adaguc.webMapJS, false);
    }
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
            geojson={layer.geojson}
            isInEditMode={layer.isInEditMode}
            isInDeleteMode={layer.isInDeleteMode}
            drawMode={layer.drawMode}
            webmapjs={this.adaguc.webMapJS}
          />
        </div>);
    });
  }

  render () {
    return (<div className='ReactWMJSMap'
      style={{ height:'100%', width:'100%', border:'none', display:'block', overflow:'hidden' }} >
      <div ref='adaguccontainer' style={{
        minWidth:'inherit',
        minHeight:'inherit',
        width: 'inherit',
        height: 'inherit',
        overflow: 'hidden',
        display:'block',
        border: 'none'
      }}>
        <div className={'ReactWMJSMapComponent'} >
          <div ref='adagucwebmapjs' />
        </div>
        <div className='ReactWMJSLayerProps'>
          <div>{this.props.children}</div>
          <div>{this.drawFeatures(this.state.featureLayers)}</div>
        </div>
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
  id: PropTypes.string.isRequired
};
