const express = require('express')
const mongoose = require('mongoose')
const morgan = require('morgan')

const config = require('./config/config')
const expressConfig = require('./config/express')
const routesConfig = require('./config/routes')

const DeviceDa = require('./api/device/device.da')
const TcpDa = require('./api/tcpData/tcpData.da')
const TcpSocketDa = require('./api/tcpData/tcpData.socket.da')

class Server {
  constructor() {
    this.app = express()
    this.config = config
    this.http = require('http').Server(this.app)

    this.init()
  }

  init() {
    // HTTP request logger
    this.app.use(morgan('dev'))

    // express settings
    expressConfig(this.app)

    // connect to local country database
    DeviceDa.startCountryDB()
      .then(r => console.log('Country db connected'))
      .catch(e => console.log('error opening Country db'))

    // populate device map for device-based queries
    DeviceDa.populateDeviceMap()
      .then(r => console.log('Populated device map in deviceda'))
      .catch(e => console.log('error populating device map'))

    DeviceDa.populateIPMap()
      .then(r => console.log('Populated IP map in deviceda'))
      .catch(e => console.log('error populating ip map'))

    // populate device map for packet based queries
    TcpDa.populateDeviceMap()
      .then(r => console.log('Populated device map in tcpda'))
      .catch(e => console.log('error populating device map'))

    // populate device map for websocket
    TcpSocketDa.populateDeviceMap()
      .then(r => console.log('Populated device map in tcpda.socket'))
      .catch(e => console.log('error populating device map'))

    // connect to database
    mongoose.connect(this.config.db, {useNewUrlParser: true})
      .then(() => {
        console.log(`[MongoDB] connected: ${this.config.db}`)

        // initialize api
        routesConfig(this.app)
        const {initSocketIO} = require('./socketio')
        initSocketIO(this.http)

        // start server
        this.http.listen(this.config.apiPort, this.config.ip, () => {
          console.log(`[Server] listening on port ${this.config.apiPort}`)
        })
      })
      .catch(err => {
        console.log(`[MongoDB] Failed to connect. ${err}`)
      })
  }
}

module.exports = new Server().app
