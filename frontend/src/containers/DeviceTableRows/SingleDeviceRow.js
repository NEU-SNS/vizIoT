import React, {useState} from 'react';
import PropTypes from 'prop-types';

import styled from 'styled-components';
import './Checkbox.css'
import SolidRow from '../../components/BeanUILibrary/SolidRow';

const DeviceHeader = styled.h5`
  font-weight:600;
  display: block;
  align-items: center;
  vertical-align: middle;
  margin-bottom: 0;
  padding-top: 2px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`

export const SingleDeviceRow = ({isEnabled, setEnabled, name}) => {

  const drawX = () => {
    return <div className='xSvg'>
      <svg style={{width:'20px', height:'20px', position:'relative', overflow:'visible'}}>
        <line x1='0' x2='18' y1='-1' y2='17' stroke='white'/>
        <line x1='18' x2='0' y1='-1' y2='17' stroke='white'/>
      </svg>
    </div>
  }

  return <SolidRow height={'30px'} style={{width:'100%',
    display:'inline-flex',
    gridTemplateColumns:'10% 90%',
    gridColumnGap:'10px',
    verticalAlign:'middle',
    justifyContent:'start',
    paddingLeft:'5%'}}>
    <label className='container'>
      <DeviceHeader>{name}</DeviceHeader>
      <input checked={isEnabled} type='checkbox' onChange={() => {setEnabled(!isEnabled)}}/>
      <span className='checkmark'>{isEnabled ? drawX() : ''}</span>
    </label>
  </SolidRow>
}

SingleDeviceRow.propTypes = {
  isEnabled: PropTypes.bool.isRequired,
  setEnabled: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
}