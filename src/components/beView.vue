<template>
  <div id="bev" :style="divCss">
    <el-divider>Bird Eye View</el-divider>

    <svg :width="svgWidth" :height="svgWidth">
      <!-- 道路 -->
      <g class="staticLanes">
        <path
          v-for="(dd, i) in allLaneData"
          :key="i"
          :d="pathPoly(dd)"
          :fill="sgCurrentOverLane == dd.id ? '#9434E3' : 'white'"
          :stroke="laneColor"
          stroke-width="1px"
          fill-opacity="0.4"
          stroke-opacity="0.9"
        />
      </g>
      <!-- 主车 -->
      <g
        class="egoCar"
        v-for="(d, i) in egoData"
        :key="i"
        :transform="`translate(${scaleX(d.cityX)}, ${scaleY(d.cityY)})`"
        @mouseover="itemMouse('over', d, $event)"
        @mouseout="itemMouse('out', d, $event)"
      >
        <path :d="drawStar(egoSize)" :fill="egoColor" fill-opacity="0.9" />
      </g>
      <!-- 其他车 -->
      <g class="otherVehicle">
        <path
          v-for="(d, i) in vehData"
          :key="i"
          :d="drawVehRect(d)"
          :stroke="vehColor"
          :fill="sgCurrentOverCar == d.track_label_uuid ? vehColor : 'white'"
          stroke-width="1px"
          :fill-opacity="sgCurrentOverCar == d.track_label_uuid ? 0.5 : 0"
          @mouseover="itemMouse('over', d, $event)"
          @mouseout="itemMouse('out', d, $event)"
        />
      </g>
      <!-- 人 -->
      <g class="people">
        <circle
          v-for="(d, i) in peoData"
          :key="i"
          :cx="scaleX(d.cityX)"
          :cy="scaleY(d.cityY)"
          r="3"
          :fill="sgCurrentOverPeo == d.track_label_uuid ? peoColor : 'white'"
          :stroke="peoColor"
          stroke-width="1.5"
          :fill-opacity="sgCurrentOverPeo == d.track_label_uuid ? 0.7 : 0"
          @mouseover="itemMouse('over', d, $event)"
          @mouseout="itemMouse('out', d, $event)"
        />
      </g>
      <!-- legend -->
      <g
        id="lineLegendBev"
        :transform="`translate(${svgWidth - marginLeft},${marginTop})`"
      >
        <g id="lineLegendTextBev"></g>

        <g
          :transform="`translate(${legendW / 2},${
            0 + 1 * (legendH + legendInterVal) + legendH / 2
          })`"
        >
          <path
            :d="drawStar(egoSize + 2)"
            :fill="egoColor"
            fill-opacity="0.9"
          />
        </g>
        <circle
          :cx="legendW / 2"
          :cy="0 + 2 * (legendH + legendInterVal) + legendH / 2"
          r="5"
          fill="none"
          :stroke="peoColor"
          stroke-width="1.5"
        />
        <rect
          :width="legendW"
          :height="legendH"
          x="0"
          :y="0 + 3 * (legendH + legendInterVal)"
          fill="none"
          :stroke="vehColor"
          stroke-width="2"
        ></rect>

        <rect
          :width="legendW"
          :height="legendH"
          x="0"
          :y="0 + 4 * (legendH + legendInterVal)"
          fill="none"
          :stroke="laneColor"
          stroke-width="2"
        ></rect>
      </g>
    </svg>

    <div id="playControl" :style="controlCss">
      <el-row align="middle">
        <el-col :span="4">
          <el-row>
            <el-col :span="10">
              <el-button type="primary" size="small" @click="videoPlay">
                <font-awesome-icon icon="fa-solid fa-play" />
                <!-- <font-awesome-icon icon="fa-solid fa-champagne-glasses" color="red" size="s" style="padding:0px"/> -->
              </el-button>
            </el-col>
            <el-col :span="10">
              <el-button type="primary" size="small" @click="videoStop">
                <font-awesome-icon icon="fa-solid fa-pause" />
                <!-- <font-awesome-icon icon="fa-solid fa-champagne-glasses" color="red" size="s" style="padding:0px"/> -->
              </el-button>
            </el-col>
          </el-row>
        </el-col>
        <el-col :span="15">
          <div class="grid-content ep-bg-purple-dark" />
          <el-slider
            v-model="currentTimestamp"
            :step="1"
            show-stops
            :min="0"
            :max="timeRange[1]"
          />
        </el-col>
        <el-col :span="4">
          <el-row>
            <el-col :span="2"></el-col>
            <el-col :span="10">
              <el-button type="primary" size="small" @click="videoMinus">
                <font-awesome-icon icon="fa-solid fa-minus" />
                <!-- <font-awesome-icon icon="fa-solid fa-champagne-glasses" color="red" size="s" style="padding:0px"/> -->
              </el-button>
            </el-col>
            <el-col :span="10">
              <el-button type="primary" size="small" @click="videoPlus">
                <font-awesome-icon icon="fa-solid fa-plus" />
                <!-- <font-awesome-icon icon="fa-solid fa-champagne-glasses" color="red" size="s" style="padding:0px"/> -->
              </el-button>
            </el-col>
          </el-row>
        </el-col>
      </el-row>
    </div>
    <div id="bevTip" :style="tooltip_css" v-html="tooltipContent"></div>
  </div>
</template>

<script>
import * as d3 from "d3";
import $ from "jquery";

import { mapState } from "vuex";
export default {
  name: "beView",
  props: {
    //这两个属性从父组件继承
    height: Number,
    width: Number,
    top: Number,
    left: Number,
  },
  data() {
    // this.$store.commit('getLogList', trackingDataAll["allLogs"])

    return {
      currentTimestamp: 0,
      sliderH: 35, // 时间控件

      nIntervId: "", // 控制播放
      playInterval: 100,
      legendW: 15,
      legendH: 10,
      legendInterVal: 10,
      marginLeft: 85,
      marginTop: 420,
      egoSize: 6,
      lineGenerator: d3.line(),
      tooltipContent: "",
      tooltip_css:
        "position: absolute;padding: 7px;font-size: 0.9em;pointer-events: none;background: rgba(255,255,255,0.6);border: 1px solid #ccc;" +
        "border-radius: 4px;-moz-box-shadow: 3px 3px 10px 0px rgba(0, 0, 0, 0.25);display:none" +
        "-webkit-box-shadow: 3px 3px 10px 0px rgba(0, 0, 0, 0.25);box-shadow: 3px 3px 10px 0px rgba(0, 0, 0, 0.25);display:none;z-index: 100;",
    };
  },
  computed: {
    ...mapState([
      "currentLogId",
      "sgCurrentOverLane",
      "sgCurrentOverCar",
      "sgCurrentOverPeo",
    ]),
    ...mapState(["currentTrackingData", "currentTime"]),
    ...mapState([
      "mapAll",
      "laneColor",
      "vehColor",
      "peoColor",
      "egoColor",
      "mapCenter",
      "mapRange",
    ]),
    // ...mapGetters(["currentCity"]),
    // ...mapGetters(["currentMapData"]),

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
    controlCss() {
      return (
        "position: absolute; border: 0px solid black;" +
        "height:" +
        this.sliderH +
        "px;" +
        "width:" +
        this.width +
        "px;" +
        "left:" +
        0 +
        "px;" +
        "top:" +
        (this.height - this.sliderH) +
        "px;margin-top:5px"
      );
    },
    svgWidth() {
      return Math.min(this.height, this.width) -15 ;
    },

    scaleX() {
      return d3
        .scaleLinear()
        .domain([
          this.mapCenter[0] - this.mapRange,
          this.mapCenter[0] + this.mapRange,
        ])
        .range([0, this.svgWidth]);
    },
    scaleY() {
      return d3
        .scaleLinear()
        .domain([
          this.mapCenter[1] - this.mapRange,
          this.mapCenter[1] + this.mapRange,
        ])
        .range([this.svgWidth, 0]);
    },
    allLaneData() {
      let currentCity = this.currentTrackingData["city"];
      let currentMapData = this.mapAll[currentCity];
      if (this.currentLogId == "") {
        return [];
      }
      let allLanes = this.currentTrackingData["allLanes"];

      let straightLanes = [],
        notStraightLanes = [];
      if (allLanes) {
        allLanes.forEach(function (laneId) {
          // console.log(currentMapData)
          if (
            currentMapData["laneInfos"][laneId.toString()].turn_direction ==
            "NONE"
          ) {
            straightLanes.push(laneId);
          } else {
            notStraightLanes.push(laneId);
          }
        });
        // let laneData = [];
        let laneData = [];
        straightLanes.concat(notStraightLanes).forEach(function (laneId) {
          laneData.push(currentMapData["laneInfos"][laneId.toString()]);
        });
        // console.log(laneData)
        return laneData;
      }
      return [];
    },
    egoData() {
      let res = [];
      if (this.currentTrackingData) {
        res = d3.filter(
          this.currentTrackingData["trackingInfos"],
          (d) =>
            (d.frame == this.currentTimestamp) & (d.track_label_uuid == "ego")
        );
        this.$store.commit("updateCurrentEgoData", res[0]);
      }

      return res;
    },
    timeRange() {
      if (this.currentTrackingData) {
        return d3.extent(
          d3.map(this.currentTrackingData["trackingInfos"], (d) => d.frame)
        );
      } else {
        return [];
      }
    },
    vehData() {
      if (this.currentTrackingData) {
        return d3.filter(
          this.currentTrackingData["trackingInfos"],
          (d) =>
            (d.frame == this.currentTimestamp) &
            (d.track_label_uuid != "ego") &
            (d.label_class == "VEHICLE")
        );
      } else {
        return [];
      }
    },
    peoData() {
      if (this.currentTrackingData) {
        return d3.filter(
          this.currentTrackingData["trackingInfos"],
          (d) =>
            (d.frame == this.currentTimestamp) &
            (d.track_label_uuid != "ego") &
            (d.label_class == "PEOPLE")
        );
      } else {
        return [];
      }
    },
  },
  mounted() {
    const legendG = d3.select("#lineLegendTextBev");
    let cur = this;
    legendG.selectChildren().remove();
    legendG
      .selectAll(".lineText")
      .data(["EGO", "PEOPLE", "VEHICLE", "LANE"])
      .enter()
      .append("text")
      .attr("x", 30)
      .attr("y", (d, i) => {
        return 10 + (i + 1) * (cur.legendInterVal + cur.legendH);
      })
      .text((d) => d)
      .attr("text-anchor", "left")
      .style("opacity", 0.95)
      .style("font-size", "12px");
  },
  watch: {
    currentTimestamp: function () {
      if (this.currentTimestamp == this.timeRange[1]) {
        clearInterval(this.nIntervId);
        this.nIntervId = null;
      }
      this.$store.commit("updateTime", this.currentTimestamp);
    },
    currentTime: function () {
      this.currentTimestamp = this.currentTime;
    },
  },

  methods: {
    pathPoly(d) {
      // console.log(d)

      let scaleX = this.scaleX;
      let scaleY = this.scaleY;
      let points = d3.map(d.polygon, function (dd) {
        return [scaleX(dd[0]), scaleY(dd[1])];
      });

      return this.lineGenerator(points);
    },
    drawStar(r) {
      // 五角星的10个点
      // https://blog.csdn.net/M0_38082783/article/details/127682226

      const pi_val = Math.PI / 180;
      const min_r = (r * Math.sin(18 * pi_val)) / Math.cos(36 * pi_val);

      const A = [0, r],
        B = [r * Math.cos(18 * pi_val), r * Math.sin(18 * pi_val)],
        C = [r * Math.cos(54 * pi_val), -r * Math.sin(54 * pi_val)],
        D = [-r * Math.cos(54 * pi_val), -r * Math.sin(54 * pi_val)],
        E = [-r * Math.cos(18 * pi_val), r * Math.sin(18 * pi_val)],
        F = [min_r * Math.cos(54 * pi_val), min_r * Math.sin(54 * pi_val)],
        G = [min_r * Math.cos(18 * pi_val), -min_r * Math.sin(18 * pi_val)],
        H = [0, -min_r],
        K = [-min_r * Math.cos(18 * pi_val), -min_r * Math.sin(18 * pi_val)],
        I = [-min_r * Math.cos(54 * pi_val), min_r * Math.sin(54 * pi_val)];
      return this.lineGenerator([A, F, B, G, C, H, D, K, E, I, A]);
    },
    drawVehRect(d) {
      // console.log(d)
      let bbox = d.bbox_city;
      let scaleX = this.scaleX,
        scaleY = this.scaleY;

      return this.lineGenerator([
        [scaleX(bbox[0][0]), scaleY(bbox[0][1])],
        [scaleX(bbox[1][0]), scaleY(bbox[1][1])],
        [scaleX(bbox[3][0]), scaleY(bbox[3][1])],
        [scaleX(bbox[2][0]), scaleY(bbox[2][1])],
        [scaleX(bbox[0][0]), scaleY(bbox[0][1])],
      ]);
    },

    videoPlay() {
      let cur = this;
      if (!this.nIntervId) {
        this.nIntervId = setInterval(function () {
          cur.currentTimestamp += 1;
          cur.$store.commit("updateTime", cur.currentTimestamp);
        }, this.playInterval);
      }
    },
    videoStop() {
      clearInterval(this.nIntervId);
      this.nIntervId = null;
    },
    videoPlus(){
      let cur = this
      if (cur.currentTimestamp < cur.timeRange[1]){
        cur.currentTimestamp += 1;
        cur.$store.commit("updateTime", cur.currentTimestamp);
      }
    },
    videoMinus(){
      let cur = this
      if (cur.currentTimestamp > cur.timeRange[0]){
        cur.currentTimestamp -= 1;
        cur.$store.commit("updateTime", cur.currentTimestamp);
      }
    },
    itemMouse(action, d, $event) {
      let tooltip = $("#bevTip");
      this.tooltipContent = "track_label_uuid : " + d.track_label_uuid;
      if (action == "over") {
        tooltip.css("display", "block");
        tooltip.css("left", $event.offsetX + 40);
        tooltip.css("top", $event.offsetY - 10);
      } else {
        tooltip.css("display", "none");
      }
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>