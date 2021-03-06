import React, {useState} from 'react';
import PropTypes from 'prop-types';

import SolidRow from "../../components/BeanUILibrary/SolidRow";
import TabColumn from "../../components/BeanUILibrary/TabColumn";
import BIcon from "../../components/BeanUILibrary/BIcon";
import {
  ArrowColumn, ArrowContainerColumn, BorderedSolidRow,
  CountryColumn,
  DestinationColumn,
  FixedTitle, GraphColumn,
  DestNameColumn, MetricColumn, MetricSymbolColumn, OverallMetricColumn, RecentMetricColumn,
  SourceColumn, RELCOLWIDTHS, numberToPercentString, getRelColWidths, getPercentageStrings,
} from "./ColumnStyles";
import SectionSubtitle from "../../components/SectionSubtitle";
import styled from "styled-components";

export const TableHeader = ({
                              sentColor,
                              receivedColor,
                              height,
                              width,
                            }) => {

  const minHeight = 53;
  const relHeight = height < minHeight ? minHeight : height;

  const relWidths = getRelColWidths(width);

  const {
    sourceWidth,
    arrowWidth,
    arrowContainerWidth,
    destWidth,
    destNameWidth,
    destCountryWidth,
    graphWidth,
    metricWidth,
    metricSymbolWidth,
    recentMetricWidth,
    overallMetricWidth,
  } = getPercentageStrings(relWidths);

  const destVals = width < 800 ?
    {title: 'Dest', width: '95%', marginLeft: '5%'} :
    {title: 'Destination', width: '80%', marginLeft: '20%'};

  const recentMetricTitle = '5 sec'
  const overallMetricTitle = '30 sec'

  return <BorderedSolidRow height={`${relHeight}px`}>
    <SourceColumn colWidth={sourceWidth} style={{display: 'flex', alignItems: 'flex-start'}}>
      <FixedTitle title='Source' style={{width: '100%', textAlign: 'center'}}/>
      <SectionSubtitle text='Name' style={{width: '100%', textAlign: 'center'}}/>
    </SourceColumn>
    <ArrowColumn colWidth={arrowWidth}/>
    <DestinationColumn colWidth={destWidth} style={{display: 'flex', alignItems: 'flex-start'}}>
      <FixedTitle title={destVals.title}
                  style={{marginLeft: destVals.marginLeft, width: destVals.width, textAlign: 'center'}}/>
      <div style={{width: '100%', display: 'inline-grid', gridTemplateColumns: `${destNameWidth} ${destCountryWidth}`}}>
        <SectionSubtitle text='Name' style={{textAlign: 'center'}}/>
        <SectionSubtitle text='Country' style={{textAlign: 'center', overflow: 'hidden'}}/>
      </div>
    </DestinationColumn>
    <GraphColumn colWidth={graphWidth} style={{textAlign: 'center'}}>
      <div style={{display: 'inline-grid', gridTemplateColumns: 'auto auto auto', justifyContent: 'start'}}>
        <FixedTitle style={{color: (sentColor ? sentColor : '#ff1e00')}} size='xsm'>
          Sent
        </FixedTitle>
        <FixedTitle>
          /
        </FixedTitle>
        <FixedTitle style={{color: (receivedColor ? receivedColor : '#0073ff')}} size='xsm'>
          Received
        </FixedTitle>
      </div>
    </GraphColumn>
    {renderMetricCols(relWidths, metricWidth, metricSymbolWidth, recentMetricWidth, overallMetricWidth, recentMetricTitle, overallMetricTitle)}

  </BorderedSolidRow>
}

const renderMetricCols = (relWidths, metricWidth, metricSymbolWidth, recentMetricWidth, overallMetricWidth, recentMetricTitle, overallMetricTitle) => {
  if (relWidths.RecentMetricColumn === 0) {
    return <MetricColumn colWidth={metricWidth} style={{display: 'flex', alignItems: 'flex-start'}}>
      <FixedTitle style={{paddingLeft: '17%', width: '100%', textAlign: 'center'}} title='Traffic' size='xsm'/>
      <div style={{
        width: '100%',
        display: 'inline-grid',
        gridTemplateColumns: `${metricSymbolWidth} ${overallMetricWidth}`
      }}>
        <div style={{width: '100%'}}/>
        <SectionSubtitle text='30 sec' style={{textAlign: 'center'}}/>
      </div>
    </MetricColumn>
  } else {
    return <MetricColumn colWidth={metricWidth} style={{display: 'flex', alignItems: 'flex-start'}}>
      <FixedTitle style={{paddingLeft: '17%', width: '100%', textAlign: 'center'}} title='Traffic' size='xsm'/>
      <div style={{
        width: '100%',
        display: 'inline-grid',
        gridTemplateColumns: `${metricSymbolWidth} ${recentMetricWidth} ${overallMetricWidth}`
      }}>
        <div style={{width: '100%'}}/>
        <SectionSubtitle text={recentMetricTitle} style={{textAlign: 'center', overflow: 'hidden'}}/>
        <SectionSubtitle text={overallMetricTitle} style={{textAlign: 'center'}}/>
      </div>
    </MetricColumn>
  }
}

TableHeader.propTypes = {
  sentColor: PropTypes.string,
  receivedColor: PropTypes.string,
  height: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
}
