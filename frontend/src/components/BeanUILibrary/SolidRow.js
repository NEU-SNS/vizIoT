'use es6';

import React, {Component} from 'react';
import styled from 'styled-components';

const TabRowContainer = styled.div`
  display: flex;
  justify-content: center;
  
  height: 100%;
  flex-wrap: wrap;
`;

export default class SolidRow extends Component {
  render() {
    const {children, height, ...rest} = this.props;
    return (
      <div style={{width: '100%', height: height}}>
        <TabRowContainer {...rest}>{children}</TabRowContainer>
      </div>
    );
  }
}
