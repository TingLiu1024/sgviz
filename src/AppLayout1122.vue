<template>
  
    <controlPanel
      :width = 'sysWidth * 0.3'
      :height = 'sysHeight * 0.4 - 2 * border'
      :top = "border"
      :left = "border"
    />
    <sgDetailView 
      :width = 'sysWidth * 0.3'
      :height = 'sysHeight * 0.4 - 2 * border'
      :top = "sysHeight * 0.4 "
      :left = "border"
    />
    <beView 
      :width = 'sysWidth * 0.3'
      :height = 'sysHeight * 0.4'
      :top = "border"
      :left = " sysWidth * 0.3 + 2 * border"
    />
    <sgView  v-if = "summaryViewState"
      :width = 'sysWidth * 0.3'
      :height = 'sysHeight * 0.4 - 2 * border'
      :top = "sysHeight * 0.4 + 2 * border"
      :left = "sysWidth * 0.3 + 2 * border"
    />
    <visualSummaryView v-if = "summaryViewState"
      :width = 'sysWidth * 0.4 - 4 * border'
      :height = 'sysHeight * 1 - 2 * border'
      :top = "border"
      :left = "sysWidth * 0.6 + 3 * border"
    />
    <topoSummary v-if = "summaryViewState"
    :width = 'sysWidth * 1 - 4 * border'
      :height = 'sysHeight * 0.2 + 3 * border'
      :top = "sysHeight * 0.8 + 3 *border"
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
    topoSummary
  },
  data(){
    return {
      //这两个变量是浏览器页面的大小，通过props遗传到子组件
      // width:document.documentElement.clientWidth ,
      // height:document.documentElement.clientHeight,
      sysWidth: 2200,
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
