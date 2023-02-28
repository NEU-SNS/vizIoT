import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {scaleOrdinal} from 'd3-scale';
import {schemeCategory20c} from 'd3-scale';
import {select} from 'd3-selection';
import {pack, hierarchy} from 'd3-hierarchy';
import {easeLinear} from 'd3-ease';
import {formatLocale} from 'd3-format';
import moment from 'moment';
import {SPACING} from '../../data/records/Spacing';
import {invertColor} from '../../utility/ColorUtility';
import tinygradient from 'tinygradient';

const format = formatLocale(',d');
const colorScheme = tinygradient([
  {color: '#FFFFFF', pos: 0},
  {color: '#FFECB3', pos: 0.2},
  {color: '#E85285', pos: 0.45},
  {color: '#6A1B9A', pos: 0.65},
  {color: '#000000', pos: 1.0},
]);

// TODO Types of variables
// Categorical/Nominal/Class
// Ordinal: distance between is not equal, but there is ordering
// Interval: distance is equal, but zero is not sig (IQ level)
// Ratio: there is an absolute 0, distance, weight...

class BubbleChart extends Component {
  constructor(props) {
    super(props);
    this.state = {
      graphData: [],
      ...this.getLiveDomainForX(),
      graphDimensions: this.getGraphDimensions(),
    };
  }

  componentDidMount() {
    this.launchChart();
  }

  componentDidUpdate() {
    // this.redrawChart();
  }

  UNSAFE_componentWillReceiveProps(newProps) {
    // this.redrawChart();

    this.setState(() => {
      return {
        graphDimensions: this.getGraphDimensions(),
        graphData: newProps.data,
      };
    });
  }

  getGraphDimensions() {
    const {
      padding,
      dimension: {width, height},
    } = this.props;
    const {l, r, t, b} = padding;

    const graphWidth = width - l - r;
    const graphHeight = height - t - b;
    return {graphWidth, graphHeight};
  }

  redrawChart() {
    const {
      graphData,
      graphDimensions: {graphWidth, graphHeight},
    } = this.state;

    // =================================================================================================================
    // Start Render Content
    // =================================================================================================================

    const node = this.node;
    const svg = select(node);
    const chartWrapper = svg.select('.chartWrapper');

    let duration = 700;
    let delay = 100;

    function circles(classes) {
      if (classes.length === 0) {
        return;
      }

      const root = hierarchy({children: classes})
        .sum(d => d.value)
        .each(d => {
          let id = d.data.id;
          if (id) {
            let i = id.lastIndexOf(' ');

            d.id = id;
            d.package = id.slice(0, i);
            d.class = id.slice(i + 1);
            d.name = `${d.class.split(/(?=[A-Z][^A-Z])/g)} ${d.value}`;
          }
        });

      const packer = pack()
        .size([graphWidth, graphHeight])
        .padding(10);

      let packedData = packer(root).leaves();
      const node = chartWrapper
        .select('.geo')
        .selectAll('.node')
        .data(packedData, d => d.id);

      const max = packedData.reduce((a, b) => {
        if (a.data.value > b.data.value) {
          return a;
        } else {
          return b;
        }
      }).data.value;

      const numLevels = 12;
      const colorsRgb = colorScheme.rgb(numLevels);
      const valueToColor = d => {
        const thisLevel = Math.floor(
          (d.data.value / (max * 1.0)) * (numLevels - 1)
        );
        return 'url(#Gradient1)';
        // return colorsRgb[thisLevel].toHexString();
      };

      // exit
      node
        .exit()
        .transition()
        .duration(duration + delay)
        .style('opacity', 0)
        .remove();

      // update - This only applies to updating nodes

      // This updates nodes
      node
        .transition()
        .duration(duration)
        .delay(function (d, i) {
          delay = i * 7;
          return delay;
        })
        .attr('transform', d => {
          return `translate(${d.x},${d.y})`;
        });

      const enterDuration = duration * 1.2;

      // This updates circles in the nodes
      let updateCircleSelection = node.select('circle');
      updateCircleSelection
        .transition()
        .duration(duration)
        .delay(function (d, i) {
          delay = enterDuration + i * 7;
          return delay;
        })
        .attr('r', d => {
          return d.r;
        })
        // .attr('transform', d => {
        //   return `translate(${d.x},${d.y})`;
        // })
        .style('fill', valueToColor);

      // ===============================================================================================================
      // Enter
      // ===============================================================================================================
      const newNodes = node
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', function (d) {
          return 'translate(' + d.x + ',' + d.y + ')';
        });

      newNodes
        .append('circle')
        .attr('id', d => d.id)
        .attr('r', d => d.r)
        .style('fill', valueToColor)
        .style('fill-opacity', 0)
        .attr('class', d => d.class)
        .transition()
        .duration(enterDuration)
        .style('fill-opacity', 1);

      newNodes
        .append('clipPath')
        .attr('id', function (d) {
          return 'clip-' + d.id;
        })
        .append('use')
        .attr('xlink:href', function (d) {
          return '#' + d.id;
        });

      const textNode = chartWrapper
        .select('.labels')
        .selectAll('text')
        .data(packedData)
        .attr('fill', d => invertColor(valueToColor(d), true))
        .style('background', valueToColor)
        .attr('x', d => d.x)
        .attr('y', (d, i, nodes) => {
          return d.y + 3;
          // return 13 + (i - nodes.length / 2 - 0.5) * 10;
        })
        .text(d => (d.r > 25 ? d.name : ''));

      textNode
        .enter()
        .append('text')
        .attr('clip-path', d => `url(#clip-${d.id}')`)
        .attr('text-anchor', 'middle')
        .style('background', valueToColor)
        .attr('fill', d => invertColor(valueToColor(d), true))
        .attr('x', d => d.x)
        .attr('y', (d, i, nodes) => {
          return d.y + 3;
          // return 13 + (i - nodes.length / 2 - 0.5) * 10;
        })
        .text(d => (d.r > 25 ? d.name : ''));

      textNode.exit().remove();

      newNodes.append('title').text(function (d) {
        return d.id + '\n' + format.format(d.value);
      });
    }

    circles(graphData);
  }

  launchChart = () => {
    const {data, padding} = this.props;
    const {leftAxisMargin, graphDimensions} = this.state;
    const {graphWidth, graphHeight} = graphDimensions;

    const graphData = data;
    this.setState(() => {
      return {graphData};
    });

    BubbleChart.appendChartSkeleton(
      graphData,
      this.node,
      graphWidth,
      graphHeight,
      padding,
      leftAxisMargin
    );
    this.redrawChart();
    // this.loop('start');
  };

  // loop(whenToActivate) {
  //   select(this.node)
  //     .transition()
  //     .duration(500)
  //
  //     .on(whenToActivate, this.onEachLoop);
  // }

  getLiveDomainForX = () => {
    const {dataWindowSize, dataWindowUnit} = this.props;
    const nowMoment = moment();
    const xStart = nowMoment
      .clone()
      .subtract(dataWindowSize, dataWindowUnit)
      .toDate();
    const xEnd = nowMoment.toDate();
    return {xStart, xEnd};
  };

  onEachLoop = () => {
    this.setState(() => {
      return {
        ...this.getLiveDomainForX(),
      };
    });
    this.loop('end');
  };

  // clearChartSkeleton() {
  //   const svg = select(this.node);
  //   svg.selectAll('chartWrapper').remove();
  // }

  static appendChartSkeleton(
    graphData,
    rootNode,
    graphWidth,
    graphHeight,
    padding
  ) {
    const data = graphData;
    const {l: lPadding, t: tPadding, r: rPadding, b: bPadding} = padding;
    const svg = select(rootNode);

    const chartWrapper = svg
      .append('g')
      .attr('class', 'chartWrapper')
      .attr('transform', `translate(${lPadding}, ${tPadding})`);

    chartWrapper.append('g').attr('class', 'geo');

    chartWrapper.append('g').attr('class', 'labels');
  }

  render() {
    const {
      dimension: {width, height},
    } = this.props;
    this.redrawChart();
    return (
      <div>
        <svg
          className="bubbleChart"
          ref={node => (this.node = node)}
          viewBox={`0 0 ${width} ${height}`}
          textAnchor="middle"
        >
          <defs>
            <linearGradient id="Gradient1" x1="0%" y1="8%" x2="100%" y2="92%">
              <stop className="stop1" offset="0%"/>
              <stop className="stop3" offset="100%"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }
}

BubbleChart.propTypes = {
  dimension: PropTypes.object.isRequired,
  // {id, value}
  data: PropTypes.array.isRequired,
  dataWindowSize: PropTypes.number.isRequired,
  dataWindowUnit: PropTypes.string.isRequired,
  padding: PropTypes.instanceOf(SPACING).isRequired,
};

export default BubbleChart;
