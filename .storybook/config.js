import { configure } from '@storybook/react';
// import '@storybook/addon-console';
import requireContext from 'require-context.macro';
import {configure as configureEnzyme }  from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configureEnzyme({ adapter: new Adapter() });

// automatically import all files ending in *.js in the stories directory
const req = requireContext('../stories', true, /\.js$/);
function loadStories() {
  req.keys().forEach(filename => req(filename));
}

configure(loadStories, module);
