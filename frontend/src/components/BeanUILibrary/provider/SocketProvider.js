'use es6';

import React, {Component} from 'react';
import {io} from 'socket.io-client';
import SocketContext from '../context/SocketContext';
import {url} from '../../../socket/subscribe';

export default class SocketProvider extends Component {
  constructor(props) {
    super(props);
    this.socket = io(props.url || url);
    console.log('socket opened SocketProvider');

  }

  componentWillUnmount() {
    console.log('socket dismounted SocketProvider');
    this.socket.disconnect();
  }

  render() {
    return (
      <SocketContext.Provider value={this.socket}>
        {this.props.children}
      </SocketContext.Provider>
    );
  }
}