'use es6';

import React, {Component} from 'react';
import styled from 'styled-components';

const TabRowContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-end;
  
  min-height: 50px;
  flex-wrap: wrap;
`;

const Streak = styled.div`
  margin: 0 auto;
  width: 100%;
  height: 1px;
  background: linear-gradient(
    to right,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.98) 50%,
    rgba(255, 255, 255, 1) 51%,
    rgba(255, 255, 255, 0) 99%,
    rgba(255, 255, 255, 0) 100%
  );
  opacity: 0.3;
`;

export default class TabRow extends Component {
  render() {
    const {children, ...rest} = this.props;
    return (
      <div>
        <TabRowContainer {...rest}>{children}</TabRowContainer>
        <Streak/>
      </div>
    );
  }
}
