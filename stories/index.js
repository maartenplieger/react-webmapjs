import React from 'react';
import { storiesOf, specs, describe, it } from '../.storybook/facade';
import { ReactWMJSLayer, ReactWMJSMap, getWMJSLayerById, generateLayerId, generateMapId } from '@adaguc/react-webmapjs';

import { mount } from 'enzyme';

const baseLayer = {
  name:"arcGisSat",
  title:"arcGisSat",
  type: 'twms',
  baseLayer: true,
  enabled:true,
  id: generateLayerId()
};

const overLayer = {
  service: 'http://geoservices.knmi.nl/cgi-bin/worldmaps.cgi?',
  name: 'ne_10m_admin_0_countries_simplified',
  format: 'image/png',
  keepOnTop: true,
  baseLayer: true,
  enabled: true,
  id: generateLayerId()
};
const radarLayer = {
  service: 'https://geoservices.knmi.nl/cgi-bin/RADNL_OPER_R___25PCPRR_L3.cgi?',
  name: 'RADNL_OPER_R___25PCPRR_L3_KNMI',
  format: 'image/png',
  enabled: true,
  style: 'knmiradar/nearest',
  id: generateLayerId()
};

storiesOf('ReactWMJSMap', module)
  .add('Map with radar data', () => {
    const story = (
      <div style={{ height: '100vh' }}>
        <ReactWMJSMap id={generateMapId()} >
          <ReactWMJSLayer {...baseLayer} />
          <ReactWMJSLayer {...radarLayer} onLayerReady={ (layer, webMapJS) => { layer.zoomToLayer(); }} />
          <ReactWMJSLayer {...overLayer} />
        </ReactWMJSMap>
      </div>
    );

    // Test which tries to mount the story to verify if this is possible.
    specs(() => describe('reactWMJSTest', function () {
      it('Should be able to mount', function () {
        const div = global.document.createElement('div');
        global.document.body.appendChild(div);
        const output = mount(story, { attachTo: div });
        output.detach();
        global.document.body.removeChild(div);
      });
    }));

    return story;
  })
  .add('Map with radar animation', () => {
    return (
      <div style={{ height: '100vh' }}>
        <ReactWMJSMap id={generateMapId()} >
          <ReactWMJSLayer {...baseLayer} />
          <ReactWMJSLayer {...radarLayer} onLayerReady={ (layer, webMapJS) => {
              if (layer) {
                var timeDim = layer.getDimension('time');
                if (timeDim) {
                  var numTimeSteps = timeDim.size();
                  if (timeDim.getValueForIndex(numTimeSteps - 1) != currentLatestDate) {
                    var currentLatestDate = timeDim.getValueForIndex(numTimeSteps - 1);
                    var currentBeginDate = timeDim.getValueForIndex(numTimeSteps - 12);
                    var dates = [];
                    for (var j = numTimeSteps - 12; j < numTimeSteps; j++) {
                      dates.push({ name:'time', value:timeDim.getValueForIndex(j) });
                    }
                    webMapJS.stopAnimating();
                    layer.zoomToLayer();
                    webMapJS.draw(dates);
                  }
                }
              }
          }} />
          <ReactWMJSLayer key={'3'} {...overLayer} />
        </ReactWMJSMap>
      </div>
    );
  });
