import MomentUnit from '../../constants/MomentUnit';
import {combineReducers} from 'redux';
import {createReducer} from 'redux-act';
import deviceList from './deviceList';
import lastSeen from './lastSeen';
import numberOfConnections from './numberOfConnections';
import {pushActiveDevices} from 'VizIoT/actions/deviceActions'

const defaultRefreshConfig = {
  default: {
    unit: MomentUnit.SECONDS,
    value: 10,
  },
  deviceList: {
    unit: MomentUnit.SECONDS,
    value: 10,
  },
  lastSeen: {
    unit: MomentUnit.SECONDS,
    value: 10,
  },
  numberOfConnections: {
    unit: MomentUnit.SECONDS,
    value: 10,
  },
};

const defaultNetwork = {
  id: 'all',
  alias: 'Network',
};

const activeDevices = createReducer({
  [pushActiveDevices]: (state, newEntry) => {
    return {
      ...state,
      data: newEntry,
    }
  },
}, {data: null});

export default combineReducers({
  entireNetwork: (state, action) => defaultNetwork,
  refreshConfig: (state, action) => defaultRefreshConfig,
  deviceList,
  lastSeen,
  numberOfConnections,
  activeDevices
});
