<template>
  <div class="topo" :style="divCss">
    <el-divider>Topological Evolution View</el-divider>
    <svg :width = "width" :height="eventHeatmapHeight"> 
      <g id = "topoheatmap"></g>

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
      marginTop:15,
      marginRight:15,
      streamColorDict:{
        "PEOPLE_notOnLane":"#FFCDBF", "PEOPLE_onLane":"#FF8680", "VEHICLE_onLane":"#1f78b4","VEHICLE_notOnLane":"#a6cee3",
        "PEOPLE": "#D25565" ,"VEHICLE":"#3E6D9C"
      },
      tooltipContent:"",
      tooltip_css:
        "position: absolute;padding: 7px;font-size: 0.9em;pointer-events: none;background: #fff;border: 1px solid #ccc;" +
        "border-radius: 4px;-moz-box-shadow: 3px 3px 10px 0px rgba(0, 0, 0, 0.25);display:none" +
        "-webkit-box-shadow: 3px 3px 10px 0px rgba(0, 0, 0, 0.25);box-shadow: 3px 3px 10px 0px rgba(0, 0, 0, 0.25);display:none",
      
      
    }
  },
  computed:{
    ...mapState(["currentEventData", "currentTrackingData"]),
    timeRange() {
      if (this.currentTrackingData) {
        return d3.extent(
          d3.map(this.currentTrackingData["trackingInfos"], d => d.frame)
        );
      } else {
        return [];
      }
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
    eventHeatmapHeight(){
      let rectH = (this.width - this.marginRight - this.marginLeft) / (this.timeRange[1] + 1)
      // this.heatRectH = rectH
      // console.log(rectH)
      return rectH * 14

    }
  },
  methods:{
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
      const group = d3.select("#topoheatmap")
      .attr("transform", `translate(${cur.marginLeft}, ${cur.marginTop })`)
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
        return lineGen([[0, d * rectH], [rectH * (cur.timeRange[1] + 1), d * rectH]])}
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
          return 0.5
        }
        else{
          return 1
        }
      }
      // d => opacityScale(d.count)
      )
      .attr("stroke-width", 0.5)
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
