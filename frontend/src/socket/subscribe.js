'use es6';

import { io } from 'socket.io-client';
import {baseUrl} from '../constants/RequestConstants';

export const url = `${baseUrl}/chat`;

// Socket instance

// Debugging flags
const enableFlag = true;

export const createSocket = customUrl => {

  const connectUrl = customUrl || url;
  if (!enableFlag) {
    return;
  }
  // debugger
  const socket = io(connectUrl);
  socket.on('connect', () => {
    console.log(`connected: ${connectUrl}`);
  });

  // added this to see whats coming in
  socket.on('chat message', (msg) => {
    console.log(msg);
  })

  socket.on('connect_error', error => {
    console.log('connect_error');
    console.log(error);
  });

  socket.on('connect_timeout', (timeout) => {
    console.log('connect_timeout');
    console.log(timeout);
  });

  socket.on('disconnect', function () {
    console.log(`disconnected: ${connectUrl}`);
  });

  return socket;
};

export const CountRoom = '/total/count/1s';
export const SizeRoom = '/total/size/1s';
export const TodayCountRoom = '/total/count';
export const TodaySizeRoom = '/total/size';
export const Size1MinRoom = '/total/size/1min';
export const IndividualSizeRoom = '/individual/size/1s';
export const ByDeviceSizeRoomToday = '/individual/size';
export const IOCount = '/total/IO/1s';
export const IOMetric = '/total/IO/metric/1s'
export const ProtocolCount = '/total/protocol/1s';
export const ProtocolMetric = '/total/protocol/metric/1s'
export const DeviceDataIO = '/data/device/IO/1s';
export const DeviceDataProtocol = '/data/device/protocol/1s';
export const DeviceConnection = '/data/connections';
export const DeviceConnectionPackets1s = '/data/connections/1s';
export const DeviceConnectionPackets5s = '/data/connections/5s';
export const DeviceConnectionPackets60s = '/data/connections/60s';