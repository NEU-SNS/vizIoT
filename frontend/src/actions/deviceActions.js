'use es6';

import {createRequestActions} from 'VizIoT/actions/requestStatusActionFactory';
import {createAction} from 'redux-act';

// Action bundles
export const deviceActionBundle = createRequestActions('device');
export const pushActiveDevices = createAction('active devices');

export default Object.assign(
  {},
  deviceActionBundle,
  {
    pushActiveDevices
  }
);
