import { createStore } from 'vuex'
import mapMIA from "../../datasets/MIAInfos.json"
import mapPIT from "../../datasets/PITInfos.json"
import * as d3 from "d3";
import logListDict from "../../public/logList.json"
import projectionData from "../../public/tsne/projection.json"
import summaryData from "../../public/summary/speedAccYawDiff.json"
import loglegendState from "../../public/logLegendState.json"


// import allSgData from "../../datasets/fdgData.json"

export default createStore({
  state: {
    currentLogId: "0ef28d5c-ae34-370b-99e7-6709e1c4b929",
    mapAll:{"PIT" : mapPIT, "MIA": mapMIA},
    laneColor:"#716e77",
    vehColor:"#3E6D9C", 
    peoColor:"#D25565",
    egoColor: "red",
    accelerationColor:"#fb9a99",
    yawDiffColor:"#bf5b17",

    currentTrackingData:"",
    logListDict:logListDict,
    currentSgData:"",
    mapRange:"",
    mapCenter:"",
    currentTime:0,
    summaryViewState: false,
    sgCurrentOverLane:"100",//记录sgview mouseover的道路
    sgCurrentOverCar:"100",
    sgCurrentOverPeo:"100",
    currentEventData:"",
    sgBrushGraph:{"nodes":[],"edges":[]},
    currentEgoData:"",
    searchSgData:"",
    searchMatchResult:[],
    plotFlag:false,
    summaryData:summaryData,
    speedFillColor:"#b3e2cd",
    projectionData:projectionData,
    projectColors:["#4e79a7","#f28e2c","#e15759","#76b7b2","#59a14f","#edc949","#af7aa1","#ff9da7","#9c755f","#bab0ab"],
    // projectColors:["#8dd3c7","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd","#ccebc5","#ffed6f"]
    projectLegendShow:true,
    projectLegendState:loglegendState
    
    
    
  },
  getters: {
    logList() {
        return logListDict["allLogs"]
    },
    projectionLogList(){
      return logListDict["allLogs"]
    },
    projectCircleConfig(state){
      let i = 0;
      let allLogs = logListDict["allLogs"]
      let logNum = allLogs.length
      let config = {}
      let configList = []
      while(i * i < logNum){
        i = i + 1
      }
      let colorPicks = state.projectColors.slice(0, i)
      let strokeColor = ["none"].concat(colorPicks)
      for(let p=0;p <i;p++){
        for(let q=0; q<i + 1; q++){
          if (colorPicks[p]==strokeColor[q]){
            continue
          }
          configList.push({'fillColor':colorPicks[p],'strokeColor': strokeColor[q], 'legendState':true})
        }
      }
      for(let idx=0;idx< logNum;idx++ ){
        config[allLogs[idx]] = configList[idx]
      }
      return config
      


    },

    
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
   updateSgCurrentOverPeo(state, peoId){
    state.sgCurrentOverPeo = peoId
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
    console.log(data)
    state.sgBrushGraph = data
   },
   updateCurrentEgoData(state, data){
    state.currentEgoData = data
   },
   updateCurrentMatchData(state, data){
    
    state.searchMatchResult = data
    // console.log('state', state.searchMatchResult)
   },
   updateMatchLogDataset(state, data){

    
    state.searchSgData = data
    state.plotFlag = !state.plotFlag
    
   },
   updateProjectLegendState(state, data){
    // console.log(state_)
    // console.log(state.projectLegendState[logId]["legendState"])
    state.projectLegendState[data[0]]["legendState"] = data[1]
    console.log(state.projectLegendState)
   },
   updateLegendState(state, bool_value){
    state.projectLegendShow=bool_value
   }

  },
  actions: {
    async getDataset(context, id_) {
        await Promise.all([d3.json("./trackingData/"+id_ +".json"),
        d3.json("./DifdgData/"+id_ +".json"), d3.json("./behaviour/"+id_ +".json")
      ]).then(function(data) {
            context.commit('updateDataset', data)
            // console.log(data)
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
          // console.log('readdata', res)
          context.commit('updateMatchLogDataset', res)
      })
  },
   
  },
  modules: {
  }
})