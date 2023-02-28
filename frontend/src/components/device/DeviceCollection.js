'use es6';

import React, {Component} from 'react';
import styled from 'styled-components';

import Flex, {FlexDirection} from 'UIBean/Flex';
import FlexSize from 'UIBean/FlexSize';
import DataTable from 'UIBean/DataTable';
import {H6} from 'UIBean/functional-css/TypographyStyles';

import DeviceCard from 'VizIoT/components/device/DeviceCard';
import {OFF_WHITE, TEXT, TRON} from 'VizIoT/styles/base/viz-theme';
import PropTypes from 'prop-types';
import * as R from 'ramda';
import {
  lastSize, lastSizeSamples,
  makeMacAddressLens,
  sizeInToday,
  sizeOutToday,
  sizeTotalToday
} from 'VizIoT/data/device/DeviceDataLenses';
import moment from 'moment';
import { DeviceData } from 'VizIoT/data/device/DeviceData';

const StyledTable = styled(DataTable)`
  margin-bottom: 50px;

  & .ReactVirtualized__Table__rowColumn:nth-child(2) {
    font-weight: 600;
  }
  
  & > .ReactVirtualized__Table__headerRow {
    text-transform: initial;
    ${H6}
    font-weight: 300;
    color: ${OFF_WHITE};
  }
  
  & .ReactVirtualized__Grid__innerScrollContainer {
    overflow: visible !important;
  }
  
  & .ReactVirtualized__Table__Grid {
    overflow: visible !important;
  }
  
  & .ReactVirtualized__Table__row {
    ${H6}
    font-weight: 300;
    color: ${OFF_WHITE};
    // padding: 0 10px;
    overflow: visible !important;
    cursor: pointer;

    .ReactVirtualized__Table__rowColumn {
      line-height: initial;
    }
    
    &::after {
      content: '';
      position: absolute;
      z-index: -1;
      width: 100%;
      height: 100%;
    
      border: 2px solid ${TRON};
      box-shadow: 0px 0px 43px #13d4b759, 0px 0px 30px #13d4b726 inset;
      background: ${TRON}33;
      margin: 0 -2px; /* this prevents shifting due to border */
      opacity: 0;
      transition: opacity 1s cubic-bezier(0.165, 0.84, 0.44, 1);
    }
    
    &:hover {
      color: ${TEXT};
      &::after {
        opacity: 1;
    }
    
  }
  
  .ReactVirtualized__Table__rowColumn:first-child {
    color: ${OFF_WHITE};
  }
`;

const DeviceCardWrapper = styled(FlexSize)`
  display: inline-flex;
  justify-content: center;
  width: 100%;
  
  /* The element to apply the animation to */
  // & > div {
  //   animation-name: example;
  //   animation-duration: 2s;
  //   animation-iteration-count: infinite;
  //   animation-direction: alternate;
  // }
  
`;

const CustomRow = styled.div`
  ${({index}) => index % 2 ? `background: ${TRON}08;` : `background: ${TRON}03;`}
`;

const deviceRowRenderer = ({
                             className,
                             columns,
                             index,
                             style,
                             key
                           }) => {

  const a11yProps = {'aria-rowindex': index + 1};

  // debugger
  return (
    <CustomRow
      key={key}
      className={className}
      role="row"
      style={style}
      index={index}
      {...a11yProps}
    >
      {columns}
    </CustomRow>
  )
};

class DeviceCollection extends Component {

  // shouldComponentUpdate(prevProps, s, c) {
  // }

  state = {
    hoveredDevice: null,
  };

  onCardHover = id => e => {
    this.setState({
      hoveredDevice: id,
    });
  };

  onCardLeaveHover = e => {
    this.setState({
      hoveredDevice: null,
    });
  };

  static renderDevicesAsCards(
    devices,
    deviceToData,
    hoveredDevice,
    onCardHover,
    onCardLeaveHover,
    chartConfig,
  ) {
    return (
      <Flex gutter={2} className="p-top-5">
        {
          devices.map(device => {
            const {_id, macAddress} = device;
            const deviceData = R.view(makeMacAddressLens(macAddress.toUpperCase()), deviceToData);
            if (!deviceData) {
              return null;
            }
            const velocity = R.view(lastSize, deviceData);
            const total = R.view(sizeTotalToday, deviceData);
            const dataIn = R.view(sizeInToday, deviceData);
            const dataOut = R.view(sizeOutToday, deviceData);
            const dataByTime = R.view(lastSizeSamples, deviceData);

            let graphData = [];
            if (dataByTime && dataByTime.length) {
              const catchUpSeconds = 0;
              graphData = dataByTime.map(({startMS, size: yData}) => {
                return {
                  xData: moment
                    .unix(startMS / 1000.0)
                    .add(catchUpSeconds, 'seconds')
                    .toDate(),
                  yData,
                };
              });

              // while () {
              //
              // }

            }

            return (
              <DeviceCardWrapper
                key={macAddress}
                size={{xs: 12, sm: 12, md: 12, lg: 6, xl: 4, xxl: 4, xxxl: 2}}
                space="m-bot-4"
              >
                <DeviceCard
                  onHover={onCardHover(_id)}
                  onLeaveHover={onCardLeaveHover}
                  active={hoveredDevice !== null && hoveredDevice !== _id}
                  device={device}
                  velocity={velocity}
                  total={total}
                  dataIn={dataIn}
                  dataOut={dataOut}
                  graphData={graphData}
                  chartConfig={chartConfig}
                />
              </DeviceCardWrapper>
            );
          })
        }
      </Flex>
    );
  };

  static renderDevicesAsList(devices, deviceToData) {

    const headerData = [
      {label: '', key: 'starred', width: 20},
      {label: 'Name', key: 'name', width: 192},
      {label: 'Packets', key: 'total', width: 72},
      {label: 'In', key: 'dataIn', width: 72},
      {label: 'Out', key: 'dataOut', width: 72},
      {label: 'Velocity', key: 'velocity', width: 160}
    ];

    const width = R.compose(
      R.sum,
      R.map(({width}) => width)
    )(headerData);

    const devicesWithDefault = devices || [];
    const rowData = devicesWithDefault.reduce((acc, device) => {
      const {_id, macAddress, name} = device;
      const deviceData = R.view(makeMacAddressLens(macAddress.toUpperCase()), deviceToData);
      if (!deviceData) {
        return acc;
      }
      const velocity = R.view(lastSize, deviceData);
      const total = R.view(sizeTotalToday, deviceData);
      const dataIn = R.view(sizeInToday, deviceData);
      const dataOut = R.view(sizeOutToday, deviceData);

      const item = {
        key: _id,
        name,
        total,
        dataIn,
        dataOut,
        velocity,
      };
      return [
        ...acc,
        item,
      ];
    }, []);

    const list = (
      <StyledTable headerData={headerData}
                   rowData={rowData}
                   headerHeight={41}
                   rowHeight={41}
                   height={41 * (rowData.length + 1)}
                   width={width}
                   rowRenderer={deviceRowRenderer}
      />
    );

    return (
      <Flex className="p-top-5" direction={FlexDirection.COLUMN}>
        {/*<SectionTitle size={'sm'} title={'VOICE ASSISTANT'} cardPadding={false} />*/}
        {list}
        {/*<SectionTitle size={'sm'} title={'APPLIANCES'} cardPadding={false} />*/}
        {/*{list}*/}
        {/*<SectionTitle size={'sm'} title={'ACTUATORS'} cardPadding={false} />*/}
        {/*{list}*/}
      </Flex>
    )
  }

  render() {
    const {hoveredDevice} = this.state;
    const {mode, devices, deviceToData, chartConfig} = this.props;

    if (mode === 'CARD') {
      return DeviceCollection.renderDevicesAsCards(
        devices,
        deviceToData,
        hoveredDevice,
        this.onCardHover,
        this.onCardLeaveHover,
        chartConfig,
      );
    } else if (mode === 'LIST') {
      return DeviceCollection.renderDevicesAsList(devices, deviceToData);
    }
    return null;
  }
}

DeviceCollection.propTypes = {
  devices: PropTypes.array.isRequired,
  deviceToData: PropTypes.objectOf(PropTypes.instanceOf(DeviceData)),
  mode: PropTypes.oneOf(['CARD', 'LIST']),
  chartConfig: PropTypes.object.isRequired,
};

DeviceCollection.defaultProps = {
  devices: [],
  deviceToData: {},
  mode: 'LIST',
};

export default DeviceCollection;

// when to update:
// after fetching, if devices are same, do not update
// when samples change, update