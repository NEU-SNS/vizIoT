function initSocketIO(http) {

  const { Server } = require('socket.io')
  // Since Socket.IO v3, you need to explicitly enable CORS
  const io = new Server(http, {
    cors: {
      origin: "*"
    }
  })
  const TcpDataDa = require('./api/tcpData/tcpData.da')


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
  // setInterval(async () => {
  //   const result = await TcpDataDa.getRecentDataWithinNSeconds(interval)
  //   chat.emit('/chat/message', result);
  // }, interval)

  setInterval(async () => {
    const result = await TcpDataDa.getTotalCountFromStartOfTheDay()
    // console.log(result)
    chat.emit('/total/count', result)
  }, interval)

  setInterval(async () => {
    const result = await TcpDataDa.getTotalCountOfRecentDataWithinNSeconds(interval)
    // console.log(result)
    chat.emit('/total/count/1s', result)
  }, interval)

  setInterval(async () => {
    const result = await TcpDataDa.getTotalSizeFromStartOfTheDay(interval)
    // console.log(result)
    chat.emit('/total/size', result)
  }, interval)


  setInterval(async () => {
    const result = await TcpDataDa.getTotalSizeOfRecentDataWithinNSeconds(interval)
    // console.log(result)
    chat.emit('/total/size/1s', result)
  }, interval)


  setInterval(async () => {
    const result = await TcpDataDa.getAggregateMacAddressSizeDataWithinNSeconds(interval)
    // console.log(result)
    chat.emit('/individual/size/1s', result)
  }, interval)

  setInterval(async () => {
    const result = await TcpDataDa.getAggregateMacAddressSizeDataFromStartOfTheDay()
    // console.log(result)
    chat.emit('/individual/size', result)
  }, interval)

  const tenMinutes = 10 * 60 * 1000

  setInterval(async () => {
    const result = await TcpDataDa.getTotalSizeOfRecentDataWithinNSeconds(tenMinutes)
    // console.log(result)
    chat.emit('/total/size/10min', result)
  }, interval)


  setInterval(async () => {
    const result = await TcpDataDa.getTotalCountOfRecentDataWithinNSeconds(tenMinutes)
    // console.log(result)
    chat.emit('/total/count/10min', result)
  }, interval)

  const oneMinute = 1 * 60 * 1000

  setInterval(async () => {
    const result = await TcpDataDa.getTotalSizeOfRecentDataWithinNSeconds(oneMinute)
    // console.log(result)
    chat.emit('/total/size/1min', result)
  }, interval)


  setInterval(async () => {
    const result = await TcpDataDa.getTotalCountOfRecentDataWithinNSeconds(oneMinute)
    // console.log(result)
    chat.emit('/total/count/1min', result)
  }, interval)

  setInterval(async () => {
    // console.log('starting get');
    const result = await TcpDataDa.getAggregateSentReceivedDataWithinNSeconds(interval)

    // shear total off of the metrics for live line graph
    result.size = result.size.slice(1)

    chat.emit('/total/IO/1s', result)
    // chat.emit('/total/IO/metric/1s', tempMetric);
  }, interval)

  setInterval(async () => {
    const result = await TcpDataDa.getAggregateProtocolDataWithinNSeconds(interval)

    chat.emit('/total/protocol/1s', result)
  }, interval)

  setInterval(async () => {
    // console.log('starting get');
    const result = await TcpDataDa.getAggregateSentReceivedDataWithinNSeconds(interval * 60)

    chat.emit('/total/IO/metric/1s', result)
  }, interval)

  setInterval(async () => {
    // console.log('starting get');
    const result = await TcpDataDa.getAggregateProtocolDataWithinNSeconds(interval * 60)

    chat.emit('/total/protocol/metric/1s', result)
  }, interval)

  // send top 3 devices for IO devices here
  setInterval(async () => {

    const metricLength = 30
    const secondData = TcpDataDa.getDeviceSentReceivedDataWithinNSeconds(interval)
    const metricData = TcpDataDa.getDeviceSentReceivedDataWithinNSeconds(interval * metricLength)

    const awaitVals = await Promise.all([secondData, metricData])
    const second = awaitVals[0]
    const metric = awaitVals[1]

    const devices = []

    Object.keys(metric.deviceData).forEach(d => {
      const secondDevice = second.deviceData[d]
      if (secondDevice) {
        devices.push({
          macAddress: d,
          velocity: (metric.deviceData[d].total / metricLength),
          totalTraffic: metric.deviceData[d].total,
          inTraffic: metric.deviceData[d].received,
          outTraffic: metric.deviceData[d].sent,
          data: {
            startMS: second.startMS,
            endMS: second.endMS,
            size: [secondDevice.sent, secondDevice.received],
          }
          ,
        })
      } else {
        devices.push({
          macAddress: d,
          velocity: (metric.deviceData[d].total / 30),
          totalTraffic: metric.deviceData[d].total,
          inTraffic: metric.deviceData[d].received,
          outTraffic: metric.deviceData[d].sent,
          data: {
            startMS: second.startMS,
            endMS: second.endMS,
            size: [0, 0],
          },
        })
      }
    })

    devices.sort((a, b) => {
      return a.totalTraffic - b.totalTraffic
    })

    let devicesShown = 3
    let fixedDevicesShown = devicesShown * -1
    const sortedDevices = devices.slice(fixedDevicesShown)

    const deviceData = {
      deviceData: sortedDevices,
    }

    chat.emit('/data/device/IO/1s', deviceData)
  }, interval)

  // send top 3 devices for Protocol here
  setInterval(async () => {

    const metricLength = 30
    const secondData = TcpDataDa.getDeviceProtocolDataWithinNSeconds(interval)
    const metricData = TcpDataDa.getDeviceProtocolDataWithinNSeconds(interval * metricLength)

    const awaitVals = await Promise.all([secondData, metricData])
    const second = awaitVals[0]
    const metric = awaitVals[1]

    const devices = []

    Object.keys(metric.deviceData).forEach(d => {
      const secondDevice = second.deviceData[d]
      if (secondDevice) {
        devices.push({
          macAddress: d,
          velocity: ((metric.deviceData[d].TCP + metric.deviceData[d].UDP + metric.deviceData[d].HTTP + metric.deviceData[d].DNS) / 30),
          tcpTraffic: metric.deviceData[d].TCP,
          udpTraffic: metric.deviceData[d].UDP,
          httpTraffic: metric.deviceData[d].HTTP,
          dnsTraffic: metric.deviceData[d].DNS,
          data: {
            startMS: second.startMS,
            endMS: second.endMS,
            size: [secondDevice.TCP, secondDevice.UDP, secondDevice.HTTP, secondDevice.DNS],
          },
        })
      } else {
        devices.push({
          macAddress: d,
          velocity: ((metric.deviceData[d].TCP + metric.deviceData[d].UDP + metric.deviceData[d].HTTP + metric.deviceData[d].DNS) / 30),
          tcpTraffic: metric.deviceData[d].TCP,
          udpTraffic: metric.deviceData[d].UDP,
          httpTraffic: metric.deviceData[d].HTTP,
          dnsTraffic: metric.deviceData[d].DNS,
          data: {
            startMS: second.startMS,
            endMS: second.endMS,
            size: [0, 0, 0, 0],
          },
        })
      }
    })

    devices.sort((a, b) => {
      return (a.tcpTraffic + a.udpTraffic + a.httpTraffic + a.dnsTraffic) - (b.tcpTraffic + b.udpTraffic + b.httpTraffic + b.dnsTraffic)
    })

    let devicesShown = 3
    let fixedDevicesShown = devicesShown * -1
    const sortedDevices = devices.slice(fixedDevicesShown)

    const deviceData = {
      deviceData: sortedDevices,
    }

    chat.emit('/data/device/protocol/1s', deviceData)
  }, interval)


  setInterval(async () => {
    // console.log('starting get');
    const connections = await TcpDataDa.getConnectionSentReceivedDataWithinNSeconds(interval)

    chat.emit('/data/connections/1s', {connections})
  }, 1000)


// const news = io
//   .of('/news')
//   .on('connection', function (socket) {
//     socket.emit('item', { news: 'item' });
//   });

}

module.exports = {
  initSocketIO,
}
