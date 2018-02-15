import React from 'react';

class Grid extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { gutter } = this.props;

    const classNames = ['flex-row', 'fade'];
    if (gutter) {
      classNames.push(`gutter-${gutter}`);
    }

    return <div className={classNames.join(' ')}>{this.props.children}</div>;
  }
}

export default Grid;
