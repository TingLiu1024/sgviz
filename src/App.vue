<template>
  
    <controlPanel
      :width = 'sysWidth * 0.25'
      :height = 'sysHeight * 0.37 - 2 * border'
      :top = "border"
      :left = "border"
    />
    <beView 
      :width = 'sysWidth * 0.25'
      :height = 'sysHeight * 0.47'
      :top = "sysHeight * 0.37 - border "
      :left = "border"
    />
    <sgView v-if = "summaryViewState"
      :width = 'sysWidth * 0.3'
      :height = 'sysHeight * 0.45'
      :top = "border"
      :left = " sysWidth * 0.25 + 2 * border"
    />
    <sgDetailView 
       :width = 'sysWidth * 0.3'
      :height = 'sysHeight * 0.37 - 2 * border'
      :top = "sysHeight * 0.45 +  border"
      :left = "sysWidth * 0.25 + 2 * border"
    />
    <visualSummaryView v-if = "summaryViewState"
      :width = 'sysWidth * 0.45 - 4 * border'
      :height = 'sysHeight * 0.46'
      :top = "border"
      :left = "sysWidth * 0.55 + 3 * border"
    />
    <graphSearchResult v-if = "summaryViewState"
      :width = 'sysWidth * 0.45 - 4 * border'
      :height = 'sysHeight * 0.36 - 2 * border'
      :top = "sysHeight * 0.46 + border"
      :left = "sysWidth * 0.55 + 3 * border"
    />
    <topoSummary v-if = "summaryViewState"
    :width = 'sysWidth * 1 - 2 * border'
      :height = 'sysHeight * 0.2 +  border'
      :top = "sysHeight * 0.82 + border"
      :left = "border"
    />


</template>

<script>
import beView from './components/beView.vue'
import controlPanel from './components/controlPanel.vue'
// import graphStatisticView from './components/graphStatisticView.vue'
import sgDetailView from './components/sgDetailView.vue'
import sgView from './components/sgView.vue'
import visualSummaryView from './components/visualSummaryView.vue'
import graphSearchResult from './components/graphSearchResult.vue'
import topoSummary from './components/topoSummary.vue'
import { mapState } from 'vuex'
export default {
  name: 'App',
  components: {
    controlPanel,
    beView,
    sgDetailView,
    visualSummaryView,
    sgView,
    topoSummary,
    graphSearchResult
  },
  data(){
    return {
      //这两个变量是浏览器页面的大小，通过props遗传到子组件
      // width:document.documentElement.clientWidth ,
      // height:document.documentElement.clientHeight,
      sysWidth: 2200,
      // sysWidth: 2500,
      sysHeight: 1200,
      border: 10,
      // flag: false
    }
  },
  computed:{
      ...mapState(["summaryViewState"])
  },
  mounted(){
    // setTimeout(function(){ this.flag = true }, 3000);
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
