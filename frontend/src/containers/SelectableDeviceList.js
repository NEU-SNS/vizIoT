import React, {useState, useEffect, useRef} from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

import BCard from '../components/BeanUILibrary/BCard';
import {fetchDeviceData} from '../data/api/devicesApi';
import { getDevices } from '../data/aggregators/DeviceAggregator';
import {FixedTitle} from './ConnectionTableRows/ColumnStyles';
import {AllDevicesRow} from './DeviceTableRows/AllDevicesRow';
import {SingleDeviceRow} from './DeviceTableRows/SingleDeviceRow';
import {useForceUpdate} from '../components/BeanUILibrary/hooks/useForceUpdate';

// top level
const ConnectionCard = styled(BCard)`
  overflow-y: scroll;
`

const DeselectAllButton = styled.button`
  color: white;
  background: transparent;
  //padding: 2px 4px 2px;
  font-family: 'Rajdhani';
  font-size: 16px;
  width: 60px;
  height: 20px;
  vertical-align: middle;
`

export const SelectableDeviceList = ({
                                  height,
                                  devices,
                                  setDevices,
                                  setForceVal,
                                }) => {
  const [allDevices, setAllDevices] = useState(true)

  // create a useEffect with empty dependences so it only runs on mount
  useEffect (() => {

    const portDevices = (devices) => {

      const checkAllDevicesSet = (devices) => {

        let isAllEnabled = true
        Object.keys(devices).forEach(key => {
          if (devices[key].selected === false) {
            isAllEnabled = false
          }
        })

        setAllDevices(isAllEnabled)
      }

      const selectableDevices = {}

      Object.keys(devices).forEach(key => {
        selectableDevices[devices[key].name] = {
          macAddress: devices[key].macAddress,
          name: devices[key].name,
          selected: true,
          setSelected: () => {selectableDevices[devices[key].name].selected = !selectableDevices[devices[key].name].selected;
                              checkAllDevicesSet(selectableDevices);
                              setForceVal({})}
        }
      })

      return selectableDevices
    }

    fetchDeviceData()
      .then(e => setDevices(portDevices(getDevices())))
      .catch(e => console.log('error fetching devices'));
  }, [setDevices, setAllDevices, setForceVal])



  const setAllDevicesList = (isAllEnabled) => {

    if (isAllEnabled === true) {
      Object.keys(devices).forEach(key => {
        devices[key].selected = true;
      })
    }

    setAllDevices(isAllEnabled)
  }

  const setAllDevicesFalse = () => {
    Object.keys(devices).forEach(key => {
      devices[key].selected = false;
    })

    setAllDevices(false)
    setForceVal({})
  }

  // console.log(devices)
  // console.log(allDevices)

  return <div style={{height:height, width:'100%'}}>
    <FixedTitle title='Devices' style={{height:'4%', textAlign:'center'}}/>
    <div style={{height:'4%', textAlign:'center'}}>
      <DeselectAllButton onClick={setAllDevicesFalse}>Clear</DeselectAllButton>
    </div>
    <ConnectionCard style={{height: '92%'}}>
      <AllDevicesRow isEnabled={allDevices} setEnabled={setAllDevicesList}/>
      <div style={{paddingTop:'4px'}}/>
      {Object.keys(devices).sort().map((key, index) => {
        return <SingleDeviceRow
          key={index}
          isEnabled={devices[key].selected}
          setEnabled={devices[key].setSelected}
          name={devices[key].name} />
      })}
    </ConnectionCard>
  </div>

}

SelectableDeviceList.propTypes = {
  height: PropTypes.string.isRequired,
  devices: PropTypes.object.isRequired,
  setDevices: PropTypes.func.isRequired,
  setForceVal: PropTypes.func.isRequired,
}