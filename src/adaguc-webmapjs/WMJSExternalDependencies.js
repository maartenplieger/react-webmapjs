/* Moment, proj4 and jquery are externals, e.g. not packaged in adaguc-webmapjs: */
import moment from 'moment';
// import proj4 from 'proj4';

var proj4 = window.proj4 || global.proj4;

/* Jquery should be globally availble */
var jquery = window.jQuery || window.$ || global.$ || global.jQuery;
export { jquery, moment, proj4 };
