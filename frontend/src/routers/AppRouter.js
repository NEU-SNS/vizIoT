import React from 'react';
import VizIoT from '../containers/VizIoT';
import {useRoutes} from 'react-router-dom'
import NotFound from '../containers/NotFound';
import Playground from '../containers/Playground';
import {getTabByPath, tabKeys, Tabs} from 'VizIoT/constants/TabNavigation';
import OverviewTab from '../containers/OverviewTab'
import DeviceOverview from '../containers/DeviceOverview'
import {SentReceivedTab} from '../containers/SentReceivedTab'
import {ProtocolTab} from '../containers/ProtocolTab'
import {ConnectionTableTab} from '../containers/ConnectionTableTab'
// exact prop means: exact path match

export default () => {
  const element = useRoutes(routes)
  return <>{element}</>
}

const routes = [
  {
    path: "/playground",
    element: <Playground/>
  },
  {
    path: "/",
    element: <VizIoT/>,
    children: [
      {
        path: `${Tabs[tabKeys.OVERVIEW].path}`,
        element: <OverviewTab/>
      },
      {
        path: Tabs[tabKeys.DEVICES].path,
        element: <DeviceOverview/>
      },
      {
        path: `${Tabs[tabKeys.INOUT].path}`,
        element: <SentReceivedTab/>
      },
      {
        path: `${Tabs[tabKeys.PROTOCOL].path}`,
        element: <ProtocolTab/>
      },
      {
        path: `${Tabs[tabKeys.CONNECTION_TABLE].path}`,
        element: <ConnectionTableTab/>
      },
    ]
  },
  {
    path: "*",
    element: <NotFound/>
  },
]
