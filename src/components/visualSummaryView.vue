<template>
  <div id="visualSummaryView" :style = "divCss">
    <el-divider>Statistical Summary View</el-divider>
    <!-- :width = "width" :height="lineChartHeight + streamHeight" -->
    <!-- transform="rotate(-90)" -->
    <svg id = "svg" 
    :width = "width" :height="lineChartHeight + streamHeight  + marginTop * 2"
    > 
      <g id = "line" :transform ="`translate(${marginLeft},${marginTop})`">
        <!-- v-if = "yawList.length"  -->
        
      </g>
      <g 
        v-if = "yawList.length" 
        id = "egoCar"
        :transform="`translate(${marginLeft+timeScale(parseInt(currentTime))}, ${marginTop+yScale(
          yawList[parseInt(currentTime)]
        )})`"
      >
        <path :d="drawStar(egoSize)" :fill="egoColor" fill-opacity="0.9" />
      </g>
      
      <g id ="lineLegend" :transform ="`translate(${marginLeft + 30},${marginTop})`"> 
        <g id = "lineLegendText"></g>
        <rect :width="legendW"
            :height="legendH"
            x="0"
            y="0"
            :fill="speedFillColor"
        ></rect>
        <rect :width="legendW"
            :height="legendH"
            x="0"
            :y="0 + 1 * (legendH + legendInterVal)"
            :fill="leftTurnColor"
        ></rect>
        <rect :width="legendW"
            :height="legendH"
            x="0"
            :y="0 + 2 * (legendH + legendInterVal)"
            :fill="rightTurnColor"
        ></rect>
        <rect :width="legendW"
            :height="legendH"
            x="0"
            :y="0 + 3 * (legendH + legendInterVal)"
            :fill="NotTurnColor"
        ></rect>
        <rect :width="legendW"
            :height="legendH"
            x="0"
            :y="0 + 4 * (legendH + legendInterVal)"
            fill="none"
            :stroke = "intersectionStrokeColor"
            stroke-width = "2"
        ></rect>
        <!-- <text style = "position:absolute; top:10px;left:100px">Speed</text> -->


      </g>
      
      <g id = "streamGraph">   
      </g>
      <g id = "heatmap">   
        
      </g>
      <!-- <use id="use" xlink:href="#egoCar" /> -->
    </svg>
    <div id="summaryTip" :style="tooltip_css" v-html="tooltipContent"></div>
    
  </div>
</template>

<script>
import { mapState } from "vuex";
import * as d3 from "d3";
import $ from "jquery";
// import _ from 'lodash'
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
      lineChartHeight:250,
      marginLeft:36,
      marginTop:15,
      marginRight:15,
      streamHeight: 250,
      lineHalfWidth:3, //控制线的宽度
      intersectionStrokeColor:"#e41a1c",
      leftTurnColor:"#ff7f00",
      rightTurnColor:"#377eb8",
      NotTurnColor:"#b3b3b3",
      
      legendW:15,
      legendH:10,
      legendInterVal:10,
      yawList:[],
      speedList:[],
      egoSize:10,
      streamKeys:[],
      streamMargin: 10,
      tooltipContent:"",
      tooltip_css:
        "position: absolute;padding: 7px;font-size: 0.9em;pointer-events: none;background: #fff;border: 1px solid #ccc;" +
        "border-radius: 4px;-moz-box-shadow: 3px 3px 10px 0px rgba(0, 0, 0, 0.25);display:none" +
        "-webkit-box-shadow: 3px 3px 10px 0px rgba(0, 0, 0, 0.25);box-shadow: 3px 3px 10px 0px rgba(0, 0, 0, 0.25);display:none",
      
      streamColorDict:{
        "PEOPLE_notOnLane":"#FFCDBF", "PEOPLE_onLane":"#FF8680", "VEHICLE_onLane":"#1f78b4","VEHICLE_notOnLane":"#a6cee3",
        "PEOPLE": "#D25565" ,"VEHICLE":"#3E6D9C"
      },
      egoFlag:false,
      heatRectH:"",
      
      
    }
  },
  computed:{
    ...mapState(["currentTrackingData", "mapAll", "currentTime", "egoColor","currentEventData", "speedFillColor"]),
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
                .domain([this.timeRange[0], this.timeRange[1]])
                .range([0, this.width - this.marginRight]);
    },
    yScale() {
      return d3.scaleLinear()
                .domain([-120, 180])
                .range([this.lineChartHeight, 0]);
    },
    eventHeatmapHeight(){
      let rectH = (this.width - this.marginRight) / (this.timeRange[1] + 1)
      // this.heatRectH = rectH
      // console.log(rectH)
      return rectH * 14

    }
    
    
  },
  methods:{
    plotLineChart(){
      // while (!this.currentTrackingData){ss
      //   setTimeout(function(){},3000)
      let cur = this
      const legendG = d3.select('#lineLegendText')
      legendG.selectChildren().remove()
      legendG.selectAll(".lineText").data(["Speed", "Left Turn", "Right Turn", "Straight", "Intersection"]).enter()
      .append("text").attr("x",40).attr("y", (d,i)=>{return 10 + i * (cur.legendInterVal+
        cur.legendH)}).text(d=>d)
        .attr("text-anchor", "left")
        .style("opacity",0.95)
        .style("font-size", "12px")
      // }
      
      let scaleX = this.timeScale, scaleY = this.yScale
      let egoTrackingDataSorted  = d3.filter(this.currentTrackingData["trackingInfos"], d=> d.track_label_uuid == "ego")
      this.yawList = d3.map(egoTrackingDataSorted, d=>d.yawMod)
      this.speedList = d3.map(egoTrackingDataSorted, d=>d.speed)
      // console.log(this.yawList)
      // console.log(d3.map(egoTrackingDataSorted, d=> d.speed))
      const speedMax = d3.max(d3.map(egoTrackingDataSorted, d=> d.speed))
      let scaleSpeed =  d3.scaleLinear()
                .domain([0, speedMax])
                .range([0, this.lineChartHeight/3]);
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
      
      let speedLowers = [], speedUppers = []
      let speedPol = []
      cutoffs.forEach(function([start, end]){
        let tmp = {}
        tmp["oriData"] = egoTrackingDataSorted.slice(start, end)
        let currentLane = tmp["oriData"][0].currentLane
        let uppers = [] // 计算线周围一圈的polygon
        let lowers = []
        tmp["oriData"].forEach(function(d){
          uppers.push([d.frame, d.yawMod + cur.lineHalfWidth])
          speedLowers.push([scaleX(d.frame), scaleY(d.yawMod + cur.lineHalfWidth)-5])
          speedUppers.push([scaleX(d.frame) , scaleY(d.yawMod + cur.lineHalfWidth)-scaleSpeed(d.speed)-5])
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
      speedLowers.pop()
        speedUppers.pop()
        let speedUppersRev = speedUppers.reverse()
        speedPol = speedLowers.concat(speedUppersRev).concat([speedLowers[0]])
      // console.log(linesData)
      
      let linesGroup = d3.select("#line")
      linesGroup.selectChildren().remove()
      // let svg = d3.select("#svg")
      linesGroup.append("g")
            .attr("transform", `translate(0,${this.lineChartHeight})`)
            .call(d3.axisBottom(this.timeScale))
            linesGroup.append("g")
            .attr("transform", `translate(0,0)`)
            .call(d3.axisLeft(this.yScale))
      
            let tooltip = $("#summaryTip");
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
             .attr("fill-opacity", 0.8)
             .on("mousemove", (event)=>{
             
              tooltip.css("display", "block");
                    tooltip.css("left", event.offsetX + 40);
                    tooltip.css("top", event.offsetY - 10);
                    // let mousex = d3.pointer(event, this)[0]
                    // console.log(mousex)
                    // window.mousex = mousex
                    
                    let invertedx = cur.timeScale.invert(event.offsetX - cur.marginLeft); //得到时间
                    let currentT = parseInt(invertedx)
                    
                  let curYaw = !cur.yawList[currentT]?null:cur.yawList[currentT].toFixed(2)
                  cur.tooltipContent = "Yaw" + " : " 
                    + curYaw + "<br>"
                        + "Timestamp : " + currentT
             })
             .on("mouseout",()=>{
              tooltip.css("display", "none");
             })
            //  speed
            linesGroup.append("g").selectAll('.speedPath').data([speedPol]).enter().append("path")
            .attr("d", d=>d3.line()(d)).attr("fill",this.speedFillColor).attr("opacity", 0.6)
            .on("mousemove", (event)=>{
             
             tooltip.css("display", "block");
                   tooltip.css("left", event.offsetX + 40);
                   tooltip.css("top", event.offsetY - 10);
            
                   
                   let invertedx = cur.timeScale.invert(event.offsetX - cur.marginLeft); //得到时间
                   let currentT = parseInt(invertedx)
                   
                 let curSpeed = !cur.speedList[currentT]?null:cur.speedList[currentT].toFixed(2)
                 cur.tooltipContent = "Speed" + " : " 
                   + curSpeed + "<br>"
                       + "Timestamp : " + currentT
            })
            .on("mouseout",()=>{
             tooltip.css("display", "none");
            })
            // d3.select("#svg").appendChild("#")
            
           

    },
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
    getStreamGraphData(data){
      //处理数据
      const objectTracking = d3.filter(data, d => d.track_label_uuid != "ego")
                objectTracking.forEach(function(d) {
                    if (d.currentLane){
                        Object.assign(d, {"onLane": true});
                    }
                    else{
                        Object.assign(d, {"onLane": false});
                    }
                })
                
                // const groupCountData = d3.rollups(objectTracking, v => v.length, d => d.frame, d=> d.label_class)
                const groupCountData = d3.rollups(objectTracking, v => v.length, d => d.frame, d=> d.label_class, d=>d.onLane)

                let res = []
                window.tracking = groupCountData
                this.streamKeys = [ "PEOPLE_notOnLane", "PEOPLE_onLane", "VEHICLE_onLane","VEHICLE_notOnLane"]
                const keys = this.streamKeys
                groupCountData.forEach(function(d){
                    let tmpDict = {}
                    tmpDict["frame"] = d[0]
                    d[1].forEach(function(labelCountData){
                        let lableClass = labelCountData[0]
                        labelCountData[1].forEach(function(onLaneData){
                            if (onLaneData[0]){
                                tmpDict[lableClass + "_onLane"] = onLaneData[1]
                            }
                            else{
                                tmpDict[lableClass + "_notOnLane"] = onLaneData[1]
                            }
                        })
                    })
                    // 补缺失为 0
                    keys.forEach(function(key){
                        if(!(key in tmpDict)){
                        tmpDict[key] = 0
                    }
                    tmpDict["VEHICLE"] = tmpDict["VEHICLE_onLane"] + tmpDict["VEHICLE_notOnLane"]
                    tmpDict["PEOPLE"] = tmpDict["PEOPLE_onLane"] + tmpDict["PEOPLE_notOnLane"]

                    }
                    )
                    res.push(tmpDict)
                })
                let stackedData = d3.stack()
                    .offset(d3.stackOffsetSilhouette) //d3.stackOffsetSilhouette
                    .keys(keys)(res)
                // console.log("stackedData...", stackedData);
                return {"stack":stackedData, "res":res}

    },
    plotStreamGraph(){
      let cur = this
      const group = d3.select("#streamGraph")
      .attr("transform", `translate(${cur.marginLeft}, ${cur.marginTop + cur.lineChartHeight})`)
      group.selectChildren().remove()
      

                let countData = this.getStreamGraphData(this.currentTrackingData["trackingInfos"])
                window.countData = countData
                let stackedData = countData["stack"], res = countData["res"]

                let x = this.timeScale

                // let xAxis = group.append('g')
                //     .attr('transform', `translate(${0},${this.streamHeight + this.lineChartHeight - 20})`)
                //     .call(d3.axisBottom(x).tickSize(2))//.tickValues(date).tickSize(2)
                //     .style('font-size', '0.5rem')
                // let maxY = 0
                // d3.map(this.streamKeys, function(key){
                //     let maxY_ = d3.max(res, d=>d[key])
                //     maxY = Math.max(maxY, maxY_)
                // })

                let maxY = 0
                d3.map(stackedData, function(sub){
                    let maxY_ = d3.max(sub, d=>d[1])
                    maxY = Math.max(maxY, maxY_)
                })
                // console.log(maxY)
                let y = d3.scaleLinear()
                    .domain([-maxY, maxY ])
                    .range([ 0 + this.streamMargin , this.streamHeight - this.streamMargin])

                
                   

                // Three function that change the tooltip when user hover / move / leave a cell
                let tooltip = $("#summaryTip");
                let mouseover = function (event) {

                    // Tooltip
                    //     .transition()
                    //     .duration(200)
                    //     .style("opacity", 0.9)
                    //     .style("left", (event.offsetX) + "px")
                    //     .style("top", (event.offsetY) + "px")
                    tooltip.css("display", "block");
                    tooltip.css("left", event.offsetX + 40);
                    tooltip.css("top", event.offsetY - 10);

                    d3.selectAll(".streamArea").style("opacity", .2)
                    d3.select(this)
                        //.style("stroke", "black")
                        .style("opacity", 1)
                }

                let mousemove = function (event, d) {
                  let mousex = d3.pointer(event, this)[0]
                    
                    let invertedx = x.invert(mousex); //得到时间
                    let currentT = parseInt(invertedx)
                    
                  
                  cur.tooltipContent = d.key + " : " 
                    + d[currentT].data[d.key] + "<br>"
                        + "Timestamp : " + currentT
                  
     
                    // console.log(d);
                    //console.log(d[mousedate].data);
                    
                    // Tooltip.html(d.key + " : " 
                    // + d[currentT].data[d.key] + "<br>"
                    //     + "Timestamp : " + currentT)
                }
                let mouseleave = function () {
                    // Tooltip.transition()
                    //     .duration(200)
                    //     .style("opacity", 0);
                    tooltip.css("display", "none");

                    d3.selectAll(".streamArea").style("opacity", 1).style("stroke", "none")
                }


                    // Area generator
                let area = d3.area()
                    .curve(d3.curveBasis)  //设置曲线
                    .x(function (d) { return x(d.data.frame); })
                    .y0(function (d) { return y(d[0]); })
                    .y1(function (d) { return y(d[1]); })
                

                group
                    .append('g')
                    .selectAll('.streamPath')
                    .data(stackedData)
                    .join('path')
                    .attr('class', 'streamArea')
                    .style("fill", function (d) { return cur.streamColorDict[d.key]; })
                    .attr("d", area)
                    .attr('transform', `translate(${0},${0})`)
                    .on("mouseover", mouseover)
                    .on("mousemove", mousemove)
                    .on("mouseleave", mouseleave)
                    let legendG = group.append("g")
               const legendText = ["PEOPLE_notOnLane", "PEOPLE_onLane","VEHICLE_onLane", "VEHICLE_notOnLane"]
      legendG.selectAll('.legendR').data(legendText).enter().append("rect")
    .attr("width", cur.legendW)
    .attr("height", cur.legendH)
    .attr("y", (d,i)=>cur.streamHeight - (4-i) * (cur.legendW+cur.legendInterVal))
    .attr("x", cur.marginLeft)
    .attr("fill", d=>cur.streamColorDict[d])
    legendG.selectAll(".streamText").data(legendText).enter()
      .append("text").attr("x",40 +cur.marginLeft ).attr("y", (d,i)=>{return 10+cur.streamHeight - (4-i) * (cur.legendW+cur.legendInterVal)}).text(d=>d)
        .attr("text-anchor", "left")
        .style("opacity",1)
        .style("font-size", "12px")

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
      const group = d3.select("#heatmap")
      .attr("transform", `translate(${cur.marginLeft}, ${cur.marginTop + cur.lineChartHeight + cur.streamHeight})`)
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
        return lineGen([[0, d * rectH], [rectH * cur.timeRange[1], d * rectH]])}
      )
      .attr("stroke-width", 0.5)
      .attr("stroke", "grey")
      .attr("stroke-opacity", 0.5)
    let tooltip = $("#summaryTip");
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
    // plotEgoCar(){
    //   this.egoFlag = true
    // }
    // plotEgoCar(){
    //   let egoGroup = d3.select("#egoCar")
    //   let cur = this
    //   egoGroup.selectChildren().remove()
    //   egoGroup.selectAll('.egoCar').data([0]).enter().append("path")
    //   .attr('d', cur.drawStar(cur.egoSize))
    //   .attr('fill', cur.egoColor)
    //   .attr('opacity', 0.9)
    //   // <path :d="drawStar(egoSize)" :fill="egoColor" fill-opacity="0.9" />
    // }
  },
  watch:{
    // currentTime:function(){
    //   this.plotEgoCar()
    // }

  },
  mounted(){
    
      this.plotLineChart()
      this.plotStreamGraph()
      // this.plotEventheatmap()
      // let cur = this
      // setTimeout(function(){
      //   cur.plotEgoCar()
      // },3000)
      
      
    
    
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>