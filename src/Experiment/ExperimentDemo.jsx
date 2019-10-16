import React, { Component } from 'react';
import { connect } from 'react-redux';
import produce from 'immer';
import { WEBMAPJS_REDUCERNAME, webMapJSReducer } from '@adaguc/react-webmapjs';
import CanvasComponent from './CanvasComponent';
import WMJSImageStore from './WMJSImageStore';
import moment from 'moment';

var globalImageStore = new WMJSImageStore(200);

/* Constants */
const REDUXREACTCOUNTERDEMO_INIT = 'COUNTERDEMO_INIT';
const REDUXREACTCOUNTERDEMO_ADD = 'COUNTERDEMO_ADD';
const REDUXREACTCOUNTERDEMO_REDUCERNAME = 'COUNTERDEMO';

/* Action creators */
// eslint-disable-next-line no-unused-vars
const initAction = obj => ({ type: REDUXREACTCOUNTERDEMO_INIT, payload: obj });

/* Define the initial state */
const initialState = {
  value : 123
};

/* Reducer which adds its data into the store; the location inside the store is specified by the reducer name and the id from the action */
const reduxReactCounterDemoReducer = (state = initialState, action = { type:null }) => {
  switch (action.type) {
    case REDUXREACTCOUNTERDEMO_INIT:
      return produce(state, draft => { draft.value = action.payload; });
    case REDUXREACTCOUNTERDEMO_ADD:
      return produce(state, draft => { draft.value += action.payload; });
    default:
      return state;
  }
};

const momentRound = (date, duration, method) => {
  return moment(Math[method]((+date) / (+duration)) * (+duration));
};

class ExperimentDemo extends Component {
  constructor (props) {
    console.log('constructor');
    super(props);
    this.renderLoop = this.renderLoop.bind(this);
    this.canvasNeedsToBeRendered = this.canvasNeedsToBeRendered.bind(this);
    this.canvasSettings = {
      width: null,
      height: null,
      ctx: null
    };
    this.game = {
      initialized: false,
      keysPressed: {},
      keysDown:{},
      levelOffsetX:0,
      levelOffsetY: 0,
      bboxa: [-2500000, 4000000, 3500000, 10000000],
      bbox: [212396.55455637982, 6414887.148195576, 1287696.7311640007, 7391691.010467171]
    };
    /* Register this new reduxReactCounterDemoReducer reducer with the reducerManager */
    window.reducerManager.add(REDUXREACTCOUNTERDEMO_REDUCERNAME, reduxReactCounterDemoReducer);
  }
  componentWillUnmount () {
    this.enableRenderLoop = false;
  }
  componentDidMount () {
    this.imageStore = globalImageStore;
    this.layerBBOX = [-372313.33428993146, 6238567.56175899, 1647876.5299392117, 7560535.12268313];
    const url = 'https://geoservices.knmi.nl/cgi-bin/RADNL_OPER_R___25PCPRR_L3.cgi?SERVICE=WMS&&SERVICE=WMS&' +
      'VERSION=1.3.0&REQUEST=GetMap&LAYERS=RADNL_OPER_R___25PCPRR_L3_COLOR&WIDTH=1085&HEIGHT=710&CRS=EPSG%3A3857&BBOX=' +
      this.layerBBOX.join() + '&STYLES=rainbow%2Fnearest&FORMAT=image/png&TRANSPARENT=TRUE';
    this.image = [];
    const startValue = momentRound(moment('2019-10-15T14:50:00.000Z').utc(), moment.duration(5, 'minutes'), 'ceil');
    console.log('startValue', startValue.toISOString());
    const endValue = moment(moment(startValue).add(6, 'h'));
    console.log('endValue', endValue.toISOString());
    let timeValue = moment(startValue);
    while (timeValue < endValue) {
      const imageURL = url + '&TIME=' + timeValue.toISOString();
      console.log(timeValue.toISOString());
      const image = this.imageStore.getImage(imageURL);
      this.image.push(image);
      image.load();
      timeValue = timeValue.add(5, 'm');
    }
    console.log(this.image.length);
    this.timer = 0;
    // this.imageStore.addLoadEventCallback(() => { console.log('Image loaded :)'); this.forceUpdate(); });
    this.enableRenderLoop = true;
    this.renderLoop();
    document.onkeydown = (e) => {
      this.game.keysPressed[e.keyCode] = true;
      if (this.game.keysDown[e.keyCode] === undefined || this.game.keysDown[e.keyCode] === null) {
        this.game.keysDown[e.keyCode] = true;
      }
    };
    document.onkeyup = (e) => {
      this.game.keysPressed[e.keyCode] = false;
      this.game.keysDown[e.keyCode] = null;
    };

    document.onwheel = (e) => {
      if (e.deltaY < 0) {
        let a = (this.game.bbox[2] - this.game.bbox[0]) / 16;
        this.game.bbox = [this.game.bbox[0] - a, this.game.bbox[1] - a, this.game.bbox[2] + a, this.game.bbox[3] + a];
      }
      if (e.deltaY > 0) {
        let a = -(this.game.bbox[2] - this.game.bbox[0]) / 18;
        this.game.bbox = [this.game.bbox[0] - a, this.game.bbox[1] - a, this.game.bbox[2] + a, this.game.bbox[3] + a];
      }
      console.log(this.game.bbox);
    };
  }
  canvasNeedsToBeRendered (ctx, width, height, canvas) {
    this.canvasSettings = {
      ctx: ctx,
      canvas: canvas,
      width: width,
      height: height
    };
  }
  renderCanvas () {
    const { ctx, width, height } = this.canvasSettings;
    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.moveTo(50, 10);
    ctx.lineTo(50 + this.image.length * 10, 10);
    ctx.moveTo(50, 14);
    ctx.lineTo(50 + this.timer * 10, 14);
    ctx.strokeStyle = '#FF0000';
    ctx.stroke();

    const left = ((this.layerBBOX[0] - this.game.bbox[0]) / (this.game.bbox[2] - this.game.bbox[0])) * width;
    const top = ((this.layerBBOX[1] - this.game.bbox[1]) / (this.game.bbox[3] - this.game.bbox[1])) * height;
    const right = ((this.layerBBOX[2] - this.game.bbox[0]) / (this.game.bbox[2] - this.game.bbox[0])) * width;
    const bottom = ((this.layerBBOX[3] - this.game.bbox[1]) / (this.game.bbox[3] - this.game.bbox[1])) * height;
    if (this.image && this.image.length > this.timer + 1) {
      let r = ((parseInt(this.timer * 10000)) % 10000) / 10000;
      let blendStart = Math.cos(r * Math.PI / 2);
      let blendEnd = Math.sin(r * Math.PI / 2);
      ctx.save();
      ctx.globalAlpha = blendStart;
      try {
        ctx.drawImage(this.image[parseInt(this.timer)].getElement(), left, top, right - left, bottom - top);
      } catch (e) {
      }
      ctx.globalAlpha = blendEnd;
      // console.log(this.timer + '; ' + blendStart);
      try {
        ctx.drawImage(this.image[parseInt(this.timer + 1)].getElement(), left, top, right - left, bottom - top);
      } catch (e) {
      }
      ctx.restore();
    }

    this.timer += 0.2;
    if (this.timer + 1 > this.image.length) {
      this.timer = 0;
    }

    ctx.fillStyle = 'red';
    const keyNames = Object.keys(this.game.keysPressed);
    for (let j = 0; j < keyNames.length; j++) {
      ctx.fillText(keyNames[j] + ': ' + this.game.keysPressed[keyNames[j]], 10, j * 20);
    }
  }
  renderLoop () {
    if (this.enableRenderLoop !== true) return;
    this.renderCanvas();
    window.requestAnimationFrame(this.renderLoop);
    // window.setTimeout(() => { window.requestAnimationFrame(this.renderLoop); }, 100);
  }
  render () {
    return (<div style={{ width:'100%', height: '100vh', padding:0, margin:0, display:'block' }}>
      <CanvasComponent onRenderCanvas={(c, w, h, canvas) => { this.canvasNeedsToBeRendered(c, w, h, canvas); }} />
    </div>
    );
  }
};

/* this maps the properties in the redux state to the properties of the component */
const mapStateToProps = state => {
  /* Return initial state if not yet set */
  const ReduxReactCounterDemoState = state[REDUXREACTCOUNTERDEMO_REDUCERNAME] || reduxReactCounterDemoReducer();
  const webMapJSState = state[WEBMAPJS_REDUCERNAME] || webMapJSReducer();

  return {
    value: ReduxReactCounterDemoState.value,
    mylayers: webMapJSState.webmapjs.mapPanel[webMapJSState.webmapjs.activeMapPanelIndex].layers
  };
};

export default connect(mapStateToProps)(ExperimentDemo);
