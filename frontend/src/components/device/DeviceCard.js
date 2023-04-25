'use es6';

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import Flex, {JustifyContent} from 'UIBean/Flex';
import FlexChild from 'UIBean/FlexChild';
import BCard from 'UIBean/BCard';
import BIcon from 'UIBean/BIcon';
import {
  OFF_BLACK,
  ORANGE_PEEL,
  TRON, EXTRA_LIGHT_COLOR, OFF_WHITE,
} from 'VizIoT/styles/base/viz-theme';
import TypographyComponent from 'UIBean/TypographyComponent';
import {formatBytes} from 'VizIoT/utility/FormatUtility';
import LineChart from 'VizIoT/components/LineChart';
import AutoFitComponent from 'VizIoT/components/AutoFitComponent';

const {H5} = TypographyComponent;

const borderRadius = '10px';

const DCard = styled(BCard)`
  min-width: 260px;
  min-height: 218px;
  
  // White version
  // background-color: white;
  // color: ${OFF_BLACK};
  
  // Tron version
  background-color: #67a8d812;
  border: #0f3b5c 1px solid;

  // border-style: solid;
  // border-color: ${ORANGE_PEEL};
  border-radius: ${borderRadius};

  transition: 0.3s;
  transition-timing-function: ease;
  z-index: 0;
  &:hover {
    transform: scale(1.02) translateY(-5px);
    z-index: 30;   
    box-shadow: #5fffd18c 0 0 40px;
  }
  &:hover:after {
      content: '';
      display: block;
      position: absolute;
      top: -3px;
      bottom: -3px;
      left: -3px;
      right: -3px;
      border-radius: 10px;
      border: ${TRON} 4px solid;
  }
  opacity: ${({active}) => (active ? 0.2 : 1)};
`;

const DName = styled(H5)`
  font-weight: 800;
  margin: 0;
`;

const DCategory = styled.div`
  font-weight: 400;
  margin-bottom: 4px;
  color: ${OFF_WHITE};
  text-transform: uppercase;
  font-size: 1.1rem;
  letter-spacing: 2px;
`;

const ConnectionsLabel = styled(H5)`
  color: ${TRON};
  font-weight: 500;
`;

const ConnectionsValue = styled.span`
  font-weight: 500;
`;

const ConnectionDestination = styled.span`
  margin-top: 6px;
  font-size: 1.2rem;
`;

const ConnectionDestinationHost = styled.span`
  font-weight: 700;
`;

const DeviceDownloadMetrics = styled(FlexChild)`
  text-align: left;
  min-width: 80px;
  padding-left: 5px;
  // color: ${TRON};
  opacity: 0.70;
`;

const DContent = styled(Flex)`
  height: 100%;
`;

const DRight = styled(FlexChild)`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
`;

const DEFAULT_VAL = '~';

const renderFacts = (cardFacts, providedFacts) => {
  if (providedFacts) {
    return providedFacts.map((fact, index) => {
      return (
        <DeviceDownloadMetrics key={index} style={{color: fact.color}}>
          <BIcon type={'fas'} name={fact.icon}
                 color={fact.color}/> {formatBytes(fact.data, undefined, 0) || DEFAULT_VAL}
        </DeviceDownloadMetrics>
      )
    })
  } else {
    return cardFacts.map((fact, index) => {
      return (
        <DeviceDownloadMetrics key={index} style={{color: fact.color}}>
          <BIcon type={'fas'} name={fact.icon} color={fact.color}/> {fact.data || DEFAULT_VAL}
        </DeviceDownloadMetrics>
      )
    })
  }
}

const DeviceCard = ({
                      onHover,
                      onLeaveHover,
                      active,
                      device: {name, category, macAddress},
                      velocity,
                      total,
                      dataIn,
                      dataOut,
                      dataStreams,
                      graphData,
                      graphColors,
                      factColors,
                      cardSymbols,
                      graphSize,
                      chartConfig: {
                        dataWindowSize,
                      },
                    }) => {

  // the original values provided with the device cards
  // if no data stream is provided, provide these facts as the default to preserve original functionality
  const cardFacts = [
    {
      icon: 'box',
      data: total,
    },
    {
      icon: 'arrow-alt-circle-up',
      data: dataIn,
    },
    {
      icon: 'arrow-alt-circle-down',
      data: dataOut,
    },
  ]

  // console.log(dataStreams)

  if (dataStreams && dataStreams.length !== factColors.length) {
    throw new Error('Provided facts and colors must be of equal length. Streams: '
      + dataStreams.length.toString() + ' -- Facts: ' + factColors.length.toString());
  }

  if (cardSymbols && dataStreams && cardSymbols.length !== dataStreams.length) {
    throw new Error('Number of Card Symbols provided do not match number of Data Streams provided: Symbols: '
      + cardSymbols.length.toString() + ' -- Streams: ' + dataStreams.length.toString());
  }

  // if facts are provided, coerce them into a collection of objects that can be rendered by renderFacts() method
  let providedFacts = undefined;
  if (dataStreams) {
    providedFacts = [];
    for (let i = 0; i < dataStreams.length; ++i) {
      if (cardSymbols) {
        providedFacts.push({
          icon: cardSymbols[i],
          data: dataStreams[i],
          color: factColors[i],
        })
      } else {
        providedFacts.push({
          icon: 'box',
          data: dataStreams[i],
          color: factColors[i],
        })
      }
    }
  }

  let cardWidth;
  const metricWidth = 90;
  if (providedFacts) {
    cardWidth = (providedFacts.length * metricWidth) + 10;
  } else {
    cardWidth = (cardFacts.length * metricWidth) + 10;
  }

  const graphWidth = Math.max(230, cardWidth - 30)

  return (
    <DCard
      onMouseEnter={onHover}
      onMouseLeave={onLeaveHover}
      compact={false}
      active={active}
      noPadding={true}
      style={{width: cardWidth}}
    >
      <DContent>
        <DRight className="p-4" grow={10}>
          <div style={{width: graphWidth}}>
            <LineChart
              className={graphSize ? graphSize : 'device-small-chart'}
              dataWindowSize={dataWindowSize}
              data={graphData}
              lineColors={graphColors}
            />
          </div>
          <FlexChild>
            <DCategory className="p-bot-1">{category}</DCategory>
            <DName>{name || macAddress}</DName>
          </FlexChild>
          <FlexChild>
            <ConnectionsLabel className="m-top-2 m-bot-4">
              <ConnectionsValue>{(velocity && formatBytes(velocity, 's', 0, false)) || DEFAULT_VAL}</ConnectionsValue>
            </ConnectionsLabel>

          </FlexChild>
          <FlexChild className="m-top-2">
            <Flex noWrap={true} justifyContent={JustifyContent.SPACE_BETWEEN} style={{textAlign: 'left'}}>
              {renderFacts(cardFacts, providedFacts)}
            </Flex>
          </FlexChild>
        </DRight>
      </DContent>
    </DCard>
  );
};

DeviceCard.defaultProps = {
  onHover: () => {
  },
  onLeaveHover: () => {
  },
  active: false,
  velocity: null,
  total: null,
  dataIn: null,
  dataOut: null,
  graphData: null,
};

DeviceCard.propTypes = {
  device: PropTypes.object.isRequired,
  onHover: PropTypes.func,
  onLeaveHover: PropTypes.func,
  active: PropTypes.bool,
  velocity: PropTypes.number,
  total: PropTypes.number,
  dataIn: PropTypes.number,
  dataOut: PropTypes.number,
  dataStreams: PropTypes.array,
  chartConfig: PropTypes.object.isRequired,
  graphData: PropTypes.array,
  graphSize: PropTypes.string,
  graphColors: PropTypes.array,
  factColors: PropTypes.array,
  cardSymbols: PropTypes.array,
};

export default DeviceCard;

// export default shouldUpdate((props, nextProps) => {
//   return props.active !== nextProps.active ||
//     props.device !== nextProps.device;
// })(DeviceCard);
