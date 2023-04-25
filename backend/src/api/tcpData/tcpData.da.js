const _ = require('lodash')
const {standardize} = require('mac-address-util')
const {TcpDataModel} = require('./tcpData.model')
const {DeviceModel} = require('../device/device.model')
const {getStartOfToday, getNow} = require('../../util/time')
const {removeLeadingZeros} = require('../../util/FormatUtility')
const {getDeviceMap} = require('../../util/DeviceMap')

module.exports = {
  getRecentDataWithinNSeconds,
  getTotalCountFromStartOfTheDay,
  getTotalSizeFromStartOfTheDay,
  getTotalCountOfRecentDataWithinNSeconds,
  getTotalSizeOfRecentDataWithinNSeconds,
  getAggregateMacAddressSizeDataByTime,
  getAggregateMacAddressSizeDataWithinNSeconds,
  getAggregateMacAddressSizeDataFromStartOfTheDay,
  getAggregateSentReceivedDataWithinNSeconds,
  getDeviceSentReceivedDataWithinNSeconds,
  getConnectionSentReceivedDataWithinNSeconds,
  getConnectionSentReceivedDataByTime,
  getAggregateProtocolDataWithinNSeconds,
  getDeviceProtocolDataWithinNSeconds,
  populateDeviceMap,
  deleteOldData
}

let macAddrs = {}

async function populateDeviceMap() {
  macAddrs = await getDeviceMap()
}

function buildSizeMacAddressData(macPacketList) {
  const macSizeMap = {}

  macPacketList.forEach((macPacket) => {
    const {size, _id} = macPacket

    const {src_mac, dst_mac} = _id

    if (!_.isNil(src_mac)) {
      if (src_mac in macSizeMap) {
        macSizeMap[src_mac] += size
      } else {
        macSizeMap[src_mac] = size
      }
    }

    if (!_.isNil(dst_mac)) {
      if (dst_mac in macSizeMap) {
        macSizeMap[dst_mac] += size
      } else {
        macSizeMap[dst_mac] = size
      }
    }

  })
  return macSizeMap
}

function convertDeviceListToMap(devices) {
  const deviceMap = {}
  _.forEach(devices, (device) => {
    const standardizedMacAddress = standardize(device['macAddress'])
    deviceMap[standardizedMacAddress] = device['name']
  })
  return deviceMap
}

function mapMacAddressToDeviceName(macSizeMap, deviceMap) {
  const results = []
  _.forEach(macSizeMap, function (size, mac) {
    const standardizedMacAddress = standardize(mac)

    const data = {
      size,
      macAddress: standardizedMacAddress,
    }
    data['name'] = ''
    if (standardizedMacAddress in deviceMap) {
      data['name'] = deviceMap[standardizedMacAddress]
    }
    results.push(data)
  })
  return results
}

async function getRecentDataWithinNSeconds(pastMS) {
  if (_.isNil(pastMS)) {
    throw Error('n is undefined')
  }
  const endMS = Date.now()
  const startMS = endMS - pastMS
  return getAggregateDataByTime(startMS, endMS)
}

async function getAggregateMacAddressSizeDataWithinNSeconds(pastMS) {
  if (_.isNil(pastMS)) {
    throw Error('n is undefined')
  }
  const endMS = Date.now()
  const startMS = endMS - pastMS
  const size = await getAggregateMacAddressSizeDataByTime(startMS, endMS)
  return {
    size,
    startMS,
    endMS,
  }
}


async function getTotalSizeOfRecentDataWithinNSeconds(pastMS) {
  if (_.isNil(pastMS)) {
    throw Error('n is undefined')
  }
  const endMS = Date.now()
  const startMS = endMS - pastMS
  const size = await getAggregateSizeDataByTime(startMS, endMS)
  return {
    size,
    startMS,
    endMS,
  }
}


async function getAggregateMacAddressSizeDataFromStartOfTheDay() {
  const endMS = Date.now()
  const startMS = getStartOfToday()
  const size = await getAggregateMacAddressSizeDataByTime(startMS, endMS)
  return {
    size,
    startMS,
    endMS,
  }
}


async function getTotalCountOfRecentDataWithinNSeconds(pastMS) {
  if (_.isNil(pastMS)) {
    throw Error('n is undefined')
  }
  const endMS = Date.now()
  const startMS = endMS - pastMS
  const count = await getAggregateCountDataByTime(startMS, endMS)
  return {
    count,
    startMS,
    endMS,
  }
}

async function getTotalCountFromStartOfTheDay() {
  const startMS = getStartOfToday()
  const endMS = getNow()

  const count = await getAggregateCountDataByTime(startMS, endMS)

  return {
    count,
    startMS,
    endMS,
  }
}


async function getTotalSizeFromStartOfTheDay() {
  const startMS = getStartOfToday()
  const endMS = getNow()

  const size = await getAggregateSizeDataByTime(startMS, endMS)

  return {
    size,
    startMS,
    endMS,
  }
}

async function getAggregateCountDataByTime(startMS, endMS) {

  const resultsFromTcpData = await TcpDataModel.aggregate([
    {
      $match: {
        timestamp: {$gte: startMS, $lte: endMS},
      },
    },
    {$group: {_id: null, count: {$sum: 1}}},
  ])

  let count = 0

  if (resultsFromTcpData.length > 0) {
    // console.log('resultsFromTcpData: ' + resultsFromTcpData[0].count)
    count += resultsFromTcpData[0].count
  }

  return count
}

async function getAggregateSizeDataByTime(startMS, endMS) {

  const resultsFromTcpData = await TcpDataModel.aggregate([
    {
      $match: {
        timestamp: {$gte: startMS, $lte: endMS},
      },
    },
    {$group: {_id: null, size: {$sum: '$packet_size'}}},
  ])

  let size = 0

  if (resultsFromTcpData.length > 0) {
    // console.log('resultsFromTcpData: ' + resultsFromTcpData[0].size)
    size += resultsFromTcpData[0].size
  }

  return size
}


async function getAggregateMacAddressSizeDataByTime(startMS, endMS) {
  const tcpDataPromise = TcpDataModel.aggregate([
    {
      $match: {
        timestamp: {$gte: startMS, $lte: endMS},
      },
    },
    {$group: {_id: {src_mac: '$src_mac', dst_mac: '$dst_mac'}, size: {$sum: '$packet_size'}}},
  ])

  const devicesDataPromise = DeviceModel.find()
  // parallel promises
  const values = await Promise.all([tcpDataPromise, devicesDataPromise])

  const resultsFromTcpData = values[0]
  const devices = values[1]
  const deviceMap = convertDeviceListToMap(devices)

  const resultMap = buildSizeMacAddressData(resultsFromTcpData)
  const results = mapMacAddressToDeviceName(resultMap, deviceMap)

  return results
}

// getAggregateMacAddressSizeDataByTime(Date.now() - 1000000, Date.now())

async function getAggregateDataByTime(startMS, endMS) {
  return TcpDataModel.find({
    timestamp: {$gte: startMS, $lte: endMS},
  })
}

async function getAggregateSentReceivedDataByTime(startMS, endMS) {
  const resultsFromTcpData = await TcpDataModel.aggregate([
    {
      $match: {
        timestamp: {$gte: startMS, $lte: endMS},
      },
    },
    // { $group: { _id: '$src_mac', res: { $push: ['$dst_mac', '$packet_size'] } } },
  ])

  let sent = 0
  let received = 0
  let total = 0

  for (let i = 0; i < resultsFromTcpData.length; ++i) {
    const packet = resultsFromTcpData[i]
    if (packet.hasOwnProperty('src_mac') && packet.hasOwnProperty('dst_mac') && packet.hasOwnProperty('packet_size')) {
      const fixedSrc = removeLeadingZeros(packet.src_mac)
      const fixedDst = removeLeadingZeros(packet.dst_mac)
      if (macAddrs.hasOwnProperty(fixedSrc)) {
        sent += packet.packet_size
        total += packet.packet_size
      } else if (macAddrs.hasOwnProperty(fixedDst)) {
        received += packet.packet_size
        total += packet.packet_size
      }
    }
  }

  return [total, sent, received]
}

async function getAggregateSentReceivedDataWithinNSeconds(pastMS) {
  const endMS = Date.now()
  const startMS = endMS - pastMS

  const size = await getAggregateSentReceivedDataByTime(startMS, endMS)

  return {
    size,
    startMS,
    endMS,
  }
}

async function getDeviceSentReceivedDataByTime(startMS, endMS) {
  const resultsFromTcpData = await TcpDataModel.aggregate([
    {
      $match: {
        timestamp: {$gte: startMS, $lte: endMS},
      },
    },
  ])

  const deviceData = {}

  for (let i = 0; i < resultsFromTcpData.length; ++i) {
    const packet = resultsFromTcpData[i]
    if (packet.hasOwnProperty('src_mac') && packet.hasOwnProperty('dst_mac') && packet.hasOwnProperty('packet_size')) {

      let sent = 0
      let received = 0
      let mac = ''

      const fixedSrc = removeLeadingZeros(packet.src_mac)
      const fixedDst = removeLeadingZeros(packet.dst_mac)

      if (macAddrs.hasOwnProperty(fixedSrc)) {
        sent = packet.packet_size
        mac = fixedSrc
      } else if (macAddrs.hasOwnProperty(fixedDst)) {
        received = packet.packet_size
        mac = fixedDst
      } else {
        continue
      }

      if (deviceData.hasOwnProperty(mac)) {
        const currSent = deviceData[mac].sent
        const currReceived = deviceData[mac].received
        const currTotal = deviceData[mac].total

        deviceData[mac].sent = currSent + sent
        deviceData[mac].received = currReceived + received
        deviceData[mac].total = currTotal + sent + received
      } else {
        deviceData[mac] = {
          macAddress: mac,
          sent: sent,
          received: received,
          total: (sent + received),
        }
      }
    }
  }

  return deviceData
}

async function getDeviceSentReceivedDataWithinNSeconds(pastMS) {
  const endMS = Date.now()
  const startMS = endMS - pastMS

  const deviceData = await getDeviceSentReceivedDataByTime(startMS, endMS)

  return {
    deviceData,
    startMS,
    endMS,
  }
}

async function getAggregateProtocolDataByTime(startMS, endMS) {
  const resultsFromTcpData = await TcpDataModel.aggregate([
    {
      $match: {
        timestamp: {$gte: startMS, $lte: endMS},
      },
    },
    // { $group: { _id: '$src_mac', res: { $push: ['$dst_mac', '$packet_size'] } } },
  ])

  let TCP = 0
  let UDP = 0
  let HTTP = 0
  let DNS = 0

  for (let i = 0; i < resultsFromTcpData.length; ++i) {
    const packet = resultsFromTcpData[i]
    if (packet.hasOwnProperty('protocols') && packet.hasOwnProperty('packet_size')) {
      const protocols = packet.protocols

      const fixedSrc = removeLeadingZeros(packet.src_mac)
      const fixedDst = removeLeadingZeros(packet.dst_mac)

      if (macAddrs.hasOwnProperty(fixedSrc) || macAddrs.hasOwnProperty(fixedDst)) {
        const packetSize = packet.packet_size
        if (protocols.includes('TCP')) {
          TCP += packetSize
        }
        if (protocols.includes('UDP')) {
          UDP += packetSize
        }
        if (protocols.includes('HTTP')) {
          HTTP += packetSize
        }
        if (protocols.includes('DNS')) {
          DNS += packetSize
        }
      }
    }
  }

  return [TCP, UDP, HTTP, DNS]
}

async function getAggregateProtocolDataWithinNSeconds(pastMS) {
  const endMS = Date.now()
  const startMS = endMS - pastMS

  const size = await getAggregateProtocolDataByTime(startMS, endMS)

  return {
    size,
    startMS,
    endMS,
  }
}

async function getDeviceProtocolDataByTime(startMS, endMS) {
  const resultsFromTcpData = await TcpDataModel.aggregate([
    {
      $match: {
        timestamp: {$gte: startMS, $lte: endMS},
      },
    },
  ])

  const deviceData = {}

  for (let i = 0; i < resultsFromTcpData.length; ++i) {
    const packet = resultsFromTcpData[i]
    if (packet.hasOwnProperty('protocols') && packet.hasOwnProperty('packet_size')) {

      let TCP = 0
      let UDP = 0
      let HTTP = 0
      let DNS = 0
      let mac = ''

      const fixedSrc = removeLeadingZeros(packet.src_mac)
      const fixedDst = removeLeadingZeros(packet.dst_mac)
      const protocols = packet.protocols

      if (macAddrs.hasOwnProperty(fixedSrc)) {
        mac = fixedSrc
      } else if (macAddrs.hasOwnProperty(fixedDst)) {
        mac = fixedDst
      } else {
        continue
      }

      const packetSize = packet.packet_size
      if (protocols.includes('TCP')) {
        TCP += packetSize
      }
      if (protocols.includes('UDP')) {
        UDP += packetSize
      }
      if (protocols.includes('HTTP')) {
        HTTP += packetSize
      }
      if (protocols.includes('DNS')) {
        DNS += packetSize
      }

      if (deviceData.hasOwnProperty(mac)) {
        const currTCP = deviceData[mac].TCP
        const currUDP = deviceData[mac].UDP
        const currHTTP = deviceData[mac].HTTP
        const currDNS = deviceData[mac].DNS


        deviceData[mac].TCP = currTCP + TCP
        deviceData[mac].UDP = currUDP + UDP
        deviceData[mac].HTTP = currHTTP + HTTP
        deviceData[mac].DNS = currDNS + DNS
      } else {
        deviceData[mac] = {
          macAddress: mac,
          TCP: TCP,
          UDP: UDP,
          HTTP: HTTP,
          DNS: DNS,
        }
      }
    }
  }

  return deviceData
}

async function getDeviceProtocolDataWithinNSeconds(pastMS) {
  const endMS = Date.now()
  const startMS = endMS - pastMS

  const deviceData = await getDeviceProtocolDataByTime(startMS, endMS)

  return {
    deviceData,
    startMS,
    endMS,
  }
}

async function getConnectionSentReceivedDataByTime(startMS, endMS) {
  const resultsFromTcpData = await TcpDataModel.aggregate([
    {
      $match: {
        timestamp: {$gte: startMS, $lte: endMS},
      },
    },
  ])

  const connectionObject = {}

  for (let i = 0; i < resultsFromTcpData.length; ++i) {
    const packet = resultsFromTcpData[i]
    if (packet.hasOwnProperty('src_mac') && packet.hasOwnProperty('dst_mac') && packet.hasOwnProperty('packet_size')) {

      let sent = 0
      let received = 0
      let macKey = ''

      const fixedSrc = removeLeadingZeros(packet.src_mac)
      const fixedDst = removeLeadingZeros(packet.dst_mac)

      if (macAddrs.hasOwnProperty(fixedSrc)) {
        sent = packet.packet_size
        macKey = fixedSrc + '--' + fixedDst
      } else if (macAddrs.hasOwnProperty(fixedDst)) {
        received = packet.packet_size
        macKey = fixedDst + '--' + fixedSrc
      } else {
        continue
      }

      if (connectionObject.hasOwnProperty(macKey)) {
        const currSent = connectionObject[macKey].sent
        const currReceived = connectionObject[macKey].received

        connectionObject[macKey].sent = currSent + sent
        connectionObject[macKey].received = currReceived + received
      } else {
        connectionObject[macKey] = {
          sent: sent,
          received: received,
        }
      }
    }
  }

  // convert object into connectiosn after all data has been aggregated
  const connections = Object.keys(connectionObject).map(key => {
    return {
      id: key,
      size: [connectionObject[key].sent, connectionObject[key].received],
      time: endMS,
    }
  })

  return connections
}

async function getConnectionSentReceivedDataWithinNSeconds(pastMS) {

  const endMS = Date.now()
  const startMS = endMS - pastMS

  const connections = await getConnectionSentReceivedDataByTime(startMS, endMS)

  return connections

}

async function deleteOldData(timeToBeDeleted) {
  const {deletedCount} = await TcpDataModel.deleteMany({timestamp: {$lte: timeToBeDeleted}})
  return deletedCount
}


