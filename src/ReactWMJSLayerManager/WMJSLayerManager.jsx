import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { layerMoveLayer, getWMJSMapById, WEBMAPJS_REDUCERNAME, webMapJSReducer, parseWMJSLayerAndDispatchActions } from '@adaguc/react-webmapjs';
import SortableWMJSReactLayerList from './SortableLayerList.jsx';
import { Button, Row, Col, Label } from 'reactstrap';
import { timeResolutionGetObject, timeResolutionGetIndexForValue, timeResolutionSteps } from './TimeResolutionSteps';
import { Icon } from 'react-fa';
import { LAYERMANAGER_REDUCERNAME, layerManagerReducer } from './LayerManagerReducer';
import { layerManagerSetNumberOfLayers, layerManagerSetTimeResolution } from './LayerManagerActions';
import './WMJSLayerManager.css';
import 'bootstrap/dist/css/bootstrap.min.css';
const moment = window.moment;

class ReactWMJSLayerManager extends Component {
  constructor (props) {
    super(props);
    this.onSortEnd = this.onSortEnd.bind(this);
    this.refreshServices = this.refreshServices.bind(this);
    window.reducerManager.add(WEBMAPJS_REDUCERNAME, webMapJSReducer);
    window.reducerManager.add(LAYERMANAGER_REDUCERNAME, layerManagerReducer);

    if (this.props.timeResolution) {
      this.props.dispatch(layerManagerSetTimeResolution({ timeResolution: 60 * 5 }));
    }
  }

  componentWillUpdate (nextProps) {
    const { dispatch } = this.props;
    if (nextProps.layerManager.layers.length !== nextProps.activeMapPanel.layers.length) {
      dispatch(layerManagerSetNumberOfLayers(nextProps.activeMapPanel.layers.length));
    }
  }

  onSortEnd ({ oldIndex, newIndex }) {
    const { dispatch } = this.props;
    const mapPanelId = this.props.activeMapPanel.id;
    dispatch(layerMoveLayer({ oldIndex, newIndex, mapPanelId }));
  }

  refreshServices () {
    const { activeMapPanel, dispatch } = this.props;
    const wmjsMap = getWMJSMapById(activeMapPanel.id);
    wmjsMap.clearImageStore();
    const wmjsLayers = wmjsMap.getLayers();
    for (let d = 0; d < wmjsLayers.length; d++) {
      parseWMJSLayerAndDispatchActions(wmjsLayers[d], dispatch, activeMapPanel.id, null, true).then(() => { wmjsMap.draw(); });
    }
  }

  render () {
    const { activeMapPanel, layerManager, services, dispatch } = this.props;

    let localTime = '-';
    if (layerManager && layerManager.timeValue) {
      let timeValueAsMoment = moment.utc(layerManager.timeValue);
      if (timeValueAsMoment.isValid()) {
        localTime = timeValueAsMoment.local().format('YYYY-MM-DD HH:mm:SS');
      }
    }
    const currentTimeResolutionIndex = timeResolutionGetIndexForValue(layerManager.timeResolution);
    return (<div className={'ReduxWMJSLayerManagerWrapper'}>
      <div className={'ReduxWMJSLayerManagerContent'}>
        { layerManager && layerManager.layers && layerManager.layers.length > 0 ?
          <SortableWMJSReactLayerList
            useDragHandle
            onSortEnd={this.onSortEnd} dispatch={dispatch}
            activeMapPanel={activeMapPanel}
            layerManager={layerManager}
            services={services}
          />
          : <span className={'ReduxWMJSLayerManagerContentEmptyLayerText'}>No layers selected; <Button onClick={() => {
            history.go(0);
          }}>reload page</Button> or refresh (F5) to get all layers back</span>
        }
      </div>
      <div className={'ReduxWMJSLayerManagerFooter'} >
        <Row>
          <Col xs='7'>{ localTime + ' (local time)'}</Col>
          <Col xs='3' style={{ whiteSpace:'nowrap' }}>
            <Row style={{ whiteSpace:'nowrap' }}>
              <Col xs='2' style={{ whiteSpace:'nowrap' }}>
                <Button disabled={currentTimeResolutionIndex >= timeResolutionSteps.length - 1} onClick={() => {
                  const index = currentTimeResolutionIndex + 1;
                  if (index < timeResolutionSteps.length) { dispatch(layerManagerSetTimeResolution({ timeResolution: timeResolutionSteps[index].value })); }
                }}><Icon name='minus' />
                </Button>
              </Col>
              <Col xs='6' style={{ whiteSpace:'nowrap' }}>
                <Label style={{ width:'7rem', textAlign:'center' }}>{ timeResolutionGetObject(layerManager.timeResolution).title }</Label>
              </Col>
              <Col xs='2' style={{ whiteSpace:'nowrap' }}>
                <Button disabled={currentTimeResolutionIndex === 0} onClick={() => {
                  const index = currentTimeResolutionIndex - 1;
                  if (index >= 0) { dispatch(layerManagerSetTimeResolution({ timeResolution: timeResolutionSteps[index].value })); }
                }}><Icon name='plus' />
                </Button>
              </Col>
            </Row>
          </Col>
          <Col xs='1'><Button onClick={this.refreshServices}>Refresh</Button></Col>
          <Col xs='1'><Button onClick={() => { alert('tbd'); }}>Add</Button></Col>
        </Row>
      </div>
    </div>);
  }
}

const mapStateToProps = state => {
  /* Return initial state if not yet set */
  const webMapJSState = state[WEBMAPJS_REDUCERNAME] ? state[WEBMAPJS_REDUCERNAME] : webMapJSReducer();
  const layerManagerState = state[LAYERMANAGER_REDUCERNAME] ? state[LAYERMANAGER_REDUCERNAME] : layerManagerReducer();
  return {
    activeMapPanel: webMapJSState.webmapjs.mapPanel[webMapJSState.webmapjs.activeMapPanelIndex],
    layerManager: layerManagerState.layerManager,
    services: webMapJSState.webmapjs.services
  };
};

ReactWMJSLayerManager.propTypes = {
  dispatch: PropTypes.func,
  layerManager: PropTypes.object,
  services: PropTypes.object,
  activeMapPanel: PropTypes.object,
  timeResolution: PropTypes.number
};

export default connect(mapStateToProps)(ReactWMJSLayerManager);
