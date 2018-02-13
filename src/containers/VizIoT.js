import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { getIn } from 'immutable'

import AppTitle from '../components/AppTitle'
import Grid from '../components/BeanUILibrary/Grid'
import GridItem from '../components/BeanUILibrary/GridItem'
import CardWrapper from '../components/BeanUILibrary/CardWrapper'
import DeviceList from '../components/DeviceList'
import DeviceActivityChart from './DeviceActivityChart'

import { selectAllDevices } from '../selectors/deviceSelectors'
import { analyzeAggregationByTime } from '../actions/analyzeActions'
import { fetchDevices } from '../actions/deviceActions'
import { defaultNetwork } from '../constants/RequestConstants'

class VizIoT extends React.Component {
  state = {}

  componentWillMount () {
    const {appConfig} = this.props
    const bucketConfig = getIn(appConfig, ['chartConfig', 'bucketConfig'], {});
    const networkId = getIn(appConfig, ['networkId'], defaultNetwork);

    const startMS = '1517967550000'
    const endMS = '1517967570000'

    fetchDevices(networkId).then(() => {
      const {devices} = this.props
      devices.forEach(({macAddr}) => {
        analyzeAggregationByTime(networkId, macAddr, bucketConfig, startMS, endMS)
      })
    })
  }

  renderBarChartCards () {
    const {appConfig, devices} = this.props
    const {chartConfig} = appConfig

    return devices.map((d) => {
      return (
        <GridItem
          key={d.macAddr}
          size={{'xs': 12, 'md': 12, 'lg': 4}}
          space="p-bot-6">
          <DeviceActivityChart
            device={d}
            chartConfig={chartConfig}/>
        </GridItem>
      )
    })
  }

  render () {
    const {devices} = this.props
    return (
      <div className="">
        <div className="tint-background">
          <div className="padded-container">
            <div className="medium-spacer"/>
            <AppTitle />
            <div className="small-spacer"/>

            <Grid gutter={3}>
              <GridItem size={{'md': 12, 'lg': 3}}>
                <h5 className="wide-letter deviceList__title">DEVICES</h5>
                <CardWrapper noPadding={true} noBackground={true} noShadow={true}>
                  <DeviceList devices={devices} />
                </CardWrapper>
              </GridItem>
              <GridItem size={{'md': 12, 'lg': 9}}>
                <h5 className="wide-letter deviceList__title">ACTIVITY<i className="material-icons">trending_up</i></h5>
                <Grid gutter={1}>
                  {this.renderBarChartCards()}
                </Grid>
              </GridItem>
            </Grid>
            <div className="large-spacer"/>
            <div className="large-spacer"/>
            <div className="large-spacer"/>
            <div className="large-spacer"/>
            <div className="large-spacer"/>
            <div className="large-spacer"/>
            <div className="large-spacer"/>
            <div className="large-spacer"/>
          </div>
        </div>
      </div>
    )
  }
}

VizIoT.defaultProps = {
  appConfig: {
    chartConfig: {
      bucketConfig: {
        bucketSize: 1,
        bucketProps: ['ACTIVITY_COUNT'],
        bucketUnit: 'SECOND'
      },
      dataWindowSize: 60,
    },
    networkId: 42,
  }
};

VizIoT.propTypes = {
  devices: PropTypes.array.isRequired,
  appConfig: PropTypes.object,
}

const mapStateToProps = (state) => {
  return {
    devices: selectAllDevices(state),
  }
}

const mapDispatchToProps = (dispatch) => {

}

export default connect(mapStateToProps)(VizIoT)
