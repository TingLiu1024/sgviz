<template>
  <div class="topo" :style="divCss">
    <el-divider>Topological Evolution View</el-divider>
    <svg :width = "width" :height="(eventHeatmapHeight + legendHeight + timelineHeight)"> 
      <g id = "topotimeline">
        <path :d="timelinePath" stroke-width="1" stroke="grey" :transform="`translate(${marginLeft},0)`"> </path>
        <g 
        
        id = "topoegoCar"
        :transform="`translate(${marginLeft+timeScale(parseInt(currentTime))}, ${timelineHeight/2
        })`"
      >
        <path :d="drawStar(8)" fill="red" fill-opacity="0.9" />
      </g>
      </g>
      <g id = "topoheatmap"></g>
      <g id = "topolegend"></g>

    </svg>
    <div id="topoTip" :style="tooltip_css" v-html="tooltipContent"></div>
    
  
  </div>
</template>

<script>
import { mapState } from "vuex";
import * as d3 from "d3";
import $ from "jquery";
export default {
  name: 'topoSummary',
  props: {
    //这两个属性从父组件继承
    height: Number,
    width: Number,
    top: Number,
    left: Number
  },
  data(){
    return {
      marginLeft:36,
      marginTop:8,
      marginRight:15,
      legendHeight:40,
      timelineHeight:20,
      DisappearOpactiy:0.5,
      streamColorDict:{
        "PEOPLE_notOnLane":"#FFCDBF", "PEOPLE_onLane":"#FF8680", "VEHICLE_onLane":"#1f78b4","VEHICLE_notOnLane":"#a6cee3",
        "PEOPLE": "#D25565" ,"VEHICLE":"#3E6D9C"
      },
      tooltipContent:"",
      tooltip_css:
        "position: absolute;padding: 7px;font-size: 0.9em;pointer-events: none;background: #fff;border: 1px solid #ccc;" +
        "border-radius: 4px;-moz-box-shadow: 3px 3px 10px 0px rgba(0, 0, 0, 0.25);display:none" +
        "-webkit-box-shadow: 3px 3px 10px 0px rgba(0, 0, 0, 0.25);box-shadow: 3px 3px 10px 0px rgba(0, 0, 0, 0.25);display:none;z-index: 100;",
      
      
    }
  },
  computed:{
    ...mapState(["currentEventData", "currentTrackingData", "currentTime"]),
    timeRange() {
      if (this.currentTrackingData) {
        return d3.extent(
          d3.map(this.currentTrackingData["trackingInfos"], d => d.frame)
        );
      } else {
        return [];
      }
    },
    timeScale(){
      let rectH = (this.width - this.marginRight - this.marginLeft) / (this.timeRange[1] + 1)
      let cur = this
      return  d3.scaleLinear()
                .domain([this.timeRange[0], this.timeRange[1]])
                .range([0+rectH/2, rectH * (cur.timeRange[1] +1)- rectH / 2] );
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
    timelinePath(){
      let rectH = (this.width - this.marginRight - this.marginLeft) / (this.timeRange[1] + 1)
      let cur = this
      return d3.line()([[0, cur.timelineHeight/2], [rectH * (cur.timeRange[1] +1), cur.timelineHeight/2]])
    },
    eventHeatmapHeight(){
      let rectH = (this.width - this.marginRight - this.marginLeft) / (this.timeRange[1] + 1)
      // this.heatRectH = rectH
      // console.log(rectH)
      return rectH * 14

    }
  },
  methods:{
    drawStar(r) {
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
      return d3.line()([A, F, B, G, C, H, D, K, E, I, A]);
    },
    plotEventheatmap(){
      // window.evetData = this.currentEventData
      const countData = d3.rollups(this.currentEventData["object"], v => v.length, 
      d=> d.frame, d=> d.label_class, d=> d.event)
      
      let heatmapData = []
      countData.forEach(function (curtimeEvent){
        let tmpDict = {}
        tmpDict["frame"] = curtimeEvent[0]
        curtimeEvent[1].forEach( labelData => {
          tmpDict["label_class"] = labelData[0]
          labelData[1].forEach(eventData => {
            tmpDict['event'] = eventData[0]
            tmpDict['count'] = eventData[1]
          })

        })
        heatmapData.push(tmpDict)
      })
      // console.log(heatmapData)
      const rectH = this.eventHeatmapHeight / 14
      let cur = this
      // const timelineGroup = d3.select("#topotimeline")
      // .attr("transform", `translate(${cur.marginLeft }, ${cur.marginTop })`)
      // timelineGroup.selectChildren().remove()

      const group = d3.select("#topoheatmap")
      .attr("transform", `translate(${cur.marginLeft }, ${cur.marginTop + cur.timelineHeight })`)
      group.selectChildren().remove()
      const heatmapYscale = d3.scalePoint().domain(["freeObjectDisappear",'laneObjectDisappear',
      "freeObjectAppear",'laneObjectAppear', "freeToLane", "laneToFree", "changeLane"
    ]).range([0, rectH * 6])
    let minRectRatio = 0.55
    const rectHScale = d3.scaleLinear().domain( d3.extent(
      d3.map(heatmapData, d=> d.count)
    )).range([rectH * minRectRatio, rectH])
    // const opacityScale = d3.scaleLinear().domain([1, d3.max(
    //   d3.map(heatmapData, d=> d.count)
    // )]).range([0.3,1])
    let lineGen = d3.line()
    
    group.append("g").selectAll(".borderPath").data([0,1,2,3,4,5,6,7,
    8,9,10,11,12,13,14]).enter().append("path")
    .attr('d', d => {
        return lineGen([[0, d * rectH], [rectH * (cur.timeRange[1] +1), d * rectH]])}
      )
      .attr("stroke-width", 1)
      .attr("stroke", "grey")
      .attr("stroke-opacity", 1)
    let tooltip = $("#topoTip");
      group.append("g").selectAll(".objectRect").data(heatmapData).enter().append("rect")
      .attr('x', (d) => d.frame * rectH)
      .attr('y', (d) => d.label_class == "VEHICLE"?heatmapYscale(d.event):(rectH *7 + heatmapYscale(d.event)))
      .attr('width', d => rectHScale(d.count))
      .attr('height', d => rectHScale(d.count))
      .attr('transform', d => "translate(" + (rectH - rectHScale(d.count))/2 +"," + (rectH - rectHScale(d.count))/2
      + ")")
      .attr('fill', d => cur.streamColorDict[d.label_class] )
      .attr("opacity", d => {
        // console.log(d)
        if (d.event.indexOf("Disappear")!= -1){
          return cur.DisappearOpactiy
        }
        else{
          return 1
        }
      }
      // d => opacityScale(d.count)
      )
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", d=>{
        if (d.event.indexOf("laneObject")!= -1){
          return 0
        }
        else if(d.event == "freeToLane"){
          return "0,"+rectHScale(d.count) + "," + rectHScale(d.count) + ", 0"
        }
        else if(d.event == "laneToFree"){
          return rectHScale(d.count) + "," + rectHScale(d.count)
        }
        else{
          return "0,"+rectHScale(d.count)/4 + "," + rectHScale(d.count)/2 + "," + rectHScale(d.count)/4
        }
        
      })
      .attr("stroke", d=> {
        if ((d.event.indexOf("Lane")!= -1) | (d.event.indexOf("lane")!= -1)){
          return "black"
        }
        else{
          return "none"
        }
      })
      
      .on('mouseover',(event,d)=>{
        // console.log(d)
     
        tooltip.css("display", "block");
        tooltip.css("left", event.offsetX + 40);
        tooltip.css("top", event.offsetY - 10);
        cur.tooltipContent = "frame : " + d.frame + "<br>" + 
        " label : "  + d.label_class + "<br>" 
                    + "event : " + d.event + "<br>"
                        + "count : " + d.count
      })
      .on("mouseout",()=>{
        tooltip.css("display", "none");
      })
      const legendGroup = d3.select("#topolegend").attr("transform", `translate(${cur.marginLeft}, ${cur.marginTop + cur.timelineHeight + cur.eventHeatmapHeight})`)
      legendGroup.append("g").selectAll('.objectType').data(["VEHICLE", "PEOPLE"]).enter().append("circle")
      .attr("cx", (d,i) => 200+ i *20)
      .attr("cy", cur.legendHeight/2)
      .attr('r', 6)
      .attr("fill", d=>cur.streamColorDict[d] )
      legendGroup.append("g").selectAll('.objectTypeText').data(["VEHICLE / PEOPLE"]).enter().append("text")
      .text(d=>d)
      
      .attr("x", 200 - 140).attr("y", cur.legendHeight/2 + 5)
        .attr("text-anchor", "left")
        .style("opacity",0.95)
        .style("font-size", "12px")
        legendGroup.append("g").selectAll('.actionType').data(["Appear", "Disappear"]).enter().append("rect")
      .attr("x", (d,i) => cur.width / 4 + i *20)
      .attr("y", cur.legendHeight/2 - rectH / 2)
      .attr('width', rectH)
      .attr('height', rectH)
      .attr("fill", cur.streamColorDict["VEHICLE"] )
      .attr("opacity", d=>d == "Appear"?1:cur.DisappearOpactiy)
      legendGroup.append("g").selectAll('.actionTypeText').data(["Appear / Disappear"]).enter().append("text")
      .text(d=>d)
      
      .attr("x", cur.width / 4 - 140).attr("y", cur.legendHeight/2 + 5)
        .attr("text-anchor", "left")
        .style("opacity",0.95)
        .style("font-size", "12px")

        legendGroup.append("g").selectAll('.onLaneType').data(["free", "onLane"]).enter().append("rect")
      .attr("x", (d,i) => cur.width / 2 + i *20)
      .attr("y", cur.legendHeight/2 - rectH / 2)
      .attr('width', rectH)
      .attr('height', rectH)
      .attr("fill", cur.streamColorDict["VEHICLE"] )
      .attr("stroke-width", 2)
      .attr("stroke", d=>d == "free"? "none":"black")
      legendGroup.append("g").selectAll('.onLaneTypeText').data(["free / onLane"]).enter().append("text")
      .text(d=>d)
      
      .attr("x", cur.width / 2 - 140).attr("y", cur.legendHeight/2 + 5)
        .attr("text-anchor", "left")
        .style("opacity",0.95)
        .style("font-size", "12px")
      
        legendGroup.append("g").selectAll('.chanegLaneType').data(["freeToLane", "laneToFree", "changeLane"]).enter().append("rect")
      .attr("x", (d,i) => cur.width / 4 * 3 + i *20)
      .attr("y", cur.legendHeight/2 - rectH / 2)
      .attr('width', rectH)
      .attr('height', rectH)
      .attr("fill", cur.streamColorDict["VEHICLE"] )
      .attr("opacity", 1)
      .attr("stroke", "black")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", d=>{
        if(d == "freeToLane"){
          return "0,"+rectH + "," + rectH + ", 0"
        }
        else if(d == "laneToFree"){
          return rectH+ "," + rectH
        }
        else {
          return "0,"+rectH/4 + "," + rectH/2 + "," + rectH/4
        }
      })
      legendGroup.append("g").selectAll('.changeLaneTypeText').data(["freeToLane / laneToFree / changeLane"]).enter().append("text")
      .text(d=>d)
      .attr("x", cur.width / 4 * 3 - 240).attr("y", cur.legendHeight/2 + 5)
        .attr("text-anchor", "left")
        .style("opacity",0.95)
        .style("font-size", "12px")
        legendGroup.append("g").selectAll('.symbolSize').data(["small", "large"]).enter().append("rect")
      .attr("x", (d,i) => cur.width -140+ i *20)
      .attr("y", (d,i) =>  cur.legendHeight/2 - rectH / (2- i) / 2 )
      .attr('width', (d,i) => rectH / (2- i))
      .attr('height', (d,i) => rectH / (2- i))
      .attr("fill", cur.streamColorDict["VEHICLE"] )
      .attr("opacity", 1)
      
      
      legendGroup.append("g").selectAll('.laneChangeTypeText').data(["Number of Occurrence"]).enter().append("text")
      .text(d=>d)
      .attr("x", cur.width  -300).attr("y", cur.legendHeight/2 + 5)
        .attr("text-anchor", "left")
        .style("opacity",0.95)
        .style("font-size", "12px")
    },
  },
  mounted(){
    this.plotEventheatmap()
  }
  
}
</script>



<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
