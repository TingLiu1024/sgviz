import { createStore } from 'vuex'
import mapMIA from "../../datasets/MIAInfos.json"
import mapPIT from "../../datasets/PITInfos.json"
import allTrackingData from "../../datasets/trackingObjects.json"
import allSgData from "../../datasets/fdgData.json"

export default createStore({
  state: {
    currentLogId: "",
    // currentSgData:[]
    allTrackingData:allTrackingData,
    mapAll:{"PIT" : mapPIT, "MIA": mapMIA},
    allSgData:allSgData,
    laneColor:"#716e77",
    vehColor:"#3E6D9C", 
    peoColor:"#D25565",
    egoColor: "red"

    
  },
  getters: {
    currentTrackingData(state){
        if (state.currentLogId == "") {return ""}
        else {return state.allTrackingData[state.currentLogId]}   
    },
    logList(state){
        return state.allTrackingData["allLogs"]
    },
    currentFdgData(state){
        return state.allSgData[state.currentLogId]
    },
    // currentCity(state){
    //     if (state.currentLogId == "") {return ""}
    //     else{
    //         return state.allTrackingData[state.currentLogId]["city"]
    //     }
        
    // },
    // currentMapData(state){
    //     if (state.currentLogId == "") {return ""}
    //     else{
    //         return state.mapAll[state.allTrackingData[state.currentLogId]["city"]]
    //     }
        
    // },
    
  },
  mutations: {

   updateLogId(state, id_){
    state.currentLogId = id_
   }

  },
  actions: {
   
  },
  modules: {
  }
})