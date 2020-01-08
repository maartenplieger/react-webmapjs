import React from 'react';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import PropTypes from 'prop-types';

export default class SimpleDropDown extends React.Component {
  constructor (props) {
    super(props);

    this.toggle = this.toggle.bind(this);
    this.state = {
      dropdownOpen: false
    };
  }

  toggle () {
    this.setState(prevState => ({
      dropdownOpen: !prevState.dropdownOpen
    }));
  }

  getSelected (selected, list, title) {
    if (selected === null || selected === undefined) return { key: null, value: title || 'Please select ...' };
    if (!list || !list.length) return { key: null, value: 'no list provided' };
    let found = list.filter(i => i && i.key === selected + ''); if (found.length > 0) return found[0];
    found = list.filter(i => i && i.value === selected + ''); if (found.length > 0) return found[0];
    found = list.filter(i => i && i.key === selected.key + ''); if (found.length > 0) return found[0];
    found = list.filter(i => i && i.value === selected.value + ''); if (found.length > 0) return found[0];
  }

  render () {
    const { selected, list, title } = this.props;
    if (!list || !list.length) return (<div>Should provide a list.</div>);
    const selectedAsObj = this.getSelected(selected, list, title);
    return (
      <Dropdown isOpen={this.state.dropdownOpen} toggle={this.toggle} style={{ display: 'inline' }}>
        <DropdownToggle caret>
          { selectedAsObj ? (selectedAsObj.value + '') : 'Key is not available ... (' + JSON.stringify(selected) + ')' }
        </DropdownToggle>
        <DropdownMenu>
          {
            list.map((i, key) => {
              return (<DropdownItem key={key} onClick={() => { this.props.onChange(i); }}>{i.value}</DropdownItem>);
            })
          }
        </DropdownMenu>
      </Dropdown>
    );
  }
}
SimpleDropDown.propTypes = {
  selected: PropTypes.string,
  title: PropTypes.string,
  list: PropTypes.array,
  onChange: PropTypes.any
};
