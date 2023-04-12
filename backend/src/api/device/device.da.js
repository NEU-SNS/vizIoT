const {DeviceModel} = require('./device.model')
const {getDeviceMap, getKnownIPMap} = require('../../util/DeviceMap')
const {TcpDataModel} = require('../tcpData/tcpData.model')
const {removeLeadingZeros} = require('../../util/FormatUtility')
const maxmind = require('maxmind')
const dns = require('dns')

let db = undefined
let countryIPs = {}
let dnsHostNames = {}
let macAddrs = {}
let knownIPs = {}

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
      else {
        await dns.lookupService(ip, port, (err, hostname, service) => {
          if (!err) {
            destName = hostname
            dnsHostNames[dnsIP] = hostname
          }
        })
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
