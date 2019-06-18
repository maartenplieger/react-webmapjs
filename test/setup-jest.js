// Setup jquery for tests.
import $ from 'jquery';
import moment from 'moment';
import proj4 from 'proj4';

window.$ = $;
window.moment = moment;
window.proj4 = proj4;

// Configure the test engine.
import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });
jest.mock('../.storybook/facade');
