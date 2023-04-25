const express = require('express')

const tcpDataApi = require('../api/tcpData/index')
const deviceApi = require('../api/device/index')

const API_V1 = '/api/v1'

module.exports = app => {
  // app.use(express.static('dist'))
  app.get(API_V1, (req, res) => {
    res.json({version: 1})
  })

  app.use(API_V1, tcpDataApi)
  app.use(API_V1, deviceApi)

}
