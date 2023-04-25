'use es6';

import React from 'react';
import PropTypes from 'prop-types';
import {identity} from 'ramda';

import Flex from 'UIBean/Flex';
import TimedSwitcher from 'UIBean/TimedSwitcher';
import styled from 'styled-components';
import BCard from 'UIBean/BCard';
import SectionTitle from 'VizIoT/components/SectionTitle';
import DeviceList from 'VizIoT/components/device/DeviceList';
import ActivityFeed from 'VizIoT/components/ActivityFeed';
import {connect} from 'react-redux';
import {
  selectDeviceList,
  selectLastSeen,
  selectNumberOfConnections,
} from 'VizIoT/selectors/deviceSelectors';
import {selectMostRecentDomains} from 'VizIoT/selectors/analyticsSelector';
import BIcon from 'UIBean/BIcon';
import BButton, {ButtonOrientation, ButtonShape} from 'UIBean/BButton';
import TypographyComponents from 'UIBean/TypographyComponent';

const {H5} = TypographyComponents;

const FixedSidebarWrapper = styled.section`
  position: fixed;
  left: 0;
  top: 0;
  width: 350px;
  height: 100vh;
  overflow-y: scroll;
  padding: 0.5rem;

  @media (max-width: 1200px) {
    display: none;
  }
  z-index: 1;

  transform: ${({hide}) => (hide ? 'translateX(-350px)' : 'translateX(0)')};
  opacity: ${({hide}) => (hide ? '0' : '1')};
  transition: opacity 1s, transform 1.1s;
  // transition-timing-function: ease-in-out;
`;

const FullHeightBCard = styled(BCard)`
  height: 100%;
  background: #09192bb5 !important;
  border-radius: 2rem;
  border: 2px solid #1f385685;
`;

const HideBtn = styled(BButton)`
  margin-left: auto;
`;

const ShowBtn = styled(BButton)`
  position: fixed;
  top: 1.5rem;
  left: 1.5rem;
  transform: ${({hide}) => (hide ? 'translateX(-10px)' : 'translateX(0)')};
  opacity: ${({hide}) => (hide ? '0' : '1')};
  transition: opacity 1s, transform 1.1s;
  height: 7rem;
  width: 7rem;
`;

const InlineH5 = styled(H5)`
  margin: 0;
`;

const Container = styled.div`
  position: relative;
  z-index: 3;
`;

const Sidebar = ({
                   hide,
                   devices,
                   deviceToNumConnection,
                   lastSeen,
                   mostRecentHosts,
                   onSwitch,
                   onToggleHide,
                 }) => {
  const deviceList = (
    <div>
      <SectionTitle title="TODAY'S DEVICES"/>
      <DeviceList
        devices={devices}
        deviceToNumConnection={deviceToNumConnection}
        lastSeen={lastSeen}
      />
    </div>
  );

  const hostList = (
    <div>
      <SectionTitle title="LATEST ACTIVITY"/>
      <ActivityFeed hosts={mostRecentHosts}/>
    </div>
  );

  return (
    <Container>
      <ShowBtn
        onClick={onToggleHide}
        hide={!hide}
        shape={ButtonShape.RECT}
        orientation={ButtonOrientation.STACKED}
      >
        <BIcon name={'view_list'} size={26} weight={400}/>
        <InlineH5>{'Feed'}</InlineH5>
      </ShowBtn>
      <FixedSidebarWrapper hide={hide}>
        <FullHeightBCard noShadow={true} noPadding={false}>
          <HideBtn type="button" onClick={onToggleHide}>
            <BIcon name={'close'} size={26} weight={600}/>
          </HideBtn>
          <Flex>
            <TimedSwitcher
              options={[
                {value: hostList, delay: 3500000},
                {value: deviceList, delay: 7000},
              ]}
            />
          </Flex>
        </FullHeightBCard>
      </FixedSidebarWrapper>
    </Container>
  );
};

Sidebar.defaultProps = {
  onSwitch: identity,
  onClickHide: identity,
  onClickShow: identity,
  hide: false,
};

Sidebar.propTypes = {
  onSwitch: PropTypes.func,
  onToggleHide: PropTypes.func,
  devices: PropTypes.array.isRequired,
  deviceToNumConnection: PropTypes.object.isRequired,
  lastSeen: PropTypes.object.isRequired,
  mostRecentHosts: PropTypes.array.isRequired,
  hide: PropTypes.bool,
};

const mapStateToProps = state => ({
  devices: selectDeviceList(state) || [],
  deviceToNumConnection: selectNumberOfConnections(state),
  lastSeen: selectLastSeen(state),
  mostRecentHosts: selectMostRecentDomains(state, 15),
});

const withHideable = ConnectedSidebar => {
  class HideableSidebar extends React.Component {
    state = {
      isHidden: true,
      useDefault: true,
    };

    onToggleHide = () => {
      this.setState({
        isHidden: !this.state.isHidden,
      });
    };

    render() {
      return (
        <ConnectedSidebar
          onToggleHide={this.onToggleHide}
          hide={this.state.isHidden}
          {...this.props}
        />
      );
    }
  }

  return HideableSidebar;
};

export default withHideable(connect(mapStateToProps)(Sidebar));
