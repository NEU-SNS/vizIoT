'use es6';

import React, {useEffect, useState} from 'react';
import moment from 'moment';
import styled from 'styled-components';
import Flex, {JustifyContent} from 'UIBean/Flex';
import FlexChild from 'UIBean/FlexChild';

import {_sticky} from 'UIBean/functional-css/layout';
import {ScreenSizes} from 'UIBean/Breakpoints';
import {H3, H4} from 'UIBean/functional-css/TypographyStyles';
import {useInterval} from 'UIBean/hooks/useInterval';
import {useScroll} from 'UIBean/hooks/useScroll';

const Background = styled(Flex)`
  ${_sticky}; // It seems that it's ok to lack a trailing semicolon in styled-components v3, but it's not in v5
  top: 0;
  right: 0;
  width: 28rem;
  height: 150px;
  padding-right: 6%;
  z-index: 10;
  text-shadow: #67e5ff 0px 0px 40px;
`;

const LogoText = styled.div`
  font-size: 2.7rem;
  font-family: 'Rajdhani';
  font-weight: 600;
  display: flex;
  text-align: right;
  justify-content: flex-end;
`;

const ClockTextContainer = styled.div`
  ${H4}
  font-weight: lighter;
  text-align: right;
`;

const NavButton = styled.button`
  float: right;
  color: white;
  background: transparent;
  padding: 2px 4px 2px;
  font-family: 'Rajdhani';
  font-size: 24px;
  width: 160px;
  height: 35px;
`

const ClockText = ({}) => {
  const [currentMoment, setMoment] = useState(moment());
  useInterval(() => {
    setMoment(moment())
  }, 1000);

  return <ClockTextContainer>{currentMoment.format('h:mm:ss a').toUpperCase()}</ClockTextContainer>;
};

const navButton = (toggleNav, showNav) => {
  if (showNav) {
    return <NavButton onClick={toggleNav}>Hide Nav</NavButton>
  } else {
    return <NavButton onClick={toggleNav}>Show Nav</NavButton>
  }
}

const AppMenuBar = ({toggleNav, showNav}) => {

  const [scrollTop, setScrollTop] = useState(0);
  useScroll(({scrollX, scrollY}) => {
    setScrollTop(scrollY);
  });

  return (
    <Background alignItems={JustifyContent.FLEX_END}
                justifyContent={JustifyContent.SPACE_BETWEEN}>
      <FlexChild grow={2}/>
      <FlexChild grow={2}>
        <LogoText className="appTime__logo">VizIoT</LogoText>
        <ClockText/>
        {navButton(toggleNav, showNav)}
      </FlexChild>
    </Background>
  );
};

export default AppMenuBar;
