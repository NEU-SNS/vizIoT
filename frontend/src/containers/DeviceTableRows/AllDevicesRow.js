import React, {useState} from 'react';
import PropTypes from 'prop-types';

import {
  BorderedSolidRow,
} from '../ConnectionTableRows/ColumnStyles';
import styled from 'styled-components';
import './Checkbox.css'

const DeviceHeader = styled.h5`
  font-weight:600;
  height: 100%;
  display: flex;
  align-items: center;
  vertical-align: middle;
  margin-bottom: 0;
  padding-bottom: 4px;
`

export const AllDevicesRow = ({isEnabled, setEnabled}) => {

  const drawX = () => {
    return <div className='xSvg'>
        <svg style={{width:'20px', height:'20px', position:'relative', overflow:'visible'}}>
          <line x1='0' x2='18' y1='-1' y2='17' stroke='white'/>
          <line x1='18' x2='0' y1='-1' y2='17' stroke='white'/>
        </svg>
    </div>
  }

  return <BorderedSolidRow height={'30px'} style={{width:'100%',
                                                   display:'inline-flex',
                                                   gridTemplateColumns:'10% 90%',
                                                   gridColumnGap:'10px',
                                                   verticalAlign:'middle',
                                                   justifyContent:'start',
                                                   paddingLeft:'5%',
                                                   }}>
    <label className='container'>
      <DeviceHeader>All</DeviceHeader>
      <input checked={isEnabled} type='checkbox' onChange={() => {setEnabled(!isEnabled)}}/>
      <span className='checkmark'>{isEnabled ? drawX() : ''}</span>
    </label>
  </BorderedSolidRow>
}

AllDevicesRow.propTypes = {
  isEnabled: PropTypes.bool.isRequired,
  setEnabled: PropTypes.func.isRequired
}