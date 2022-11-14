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
          fill="white"
          :stroke="laneColor"
          stroke-width="1px"
          fill-opacity="0.4"
          stroke-opacity="0.9"
        />
      </g>
      <!-- 主车 -->
      <g class="egoCar" v-for="(d, i) in egoData" :key="i" :transform="`translate(${scaleX(d.cityX)}, ${scaleY(d.cityY)})`" 
      @mouseover="itemMouse('over', d, $event)"
      @mouseout="itemMouse('out', d, $event)"
      >
        <path :d="drawStar(egoSize)" :fill="egoColor" fill-opacity="0.9" />
      </g>
       <!-- 其他车 -->
       <g class="otherVehicle" >
        <path v-for="(d, i) in vehData" :key="i" :d="drawVehRect(d)" :stroke="vehColor" stroke-width="1px" fill-opacity = "0" 
        @mouseover="itemMouse('over', d, $event)"
        @mouseout="itemMouse('out', d, $event)"
        />
      </g>
      <!-- 人 -->
      <g class="people" >
        <circle v-for="(d, i) in peoData" :key="i" 
        :cx="scaleX(d.cityX)" :cy="scaleY(d.cityY)" r="3" :fill = "peoColor" 
        @mouseover="itemMouse('over', d, $event)"
        @mouseout="itemMouse('out', d, $event)"
        />
      </g>
    </svg>

    <div id="playControl" :style="controlCss">
      <el-row align="middle">
        <el-col :span="5">
          <div class="grid-content ep-bg-purple-dark" />
          <el-button type="primary" size="small" @click = "videoPlay">
            <font-awesome-icon icon="fa-solid fa-play" />
            <!-- <font-awesome-icon icon="fa-solid fa-champagne-glasses" color="red" size="s" style="padding:0px"/> -->
          </el-button>
          <el-button type="primary" size="small"  @click = "videoStop">
            <font-awesome-icon icon="fa-solid fa-pause" />
          </el-button>
        </el-col>
        <el-col :span="19">
          <div class="grid-content ep-bg-purple-dark" />
          <el-slider v-model="currentTimestamp" :step="1" show-stops :min="0" :max="timeRange[1]"/>
        </el-col>
      </el-row>
    </div>
    <div
      id="bevTip"
      :style="tooltip_css"
      v-html="tooltipContent">
    </div>
  </div>
</template>

<script>
import * as d3 from "d3";
import $ from "jquery";

import { mapState, mapGetters } from "vuex";
export default {
  name: "beView",
  props: {
    //这两个属性从父组件继承
    height: Number,
    width: Number,
    top: Number,
    left: Number
  },
  data() {
    // this.$store.commit('getLogList', trackingDataAll["allLogs"])

    return {
      currentTimestamp: 0,
      sliderH: 35, // 时间控件
      laneColor: "#716e77",
      vehColor: "#3E6D9C",
      peoColor: "#D25565",
      egoColor: "red",
      nIntervId: "", // 控制播放
      playInterval:300,
      egoSize:6,
      lineGenerator:d3.line(),
      tooltipContent: "",
      tooltip_css:
        "position: absolute;padding: 7px;font-size: 0.9em;pointer-events: none;background: #fff;border: 1px solid #ccc;" +
        "border-radius: 4px;-moz-box-shadow: 3px 3px 10px 0px rgba(0, 0, 0, 0.25);display:none" +
        "-webkit-box-shadow: 3px 3px 10px 0px rgba(0, 0, 0, 0.25);box-shadow: 3px 3px 10px 0px rgba(0, 0, 0, 0.25);display:none",
    };
  },
  computed: {
    ...mapState(["currentLogId"]),
    ...mapGetters(["currentTrackingData"]),
    ...mapState(["mapAll"]),
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
        "px;"
      );
    },
    svgWidth() {
      return Math.min(this.height, this.width) - 50 - this.sliderH;
    },

    mapCenter() {
      return this.currentTrackingData["mapCenter"];
    },
    mapRange() {
      return this.currentTrackingData["mapRange"];
    },
    scaleX() {
      return d3
        .scaleLinear()
        .domain([
          this.mapCenter[0] - this.mapRange,
          this.mapCenter[0] + this.mapRange
        ])
        .range([0, this.svgWidth]);
    },
    scaleY() {
      return d3
        .scaleLinear()
        .domain([
          this.mapCenter[1] - this.mapRange,
          this.mapCenter[1] + this.mapRange
        ])
        .range([0, this.svgWidth]);
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
      allLanes.forEach(function(laneId) {
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
      let laneData = [];
      straightLanes.concat(notStraightLanes).forEach(function(laneId) {
        laneData.push(currentMapData["laneInfos"][laneId.toString()]);
      });
      return laneData;
    },
    egoData() {
      return d3.filter(
        this.currentTrackingData["trackingInfos"],
        d => (d.frame == this.currentTimestamp) & (d.track_label_uuid == "ego")
      );
    },
    timeRange(){
      return d3.extent(d3.map(this.currentTrackingData["trackingInfos"], d=> d.frame))
    },
    vehData(){
      return d3.filter(this.currentTrackingData["trackingInfos"], d => (d.frame == this.currentTimestamp) & (d.track_label_uuid != "ego") & (d.label_class == "VEHICLE"))
    },
    peoData(){
      return d3.filter(this.currentTrackingData["trackingInfos"], d => d.frame == this.currentTimestamp & d.track_label_uuid != "ego" & d.label_class == "PEOPLE")
    },
  },
  mounted() {},
  watch:{
    currentTimestamp: function(){
      if (this.currentTimestamp == this.timeRange[1]){
        clearInterval(this.nIntervId);
        this.nIntervId = null;
      }
    }
  },
  methods: {
    pathPoly(d) {
      // console.log(d)
      
      let scaleX = this.scaleX;
      let scaleY = this.scaleY;
      let points = d3.map(d.polygon, function(dd) {
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
    drawVehRect(d){
      // console.log(d)
      let bbox = d.bbox_city
      let scaleX = this.scaleX, scaleY = this.scaleY
      
      return this.lineGenerator([[scaleX(bbox[0][0]), scaleY(bbox[0][1])], [scaleX(bbox[1][0]), scaleY(bbox[1][1])],
                        [scaleX(bbox[3][0]), scaleY(bbox[3][1])], [scaleX(bbox[2][0]), scaleY(bbox[2][1])],
                        [scaleX(bbox[0][0]), scaleY(bbox[0][1])]])
    },
    
    videoPlay(){
      let cur = this
      if (!this.nIntervId ) {
          this.nIntervId = setInterval(function(){
            cur.currentTimestamp += 1
          }, this.playInterval);
      }

    },
    videoStop(){
      clearInterval(this.nIntervId);
      this.nIntervId = null;
    },
    itemMouse(action, d, $event){
      let tooltip = $("#bevTip")
      this.tooltipContent = "track_label_uuid : " + d.track_label_uuid
      if (action == "over"){
        tooltip.css("display", "block");
        tooltip.css("left", $event.offsetX + 40);
        tooltip.css("top", $event.offsetY - 10);
      }
      else{
        tooltip.css("display", "none");
      }
      
      
        
    }
   
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>