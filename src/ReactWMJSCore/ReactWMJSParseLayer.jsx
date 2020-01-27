import WMJSGetServiceFromStore from '../ReactWMJSMap/adaguc-webmapjs/WMJSGetServiceFromStore';
import { serviceSetLayers, layerSetStyles, layerSetDimensions, layerChangeStyle, layerChangeDimension } from './ReactWMJSActions';

export const parseWMJSLayerAndDispatchActions = (wmjsLayer, dispatch, mapPanelId, xml2jsonrequestURL, forceRefresh = false) => {
  // console.log('parseWMJSLayerAndDispatchActions');
  return new Promise((resolve, reject) => {
    wmjsLayer.parseLayer((_layer) => {
      if (wmjsLayer && wmjsLayer.hasError === false) {
        if (dispatch) {
          const service = WMJSGetServiceFromStore(wmjsLayer.service, xml2jsonrequestURL);
          /* Update list of layers for service */
          const done = (layers) => {
            dispatch(serviceSetLayers({ service:wmjsLayer.service, layers:layers }));
            /* Update style information in services for a layer */
            dispatch(layerSetStyles({ service: wmjsLayer.service, name:wmjsLayer.name, styles:wmjsLayer.getStyles() }));
            /* Select first style in service for a layer */
            dispatch(layerChangeStyle({
              service: wmjsLayer.service,
              mapPanelId: mapPanelId,
              layerId:wmjsLayer.ReactWMJSLayerId,
              style: wmjsLayer.currentStyle// || wmjsLayer.getStyles().length > 0 ? wmjsLayer.getStyles()[0].Name.value : 'default'
            }));
            /* Update dimensions information in services for a layer */
            dispatch(layerSetDimensions({ service: wmjsLayer.service, name:wmjsLayer.name, dimensions:wmjsLayer.dimensions }));
            let mapNeedsUpdate = false;
            for (let d = 0; d < wmjsLayer.dimensions.length; d++) {
              /* Try to re-use the dimensionValue selected in the redux state */
              let reactLayerDimension = { currentValue: null };
              if (wmjsLayer.reactWebMapJSLayer && wmjsLayer.reactWebMapJSLayer.props.dimensions) {
                const index = wmjsLayer.reactWebMapJSLayer.props.dimensions.findIndex(dim => dim.name === wmjsLayer.dimensions[d].name);
                if (index >= 0) { reactLayerDimension = wmjsLayer.reactWebMapJSLayer.props.dimensions[index]; }
              }

              if (reactLayerDimension.currentValue) {
                if (reactLayerDimension.currentValue !== wmjsLayer.dimensions[d].currentValue) {
                  wmjsLayer.dimensions[d].currentValue = reactLayerDimension.currentValue;
                  mapNeedsUpdate = true;
                }
              }

              const dimension = {
                name: wmjsLayer.dimensions[d].name,
                units: wmjsLayer.dimensions[d].units,
                currentValue: wmjsLayer.dimensions[d].currentValue
              };
              dispatch(layerChangeDimension({
                service: wmjsLayer.service,
                mapPanelId: mapPanelId,
                layerId:wmjsLayer.ReactWMJSLayerId,
                dimension:dimension
              }));
            }
            if (mapNeedsUpdate) {
              if (wmjsLayer.parentMaps && wmjsLayer.parentMaps.length > 0) {
                wmjsLayer.parentMaps[0].draw();
              }
            }
            resolve();
          };
          service.getLayerObjectsFlat(done, () => {}, false, null, { headers: wmjsLayer.headers });
        }
      }
    }, forceRefresh, 'ReactWMJSParseLayer.jsx', xml2jsonrequestURL);
  });
};
