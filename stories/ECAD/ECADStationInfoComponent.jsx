import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './ECAD.css';
const ecadStationsInfoURL = 'http://birdexp07.knmi.nl/ecadbackend/stationsinfo?';
/*
{
    "station_id": 162,
    "sta_name": "De Bilt",
    "country": "NETHERLANDS",
    "lat": 52.0989,
    "lon": 18647,
    "height": 1.9,
    "gsn": "y",
    "wmocode": "06260",
    "picture": "y",
    "landuse": "Partly open landscape. Broad transition zone between the low sandy hills of the Utrechtse Heuvelrug and the basin of the river Kromme Rijn. Meadows and arable land alternate with built-up areas and woodlands.",
    "surface": "Grass",
    "shelter": "",
    "soiltype": "Sand",
    "history": "19500916 relocation westwards <br>\n19510827 relocation southwards (300m) <br>\n20080925 relocation eastwards (230m) <br>\n<br>\nTemperature: <br>\n19010101-19500516 thermograph in large pagodehut (2.2 m),<br>\n19500517-19610628 thermograph in Stevensonhut (2.2 m), <br>\n19610629-19930625 electronic measurement in Stevensonhut (1.5 m), <br>\n19930326-present electronic sensors in round-plated screen<br>\nPressure:<br>\n18481201-18951231 pressure as mean value of the 7:40, 13:40 and 21:40 GMT air pressures <br>\n18481201-18961231 pressure measured at Utrecht 52Â°05(N), 05Â°08(E) <br>\n18960101-19011231 pressure as mean value of the 7:40, 13:40 and 18:40 GMT air pressures <br>\n19020101-present pressure as mean value of 24 hourly measurements <br>\n<br>\n19020101-19731015 barograph and mercury barometer, <br>\n19731016-19930625 barograph en digital aneroid barometer, <br>\n19930626-electronic measurement<br>",
    "opened": 1901,
    "closed": 0
  }
*/

export default class ECADStationInfoComponent extends Component {
  constructor (props) {
    super(props);
    this.fetchStationInfo = this.fetchStationInfo.bind(this);
    this.state = {
      stationData: null
    };
  }
  componentDidMount () {
    this.fetchStationInfo();
  }
  componentDidUpdate (prevProps) {
    if (this.props.stationId !== prevProps.stationId) {
      this.fetchStationInfo();
    }
  }
  fetchStationInfo () {
    const { stationId } = this.props;
    if (!stationId) {
      return (null);
    }
    fetch(ecadStationsInfoURL + 'station_id=' + stationId, {
      method: 'GET',
      mode: 'cors'
    }).then(data => {
      return data.json();
    }).then(data => {
      this.setState({ stationData: data[0] });
    });
  }

  renderStationInfoHTML (stationData) {
    if (!stationData) return null;
    return (<tbody>
      {/* <tr>
        <td className='head1' colSpan='5'>
          <p className='head1'>Homogeneity details for the temperature series<br />from station Tachov, CZECH REPUBLIC</p>
        </td>
      </tr> */}
      <tr>
        <td className='labeltext' width='130'>
          <p className='normaltext'>Latitude</p>
        </td>
        <td className='labeltext' width='170'>
          <p className='normaltext'>{stationData.lat}</p>
        </td>
        <td className='labeltext' width='130'>
          <p className='normaltext'>WMO&nbsp;identifier</p>
        </td>
        <td className='labeltext' width='15'>
          <p className='normaltext'>{stationData.wmocode}</p>
        </td>
        <td rowSpan='8' valign='top' align='center'>
          <p className='labeltext'>
            <a href='../images/stations/11176.jpg' target='_blank'>
              <img src={'http://bhle4m.knmi.nl/rcc/images/stations/' + stationData.station_id + '.jpg'} alt='' width='130' border='1' />
            </a>
          </p>
          <br />
          <p className='labeltext'>
            <a href={'http://maps.google.com/maps?q=' + stationData.lat + ',+' + stationData.lon} target='_blank'>Show location using Google Maps</a>
            <br /><br />(not part of ECA&amp;D, opens a new window)</p>
        </td>
      </tr>
      <tr>
        <td className='labeltext'>
          <p className='normaltext'>Longitude</p>
        </td>
        <td className='labeltext'>
          <p className='normaltext'>{stationData.lon}</p>
        </td>
        <td className='labeltext' valign='top'>
          <p className='normaltext'>GCOS&nbsp;station</p>
        </td>
        <td className='labeltext'><p className='normaltext'>{stationData.gsn === 'y' ? 'Yes' : 'No'}</p>
        </td>
      </tr>
      <tr>
        <td className='labeltext'>
          <p className='normaltext'>Elevation</p>
        </td>
        <td className='labeltext'>
          <p className='normaltext'>{stationData.height}</p>
        </td>
        <td className='labeltext'>
          <p className='normaltext'>Station ID</p>
        </td>
        <td className='labeltext'>
          <p className='normaltext'>{stationData.station_id}</p>
        </td>
      </tr>
      <tr>
        <td className='labeltext' valign='top'>
          <p className='normaltext'>Land&nbsp;use</p>
        </td>
        <td className='labeltext' colSpan='3'>
          <p className='normaltext'>{stationData.landuse}</p>
        </td>
      </tr>
      <tr>
        <td className='labeltext' valign='top'>
          <p className='normaltext'>Soil&nbsp;type</p>
        </td>
        <td className='labeltext' colSpan='3'>
          <p className='normaltext'>{stationData.soiltype}</p>
        </td>
      </tr>
      <tr>
        <td className='labeltext' valign='top'>
          <p className='normaltext'>Surface&nbsp;coverage</p>
        </td>
        <td className='labeltext' colSpan='3'>
          <p className='normaltext'>{stationData.surface}</p>
        </td>
      </tr>
      <tr>
        <td className='labeltext' valign='top'>
          <p className='normaltext'>Sheltering</p>
        </td><td className='labeltext' colSpan='2'>
          <p className='normaltext'>{stationData.shelter}</p>
        </td>
      </tr>
      <tr>
        <td colSpan='5'>&nbsp;</td>
      </tr>
    </tbody>);
  }
  render () {
    const { stationId } = this.props;
    if (!stationId) {
      return (null);
    }
    return (<div>{this.renderStationInfoHTML(this.state.stationData)}</div>);
  }
};

ECADStationInfoComponent.propTypes = {
  stationId: PropTypes.number
};
