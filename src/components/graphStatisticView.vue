
// https://d3-graph-gallery.com/graph/density_basic.html
<template>
  <div id="graphStatisticView" :style="divCss">
    <el-divider> Over View </el-divider>
    <svg id="speedAccYaw" :width="width" :height="height">
      <g id="speedDensity">
        <foreignObject :x="width/2- 40" y="0" width="80" height="40">
          <text> Speed</text>
        </foreignObject>
        
      </g>
      <g id="accDensity" :transform="`translate(0, ${densityHeight + marginTop})`">
        <foreignObject :x="width/2- 40" y="0" width="80" height="40">
          <text> Acceleration</text>
        </foreignObject>
      </g>
      <g id="yawDensity" :transform="`translate(0, ${(densityHeight + marginTop) * 2})`">
        <foreignObject :x="width/2- 40" y="0" width="80" height="40">
          <text> YawDiff</text>
        </foreignObject>

      </g>
    </svg>
  </div>
</template>

<script>
import { mapState } from "vuex";
import * as d3 from "d3";

export default {
  name: "graphStatisticView",
  props: {
    //这两个属性从父组件继承
    height: Number,
    width: Number,
    top: Number,
    left: Number,
  },
  data() {
    return {
      marginLeft: 40,
      marginTop: 15,
    };
  },
  computed: {
    ...mapState(["summaryData"]),
    ...mapState(["speedFillColor", "accelerationColor", "yawDiffColor"]),

    densityHeight(){
      return (this.height - this.marginTop * 5 - this.top )/ 3
    },
    divCss() {
      return (
        "position: absolute; border: 0px solid black;" +
        "height:" +
        this.height +
        "px;" +
        "width:" +
        this.width +
        "px;" +
        "left:" +
        this.left +
        "px;" +
        "top:" +
        this.top +
        "px;"
      );
    },
  },
  
  methods: {
    plotDensity(data_all, col, epsilon, poi_num, yMax, fillColor) {
      let data = data_all[col];
      let group = ""
      if (col == "speed") {
        group = d3.select("#speedDensity");
      } else if (col == "acceleration") {
        group = d3.select("#accDensity");
      } else if (col == "yawDiff") {
        group = d3.select("#yawDensity");
      }

      // add the x Axis
      let cur = this;
      let valueRange = d3.extent(data);
      // console.log(valueRange);
      let interval = (d3.max(data) - d3.min(data)) / poi_num
      // console.log(interval)
      let minX =  d3.min(data) - interval, maxX = d3.max(data) + interval
      let xScale = d3
        .scaleLinear()
        .domain([minX, maxX])
        .range([cur.marginLeft, cur.width - cur.marginLeft]);
      let poi = d3.range(minX, maxX + interval / 2, interval)
      
      // console.log(poi);
      let eps = Math.min(epsilon, interval)
      

      group
        .append("g")
        .attr("transform", `translate(0, ${cur.densityHeight})`)
        .call(d3.axisBottom(xScale));

      // add the y Axis
      
      const yScale = d3.scaleLinear().range([cur.densityHeight, 0]).domain([0, yMax]);
      group.append("g")
      .attr("transform", `translate(${cur.marginLeft}, 0)`)
      .call(d3.axisLeft(yScale));
      
      // Compute kernel density estimation
      const kde = cur.kernelDensityEstimator(
        cur.kernelEpanechnikov(eps),
        poi
      );
      // console.log(data.map(function(d){  return d.speed; }) )
      // console.log(speedX.ticks(40))
      const density = kde(data);
      // console.log(density);
      // [speedRange[0]-1, 0].concat(density).concat([speedRange[0]+1, 0])

      // Plot the area
      group
        .append("path")
        .attr("class", "mypath")
        .datum(density)
        .attr("fill", fillColor)
        .attr("opacity", "0.4")
        .attr("stroke", "#000")
        .attr("stroke-width", 1)
        .attr("stroke-linejoin", "round")
        .attr(
          "d",
          d3
            .line()
            .curve(d3.curveBasis)
            .x(function (d) {
              return xScale(d[0]);
            })
            .y(function (d) {
              return yScale(d[1]);
            })
        );
    },
    // Function to compute density
    kernelDensityEstimator(kernel, X) {
      return function (V) {
        return X.map(function (x) {
          return [
            x,
            d3.mean(V, function (v) {
              return kernel(x - v);
            }),
          ];
        });
      };
    },
    kernelEpanechnikov(k) {
      //  k 表示带宽 落入领域为1 不在为0
      return function (v) {
        return Math.abs((v /= k)) <= 1 ? (0.75 * (1 - v * v)) / k : 0;
      };
    },
  },
  mounted() {
    let cur = this;
    console.log(cur.summaryData)

    this.plotDensity(cur.summaryData, "speed", 2, 30, 0.04, cur.speedFillColor);
    this.plotDensity(cur.summaryData, "acceleration", 2, 30, 0.1, cur.accelerationColor);
    this.plotDensity(cur.summaryData, "yawDiff", 0.005, 30, 0.8, cur.yawDiffColor);

    
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>