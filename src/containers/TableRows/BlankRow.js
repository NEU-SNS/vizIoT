import React, {useState} from 'react';

import SolidRow from "../../components/BeanUILibrary/SolidRow";
import TabColumn from "../../components/BeanUILibrary/TabColumn";
import BIcon from "../../components/BeanUILibrary/BIcon";
import {
  ArrowColumn, ArrowContainerColumn, BorderedSolidRow,
  CountryColumn,
  DestinationColumn,
  FixedTitle, GraphColumn,
  IPColumn, MetricColumn, MetricSymbolColumn, OverallMetricColumn, RecentMetricColumn,
  SourceColumn
} from "./ColumnStyles";

export const BlankRow = ({}) => {
  return <BorderedSolidRow height='100px'>
    <SourceColumn>
      <SolidRow>
        <TabColumn>
          ~
        </TabColumn>
      </SolidRow>
    </SourceColumn>
    <ArrowColumn>
      <SolidRow>
        <ArrowContainerColumn>
          <BIcon name='arrow-back-outline' type='eva' size={28} color={'#0073ff'}/>
        </ArrowContainerColumn>
        <ArrowContainerColumn>
          <BIcon name='arrow-forward-outline' type='eva' size={28} color={'#ff1e00'}/>
        </ArrowContainerColumn>
      </SolidRow>
    </ArrowColumn>
    <DestinationColumn>
      <SolidRow>
        <IPColumn>
          ~
        </IPColumn>
        <CountryColumn>
          ~
        </CountryColumn>
      </SolidRow>
    </DestinationColumn>
    <GraphColumn style={{alignContent:'center'}}>
      ~
    </GraphColumn>
    <MetricColumn>
      <SolidRow height='50%'>
        <MetricSymbolColumn style={{paddingLeft:'5%'}}>
          <BIcon name='arrow-circle-up-outline' type='eva' size={28} color={'#ff1e00'}/>
        </MetricSymbolColumn>
        <RecentMetricColumn>
          ~ B/S
        </RecentMetricColumn>
        <OverallMetricColumn>
          ~ B/S
        </OverallMetricColumn>
      </SolidRow>
      <SolidRow height='50%'>
        <MetricSymbolColumn style={{paddingLeft:'5%'}}>
          <BIcon name='arrow-circle-down-outline' type='eva' size={28} color={'#0073ff'}/>
        </MetricSymbolColumn>
        <RecentMetricColumn>
          ~ B/S
        </RecentMetricColumn>
        <OverallMetricColumn>
          ~ B/S
        </OverallMetricColumn>
      </SolidRow>
    </MetricColumn>
  </BorderedSolidRow>
}