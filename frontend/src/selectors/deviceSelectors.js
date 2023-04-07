'use es6';

import AnalyticsRequest from '../data/records/AnalyticsRequest';
import {ConnectionMetric} from '../data/metrics/ConnectionMetric';
import DataReducerTypes from '../constants/DataReducerTypes';
import {convertDateTypeToString} from '../utility/TimeUtility';
import {DateConstants} from '../constants/DateConstants';
import GeoDimension from '../data/dimensions/GeoDimension';
import * as R from 'ramda';
import * as device from '../data/device/DeviceLenses';
import {createSelector} from 'reselect';
import {selectDeviceToLiveSamples} from './packetSelector';
import {
  takeTop3Size,
  macAddress,
  makeMacAddressLens,
  lastSizeSamples,
  getLastSizeSamples, getDeviceDataByMac
} from '../data/device/DeviceDataLenses';
import {findMultiDeviceByMac} from '../data/device/DeviceLenses';

export const selectDeviceList = R.view(device.deviceListValue);

export const selectDeviceIdList = R.view(device.idList);

export const selectNumberOfDevices = R.view(device.count);

export const searchForDevice = searchValue => createSelector(
  [selectDeviceList],
  findMultiDeviceByMac(searchValue),
);


export const selectEntireNetwork = ({devices: {entireNetwork}}) => {
  return entireNetwork;
};

/**
 * Returns a map of device.macAddr -> last seen
 */
export const selectLastSeen = R.path(['devices', 'lastSeen', 'value']);

export const selectNumberOfConnections = R.path(['device', 'numberOfConnections', 'value']);

export const selectNumberOfActiveDevices = state => {
  const activeDevices = R.pathOr([], ['devices', 'activeDevices', 'data'], state);
  return activeDevices.length;
};

// export const selectPercentUnsecuredToday = state => {
// const { analytics } = state;
// const key = new AnalyticsRequest({
//   dimensions: [],
//   metrics: [ConnectionMetric.PERCENT_SECURED],
//   reducer: DataReducerTypes.INDIVIDUAL,
//   startTime: convertDateTypeToString[DateConstants.TODAY](),
//   endTime: convertDateTypeToString[DateConstants.NOW](),
// }).hashCode();

// const percentSecured = analytics.values[key].report.data.rows.metrics[0];
// };

export const selectMacAddressToAlias = createSelector(
  [selectDeviceList],
  deviceList => {
    R.pipe(
      R.defaultTo([]),
      R.reduce((acc, {macAddress, alias}) => {
        return {
          ...acc,
          [macAddress]: alias,
        };
      }, {})
    )(deviceList);
  }
);

export const selectDeviceDataByDeviceMac = macAddress => createSelector(
  [selectDeviceToLiveSamples],
  getDeviceDataByMac(macAddress),
);

export const selectDeviceDataSamplesByDeviceMac = macAddress => createSelector(
  [selectDeviceDataByDeviceMac(macAddress)],
  (maybeDeviceData) => maybeDeviceData && getLastSizeSamples(maybeDeviceData)
);

// top 3 devices with most connections in the last 30 seconds
// visualize using a bar chart, which is better for
export const selectThreeDevices = createSelector(
  [selectDeviceList, selectDeviceToLiveSamples],
  (devices, deviceToLiveSamples) => {

    const mapToMacAddresses = R.pipe(
      R.map(R.view(macAddress)),
      R.defaultTo([]),
    );

    const mapToDevices = R.map(
      macAddress => device.findDeviceByMac(macAddress)(devices) || {macAddress}
    );

    const threeDevices = R.pipe(
      takeTop3Size,
      mapToMacAddresses,
      mapToDevices,
    )(deviceToLiveSamples);

    return threeDevices;
  }
);