'use es6';

import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import {getProp} from 'UIBean/UtilGet';
import {Column, Table, defaultTableRowRenderer} from 'react-virtualized'
import 'react-virtualized/styles.css';
import {H5} from 'UIBean/functional-css/TypographyStyles';

const TableHeaderRow = styled.div`
`;

const HeaderItem = styled.div`
  width: ${getProp('width')};
`;


class DataTable extends React.Component {

  constructor(props) {
    super(props);
    this.testTableRef = React.createRef();
  }

  state = {
    scrollRow: 0
  };

  componentDidUpdate() {
    if (this.state.scrollRow !== this.props.rowData.length - 1) {
      this.setState({scrollRow: this.props.rowData.length - 1});
    }
  }

  render() {
    const {headerData, rowData, ...rest} = this.props;
    // const rowRenderer = ({index,       // Index of row
    //                       columns,
    //                        className,
    //                      isScrolling, // The List is currently being scrolled
    //                      isVisible,   // This row is visible within the List (eg it is not an overscanned row)
    //                      key,         // Unique key within array of rendered rows
    //                      parent,      // Reference to the parent List (instance)
    //                      style} ) => {
    //   const row = rowData[index];
    //   // debugger
    //   return (
    //     <div className={className} key={row[key]} role="row" style={style}>
    //       {columns}
    //     </div>
    //   );
    // };

    return (
      <Table
        ref={this.testTableRef}
        rowCount={rowData.length}
        scrollToRow={this.state.scrollRow}
        // rowRenderer={rowRenderer}
        rowGetter={({index}) => rowData[index]}
        {...rest}
      >
        {
          headerData.map(({label, key, width}) => {
            return <Column key={key} label={label} dataKey={key} width={width}/>
          })
        }
      </Table>
    );
  }
}

DataTable.defaultProps = {
  rowHeight: 50,
  headerHeight: 20,
  rowRenderer: defaultTableRowRenderer,
};

DataTable.propTypes = {
  headerData: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string,
    key: PropTypes.string,
    width: PropTypes.number,
  })).isRequired,
  rowData: PropTypes.arrayOf(PropTypes.object).isRequired,
  children: PropTypes.any,
  rowHeight: PropTypes.number,
  headerHeight: PropTypes.number,
  height: PropTypes.number,
  width: PropTypes.number,
  rowRenderer: PropTypes.func,
};

export default DataTable;