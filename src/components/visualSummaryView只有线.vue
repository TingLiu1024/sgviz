<template>
  <div id="visualSummaryView" :style = "divCss">
    <el-divider>Visual Summary View</el-divider>
    <svg id = "svg" :width = "width" :height="lineChartHeight + otherHeight"> 
      <g id = "line" :transform ="`translate(${marginLeft},${marginTop})`"></g>
      <g id = "heatmap"> </g>
    </svg>
    
  </div>
</template>

<script>
import { mapState } from "vuex";
import * as d3 from "d3"
export default {
  name: 'visualSummaryView',
  props: {
    //这两个属性从父组件继承
    height:Number,
    width:Number,
    top:Number,
    left:Number,
  },
  data(){
    return {
      lineChartHeight:400,
      marginLeft:36,
      marginTop:15,
      otherHeight: 300,
      lineHalfWidth:3, //控制线的宽度
      intersectionStrokeColor:"#e41a1c",
      leftTurnColor:"#ff7f00",
      rightTurnColor:"#377eb8",
      NotTurnColor:"#b3b3b3"
      
    }
  },
  computed:{
    ...mapState(["currentTrackingData", "mapAll"]),
    divCss(){
        return "position: absolute; border: 0px solid black;" +  
              "height:" + this.height + "px;" +
              "width:" + this.width + "px;" +
              "left:" + this.left + "px;" +
              "top:" + this.top + "px;" 
    },
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
        return d3.scaleLinear()
                .domain([this.timeRange[0], this.timeRange[1]+10])
                .range([0, this.width]);
    },
    yScale() {
      return d3.scaleLinear()
                .domain([-120, 120])
                .range([this.lineChartHeight, 0]);
    },
    
  },
  methods:{
    plotLineChart(){
      // while (!this.currentTrackingData){ss
      //   setTimeout(function(){},3000)
      // }
      let scaleX = this.timeScale, scaleY = this.yScale
      let egoTrackingDataSorted  = d3.filter(this.currentTrackingData["trackingInfos"], d=> d.track_label_uuid == "ego")
      let cutoffs = []
      // console.log(egoTrackingDataSorted)
      let left = 0
      let mapData = this.mapAll[this.currentTrackingData["city"]]
      let i = 1
      for( i = 1; i< egoTrackingDataSorted.length ;i++){
          let pre = egoTrackingDataSorted[i-1].currentLane
          let cur = egoTrackingDataSorted[i].currentLane
          if (cur!= pre){
            cutoffs.push([left, i])
              left = i
          }
      }
      cutoffs.push([left, i])
      // console.log(cutoffs)
      let linesData = []
      let cur = this
      cutoffs.forEach(function([start, end]){
        let tmp = {}
        tmp["oriData"] = egoTrackingDataSorted.slice(start, end)
        let currentLane = tmp["oriData"][0].currentLane
        let uppers = [] // 计算线周围一圈的polygon
        let lowers = []
        tmp["oriData"].forEach(function(d){
          uppers.push([d.frame, d.yawMod + cur.lineHalfWidth])
        })
        tmp["oriData"].forEach(function(d){
          lowers.push([d.frame, d.yawMod - cur.lineHalfWidth])
        })
        let lowersRev = lowers.reverse()
        tmp["plotPoints"] = uppers.concat(lowersRev).concat([uppers[0]])
        if (currentLane){
          tmp["turn_direction"] = mapData["laneInfos"][currentLane.toString()]["turn_direction"]
          tmp["is_intersection"] = mapData["laneInfos"][currentLane.toString()]["is_intersection"]
        }
        else{
          tmp["turn_direction"] = null
          tmp["is_intersection"] = null
        }
        
        linesData.push(tmp)

      })
      // console.log(linesData)
      
      let linesGroup = d3.select("#line")
      // let svg = d3.select("#svg")
      linesGroup.append("g")
            .attr("transform", `translate(0,${this.lineChartHeight})`)
            .call(d3.axisBottom(this.timeScale))
            linesGroup.append("g")
            .attr("transform", `translate(0,0)`)
            .call(d3.axisLeft(this.yScale))
      
      
        linesGroup.append("g").selectAll('.yawPath').data(linesData).enter().append("path").attr("d", d=>
        d3.line()( d3.map(d.plotPoints, function(dd) {
        return [scaleX(dd[0]), scaleY(dd[1])];
      })))
                .attr("fill", d=>{
                  if(d.turn_direction == "RIGHT"){
                    return cur.rightTurnColor
                  }
                  else if(d.turn_direction=="LEFT"){
                    return cur.leftTurnColor
                  }
                  else{
                    return cur.NotTurnColor
                  }
                })
             .attr("stroke-width", 2)
            //  .attr("stroke-opacity", 1)
             .attr("stroke", d=> d.is_intersection?this.intersectionStrokeColor:"none")
             .on("mouseover", (e,d)=>{
              console.log(d)
             })
           

    }
  },
  mounted(){
    
      this.plotLineChart()
    
    
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>