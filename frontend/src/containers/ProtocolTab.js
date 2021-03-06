import React from 'react';
import {
  pushRealTimeProtocolMetricTraffic,
  pushRealTimeProtocolTraffic
} from '../actions/packetActions';
import {
  selectRealTimeProtocolMetricTraffic,
  selectRealTimeProtocolTraffic
} from '../selectors/packetSelector';
import {IOMetric, ProtocolCount, ProtocolMetric, DeviceDataIO, DeviceDataProtocol} from '../socket/subscribe';
import LineGraphPage from './LineGraphPage';
import {resourceFactory} from '../Factories/ResourceFactory';
import {factFactory} from '../Factories/FactFactory';
import {getDeviceIOData} from '../data/aggregators/DeviceDataIOAggregator';
import {parseDeviceIO, parseDeviceProtocol} from '../data/api/packetApi';
import {fetcherFactory} from '../Factories/FetcherFactory';
import {fetchDeviceData} from '../data/api/devicesApi';
import {getDevices} from '../data/aggregators/DeviceAggregator';
import {getDeviceProtocolData} from '../data/aggregators/DeviceDataProtocolAggregator';


export const ProtocolTab = ({}) => {

  const tcpFact = factFactory('TCP', 'white', true);
  const udpFact = factFactory('UDP', '#03cbac', true);
  const httpFact = factFactory('HTTP', '#d9b409', true);
  const dnsFact = factFactory('DNS', 'red', true);

  const facts = [tcpFact, udpFact, httpFact, dnsFact]

  const resources = resourceFactory(ProtocolCount, selectRealTimeProtocolTraffic, pushRealTimeProtocolTraffic)
  const metricResources = resourceFactory(ProtocolMetric, selectRealTimeProtocolMetricTraffic, pushRealTimeProtocolMetricTraffic)
  const individualGraphResources = resourceFactory(DeviceDataProtocol, getDeviceProtocolData, parseDeviceProtocol)
  const deviceFetcher = fetcherFactory(fetchDeviceData, getDevices, 15000)

  resources.inUse = true;

  return (
    <LineGraphPage
      graphResource={resources}
      graphSocketOverride={true}
      metricResource={metricResources}
      metricSocketOverride={true}
      individualGraphResource={individualGraphResources}
      individualGraphSize='device-large-chart'
      individualDeviceFetcher={deviceFetcher}
      facts={facts}
      pageTitle={'Protocol Traffic'}
      pageSubtitle={'View network protocol traffic in real time'}
      graphTitle={'Network Traffic'}
      chartTitle={'Network'}
      chartSubtitle={'BYTES / SEC'}
      legendTitle={'Total protocol traffic over last 60 seconds'}
    />
  )
}