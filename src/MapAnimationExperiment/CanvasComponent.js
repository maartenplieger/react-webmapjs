import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class CanvasComponent extends Component {
  constructor () {
    super();
    this.updateCanvas = this.updateCanvas.bind(this);
    this.handleMouseMoveEvent = this.handleMouseMoveEvent.bind(this);
    this.resize = this.resize.bind(this);
    this._handleWindowResize = this._handleWindowResize.bind(this);
    this.handleClickEvent = this.handleClickEvent.bind(this);
    this.currentWidth = 300;
    this.currentHeight = 150;
  }
  _handleWindowResize () {
    this.resize();
  }

  resize () {
    const canvascontainer = this.refs.canvascontainer;
    if (canvascontainer) {
      const newWidth = canvascontainer.clientWidth;
      const newHeight = canvascontainer.clientHeight;
      if ((newWidth !== undefined && newHeight !== undefined) && (this.currentWidth !== newWidth || this.currentHeight !== newHeight)) {
        this.currentWidth = newWidth;
        this.currentHeight = newHeight;
        this.updateCanvas();
      }
    }
  }

  handleMouseMoveEvent (event) {
    const mousemove = this.props.onMouseMove;
    const x = event.layerX;
    const y = event.layerY;
    if (event.buttons === 1) {
      this.props.onCanvasClick(x, y);
    }
    mousemove(x, y);
  }

  handleClickEvent (event) {
    const x = event.layerX;
    const y = event.layerY;
    this.props.onCanvasClick(x, y);
  }

  /* istanbul ignore next */
  componentDidMount () {
    if (this.canvas) {
      this.canvas.addEventListener('mousemove', this.handleMouseMoveEvent);
      this.canvas.addEventListener('click', this.handleClickEvent);
      this.resize();
      this.updateCanvas();
    }
    window.addEventListener('resize', this._handleWindowResize);
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this._handleWindowResize);
    if (this.canvas) {
      this.canvas.removeEventListener('mousemove', this.handleMouseMoveEvent);
      this.canvas.removeEventListener('click', this.handleClickEvent);
    }
  }

  /* istanbul ignore next */
  updateCanvas () {
    if (!this.canvas) {
      return;
    }

    const ctx = this.canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      return;
    }
    if (parseInt(ctx.canvas.height) !== this.currentHeight) {
      ctx.canvas.height = this.currentHeight;
    }
    if (parseInt(ctx.canvas.width) !== this.currentWidth) {
      ctx.canvas.width = this.currentWidth;
    }
    this.props.onRenderCanvas(ctx, this.currentWidth, this.currentHeight, this.canvas);
  }

  render () {
    this.updateCanvas();
    return (<div style={{ height:'100%', width:'100%', border:'none', display:'block', overflow:'hidden' }} >
      <div ref='canvascontainer' style={{
        minWidth:'inherit',
        minHeight:'inherit',
        width: 'inherit',
        height: 'inherit',
        overflow: 'hidden',
        display:'block',
        border: 'none'
      }}>
        <div style={{ overflow: 'visible', width:0, height:0 }} >
          <canvas ref={(canvas) => { this.canvas = canvas; }} />
        </div>
      </div>
    </div>);
  }
}

CanvasComponent.propTypes = {
  onRenderCanvas: PropTypes.func,
  onCanvasClick: PropTypes.func,
  onMouseMove: PropTypes.func
};

CanvasComponent.defaultProps = {
  onRenderCanvas: () => { /* intentionally left blank */ },
  onCanvasClick: () => { /* intentionally left blank */ },
  onMouseMove: () => { /* intentionally left blank */ }
};
