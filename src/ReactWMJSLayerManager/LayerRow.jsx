import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Row, Col, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { layerManagerToggleLayerSelector, layerManagerToggleStylesSelector } from './LayerManagerActions';
import { layerChangeName, layerChangeEnabled, layerChangeStyle, layerDelete } from '@adaguc/react-webmapjs';
import { Icon } from 'react-fa';
import ReactWMJSTimeSelector from './TimeSelector';
import DimensionSelector from './DimensionSelector';
import OpacitySelector from './OpacitySelector';

class ReactWMJSLayerRow extends Component {
  renderEnabled (layer, enableLayer) {
    if (!layer) { return (<div>-</div>); }
    const enabled = layer.enabled !== false;
    return (
      <Button onClick={(e) => { enableLayer(!enabled); e.stopPropagation(); e.preventDefault(); }}>
        <Icon name={enabled ? 'eye' : 'eye-slash'} />
        <span className='ReactWMJSDropDownTooltipText'>Toggle this layer's visibility</span>
      </Button>);
  }

  renderDelete (layer, deleteLayer) {
    if (!layer) { return (<div>-</div>); }
    return (
      <Button onClick={(e) => { deleteLayer(); e.stopPropagation(); e.preventDefault(); }}>
        <Icon name='trash' />
        <span className='ReactWMJSDropDownTooltipText'>Remove this layer</span>
      </Button>);
  }

  renderFocus (layer, focusLayer) {
    if (!layer) { return (<div>-</div>); }
    return (<Button onClick={(e) => { focusLayer(); e.stopPropagation(); e.preventDefault(); }}><Icon name='window-maximize' /></Button>);
  }

  renderLayers (services, layer, isOpen, toggle, selectLayer) {
    if (!services || !services[layer.service] || !services[layer.service].layers) {
      return (<div><Button>Select service...</Button></div>);
    }
    const layers = services[layer.service].layers;
    const filteredLayers = layers.filter(l => l.name === layer.name);
    const currentValue = filteredLayers.length === 1 && filteredLayers[0].text ? filteredLayers[0].text : 'none';
    return (
      <Dropdown isOpen={isOpen} toggle={toggle}>
        <DropdownToggle caret>
          {currentValue}
          <span className='ReactWMJSDropDownTooltipText'>Select a layer</span>
        </DropdownToggle>
        <DropdownMenu>
          <DropdownItem header>Select a layer</DropdownItem>
          {
            layers.map((l, i) => {
              return (<DropdownItem active={currentValue === l.text} key={i} onClick={() => { selectLayer(l.name); }}>{l.text}</DropdownItem>);
            })
          }
        </DropdownMenu>
      </Dropdown>
    );
  }

  renderStyles (services, layer, isOpen, toggle, selectStyle) {
    let currentStyle = { Name: { value:'none' }, Title:{ value: 'none' } };
    let styles = [];
    if (services && services[layer.service] && services[layer.service].layer) {
      const serviceLayer = services[layer.service].layer[layer.name];
      styles = serviceLayer && serviceLayer.styles && serviceLayer.styles.length > 0 ? serviceLayer.styles : [];
      currentStyle = styles.filter(l => l.name === layer.style)[0] || { Name: { value:'default' }, Title:{ value:'default' } };
    }
    const currentValue = currentStyle.Title.value;
    return (
      <Dropdown isOpen={isOpen} toggle={toggle}>
        <DropdownToggle caret>
          {currentValue}
          <span className='ReactWMJSDropDownTooltipText'>
            Select a style for layer <strong>{layer.name}</strong>
          </span>
        </DropdownToggle>
        <DropdownMenu>
          <DropdownItem header>Select a style</DropdownItem>
          {
            styles.map((l, i) => {
              return (<DropdownItem active={l.Title.value === currentValue} key={i} onClick={() => { selectStyle(l.Name.value); }}>{l.Title.value}</DropdownItem>);
            })
          }
        </DropdownMenu>
      </Dropdown>
    );
  }

  render () {
    const { dispatch, layerIndex } = this.props;

    if (layerIndex > (this.props.activeMapPanel.layers.length - 1)) {
      console.error('Trying to add more layers to the layermanager than which are available in the map.');
      return <div />;
    }

    return (
      <Row>
        <Col xs='2' style={{ whiteSpace:'nowrap' }}>
          <Row>
            <Col xs='4' style={{ whiteSpace:'nowrap' }}>
              {
                this.renderDelete(
                  this.props.activeMapPanel.layers[layerIndex],
                  () => { dispatch(layerDelete({ mapPanelId:this.props.activeMapPanel.id, layerIndex: layerIndex })); }
                )
              }
              {
                this.renderEnabled(
                  this.props.activeMapPanel.layers[layerIndex],
                  (enabled) => { dispatch(layerChangeEnabled({ mapPanelId:this.props.activeMapPanel.id, layerIndex: layerIndex, enabled: enabled })); }
                )
              }
              {
                <OpacitySelector
                  layer={this.props.activeMapPanel.layers[layerIndex]}
                  mapPanel={this.props.activeMapPanel}
                  id={this.props.activeMapPanel.layers[layerIndex].id}
                />
              }
            </Col>
            <Col xs='8' style={{ textOverflow: 'ellipsis' }}>
              <DimensionSelector
                layer={this.props.activeMapPanel.layers[layerIndex]}
                mapPanel={this.props.activeMapPanel}
                services={this.props.services}
                id={this.props.activeMapPanel.layers[layerIndex].id}
              />
              {/* {
                this.renderFocus(
                  this.props.activeMapPanel.layers[layerIndex],
                  () => { dispatch(layerFocus({ mapPanelId:this.props.activeMapPanel.id, layerIndex: layerIndex })); }
                )
              } */}
            </Col>
          </Row>
        </Col>
        <Col xs='2'>
          {
            this.renderLayers(
              this.props.services,
              this.props.activeMapPanel.layers[layerIndex],
              this.props.layerManager.layers[layerIndex].layerSelectorOpen,
              () => { dispatch(layerManagerToggleLayerSelector({ layerIndex: layerIndex })); },
              (name) => { dispatch(layerChangeName({ mapPanelId:this.props.activeMapPanel.id, layerIndex: layerIndex, name: name })); }
            )
          }
          {
            this.renderStyles(
              this.props.services,
              this.props.activeMapPanel.layers[layerIndex],
              this.props.layerManager.layers[layerIndex].styleSelectorOpen,
              () => { dispatch(layerManagerToggleStylesSelector({ layerIndex: layerIndex })); },
              (style) => { dispatch(layerChangeStyle({ mapPanelId:this.props.activeMapPanel.id, layerId: this.props.activeMapPanel.layers[layerIndex].id, style: style })); }
            )
          }
        </Col>
        <Col xs='8'>
          <ReactWMJSTimeSelector
            layer={this.props.activeMapPanel.layers[layerIndex]}
            activeMapPanel={this.props.activeMapPanel}
            layerManager={this.props.layerManager}
            dispatch={this.props.dispatch}
          />
        </Col>
      </Row>);
  }
}

ReactWMJSLayerRow.propTypes = {
  dispatch: PropTypes.func,
  layerManager: PropTypes.object,
  services: PropTypes.object,
  activeMapPanel: PropTypes.object,
  layerIndex: PropTypes.number
};

export default ReactWMJSLayerRow;
