import NetworkState from '../constants/NetworkState';
import { createReducer } from 'redux-act';
import {
  startFetchDevices,
  successFetchDevices,
  failureFetchDevices,
} from '../actions/deviceActions';

const defaultState = {
  devices: [],
  entireNetwork: {
    id: 123,
    alias: 'Entire Network',
    lastSeen: '1517177323000',
  },
  networkState: NetworkState.READY,
};

export default createReducer(
  {
    [startFetchDevices]: state => ({
      ...state,
      networkState: NetworkState.LOADING,
    }),
    [successFetchDevices]: (state, result) => {
      return {
        ...state,
        networkState: NetworkState.READY,
        devices: result.payload.devices,
      };
    },
    [failureFetchDevices]: state => {
      return {
        ...state,
        networkState: NetworkState.READY,
      };
    },
  },
  defaultState
);
