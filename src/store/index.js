import { createStore } from 'vuex'
import mapMIA from "../../datasets/MIAInfos.json"
import mapPIT from "../../datasets/PITInfos.json"
import * as d3 from "d3";
import logListDict from "../../public/logList.json"

// import allSgData from "../../datasets/fdgData.json"

export default createStore({
  state: {
    currentLogId: "",
    mapAll:{"PIT" : mapPIT, "MIA": mapMIA},
    laneColor:"#716e77",
    vehColor:"#3E6D9C", 
    peoColor:"#D25565",
    egoColor: "red",
    currentTrackingData:"",
    logListDict:logListDict,
    currentSgData:"",
    mapRange:"",
    mapCenter:"",
    currentTime:0,
    summaryViewState: false,
    sgCurrentOverLane:"100",//记录sgview mouseover的道路
    sgCurrentOverCar:"100",
    currentEventData:"",
    sgBrushGraph:{"nodes":[],"edges":[]},
    currentEgoData:"",
    searchSgData:[],
    searchMatchResult:[],

    
  },
  getters: {
    logList() {
        return logListDict["allLogs"]
    } 

    
  },
  mutations: {
   updateLogId(state, id_){
    state.currentLogId = id_
    state.summaryViewState = false
    
   },
   updateDataset(state, data){
    state.currentTrackingData = data[0]
    state.mapCenter = state.currentTrackingData["mapCenter"]
    state.mapRange = state.currentTrackingData["mapRange"]
    state.currentSgData = data[1]
    state.currentEventData = data[2]
    state.summaryViewState = true
    // state.searchSgData = data[3]
    
   },
   updateTime(state, tsp){
    state.currentTime = tsp
   },
   updateSgCurrentOverLane(state, laneId){
    // console.log(laneId)
    state.sgCurrentOverLane = laneId
   },
   updateSgCurrentOverCar(state, carId){
    state.sgCurrentOverCar = carId
   },
   updateSgBrushData(state, data){
    // 定义子图匹配调节
    // let res = []
    if (d3.filter(data["nodes"], d=>d.track_label_uuid=="ego").length == 0){
      data["nodes"].push(state.currentEgoData)

    }
    data["nodes"].forEach( d=>{
      Object.assign(d, {"consider":true})
      if(d.label_class == "LANE"){
        
        Object.assign(d, {"turnConsider":true, "intersectionConsider":true})
      }
    })
    data["edges"].forEach( d=>{
      Object.assign(d, {"consider":true})
    })
    // console.log(data)
    state.sgBrushGraph = data
   },
   updateCurrentEgoData(state, data){
    state.currentEgoData = data
   },
   updateCurrentMatchData(state, data){
    
    state.searchMatchResult = data
    console.log('state', state.searchMatchResult)
   },
   updateMatchLogDataset(state, data){
    function getSimulationData(tsp, data, rectH, sgMargin){
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
                    .force("link", d3.forceLink(graph.links)
                        .id(d => d.track_label_uuid) 	// 每个节点的id的获取方式
                        .strength(1).distance(10))
                    // 万有引力
                    .force("charge", d3.forceManyBody().strength(-3).distanceMax(10))
                //     simulation.on("tick", () => {
                //     // 每次tick计时到时，连接线的响应动作
                //     link
                //         .attr("x1", d => d.source.x)
                //         .attr("y1", d => d.source.y)
                //         .attr("x2", d => d.target.x)
                //         .attr("y2", d => d.target.y);

                //     // 每次tick计时到时，节点的响应动作
                //     node

                //         .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; })

                // });
          return graph

    }
    let res = {}
    state.searchMatchResult.forEach(d=>{
      let logId_ = d["logId"]
      res[logId_] = {}
      let frames = d["frames"]
      for (let i = 0;i < frames.length; i++){
        res[logId_][frames[i].toString()] = getSimulationData(frames[i], data[logId_], 100, 10)
      }
    })
    console.log(res)
    window.res = res
    state.searchSgData = res
    
   }

  },
  actions: {
    async getDataset(context, id_) {
        await Promise.all([d3.json("./trackingData/"+id_ +".json"),
        d3.json("./DifdgData/"+id_ +".json"), d3.json("./behaviour/"+id_ +".json"), d3.json("./DifdgData/"+id_ +".json"),
      ]).then(function(data) {
            context.commit('updateDataset', data)
        })
    },
    async readMatchLogDataset(context, matchResult) {
      let res = {}
      let logs = matchResult.map(d => d["logId"])
      
      await Promise.all(matchResult.map(d => d3.json("./DifdgData/"+d["logId"] +".json"))
        ).then(function(data) {
          for (let i = 0; i < logs.length; i++){
            res[logs[i]] = data[i]
          }
          
          context.commit('updateMatchLogDataset', res)
      })
  },
   
  },
  modules: {
  }
})