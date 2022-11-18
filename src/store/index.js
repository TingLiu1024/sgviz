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
    sgCurrentOverCar:"100"

    
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
    state.summaryViewState = true
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
   }

  },
  actions: {
    async getDataset(context, id_) {
        await Promise.all([d3.json("./trackingData/"+id_ +".json"),
        d3.json("./sgData/"+id_ +".json")]).then(function(data) {
            context.commit('updateDataset', data)
        })
    },
   
  },
  modules: {
  }
})