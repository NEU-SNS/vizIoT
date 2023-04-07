'use es6';

import {path, pathOr} from 'ramda';

// Loose selectors for MVP, when reporting api is done, we will switch to generic selectors and hopefully these will be gone.

export const selectRecentPackets = path(['packets', 'packets', 'packetListing']);

export const selectTodaySize = path(['packets', 'pushSize', 'data']);

export const selectSize1Min = path(['packets', 'pushSize1MinStore', 'data']);

export const selectVelocity1Min = state => {
  const size10Min = selectSize1Min(state);
  return size10Min && (size10Min / 60.0);
};

export const selectTodayPacketCount = path(['packets', 'pushPacketCount', 'data']);

export const selectRealtimeVelocitySample = path(['packets', 'realtimeVelocitySample', 'data']);

export const selectRealtimeVelocitySizeSample = path(['packets', 'realtimeVelocitySizeSample', 'data']);

// export const numberOfActiveDevices = state => {
//   const deviceVolumes = pathOr([], ['packets', 'packetPerDevice', 'data', 'size'], state);
//   return deviceVolumes.length;
// };

export const selectDeviceToLiveSamples = path(['packets', 'realtimeIndividualVelocitySizeSample', 'data']);

// my selector
export const selectRealTimeIOTraffic = path(['packets', 'realTimeIOTraffic', 'data']);

export const selectRealTimeIOMetricTraffic = path(['packets', 'realTimeIOMetricTraffic', 'data'])

export const selectRealTimeProtocolTraffic = path(['packets', 'realTimeProtocolTraffic', 'data']);

export const selectRealTimeProtocolMetricTraffic = path(['packets', 'realTimeProtocolMetricTraffic', 'data'])
