import React from 'react';

import { storiesOf } from '@storybook/react';
import ReactWMJSLayer from '../src/ReactWMJSLayer';

storiesOf('ReactWMJSLayer', module)
  .add('firstTest', () => <ReactWMJSLayer id={1} randomProp={'Hello'} />);
