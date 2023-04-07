function initSocketIO(http) {

  const { Server } = require('socket.io')
  // Since Socket.IO v3, CORS needs to be enabled explicitly
  const io = new Server(http, {
    cors: {
      origin: "*"
    }
  })
  
  const TcpDataSocketDa = require('./api/tcpData/tcpData.socket.da')
  const TcpDataDa = require('./api/tcpData/tcpData.da')
  const DeviceDa = require('./api/device/device.da')
  const customTimer = require('./util/customTimer')
  const moment = require('moment')
  const _ = require('lodash')

  // const log4js = require("log4js");
  // log4js.configure({
  //   appenders: { db: { type: "file", filename: "db.log" } },
  //   categories: { default: { appenders: ["db"], level: "trace" } },
  // });
  // const logger = log4js.getLogger("db");
//
// io.on('connection', function(socket){
//   console.log('a user connected');
//   socket.on('chat message', function(msg){
//     console.log('message: ' + msg);
//   });
//
// });

  const chat = io
    .of('/chat')

  chat.on('connection', function (socket) {
    // console.log('a cat user connected');
    socket.on('/chat/message', function (data) {
      // chat.emit('/chat/message', data)
      // socket.broadcast.emit('/chat/message', data);

      // console.log(data)
    })
    socket.on('/total/count', function (data) {
      // chat.emit('/chat/message', data)
      // socket.broadcast.emit('/chat/message', data);

      // console.log(data)
    })
    socket.on('/total/count/500ms', function (data) {
      // chat.emit('/chat/message', data)
      // socket.broadcast.emit('/chat/message', data);

      // console.log(data)
    })

    //
    // socket.emit('a message', {
    //   that: 'only',
    //   '/chat': 'will get'
    // });
    // chat.emit('a message', {
    //   everyone: 'in',
    //   '/chat': 'will get'
    // });
  })

  const interval = 1000
  const initialMetricOfToday = {
    totalSize: {
      size: 0,
      startMS: undefined,
      endMS: undefined,
    },
    activeDevices: new Set()
  }

  let metricOfToday = _.cloneDeep(initialMetricOfToday)
  let resetMoment = moment().endOf('day')

  const transmitData = async(eventName, handler, dataSource) => {
    const result = handler(dataSource)
    chat.emit(eventName, result)
  }

  /* 
  The setIntervals commented out below send many queries at the same and some of them take more than the interval to complete, which slow down all the queries and crash the system eventually
  Most setIntervals need the same raw data from the database, so instead of querying data for every websocket room, data is distributed to handlers, which avoids repetitive queries
  Also, customTimers are used, which only starts the next loop before the last loop completes
  Since some handlers require muliple data, it seems some data fetching functions have to be placed in a customTimer.
  */

  customTimer(async () => {
    const endMS = Date.now()
    const startMS1S = endMS - interval
    
    const metricLength = 30
    const startMS4Device = endMS - interval * metricLength

    const tcpData1S = await TcpDataSocketDa.getTcpDataByTime(startMS1S, endMS)
    
    transmitData('/total/size/1s', TcpDataSocketDa.getTotalSizeOfRecentDataAndUpdateMetricOfToday, {tcpData: {startMS: startMS1S, endMS, data: tcpData1S}, metricOfToday})
    transmitData('/total/IO/1s', TcpDataSocketDa.getAggregateSentReceivedData4Graph, {tcpData: {startMS: startMS1S, endMS, data: tcpData1S}})
    transmitData('/total/protocol/1s', TcpDataSocketDa.getAggregateProtocolDataByTime, {tcpData: {startMS: startMS1S, endMS, data: tcpData1S}})
    transmitData('/data/connections/1s', TcpDataSocketDa.getConnectionSentReceivedDataByTime, {tcpData: {startMS: startMS1S, endMS, data: tcpData1S}})
    
    const deviceData = await DeviceDa.getAll()
    transmitData('/individual/size/1s', TcpDataSocketDa.getAggregateMacAddressSizeDataBelow1Min, {tcpData: {startMS: startMS1S, endMS, data: tcpData1S}, deviceData, metricOfToday})
    
    const tcpData4Device = await TcpDataSocketDa.getTcpDataByTime(startMS4Device, endMS)

    transmitData('/data/device/IO/1s', TcpDataSocketDa.getTop3Devices4IO, {tcpData1S: {startMS: startMS1S, endMS, data: tcpData1S}, tcpData4Device: {startMS: startMS4Device, endMS, data: tcpData4Device}, metricLength})
    transmitData('/data/device/protocol/1s', TcpDataSocketDa.getTop3Devices4Protocol, {tcpData1S: {startMS: startMS1S, endMS, data: tcpData1S}, tcpData4Device: {startMS: startMS4Device, endMS, data: tcpData4Device}, metricLength})
  }, interval)

  customTimer(async () => {
    const endMS = Date.now()
    const startMS1Min = endMS - interval * 60

    const tcpData1Min = await TcpDataSocketDa.getTcpDataByTime(startMS1Min, endMS)

    transmitData('/total/size/1min', TcpDataSocketDa.getTotalSizeOfRecentData, {tcpData: {startMS: startMS1Min, endMS, data: tcpData1Min}})
    transmitData('/total/IO/metric/1s', TcpDataSocketDa.getAggregateSentReceivedData4Metric, {tcpData: {startMS: startMS1Min, endMS, data: tcpData1Min}})
    transmitData('/total/protocol/metric/1s', TcpDataSocketDa.getAggregateProtocolDataByTime, {tcpData: {startMS: startMS1Min, endMS, data: tcpData1Min}})
  }, interval)

  // update some one-day metrics
  customTimer(async () => {
    chat.emit('/total/size', metricOfToday.totalSize)
    chat.emit('/device/active', Array.from(metricOfToday.activeDevices))
  }, interval)

  customTimer(async () => {
    const timeToBeDeleted = Date.now() - interval * 60
    await TcpDataDa.deleteOldData(timeToBeDeleted)
  }, interval * 60)

  // clear some values after midnight
  customTimer(async () => {
    const now = moment()
    if (now > resetMoment) {
      metricOfToday = _.cloneDeep(initialMetricOfToday)
      resetMoment = moment().endOf('day')
    }
  }, interval)


  // const interval = 1000
  // setInterval(async () => {
  //   const result = await TcpDataDa.getRecentDataWithinNSeconds(interval)
  //   chat.emit('/chat/message', result);
  // }, interval)

  // Not being used
  // setInterval(async () => {
  //   const result = await TcpDataDa.getTotalCountFromStartOfTheDay()
  //   // console.log(result)
  //   chat.emit('/total/count', result)
  // }, interval)

  // Not being used
  // setInterval(async () => {
  //   const result = await TcpDataDa.getTotalCountOfRecentDataWithinNSeconds(interval)
  //   // console.log(result)
  //   chat.emit('/total/count/1s', result)
  // }, interval)

  // Done
  // setInterval(async () => {
  //   const result = await TcpDataDa.getTotalSizeFromStartOfTheDay(interval)
  //   // console.log(result)
  //   chat.emit('/total/size', result)
  // }, interval)

  // Done
  // setInterval(async () => {
  //   const result = await TcpDataDa.getTotalSizeOfRecentDataWithinNSeconds(interval)
  //   // console.log(result)
  //   chat.emit('/total/size/1s', result)
  // }, interval)

  // Done
  // setInterval(async () => {
  //   const result = await TcpDataDa.getAggregateMacAddressSizeDataWithinNSeconds(interval)
  //   // console.log(result)
  //   chat.emit('/individual/size/1s', result)
  // }, interval)

  // Done
  // setInterval(async () => {
  //   const result = await TcpDataDa.getAggregateMacAddressSizeDataFromStartOfTheDay()
  //   // console.log(result)
  //   chat.emit('/individual/size', result)
  // }, interval)

  // const tenMinutes = 10 * 60 * 1000
  // not being used
  // setInterval(async () => {
  //   const result = await TcpDataDa.getTotalSizeOfRecentDataWithinNSeconds(tenMinutes)
  //   // console.log(result)
  //   chat.emit('/total/size/10min', result)
  // }, interval)

  // not being used
  // setInterval(async () => {
  //   const result = await TcpDataDa.getTotalCountOfRecentDataWithinNSeconds(tenMinutes)
  //   // console.log(result)
  //   chat.emit('/total/count/10min', result)
  // }, interval)

  // const oneMinute = 1 * 60 * 1000
  // Done
  // setInterval(async () => {
  //   const result = await TcpDataDa.getTotalSizeOfRecentDataWithinNSeconds(oneMinute)
  //   // console.log(result)
  //   chat.emit('/total/size/1min', result)
  // }, interval)

  // not being used
  // setInterval(async () => {
  //   const result = await TcpDataDa.getTotalCountOfRecentDataWithinNSeconds(oneMinute)
  //   // console.log(result)
  //   chat.emit('/total/count/1min', result)
  // }, interval)

  // Done
  // setInterval(async () => {
  //   // console.log('starting get');
  //   const result = await TcpDataDa.getAggregateSentReceivedDataWithinNSeconds(interval)

  //   // shear total off of the metrics for live line graph
  //   result.size = result.size.slice(1)

  //   chat.emit('/total/IO/1s', result)
  //   // chat.emit('/total/IO/metric/1s', tempMetric);
  // }, interval)

  // Done
  // setInterval(async () => {
  //   const result = await TcpDataDa.getAggregateProtocolDataWithinNSeconds(interval)

  //   chat.emit('/total/protocol/1s', result)
  // }, interval)

  // Done
  // setInterval(async () => {
  //   // console.log('starting get');
  //   const result = await TcpDataDa.getAggregateSentReceivedDataWithinNSeconds(interval * 60)

  //   chat.emit('/total/IO/metric/1s', result)
  // }, interval)

  // Done
  // setInterval(async () => {
  //   // console.log('starting get');
  //   const result = await TcpDataDa.getAggregateProtocolDataWithinNSeconds(interval * 60)

  //   chat.emit('/total/protocol/metric/1s', result)
  // }, interval)

  // Done
  // send top 3 devices for IO devices here
  // setInterval(async () => {

  //   const metricLength = 30
  //   const secondData = TcpDataDa.getDeviceSentReceivedDataWithinNSeconds(interval)
  //   const metricData = TcpDataDa.getDeviceSentReceivedDataWithinNSeconds(interval * metricLength)

  //   const awaitVals = await Promise.all([secondData, metricData])
  //   const second = awaitVals[0]
  //   const metric = awaitVals[1]

  //   const devices = []

  //   Object.keys(metric.deviceData).forEach(d => {
  //     const secondDevice = second.deviceData[d]
  //     if (secondDevice) {
  //       devices.push({
  //         macAddress: d,
  //         velocity: (metric.deviceData[d].total / metricLength),
  //         totalTraffic: metric.deviceData[d].total,
  //         inTraffic: metric.deviceData[d].received,
  //         outTraffic: metric.deviceData[d].sent,
  //         data: {
  //           startMS: second.startMS,
  //           endMS: second.endMS,
  //           size: [secondDevice.sent, secondDevice.received],
  //         }
  //         ,
  //       })
  //     } else {
  //       devices.push({
  //         macAddress: d,
  //         velocity: (metric.deviceData[d].total / 30),
  //         totalTraffic: metric.deviceData[d].total,
  //         inTraffic: metric.deviceData[d].received,
  //         outTraffic: metric.deviceData[d].sent,
  //         data: {
  //           startMS: second.startMS,
  //           endMS: second.endMS,
  //           size: [0, 0],
  //         },
  //       })
  //     }
  //   })

  //   devices.sort((a, b) => {
  //     return a.totalTraffic - b.totalTraffic
  //   })

  //   let devicesShown = 3
  //   let fixedDevicesShown = devicesShown * -1
  //   const sortedDevices = devices.slice(fixedDevicesShown)

  //   const deviceData = {
  //     deviceData: sortedDevices,
  //   }

  //   chat.emit('/data/device/IO/1s', deviceData)
  // }, interval)

  // Done
  // send top 3 devices for Protocol here
  // setInterval(async () => {

  //   const metricLength = 30
  //   const secondData = TcpDataDa.getDeviceProtocolDataWithinNSeconds(interval)
  //   const metricData = TcpDataDa.getDeviceProtocolDataWithinNSeconds(interval * metricLength)

  //   const awaitVals = await Promise.all([secondData, metricData])
  //   const second = awaitVals[0]
  //   const metric = awaitVals[1]

  //   const devices = []

  //   Object.keys(metric.deviceData).forEach(d => {
  //     const secondDevice = second.deviceData[d]
  //     if (secondDevice) {
  //       devices.push({
  //         macAddress: d,
  //         velocity: ((metric.deviceData[d].TCP + metric.deviceData[d].UDP + metric.deviceData[d].HTTP + metric.deviceData[d].DNS) / 30),
  //         tcpTraffic: metric.deviceData[d].TCP,
  //         udpTraffic: metric.deviceData[d].UDP,
  //         httpTraffic: metric.deviceData[d].HTTP,
  //         dnsTraffic: metric.deviceData[d].DNS,
  //         data: {
  //           startMS: second.startMS,
  //           endMS: second.endMS,
  //           size: [secondDevice.TCP, secondDevice.UDP, secondDevice.HTTP, secondDevice.DNS],
  //         },
  //       })
  //     } else {
  //       devices.push({
  //         macAddress: d,
  //         velocity: ((metric.deviceData[d].TCP + metric.deviceData[d].UDP + metric.deviceData[d].HTTP + metric.deviceData[d].DNS) / 30),
  //         tcpTraffic: metric.deviceData[d].TCP,
  //         udpTraffic: metric.deviceData[d].UDP,
  //         httpTraffic: metric.deviceData[d].HTTP,
  //         dnsTraffic: metric.deviceData[d].DNS,
  //         data: {
  //           startMS: second.startMS,
  //           endMS: second.endMS,
  //           size: [0, 0, 0, 0],
  //         },
  //       })
  //     }
  //   })

  //   devices.sort((a, b) => {
  //     return (a.tcpTraffic + a.udpTraffic + a.httpTraffic + a.dnsTraffic) - (b.tcpTraffic + b.udpTraffic + b.httpTraffic + b.dnsTraffic)
  //   })

  //   let devicesShown = 3
  //   let fixedDevicesShown = devicesShown * -1
  //   const sortedDevices = devices.slice(fixedDevicesShown)

  //   const deviceData = {
  //     deviceData: sortedDevices,
  //   }

  //   chat.emit('/data/device/protocol/1s', deviceData)
  // }, interval)

  // Done
  // setInterval(async () => {
  //   // console.log('starting get');
  //   const connections = await TcpDataDa.getConnectionSentReceivedDataWithinNSeconds(interval)

  //   chat.emit('/data/connections/1s', {connections})
  // }, 1000)


// const news = io
//   .of('/news')
//   .on('connection', function (socket) {
//     socket.emit('item', { news: 'item' });
//   });

}

module.exports = {
  initSocketIO,
}
