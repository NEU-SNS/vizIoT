'use es6';

import React, {PureComponent, useState, useEffect} from 'react';
import PropTypes from 'prop-types';
import {useLocation, Outlet, useNavigate} from 'react-router-dom'
import styled from 'styled-components';

import TabTitle from '../components/TabTitle';
import OverviewTab from './OverviewTab';
import BubbleLocationTab from './BubbleLocationTab';
import CoverFlow from 'UIBean/CoverFlow';
import DeviceOverview from 'VizIoT/containers/DeviceOverview';
import NotFound from 'VizIoT/containers/NotFound';
import TimeOverview from 'VizIoT/containers/TimeOverview';
import {getTabByPath, tabKeys, Tabs} from 'VizIoT/constants/TabNavigation';
import LoggerContainer from 'VizIoT/containers/LoggerContainer';
import AppMenuBar from 'VizIoT/components/AppMenuBar';
import Navigator from 'VizIoT/components/Navigator';
import {pathOr} from 'ramda';
import {SentReceivedTab} from './SentReceivedTab';
import {ProtocolTab} from './ProtocolTab';
import {ConnectionTableTab} from './ConnectionTableTab';

class VideoBackground extends PureComponent {
  render() {
    return (
      <Background>
        <BackgroundRelative>
          <video autoPlay muted loop style={{width: '100%', minWidth: '1980px'}}>
            <source src="media/bg.mp4" type="video/mp4"/>
          </video>
        </BackgroundRelative>
      </Background>
    )
  }
}

const Background = styled.div`
  z-index: -2;
  position: fixed;
  width: 100%;
  height: 100%;
`;

const BackgroundRelative = styled.div`
  position: relative;
`;

const VizIoT = () => {
   
  const location = useLocation()
  const navigate = useNavigate()
  // const [redirectTo, setRedirectTo] = useState(null)
  const [showTitle, setShowTitle] = useState(true)
  const [scheduler, setScheduler] = useState(null)
  const [showNav, setShowNav] = useState(false)
  
  // After we receive new or changed location, reset redirect when location === redirectTo.
  // Don't really understand what this is for. redirectTo is always null????
  // useEffect(() => {
  //   const {pathname} = location
  //   if (pathname === redirectTo) {
  //     setRedirectTo(null)
  //   }
  // }, [location])

  useEffect(() => {
    const {pathname} = location
    if (pathname === '/') {
      navigate('/overview')
    }
  }, [location])


  useEffect(() => {
    scheduleHideTitle();
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    }
  }, [])
 

  const scheduleHideTitle = () => {
    scheduler && clearTimeout(scheduler);
    setScheduler(setTimeout(() => {
      setShowTitle(false)
    }, 6000))
  };

  // handleRightArrow = () => {
  //   let currentTabIndex = this.getCurrentTabIdxFromLocation(); // May be OOB
  //   if (currentTabIndex >= 0) {
  //     const nextTabIndex = ++currentTabIndex % tabOrder.length;
  //     this.setState(() => ({
  //       showTitle: true,
  //       scheduler: null,
  //       redirectTo: Tabs[tabOrder[nextTabIndex]].path,
  //     }));
  //     this.scheduleHideTitle();
  //   }
  // };

  const onToggleNav = () => {
    setShowNav(state => !state)
  };

  const handleKeyDown = e => {
    if (e.key === 'i') {
      e.preventDefault();
      onToggleNav();
    }
  };

    // Don't really understand what this is for. redirectTo is always null????
    // if (redirectTo && redirectTo !== location.pathname) {
    //   // Redirect triggers when state is changed
    //   return <Redirect to={redirectTo}/>;
    // }

  const title = pathOr('', ['title'], getTabByPath(location.pathname));

  return (
    <div id="root-container">
      <VideoBackground/>
      <TabTitle subtitle={title} show={showTitle}/>
      <div>
        <AppMenuBar toggleNav={onToggleNav} showNav={showNav}/>
        <Navigator location={location} isHidden={!showNav}/>
        {/*<ActivitySidebar />*/}
        <CoverFlow
          keyName={location.pathname}
          // onLeft={handleLeftArrow}
          // onRight={handleRightArrow}
        >
          <Outlet/>
        </CoverFlow>
      </div>
    </div>
  );
}

VizIoT.defaultProps = {
  appConfig: {
    networkId: 42,
  },
};

VizIoT.propTypes = {
  appConfig: PropTypes.object,
};

export default VizIoT;
