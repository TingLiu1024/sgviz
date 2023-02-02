<template>
  <div id="graphSearchResult" :style="divCss">
    <el-divider> Graph Search Result </el-divider>
    <el-scrollbar>
      <g >
        <el-row v-for="(d, i) in searchMatchResult" :key="i">
          <el-scrollbar>
            <div
              :style="'width:' +rectH * d['frames'].length +'px;height:'+ rectH+'px;border: 0px red solid;display: flex;flex-direction: row;'">
            
              <div :style="'height: '+rectH + 'px; width:'+ rectH +'px; border: 1px grey solid'" v-for="(dd, j) in d['frames']" :key="j" 
              @mouseover="itemMouse('over', d['logId'], dd, $event)"
              @mouseout="itemMouse('out', d['logId'], dd, $event)"
              @click="changeToFrame(d['logId'], dd)"
              >
                <svg width="100px" height="100px" :id="('svg'+d['logId'] +'_' +dd)" >
                 
                </svg>
              </div>
           
             
            </div>
          </el-scrollbar>
        </el-row>
      </g>
      <el-row>
      
      </el-row>
    
      
    </el-scrollbar>
    <div id="searchResultTip" :style="tooltip_css" v-html="tooltipContent"></div>
  </div>
</template>

<script>
import {mapState} from 'vuex'
import * as d3 from "d3";
import $ from "jquery";
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
      tooltipContent: "",
      
      tooltip_css:
        "position: absolute;padding: 7px;font-size: 0.9em;pointer-events: none;background: #fff;border: 1px solid #ccc;" +
        "border-radius: 4px;-moz-box-shadow: 3px 3px 10px 0px rgba(0, 0, 0, 0.25);display:none" +
        "-webkit-box-shadow: 3px 3px 10px 0px rgba(0, 0, 0, 0.25);box-shadow: 3px 3px 10px 0px rgba(0, 0, 0, 0.25);display:none"
    };
  },
  computed: {
    ...mapState([ "laneColor", "vehColor", "peoColor", "egoColor", "searchSgData", "searchMatchResult", "plotFlag"]),
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
    changeToFrame(logId_, frm){
      console.log('click', logId_, frm)
      this.$store.commit('updateLogId', logId_)
      // this.$store.dispatch('getDataset', logId_)
      this.$store.commit('updateTime', parseInt(frm))

    },
  sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
  },
  itemMouse(action, logId_, frm, $event){
    let tooltip = $("#searchResultTip");
      this.tooltipContent = "logId : " + logId_ +"<br>"+ "frame: "+ frm;
      if (action == "over") {
        tooltip.css("display", "block");
        tooltip.css("left", $event.offsetX + 40);
        tooltip.css("top", $event.offsetY - 10);
      } else {
        tooltip.css("display", "none");
      }
  },
    plotOneStampFdg(dynamicGroup, tsp , data) {
      
      if(!data){
          return []
      }
  
      let cur = this
      let lastFdgLayout = []
     
      const graph = data[tsp.toString()]
      let xRange = d3.extent(d3.map(graph.nodes, d=> d.cityX))
      let yRange = d3.extent(d3.map(graph.nodes, d=> d.cityY))
      let mapRange = d3.max([yRange[1]- yRange[0], xRange[1] - xRange[0]]) / 2
      let mapCenter = [ d3.mean(xRange), d3.mean(yRange)]
      let scaleFdgX = d3.scaleLinear().domain([mapCenter[0] - mapRange, mapCenter[0] + mapRange])
                .range([0 + cur.sgMargin, cur.rectH - cur.sgMargin]),
          scaleFdgY = d3.scaleLinear().domain([mapCenter[1] - mapRange, mapCenter[1] + mapRange])
                .range([cur.rectH - cur.sgMargin, 0 + cur.sgMargin]), 
          laneColor = this.laneColor, vehColor = this.vehColor, peoColor = this.peoColor, egoColor = this.egoColor
      let maxCityX =  mapCenter[0] + mapRange,
          minCityX = mapCenter[0] - mapRange,
          maxCityY = mapCenter[1] + mapRange,
          minCityY = mapCenter[1] - mapRange

    
                // console.log(graph)
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
                

                // tsp --frame   
                dynamicGroup.selectChildren().remove()
                let simulation = d3.forceSimulation(graph.nodes)
                    // 连接力
                    .force("link", d3.forceLink(graph.links)
                        .id(d => d.track_label_uuid) 	// 每个节点的id的获取方式
                        .strength(1).distance(10))
                    // 万有引力
                    .force("charge", d3.forceManyBody().strength(-3).distanceMax(10))

                // 定义人物节点之间连线的信息
                let link = dynamicGroup
                     //#999
                    .selectAll(".linkeLine") // 用line元素来绘制
                    .data(graph.links) // 绑定json文件中的links数据
                    .enter()
                    .append("line")
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
                    .call(
                        // 以定义的这些节点为参数，调用drag()函数
                        // 绑定拖拽函数的三个钩子，即拖拽开始、拖拽中、拖拽结束
                        d3.drag()
                            .on("start", dragstarted)
                            .on("drag", dragged)
                            .on("end", dragended)
                    )
                   

                // node.append("title").text(d => d.id);
                // 定义simulation内部计时器tick每次结束时的动作
                simulation.on("tick", () => {
                    // 每次tick计时到时，连接线的响应动作
                    link
                        .attr("x1", d => d.source.x)
                        .attr("y1", d => d.source.y)
                        .attr("x2", d => d.target.x)
                        .attr("y2", d => d.target.y);

                    // 每次tick计时到时，节点的响应动作
                    node

                        .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; })

                });
                // 定义开始拖拽节点时的动作，注意v6版本是通过event返回的函数参数来处理的 
                function dragstarted(event) {

                    // 当开始拖动时，restart()方法重新启动模拟器的内部计时器并返回模拟器，
                    // alphaTarget(0.3) => alpha将保持在0.3左右，使模拟不断移动
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    event.subject.fx = event.subject.x;
                    event.subject.fy = event.subject.y;
                }

                // 定义拖拽中的动作
                function dragged(event) {
                    event.subject.fx = event.x;
                    event.subject.fy = event.y;
                }

                // 定义拖拽结束的动作
                // 在拖动结束时，alphaTarget被设置回0，因此再次稳定下来，这就是阻力相互作用后力返回的原因
                function dragended(event) {
                    if (!event.active) simulation.alphaTarget(0);
                    event.subject.fx = null;
                    event.subject.fy = null;
                }

   
                return graph.nodes
    },
    

  },
  watch: {
    plotFlag: function(){
      console.log(this.searchSgData)
      console.log(this.searchMatchResult)
      console.log(this.plotFlag)
      let cur = this
      cur.sleep(1000).then(() => { console.log("plot search result!"); 
      cur.searchMatchResult.forEach((logRes)=>{
        let logId_ = logRes["logId"]
        logRes["frames"].forEach(frm =>{
          let dynamicGroup = d3.select("#svg" + logId_ + '_' + frm)
          // 加svg前缀原因 ： 数字开头会导致selector失败
          // let dynamicGroup = document.getElementById(logId_ + '_' + frm)
          // let dynamicGroup = d3.select('#3138907e-1f8a-362f-8f3d-773f795a0d01_1')
          cur.plotOneStampFdg(dynamicGroup, frm , cur.searchSgData[logId_])
        })
      })
    });
    },
   
  },
  mounted() {
      
   
      let cur = this
      if (cur.searchMatchResult.length){
        
        cur.searchMatchResult.forEach((logRes)=>{
        let logId_ = logRes["logId"]
        logRes["frames"].forEach(frm =>{
          let dynamicGroup = d3.select("#svg" + logId_ + '_' + frm)
          // 加svg前缀原因 ： 数字开头会导致selector失败
          // let dynamicGroup = document.getElementById(logId_ + '_' + frm)
          // let dynamicGroup = d3.select('#3138907e-1f8a-362f-8f3d-773f795a0d01_1')
          cur.plotOneStampFdg(dynamicGroup, frm , cur.searchSgData[logId_])
        })
      
    });

      }
      
      
      
      
      
      
    },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>