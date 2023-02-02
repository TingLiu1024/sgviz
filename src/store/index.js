import { createStore } from 'vuex'
import mapMIA from "../../datasets/MIAInfos.json"
import mapPIT from "../../datasets/PITInfos.json"
import * as d3 from "d3";
import logListDict from "../../public/logList.json"

// import allSgData from "../../datasets/fdgData.json"

export default createStore({
  state: {
    currentLogId: "0ef28d5c-ae34-370b-99e7-6709e1c4b929",
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
    sgCurrentOverPeo:"100",
    currentEventData:"",
    sgBrushGraph:{"nodes":[],"edges":[]},
    currentEgoData:"",
    searchSgData:"",
    searchMatchResult:[],
    plotFlag:false,

    
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
          // console.log('readdata', res)
          context.commit('updateMatchLogDataset', res)
      })
  },
   
  },
  modules: {
  }
})