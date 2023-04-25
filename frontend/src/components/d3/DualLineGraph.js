import React, {useState} from 'react';
import PropTypes from 'prop-types';
import {formatBytes} from "../../utility/FormatUtility";

const textXXOffset = 15;
const textXYOffset = 17;
const textYXOffset = 10;
const textYYOffset = 4;
const strokeColor = '#777'

const drawX = (start, end, yPos) => {
  return <line x1={start} y1={yPos} x2={end} y2={yPos} stroke={strokeColor} strokeWidth={1}/>
}

const drawXLabels = (ticks, maxTime, start, end, yPos) => {

  const interval = maxTime / ticks;
  const xSkip = (end - start) / ((ticks * interval) - 1);
  const skipPos = [];
  for (let i = 0; i < ticks; ++i) {
    skipPos[i] = {
      pos: end - (i * xSkip * interval),
      time: i * interval,
    }
  }

  return <g>
    {skipPos.map((tick, index) => {
      return <g key={index}>
        <text x={tick.pos - textXXOffset} y={yPos + textXYOffset} fill={strokeColor} fontSize={10}>{tick.time}sec</text>
        <line
          x1={tick.pos}
          y1={yPos + 5}
          x2={tick.pos}
          y2={yPos - 5}
          stroke={strokeColor}
          strokeWidth={1}
        />
      </g>
    })}
  </g>

}

const drawYLabels = (max, height) => {

  const mid = (height / 2);
  const midTop = mid + (height / 4);
  const midBottom = mid - (height / 4);
  const tickVal = Math.floor(max / 2);

  return <g>
    <text x={textYXOffset} y={midTop + textYYOffset} fill={strokeColor}
          fontSize={12}>{formatBytes(tickVal, '', 0)}</text>
    <text x={textYXOffset} y={midBottom + textYYOffset} fill={strokeColor}
          fontSize={12}>{formatBytes(tickVal, '', 0)}</text>
    <line x1={0} y1={midTop} x2={5} y2={midTop} stroke={strokeColor} strokeWidth={1}/>
    <line x1={0} y1={midBottom} x2={5} y2={midBottom} stroke={strokeColor} strokeWidth={1}/>
  </g>

}

const drawLine = (timeFrame, data, max, height, width, color, isSent) => {
  // console.log(data)

  // console.log(max)
  const halfHeight = height / 2;
  let maxMult = 0;
  if (max > 0) {
    maxMult = halfHeight / (max * 1.0);
  }
  const pointWidth = width / (timeFrame - 1);
  let pointStr = '';
  const diff = timeFrame - data.length;
  for (let i = data.length - 1; i >= 0; --i) {

    let relativeY = halfHeight;
    if (isSent) {
      relativeY = halfHeight - (maxMult * data[i]);
    } else {
      relativeY = halfHeight + (maxMult * data[i]);
    }

    const relativeX = pointWidth * (i + diff);

    pointStr += relativeX + ',' + relativeY + ' ';
  }

  // manually add polygon points for fill using existing string
  let fillStr = pointStr;
  // prepend first point (leftmost)
  fillStr = width + ',' + halfHeight + ' ' + fillStr;
  // append last point (rightmost)
  fillStr += '0,' + halfHeight;

  // console.log(fillStr)

  return <g>
    <polyline
      fill='none'
      stroke={color}
      strokeWidth='1'
      points={pointStr}
    />
    <polyline
      fill={color}
      opacity={0.3}
      stroke='transparent'
      points={fillStr}
    />
  </g>
}

export const DualLineGraph = ({
                                height,
                                width,
                                data,
                                ticks,
                                timeFrame,
                                timeStamp,
                                topColor,
                                bottomColor,
                              }) => {

  const view = `0 0 ${width} ${height}`
  const xAxisStart = 0;
  const xAxisEnd = width;
  const xAxisYPos = (height / 2);

  // console.log(data)
  // console.log(data.length)

  // console.log(timeStamp);

  // find the last element that can be displayed by converting timeFrame to milliseconds
  // and subtracting that value from timeStamp
  const end = timeStamp - ((timeFrame) * 1000);
  const sent = Array(timeFrame).fill(0);
  const received = Array(timeFrame).fill(0);
  let max = 0;
  for (let i = 0; i < data.length; ++i) {
    // get data points
    const currSent = data[i].size[0];
    const currReceived = data[i].size[1];

    // get timestamp on packet
    const currTime = data[i].time;
    // get index of packet in sent/received
    const index = Math.floor(((timeStamp - currTime) / 1000));
    // console.log(index)
    // if index has not yet been rendered on the graph or it is older than what is displayed, do not insert into array
    if (index < 0 || index >= timeFrame) {
      continue;
    }
    const relativeIndex = (timeFrame - 1) - index;
    sent[relativeIndex] += (currSent);
    received[relativeIndex] += currReceived;

    // get max val for drawing y -- perform only if the metric provided is valid
    max = Math.max(max, currSent, currReceived)
  }

  const tickMarks = (ticks ? ticks : 3);
  const maxTime = (timeFrame ? timeFrame : 30);

  const updateData = (maxTime, max, height, width, sent, received, topColor, bottomColor) => {
    return (
      <>
        {drawYLabels(max, height)}
        {drawLine(maxTime, sent, max, height, width, (topColor ? topColor : '#ff1e00'), true)}
        {drawLine(maxTime, received, max, height, width, (bottomColor ? bottomColor : '#0073ff'), false)}
      </>
    )
  }

  return (
    <svg viewBox={view}>
      {drawX(xAxisStart, xAxisEnd, xAxisYPos)}
      {drawXLabels(tickMarks, maxTime, xAxisStart, xAxisEnd, xAxisYPos)}
      {updateData(maxTime, max, height, width, sent, received, topColor, bottomColor)}
    </svg>
  )
}

DualLineGraph.propTypes = {
  height: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
  data: PropTypes.array.isRequired,
  ticks: PropTypes.number,
  timeFrame: PropTypes.number,
  timeStamp: PropTypes.number.isRequired,
  topColor: PropTypes.string,
  bottomColor: PropTypes.string,
}