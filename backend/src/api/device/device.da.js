const {DeviceModel} = require('./device.model')
const {getDeviceMap, getKnownIPMap} = require('../../util/DeviceMap')
const {TcpDataModel} = require('../tcpData/tcpData.model')
const {removeLeadingZeros} = require('../../util/FormatUtility')
const maxmind = require('maxmind')
const dnsPromises = require('node:dns').promises;

let db = undefined
let countryIPs = {}
let dnsHostNames = {}
let macAddrs = {}
let knownIPs = {}
const untraceableDnsIPs = new Set()

module.exports = {
  getAll,
  getConnections,
  startCountryDB,
  populateDeviceMap,
  populateIPMap,
}

async function startCountryDB() {
  console.log(process.cwd())
  const dbPath = process.cwd() + '/src/db/GeoLite2-Country.mmdb'
  db = await maxmind.open(dbPath)
}

async function populateDeviceMap() {
  macAddrs = await getDeviceMap()
}

async function populateIPMap() {
  knownIPs = await getKnownIPMap()
}

async function getAll() {
  return DeviceModel.find({})
}

async function getConnections(startMS, endMS) {
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

      let macKey = ''
      let name = ''
      let destName = ''
      let ip = ''
      let port = -1

      const fixedSrc = removeLeadingZeros(packet.src_mac)
      const fixedDst = removeLeadingZeros(packet.dst_mac)

      if (macAddrs.hasOwnProperty(fixedSrc)) {
        macKey = fixedSrc + '--' + fixedDst
        name = macAddrs[fixedSrc].name
        destName = packet.dst_ip
        ip = packet.dst_ip
        port = packet.dst_port
      } else if (macAddrs.hasOwnProperty(fixedDst)) {
        macKey = fixedDst + '--' + fixedSrc
        name = macAddrs[fixedDst].name
        destName = packet.src_ip
        ip = packet.src_ip
        port = packet.src_port
      } else {
        continue
      }

      if (ip == undefined) {
        continue
      }

      let country = undefined

      const dnsIP = ip + ':' + port
      // check if theres a static map
      if (knownIPs.hasOwnProperty(ip)) {
        destName = knownIPs[ip].name
      }
      // check if dns lookup has already run
      else if (dnsHostNames.hasOwnProperty(dnsIP)) {
        const dnsIPVal = dnsHostNames[dnsIP]
        if (dnsIPVal !== '-1') {
          destName = dnsIPVal
        }
      }
      // otherwise perform initial dns lookup for ip:port
      /* Initially, dns.lookupService was used, which asynchronously looks up the hostname. 
      The problem is it takes around 4-5 seconds to complete, but the next request comes in in about 1-2 seconds, which leads to a memory leak
      Therefore, the promise version of lookupService is used here to avoid that. Also untraceableDnsIPs is used since sometimes the hostname can't be found and the lookup shouldn't be repeated
      However, it's not perfect. For the first few requests, it's gonna take a lot of time to respond, since the dnsIPs are not in dnsHostNames nor in untraceableDnsIPs, and dnsPromises.lookupService needs to be invoked
      Althought it becomes faster and faster when dnsHostNames and untraceableDnsIPs grow bigger, it's still not fast enough as long as there are dnsIPs not in them, which needs to be improved.
       */
      else {
        if (!untraceableDnsIPs.has(dnsIP)) {
          try {
            const {hostname} = await dnsPromises.lookupService(ip, port) 
            destName = hostname
            dnsHostNames[dnsIP] = hostname
          } catch (e) { 
            untraceableDnsIPs.add(dnsIP)
          }
        }
      }

      // handle grabbing
      if (countryIPs.hasOwnProperty(ip)) {
        country = countryIPs[ip]
      } else {
        const res = await db.get(ip)
        // console.log(res)
        if (res && res.country && res.country.iso_code) {
          country = res.country.iso_code
          countryIPs[ip] = country
        }
      }

      // otherwise creat new entries
      // if connection exists, don't do any additional inserts
      if (!connectionObject.hasOwnProperty(macKey)) {
        connectionObject[macKey] = {
          id: macKey,
          name: name,
          destName: destName,
          country: country,
        }
      }
    }
  }

  // convert object into connectiosn after all data has been aggregated
  const connections = Object.keys(connectionObject).map(key => {
    return connectionObject[key]
  })

  return connections

}
