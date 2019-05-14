import React from 'react';
import { storiesOf } from '@storybook/react';
import ReactWMJSLayer from '../src/ReactWMJSLayer';
import ReactWMJSMap from '../src/ReactWMJSMap';

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

storiesOf('ReactWMJSLayer', module)
  .add('firstTest', () => <ReactWMJSLayer id={1} randomProp={'Hello'} />);

storiesOf('ReactWMJSMap', module)
  .add('reactWMJSTest', () => {
    return (
      <ReactWMJSMap id={'Map1'} >
        {[
          <ReactWMJSLayer key={'1'} {...baseLayer} />,
          <ReactWMJSLayer key={'2'} {...radarLayer} />
        ]}
      </ReactWMJSMap>
    );
  });
