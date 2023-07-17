<template>
  <div class="projectView" :style="divCss">
    <el-divider> Projection View </el-divider>
    <el-row style="margin-bottom: 3px">
      <el-col :span="4">
        <el-button type="primary" style="font-size:18px;padding:0px 2px;" size="default"  @click="highlight('current')">
          Current</el-button
        >
      </el-col>
      <el-col :span="3.5">
        <el-button type="primary" size="default" style="font-size:18px;padding:0px 2px;" @click="highlight('search')">
          Search</el-button
        >
      </el-col>
      <el-col :span="5">
        <el-button type="primary" size="default" style="font-size:18px;padding:0px 2px;" @click="update_view()">
          Plot Brush</el-button
        >
      </el-col>
      <el-col :span="6">
        <el-button type="primary" size="default" style="font-size:18px;padding:0px 2px;" @click="update_legend('show')">
          Show Legend</el-button
        >
      </el-col>
      <el-col :span="5.5">
        <el-button type="primary" size="default" style="font-size:18px;padding:0px 2px;" @click="update_legend('hide')">
          Hide Legend</el-button
        >
      </el-col>
    </el-row>
    <div>
      <svg
        :width="width"
        :height="svgHeight"
        @mousedown="itemMouseProjection('mousedown', $event)"
        @mousemove="itemMouseProjection('mousemove', $event)"
        @mouseup="itemMouseProjection('mouseup', $event)"
      >
        <g id="projectYaxis" :transform="`translate(${marginLeft}, 0)`"></g>
        <g
          id="projectXaxis"
          :transform="`translate(${marginLeft}, ${
            svgHeight - marginTop - marginBottom
          })`"
        ></g>
        <g :transform="`translate(${marginLeft}, 0)`">
          <path
            :d="lineGenerator(lassoPol)"
            fill="none"
            stroke="grey"
            stroke-width="2.5"
            stroke-dasharray="3,3"
          ></path>

          <g id="frameProjectPoint">
            <circle
              v-for="(d, i) in plotCircleData"
              :key="i"
              class="projectionCircle"
              :cx="scaleX(d.x)"
              :cy="scaleY(d.y)"
              :r="cicleSize"
              :stroke-width="strokeWidth"
              :stroke="projectCircleConfig[d.logId]['strokeColor']"
              :opacity="d['opacity']"
              :fill="projectCircleConfig[d.logId]['fillColor']"
              @mouseover="itemMouse('over', d, $event)"
              @mouseout="itemMouse('out', d, $event)"
            />
          </g>
        </g>
      </svg>
    </div>

    <div id="projectTip" :style="tooltip_css" v-html="tooltipContent"></div>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import $ from "jquery";
import * as d3 from "d3";
export default {
  name: "projectView",
  props: {
    //这两个属性从父组件继承
    height: Number,
    width: Number,
    top: Number,
    left: Number,
  },
  data() {
    return {
      legendControl: 30,
      opacityLow: 0.1,
      opacityHigh: 0.7,
      currentState: false,
      // ture说明其他点opacity 为opacityLow
      searchState: false,
      marginLeft: 25,
      marginTop: 10,
      marginRight: 10,
      marginBottom: 30,
      cicleSize: 2,
      strokeWidth: 0.7,
      tooltipContent: "",
      lassoPol: [],
      lassoStart: "",
      local_brush: "",
      lassoFlag: false,
      lineGenerator: d3.line(),
      local_brush: "",
      tooltip_css:
        "position: absolute;padding: 7px;font-size: 25px;pointer-events: none;background: rgba(255,255,255,0.6);border: 1px solid #ccc;" +
        "border-radius: 4px;-moz-box-shadow: 3px 3px 10px 0px rgba(0, 0, 0, 0.25);display:none" +
        "-webkit-box-shadow: 3px 3px 10px 0px rgba(0, 0, 0, 0.25);box-shadow: 3px 3px 10px 0px rgba(0, 0, 0, 0.25);display:none;z-index: 100;",
    };
  },
  computed: {
    ...mapState([
      "projectionData",
      "projectLegendState",
      "currentLogId",
      "searchMatchResult",
    ]),
    ...mapGetters(["projectionLogList", "projectCircleConfig"]),
    svgHeight() {
      return this.height - this.legendControl - 20;
    },
    scaleOpacity() {
      return d3.scaleLinear().domain([1, 42]).range([this.opacityHigh, 1]);
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
    plotCircleData() {
      // let res = d3.filter(this.projectionData, d => this.projectionLogList.includes(d.logId) )
      // console.log(this.projectionData)
      return d3.filter(
        this.projectionData,
        (d) => this.projectLegendState[d.logId]["legendState"]
      );
    },
    rangeX() {
      return d3.extent(this.plotCircleData, (d) => d.x);
    },
    rangeY() {
      return d3.extent(this.plotCircleData, (d) => d.y);
    },
    scaleX() {
      return d3
        .scaleLinear()
        .domain(this.rangeX)
        .range([0, this.width - this.marginLeft - this.marginRight]);
    },
    scaleY() {
      return d3
        .scaleLinear()
        .domain(this.rangeY)
        .range([this.svgHeight - this.marginTop - this.marginBottom, 5]);
    },
  },
  methods: {
    inside(point, vs) {
      // ray-casting algorithm based on
      // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html

      var x = point[0],
        y = point[1];

      var inside = false;
      for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0],
          yi = vs[i][1];
        var xj = vs[j][0],
          yj = vs[j][1];

        var intersect =
          yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
      }
      return inside;
    },
    itemMouseProjection(str_, $event) {
      // 获取套索对象
      let cur = this;
      if (str_ == "mousedown") {
        cur.lassoFlag = true;
        cur.lassoPol = [];
        // console.log(event)
        cur.lassoStart = [$event.offsetX - cur.marginLeft, $event.offsetY];
        cur.lassoPol.push([$event.offsetX - cur.marginLeft, $event.offsetY]);
      } else if (str_ == "mousemove") {
        if (cur.lassoFlag) {
          cur.lassoPol.push([$event.offsetX - cur.marginLeft, $event.offsetY]);
        }
      } else if (str_ == "mouseup") {
        cur.lassoFlag = false;
        cur.lassoPol.push(cur.lassoStart);
        // console.log('lasso',cur.lassoPol)
        let lassoEle = [];
        cur.plotCircleData.forEach((d) => {
          if (
            cur.inside([cur.scaleX(d["x"]), cur.scaleY(d["y"])], cur.lassoPol)
          ) {
            lassoEle.push(d);
          }
        });
        // console.log(lassoEle)
        let projectionBrushData = [];
        lassoEle.forEach((projectCircle) => {
          projectCircle["frames_list"].forEach((single_frame) => {
            let frameCopy = JSON.parse(JSON.stringify(projectCircle));
            Object.assign(frameCopy, { current_frame: single_frame });
            projectionBrushData.push(frameCopy);
          });
        });

        let logDict = projectionBrushData.reduce(function (allLogs, log) {
          if (log["logId"] in allLogs) {
            allLogs[log["logId"]].push(log["current_frame"]);
          } else {
            allLogs[log["logId"]] = [];
            allLogs[log["logId"]].push(log["current_frame"])
          }
          return allLogs;
        }, {});
        let res = [];
        let logIds = Object.keys(logDict);
        let frames = Object.values(logDict);
        for (let i = 0; i < logIds.length; i++) {
          let tmpDict = {};
          tmpDict["logId"] = logIds[i];
          tmpDict["frames"] = frames[i];
          res.push(tmpDict);
        }
        cur.local_brush = "";
        cur.local_brush = res;
       
        cur.$store.dispatch("readMatchLogDataset", res);
      }
    },
    judgePointInSearch(dd) {
      // 判断点是否为search result的点 返回bool
      let cur = this;
      for (let i = 0; i < cur.searchMatchResult.length; i++) {
        let log = cur.searchMatchResult[i];
        if (log["logId"] == dd.logId) {
          // console.log('hello')
          if (d3.union(log["frames"], dd["frames_list"]).size > 0) {
            // console.log(d3.union(log["frames"], dd["frames_list"]))
            return true;
          }
        }
      }
      return false;
    },
    highlight(str_) {
      let cur = this;
      if (str_ == "current") {
        if (!cur.currentState) {
          cur.projectionData.forEach(function (d) {
            if (d.logId == cur.currentLogId) {
              Object.assign(d, { opacity: cur.scaleOpacity(d["frame_len"]) });
            } else {
              Object.assign(d, { opacity: cur.opacityLow });
            }
          });
          // console.log(cur.projectionData)
          cur.currentState = true;
        } else {
          cur.projectionData.forEach(function (d) {
            Object.assign(d, { opacity: cur.scaleOpacity(d["frame_len"]) });
          });
          cur.currentState = false;
        }
      } else if ((str_ = "search")) {
        if (cur.searchMatchResult.length > 0) {
          if (!cur.searchState) {
            cur.projectionData.forEach(function (d) {
              if (cur.judgePointInSearch(d)) {
                // console.log('hello',d)
                Object.assign(d, { opacity: cur.scaleOpacity(d["frame_len"]) });
              } else {
                Object.assign(d, { opacity: cur.opacityLow });
              }
            });
            cur.searchState = true;
          } else {
            cur.projectionData.forEach(function (d) {
              Object.assign(d, { opacity: cur.scaleOpacity(d["frame_len"]) });
            });
            cur.searchState = false;
          }
        }
      }
    },
    update_view() {
      let cur = this;
      cur.$store.commit("updateSearchResultViewState", "brush");
    
      cur.$store.commit('updateCurrentMatchData', cur.local_brush)
      cur.$store.commit("openPlot");
    },
    update_legend(str_) {
      if (str_ == "show") {
        this.$store.commit("updateLegendState", true);
      } else {
        this.$store.commit("updateLegendState", false);
      }
    },
    itemMouse(action, d, $event) {
      let tooltip = $("#projectTip");
      this.tooltipContent =
        "logId : " + d.logId + "<br>" + "frames : " + d.frames_list;
      if (action == "over") {
        tooltip.css("display", "block");
        tooltip.css("left", $event.offsetX + 40);
        tooltip.css("top", $event.offsetY - 10);
      } else {
        tooltip.css("display", "none");
      }
    },
    calOpacity() {
      let cur = this;
      cur.projectionData.forEach(function (d) {
        Object.assign(d, { opacity: cur.scaleOpacity(d["frame_len"]) });
      });
    },
    plotAxis() {
      d3.select("#projectXaxis").selectChildren().remove();
      d3.select("#projectYaxis").selectChildren().remove();

      let cur = this;
      d3.select("#projectXaxis").call(d3.axisBottom(cur.scaleX));
      d3.select("#projectYaxis").call(d3.axisLeft(cur.scaleY));
    },
  },
  watch: {
    projectLegendState: function () {
      this.plotAxis();
    },
  },
  mounted() {
    this.calOpacity();
    this.plotAxis();
    // console.log(cur.projectCircleConfig)
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.el-divider >>> .el-divider__text{
  font-size:25px;
}
.el-button{
  padding:3px, 6px;
}
</style>
