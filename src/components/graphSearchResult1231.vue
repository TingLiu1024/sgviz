<template>
  <div id="graphSearchResult" :style="divCss">
    <el-divider> Graph Search Result </el-divider>
    <!-- <div> <svg id = "log1_1" width="100px" height="100px"> </svg></div> -->
    <el-scrollbar>
      <g >
        <el-row v-for="(d, i) in searchMatchResult" :key="i">
          <el-scrollbar>
            <div
              :style="'width:' +rectH * d['frames'].length +'px;height:'+ rectH+'px;border: 1px red solid;display: flex;flex-direction: row;'">
            
              <div :style="'height: '+rectH + 'px; width:'+ rectH +'px; border: 1px blue solid'" v-for="(dd, j) in d['frames']" :key="j" 
              >
                <svg width="100px" height="100px" :id="(d['logId'] +'_' +dd)" v-if="(Object.keys(searchSgData).length>0)" >
                  <g >
        <circle  
          v-for="(obj, k) in searchSgData[d['logId']][dd.toString()]['nodes']"
          :key="k"
          :cx="obj.x"
          :cy="obj.y"
          r="1"
          fill="black"
          /></g>
              
                </svg>
              </div>  
            </div>
          </el-scrollbar>
        </el-row>
      </g>
      <el-row>
      
      </el-row>
      <el-row>
        <el-card></el-card>
      </el-row>
      <el-row>
        <el-card></el-card>
      </el-row>
      <el-row>
        <el-card></el-card>
      </el-row>
      
    </el-scrollbar>
  </div>
</template>

<script>
import {mapState} from 'vuex'
import * as d3 from "d3";
export default {
  name: "graphSearchResult",
  props: {
    //这两个属性从父组件继承
    height: Number,
    width: Number,
    top: Number,
    left: Number,
  },
  data() {
    return {
      rectH: 100,
      sgMargin:5,
      results: [{"logId": "log1", "frames":[1, 2, 3, 4] }, {"logId": "log2", "frames":[1, 2, 3, 4] }],
    };
  },
  computed: {
    ...mapState([ "laneColor", "vehColor", "peoColor", "egoColor", "searchSgData", "searchMatchResult"]),
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
  methods:{
    // itemMouse( d, dd) {
    //   console.log(d, dd)
    // },
    getSimulationData(tsp, data, rectH, sgMargin){
      let lastFdgLayout = []
     
      let graph = data[tsp.toString()]
      
      let xRange = d3.extent(d3.map(graph.nodes, d=> d.cityX))
      let yRange = d3.extent(d3.map(graph.nodes, d=> d.cityY))
      let mapRange = d3.max([yRange[1]- yRange[0], xRange[1] - xRange[0]]) / 2
      let mapCenter = [ d3.mean(xRange), d3.mean(yRange)]
      let scaleFdgX = d3.scaleLinear().domain([mapCenter[0] - mapRange, mapCenter[0] + mapRange])
                .range([0 + sgMargin, rectH - sgMargin]),
          scaleFdgY = d3.scaleLinear().domain([mapCenter[1] - mapRange, mapCenter[1] + mapRange])
                .range([rectH - sgMargin, 0 + sgMargin])
                let maxCityX =  mapCenter[0] + mapRange,
          minCityX = mapCenter[0] - mapRange,
          maxCityY = mapCenter[1] + mapRange,
          minCityY = mapCenter[1] - mapRange
          let lastObjs = []
                
                if (lastFdgLayout) {
                    lastObjs = d3.map(lastFdgLayout, d => d.track_label_uuid)
                    // console.log(lastObjs)
                }
                          
                          graph.nodes.forEach((d) => {
                              // 车道固定位置， 已有位置按原位置分配， 没有的若能匹配到车道，则初始位置为对应车道，否则，按本身的地理位置分配
          
                              if (d.label_class == "LANE") {
                                let pol = d3.filter(d.polygon.slice(0,-1),
                                  k => k[0] > minCityX & k[0] < maxCityX & k[1] > minCityY & k[1] < maxCityY)
                                  const meanX = d3.mean(d3.map(pol, a => a[0]))
                                  const meanY = d3.mean(d3.map(pol, a => a[1]))
                              
                                  d.fx = scaleFdgX(meanX)
                                  d.fy = scaleFdgY(meanY)
                              }
                              else if (lastObjs.includes(d.track_label_uuid)) {
                                  d.x = d3.filter(lastFdgLayout, g => g.track_label_uuid == d.track_label_uuid)[0].x
                                  d.y = d3.filter(lastFdgLayout, g => g.track_label_uuid == d.track_label_uuid)[0].y
          
                              }
                              else if (d.track_label_uuid != "ego") {
                                  // 对新的object 分配一个位置使得收敛较快
                                  let matchLink = d3.filter(graph.links, l => l.source == d.track_label_uuid)
                                  // console.log(matchLink)
                              
                                  if (matchLink.length) {
                                      const target = matchLink[0].target
                                      let meanX = "", meanY = ""
                                      if (typeof (target) == "object") {
                                          meanX = d3.mean(d3.map(target.polygon, a => a[0]))
                                          meanY = d3.mean(d3.map(target.polygon, a => a[1]))
                                      }
                                      else {
                                          meanX = d3.mean(d3.map(d3.filter(graph.nodes, b => b.track_label_uuid == target)[0].polygon, a => a[0]))
                                          meanY = d3.mean(d3.map(d3.filter(graph.nodes, b => b.track_label_uuid == target)[0].polygon, a => a[1]))
          
                                      }
                                      // // console.log(meanX, meanY)
                                      d.x = scaleFdgX(meanX)
                                      d.y = scaleFdgY(meanY)
                                  }
                                  else {
                                      d.x = scaleFdgX(d.cityX)
                                      d.y = scaleFdgY(d.cityY)
                                      // d.x = width / 2
                                      // d.y = height / 2
                                  }
                              }
                          })
                          let simulation = d3.forceSimulation(graph.nodes)
                    // 连接力
                    simulation.force("link", d3.forceLink(graph.links)
                        .id(d => d.track_label_uuid) 	// 每个节点的id的获取方式
                        .strength(1).distance(10))
                    // 万有引力
                    .force("charge", d3.forceManyBody().strength(-3).distanceMax(10))
                    simulation.on("tick", () => {
                    // 每次tick计时到时，连接线的响应动作
                    // link
                    //     .attr("x1", d => d.source.x)
                    //     .attr("y1", d => d.source.y)
                    //     .attr("x2", d => d.target.x)
                    //     .attr("y2", d => d.target.y);

                    // // 每次tick计时到时，节点的响应动作
                    // node

                    //     .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; })

                });
          return graph

    },
    plotOneStampFdg(dynamicGroup, tsp , data) {
      
      if(!data){
          return []
      }
  
      let cur = this,
      laneColor = this.laneColor, 
        vehColor = this.vehColor, peoColor = this.peoColor, egoColor = this.egoColor
      
      let graph = cur.getSimulationData(tsp, data, cur.rectH, cur.sgMargin)
      console.log(graph)


                // tsp --frame   
                dynamicGroup.selectChildren().remove()
             

                // 定义人物节点之间连线的信息
                let link = dynamicGroup
                     //#999
                    .selectAll(".linkeLine") // 用line元素来绘制
                    .data(graph.links) // 绑定json文件中的links数据
                    .enter()
                    link.append("path")
                    .attr("d", d=>{
                      return d3.line()([[d.source.x, d.source.y], [d.target.x, d.target.y]])
                    })
                    // .join("line")
                    
                    .attr("stroke-opacity", 1)
                    .attr("stroke-width", 1) // 连线粗细通过线的value计算
                    .attr("stroke", "#a65628")

                let node = dynamicGroup
                    .selectAll(".circle").data(graph.nodes).enter()
                    .append("g")
                    // d3.symbolDiamond2 d3.symbolCircle d3.symbolPlus d3.symbolStar d3.symbolTriangle d3.symbolTriangle2
                    //  d3.symbolWye   d3.symbolX  d3.symbolAsterisk
                    .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; })
                node.append("path")
                    .attr("d", d3.symbol()
                        .size(function (d) {
                            if (d.label_class == "LANE") {
                                return 30
                            }
                            else if (d.label_class == "PEOPLE") {
                                return 10
                            }
                            else {
                                return 15
                            }
                        })
                        .type(
                            // d3.symbolCross
                            function (d) {
                                // console.log(d)
                                if (d.track_label_uuid == "ego") { return d3.symbolStar }
                                else if (d.label_class == "LANE") { return d3.symbolSquare }
                                else if (d.label_class == "VEHICLE") { return d3.symbolCross }
                                else { return d3.symbolCircle }
                            }
                        ))

                    .attr("fill", function (d) {
                        if (d.track_label_uuid == "ego") { return egoColor }
                        else if (d.label_class == "LANE") { return laneColor }
                        else if (d.label_class == "VEHICLE") {
                            return vehColor
                            // "#8ac6d1" 
                        }
                        else { return peoColor }
                    })// 设置节点的填充色，通过节点的group属性来计算节点的填充颜色
                    .attr("opacity", function (d) {
                        if (d.label_class == "LANE") {
                            return 0.7
                        }
                        else {
                            return 1
                        }
                    })
                   
          
    },
    

  },
  watch: {
    // searchSgData: function(){
    //   console.log(this.searchSgData)
    //   console.log(this.searchMatchResult)
    //   let cur = this
    //   cur.searchMatchResult.forEach((logRes)=>{
    //     let logId_ = logRes["logId"]
    //     logRes["frames"].forEach(frm =>{
    //       let dynamicGroup = d3.select("#" + logId_ + '_' + frm)
    //       // let dynamicGroup = document.getElementById(logId_ + '_' + frm)
    //       // let dynamicGroup = d3.select('#3138907e-1f8a-362f-8f3d-773f795a0d01_1')
    //       cur.plotOneStampFdg(dynamicGroup, frm , cur.searchSgData[logId_])
    //     })
    //   })
    // },
    // searchMatchResult: function() {
      
    // }
  },
  mounted() {
    console.log('mount')
    console.log(this.searchSgData)
      console.log(this.searchMatchResult)
      // let dynamicGroup = d3.select("#log1_1")
      // this.plotOneStampFdg(dynamicGroup, '0', this.searchSgData)
      // let cur = this
      // if (cur.searchMatchResult.length >0 ){
      //   cur.searchMatchResult.forEach((logRes)=>{
      //   let logId_ = logRes["logId"]
      //   logRes["frames"].forEach(frm =>{
      //     let dynamicGroup = d3.select("#" + logId_ + '_' + frm)
      //     // let dynamicGroup = document.getElementById(logId_ + '_' + frm)
      //     // let dynamicGroup = d3.select('#3138907e-1f8a-362f-8f3d-773f795a0d01_1')
      //     cur.plotOneStampFdg(dynamicGroup, frm , cur.searchSgData[logId_])
      //   })
      // })
      // }
      
      
      
      
    },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>