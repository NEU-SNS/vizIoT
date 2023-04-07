const _ = require('lodash')
const { standardize } = require('mac-address-util')
const { TcpDataModel } = require("./tcpData.model");
const { getStartOfToday } = require('../../util/time')
const { removeLeadingZeros } = require("../../util/FormatUtility");
const { getDeviceMap } = require("../../util/DeviceMap")

module.exports = {
  getTcpDataByTime,
  getTotalCountOfRecentData,
  getTotalSizeOfRecentData,
  getAggregateMacAddressSizeDataBelow1Min,
  getAggregateSentReceivedData4Graph,
  getAggregateSentReceivedData4Metric,
  getAggregateProtocolDataByTime,
  getTop3Devices4IO,
  getTop3Devices4Protocol,
  getConnectionSentReceivedDataByTime,
  populateDeviceMap,
  getTotalSizeOfRecentDataAndUpdateMetricOfToday,
};

let macAddrs = {}

async function populateDeviceMap() {
  macAddrs = await getDeviceMap()
}

async function getTcpDataByTime(startMS, endMS) {
  const tcpData = await TcpDataModel.aggregate([
    {
      $match: {
        timestamp: { $gte: startMS, $lte: endMS },
      },
    },
  ]);
  return tcpData;
}

/**
 * Replace mongodb $group and $sum
 * @param {array} rawData 
 * @param {object} _id e.g. {src_mac: <src_mac>, dst_mac: <dst_mac>}
 * @param {string} field e.g. 'packet_size'
 * @param {string} newFieldName e.g. 'size'
 * @returns 
 */
function groupAndSum(rawData, _id, field, newFieldName) {
  const map = new Map();
  const res = [];
  rawData.forEach((data) => {
    let key = "";
    Object.keys(_id).forEach((groupBy) => (key += data[groupBy]));

    if (map.has(key)) {
      const index = map.get(key);
      res[index][newFieldName] += data[field];
    } else {
      map.set(key, res.length);
      const newSizeData = { _id: {}, [newFieldName]: data[field] };
      Object.keys(_id).forEach(
        (groupBy) => (newSizeData["_id"][groupBy] = data[groupBy])
      );
      res.push(newSizeData);
    }
  });

  return res;
}

function getTotalCountOfRecentData(dataSource) {
  const {
    tcpData: { startMS, endMS, data: tcpData },
  } = dataSource;
  return {
    count: tcpData.length,
    startMS,
    endMS,
  };
}

function getTotalSizeOfRecentData(dataSource) {
  const {
    tcpData: { startMS, endMS, data: tcpData },
  } = dataSource;

  let size = 0;
  tcpData.forEach((data) => {
    size += data["packet_size"]
  });

  return {
    size,
    startMS,
    endMS,
  };
}

function getTotalSizeOfRecentDataAndUpdateMetricOfToday(dataSource) {
  const result = getTotalSizeOfRecentData(dataSource)
  const { metricOfToday: {totalSize}} = dataSource;
  totalSize.size += result.size
  totalSize.startMS = getStartOfToday()
  totalSize.endMS = result.endMS
  return result
}

function convertDeviceListToMap(devices) {
  const deviceMap = {}
  _.forEach(devices, (device) => {
    const standardizedMacAddress = standardize(device['macAddress'])
    deviceMap[standardizedMacAddress] = device['name']
  })
  return deviceMap
}

function buildSizeMacAddressData(macPacketList) {
  const macSizeMap = {}

  macPacketList.forEach((macPacket) => {
    const { size, _id } = macPacket

    const { src_mac, dst_mac } = _id

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

function getAggregateMacAddressSizeDataBelow1Min(dataSource) {
  const {
    tcpData: { startMS, endMS, data: tcpData },
    deviceData,
    metricOfToday: {activeDevices}
  } = dataSource;

  const convertedTcpData = groupAndSum(
    tcpData,
    { src_mac: "src_mac", dst_mac: "dst_mac" },
    "packet_size",
    "size"
  );

  const deviceMap = convertDeviceListToMap(deviceData);
  const resultMap = buildSizeMacAddressData(convertedTcpData);
  const results = mapMacAddressToDeviceName(resultMap, deviceMap);
  
  // update active devices
  results.forEach(result => activeDevices.add(result.macAddress))

  return { size: results, startMS, endMS };
}

function getAggregateSentReceivedDataByTime(tcpData) {

  let sent = 0;
  let received = 0;
  let total = 0;

  for (let i = 0; i < tcpData.length; ++i) {
    const packet = tcpData[i];
    if (
      packet.hasOwnProperty("src_mac") &&
      packet.hasOwnProperty("dst_mac") &&
      packet.hasOwnProperty("packet_size")
    ) {
      const fixedSrc = removeLeadingZeros(packet.src_mac);
      const fixedDst = removeLeadingZeros(packet.dst_mac);
      if (macAddrs.hasOwnProperty(fixedSrc)) {
        sent += packet.packet_size;
        total += packet.packet_size;
      } else if (macAddrs.hasOwnProperty(fixedDst)) {
        received += packet.packet_size;
        total += packet.packet_size;
      }
    }
  }

  return [total, sent, received];
}

function getAggregateSentReceivedData4Graph(dataSource) {
  const {
    tcpData: { startMS, endMS, data: tcpData },
  } = dataSource;

  let size = getAggregateSentReceivedDataByTime(tcpData);
  size = size.slice(1);

  return {
    size,
    startMS,
    endMS,
  };
}

function getAggregateSentReceivedData4Metric(dataSource) {
  const {
    tcpData: { startMS, endMS, data: tcpData },
  } = dataSource;

  const size = getAggregateSentReceivedDataByTime(tcpData);

  return {
    size,
    startMS,
    endMS,
  };
}

function getAggregateProtocolDataByTime(dataSource) {
  const {
    tcpData: { startMS, endMS, data: tcpData },
  } = dataSource;
  let TCP = 0;
  let UDP = 0;
  let HTTP = 0;
  let DNS = 0;

  for (let i = 0; i < tcpData.length; ++i) {
    const packet = tcpData[i];
    if (
      packet.hasOwnProperty("protocols") &&
      packet.hasOwnProperty("packet_size")
    ) {
      const protocols = packet.protocols;

      const fixedSrc = removeLeadingZeros(packet.src_mac);
      const fixedDst = removeLeadingZeros(packet.dst_mac);

      if (
        macAddrs.hasOwnProperty(fixedSrc) ||
        macAddrs.hasOwnProperty(fixedDst)
      ) {
        const packetSize = packet.packet_size;
        if (protocols.includes("TCP")) {
          TCP += packetSize;
        }
        if (protocols.includes("UDP")) {
          UDP += packetSize;
        }
        if (protocols.includes("HTTP")) {
          HTTP += packetSize;
        }
        if (protocols.includes("DNS")) {
          DNS += packetSize;
        }
      }
    }
  }

  return {
    size: [TCP, UDP, HTTP, DNS],
    startMS,
    endMS,
  };
}

function getDeviceSentReceivedDataByTime(startMS, endMS, tcpData) {
  const deviceData = {};

  for (let i = 0; i < tcpData.length; ++i) {
    const packet = tcpData[i];
    if (
      packet.hasOwnProperty("src_mac") &&
      packet.hasOwnProperty("dst_mac") &&
      packet.hasOwnProperty("packet_size")
    ) {
      let sent = 0;
      let received = 0;
      let mac = "";

      const fixedSrc = removeLeadingZeros(packet.src_mac);
      const fixedDst = removeLeadingZeros(packet.dst_mac);

      if (macAddrs.hasOwnProperty(fixedSrc)) {
        sent = packet.packet_size;
        mac = fixedSrc;
      } else if (macAddrs.hasOwnProperty(fixedDst)) {
        received = packet.packet_size;
        mac = fixedDst;
      } else {
        continue;
      }

      if (deviceData.hasOwnProperty(mac)) {
        const currSent = deviceData[mac].sent;
        const currReceived = deviceData[mac].received;
        const currTotal = deviceData[mac].total;

        deviceData[mac].sent = currSent + sent;
        deviceData[mac].received = currReceived + received;
        deviceData[mac].total = currTotal + sent + received;
      } else {
        deviceData[mac] = {
          macAddress: mac,
          sent: sent,
          received: received,
          total: sent + received,
        };
      }
    }
  }

  return {
    deviceData,
    startMS,
    endMS,
  };
}

function getTop3Devices4IO(dataSource) {
  const {
    tcpData1S: { startMS: startMS1S, endMS: endMS1S, data: tcpData1S },
    tcpData4Device: {
      startMS: startMS4Device,
      endMS: endMS4Device,
      data: tcpData4Device,
    },
    metricLength,
  } = dataSource;

  const second = getDeviceSentReceivedDataByTime(startMS1S, endMS1S, tcpData1S);
  const metric = getDeviceSentReceivedDataByTime(
    startMS4Device,
    endMS4Device,
    tcpData4Device
  );

  const devices = [];

  Object.keys(metric.deviceData).forEach((d) => {
    const secondDevice = second.deviceData[d];
    if (secondDevice) {
      devices.push({
        macAddress: d,
        velocity: metric.deviceData[d].total / metricLength,
        totalTraffic: metric.deviceData[d].total,
        inTraffic: metric.deviceData[d].received,
        outTraffic: metric.deviceData[d].sent,
        data: {
          startMS: second.startMS,
          endMS: second.endMS,
          size: [secondDevice.sent, secondDevice.received],
        },
      });
    } else {
      devices.push({
        macAddress: d,
        velocity: metric.deviceData[d].total / metricLength,
        totalTraffic: metric.deviceData[d].total,
        inTraffic: metric.deviceData[d].received,
        outTraffic: metric.deviceData[d].sent,
        data: {
          startMS: second.startMS,
          endMS: second.endMS,
          size: [0, 0],
        },
      });
    }
  });

  devices.sort((a, b) => {
    return a.totalTraffic - b.totalTraffic;
  });

  let devicesShown = 3;
  let fixedDevicesShown = devicesShown * -1;
  const sortedDevices = devices.slice(fixedDevicesShown);

  return {
    deviceData: sortedDevices,
  };
}

function getDeviceProtocolDataByTime(startMS, endMS, tcpData) {
  const deviceData = {};

  for (let i = 0; i < tcpData.length; ++i) {
    const packet = tcpData[i];
    if (
      packet.hasOwnProperty("protocols") &&
      packet.hasOwnProperty("packet_size")
    ) {
      let TCP = 0;
      let UDP = 0;
      let HTTP = 0;
      let DNS = 0;
      let mac = "";

      const fixedSrc = removeLeadingZeros(packet.src_mac);
      const fixedDst = removeLeadingZeros(packet.dst_mac);
      const protocols = packet.protocols;

      if (macAddrs.hasOwnProperty(fixedSrc)) {
        mac = fixedSrc;
      } else if (macAddrs.hasOwnProperty(fixedDst)) {
        mac = fixedDst;
      } else {
        continue;
      }

      const packetSize = packet.packet_size;
      if (protocols.includes("TCP")) {
        TCP += packetSize;
      }
      if (protocols.includes("UDP")) {
        UDP += packetSize;
      }
      if (protocols.includes("HTTP")) {
        HTTP += packetSize;
      }
      if (protocols.includes("DNS")) {
        DNS += packetSize;
      }

      if (deviceData.hasOwnProperty(mac)) {
        const currTCP = deviceData[mac].TCP;
        const currUDP = deviceData[mac].UDP;
        const currHTTP = deviceData[mac].HTTP;
        const currDNS = deviceData[mac].DNS;

        deviceData[mac].TCP = currTCP + TCP;
        deviceData[mac].UDP = currUDP + UDP;
        deviceData[mac].HTTP = currHTTP + HTTP;
        deviceData[mac].DNS = currDNS + DNS;
      } else {
        deviceData[mac] = {
          macAddress: mac,
          TCP: TCP,
          UDP: UDP,
          HTTP: HTTP,
          DNS: DNS,
        };
      }
    }
  }

  return {
    deviceData,
    startMS,
    endMS,
  };
}

function getTop3Devices4Protocol(dataSource) {
  const {
    tcpData1S: { startMS: startMS1S, endMS: endMS1S, data: tcpData1S },
    tcpData4Device: {
      startMS: startMS4Device,
      endMS: endMS4Device,
      data: tcpData4Device,
    },
    metricLength,
  } = dataSource;

  const second = getDeviceProtocolDataByTime(startMS1S, endMS1S, tcpData1S);
  const metric = getDeviceProtocolDataByTime(
    startMS4Device,
    endMS4Device,
    tcpData4Device
  );

  const devices = [];

  Object.keys(metric.deviceData).forEach((d) => {
    const secondDevice = second.deviceData[d];
    if (secondDevice) {
      devices.push({
        macAddress: d,
        velocity:
          (metric.deviceData[d].TCP +
            metric.deviceData[d].UDP +
            metric.deviceData[d].HTTP +
            metric.deviceData[d].DNS) /
          metricLength,
        tcpTraffic: metric.deviceData[d].TCP,
        udpTraffic: metric.deviceData[d].UDP,
        httpTraffic: metric.deviceData[d].HTTP,
        dnsTraffic: metric.deviceData[d].DNS,
        data: {
          startMS: second.startMS,
          endMS: second.endMS,
          size: [
            secondDevice.TCP,
            secondDevice.UDP,
            secondDevice.HTTP,
            secondDevice.DNS,
          ],
        },
      });
    } else {
      devices.push({
        macAddress: d,
        velocity:
          (metric.deviceData[d].TCP +
            metric.deviceData[d].UDP +
            metric.deviceData[d].HTTP +
            metric.deviceData[d].DNS) /
          metricLength,
        tcpTraffic: metric.deviceData[d].TCP,
        udpTraffic: metric.deviceData[d].UDP,
        httpTraffic: metric.deviceData[d].HTTP,
        dnsTraffic: metric.deviceData[d].DNS,
        data: {
          startMS: second.startMS,
          endMS: second.endMS,
          size: [0, 0, 0, 0],
        },
      });
    }
  });

  devices.sort((a, b) => {
    return (
      a.tcpTraffic +
      a.udpTraffic +
      a.httpTraffic +
      a.dnsTraffic -
      (b.tcpTraffic + b.udpTraffic + b.httpTraffic + b.dnsTraffic)
    );
  });

  let devicesShown = 3;
  let fixedDevicesShown = devicesShown * -1;
  const sortedDevices = devices.slice(fixedDevicesShown);

  return {
    deviceData: sortedDevices,
  };
}

function getConnectionSentReceivedDataByTime(dataSource) {
  const {
    tcpData: { startMS, endMS, data: tcpData },
  } = dataSource;

  const connectionObject = {};

  for (let i = 0; i < tcpData.length; ++i) {
    const packet = tcpData[i];
    if (
      packet.hasOwnProperty("src_mac") &&
      packet.hasOwnProperty("dst_mac") &&
      packet.hasOwnProperty("packet_size")
    ) {
      let sent = 0;
      let received = 0;
      let macKey = "";

      const fixedSrc = removeLeadingZeros(packet.src_mac);
      const fixedDst = removeLeadingZeros(packet.dst_mac);

      if (macAddrs.hasOwnProperty(fixedSrc)) {
        sent = packet.packet_size;
        macKey = fixedSrc + "--" + fixedDst;
      } else if (macAddrs.hasOwnProperty(fixedDst)) {
        received = packet.packet_size;
        macKey = fixedDst + "--" + fixedSrc;
      } else {
        continue;
      }

      if (connectionObject.hasOwnProperty(macKey)) {
        const currSent = connectionObject[macKey].sent;
        const currReceived = connectionObject[macKey].received;

        connectionObject[macKey].sent = currSent + sent;
        connectionObject[macKey].received = currReceived + received;
      } else {
        connectionObject[macKey] = {
          sent: sent,
          received: received,
        };
      }
    }
  }

  // convert object into connectiosn after all data has been aggregated
  const connections = Object.keys(connectionObject).map((key) => {
    return {
      id: key,
      size: [connectionObject[key].sent, connectionObject[key].received],
      time: endMS,
    };
  });

  return { connections };
}
