import { createStore } from 'vuex'
import mapMIA from "../../datasets/MIAInfos.json"
import mapPIT from "../../datasets/PITInfos.json"
import allTrackingData from "../../datasets/trackingObjects.json"
export default createStore({
  state: {
    currentLogId: "",
    // currentSgData:[]
    allTrackingData:allTrackingData,
    mapAll:{"PIT" : mapPIT, "MIA": mapMIA}

    
  },
  getters: {
    currentTrackingData(state){
        
        if (state.currentLogId == "") {return ""}
        else {return state.allTrackingData[state.currentLogId]}
        
    },
    logList(state){
        return state.allTrackingData["allLogs"]
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