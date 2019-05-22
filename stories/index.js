import React from 'react';
import { storiesOf, specs, describe, it } from '../.storybook/facade';
import { ReactWMJSLayer, ReactWMJSMap, getWMJSLayerById } from '@adaguc/react-webmapjs';

import { mount } from 'enzyme';

const baseLayer = {
  service: 'http://geoservices.knmi.nl/cgi-bin/worldmaps.cgi?',
  name: 'ne_10m_admin_0_countries_simplified',
  format: 'image/png',
  keepOnTop: true,
  baseLayer: true,
  enabled: true,
  id: 'layerid_1'
};
const radarLayer = {
  service: 'https://geoservices.knmi.nl/cgi-bin/RADNL_OPER_R___25PCPRR_L3.cgi?',
  name: 'RADNL_OPER_R___25PCPRR_L3_COLOR',
  format: 'image/png',
  enabled: true,
  id: 'layerid_2'
};

storiesOf('ReactWMJSMap', module)
  .add('Map with radar data', () => {
    const story = (
      <div style={{ height: '500px' }}>
        <ReactWMJSMap id={'Map1'} >
          {[
            <ReactWMJSLayer key={'1'} {...baseLayer} />,
            <ReactWMJSLayer key={'2'} {...radarLayer} />
          ]}
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

        console.log(output);
      });
    }));

    return story;
  })
  .add('Map with radar animation', () => {
    return (
      <div style={{ height: '500px' }}>
        <ReactWMJSMap id={'Map1'} webMapJSInitializedCallback={(webMapJS) => {
          const layer = getWMJSLayerById(radarLayer.id);
          var timeDim = layer.getDimension('time');
          var numTimeSteps = timeDim.size();

          // TODO: Wait until the layer is registered!

          if (timeDim.getValueForIndex(numTimeSteps - 1) != currentLatestDate) {
            console.log('Updating ' + currentLatestDate);
            var currentLatestDate = timeDim.getValueForIndex(numTimeSteps - 1);
            console.log(' to ' + currentLatestDate);
            var currentBeginDate = timeDim.getValueForIndex(numTimeSteps - 12);
            var dates = [];
            for (var j = numTimeSteps - 12; j < numTimeSteps; j++) {
              dates.push({ name:'time', value:timeDim.getValueForIndex(j) });
            }
            console.log('drawing dates');
            webMapJS.stopAnimating();
            webMapJS.draw(dates);
          }
        }}>
          {[
            <ReactWMJSLayer key={'1'} {...baseLayer} />,
            <ReactWMJSLayer key={'2'} {...radarLayer} />
          ]}
        </ReactWMJSMap>
      </div>
    );
  });
