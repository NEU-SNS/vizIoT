'use es6';

import React from 'react';
import styled from 'styled-components';

import ScheduleCard from '../containers/ScheduleCard';
import SectionTitle from '../components/SectionTitle';
import SectionSubtitle from '../components/SectionSubtitle';

const Padded = styled.div`
  padding: 0 6%; 
`;

const TitleSection = styled.div`
`;

export default () => {
  return (
    <Padded>
      <TitleSection className={'m-tb-10'}>
        <SectionTitle title="Timeline" size={'lg'} cardPadding={false}/>
        <SectionSubtitle text={'Jump across time to find temporal patterns in traffic'}/>
      </TitleSection>
      <ScheduleCard/>
    </Padded>
  );
};
