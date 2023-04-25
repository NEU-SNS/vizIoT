'use es6';

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
  ACTIVE_FILL_COLOR,
  CARD_COLOR, HOVER_FILL_COLOR,
} from 'VizIoT/styles/base/viz-theme';
import {withClickable} from 'UIBean/CommonHOC';

export const ButtonShape = {
  ICON: 'ICON',
  RECT: 'RECT',
};

export const ButtonOrientation = {
  HORIZONTAL: 'HORIZONTAL',
  STACKED: 'STACKED',
};

const ButtonShapesList = Object.keys(ButtonShape);
const ButtonOrientationList = Object.keys(ButtonOrientation);

const shapeToRadius = shape => {
  if (shape === ButtonShape.ICON) {
    return '50%';
  } else {
    return '1rem';
  }
};

const orientationToFlexDirection = orientation => {
  if (orientation === ButtonOrientation.HORIZONTAL) {
    return 'row';
  } else {
    return 'column';
  }
};

const BButtonWrapper = styled.button`
  display: flex;
  flex-direction: ${({orientation}) =>
  orientationToFlexDirection(orientation)};
  justify-content: center;
  align-items: center;
  width: fit-content;
  padding: 6px;

  background: ${CARD_COLOR};
  color: white;
  border: solid #ffffff21 1px;
  border-radius: ${({shape}) => shapeToRadius(shape)};
  transition: background 0.2s;

  &:hover {
    background: ${HOVER_FILL_COLOR};
    border-color: white;
  }

  &:active {
    background: ${ACTIVE_FILL_COLOR};
  }
`;

const BButton = ({shape, ...rest}) => {
  return <BButtonWrapper type="button" shape={shape} {...rest} />;
};

BButton.defaultProps = {
  shape: ButtonShape.ICON,
  orientation: ButtonOrientation.HORIZONTAL,
};

BButton.propTypes = {
  shape: PropTypes.oneOf(ButtonShapesList),
  orientation: PropTypes.oneOf(ButtonOrientationList),
};

export default React.memo(withClickable(BButton))
