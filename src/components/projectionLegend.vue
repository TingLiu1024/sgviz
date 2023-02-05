<template>
  <div class="projectLegend" :style="divCss">
    <el-row> 
      <el-col :span="6">
        <el-button type="primary" size="small" @click="hideAll()">hide all</el-button>
      </el-col>
      <el-col :span="6">
        <el-button type="primary" size="small" @click="showAll()">show all</el-button>
      </el-col>

    </el-row>
   
    <svg :width="width" :height="svgHeight" :transform="`translate(${marginLeft}, ${marginTop})`"> 
     
      <g  :transform="`translate(${10}, 30)`">
        
        <g class="LogIdLegend">
        <circle
          v-for="(d, i) in projectionLogList"
          :key="i"
          :cx="0"
          :cy="i * lengendInterval"
          :r="cicleSize"
          :opacity="(projectLegendState[d]['legendState']==true)?1:0.3"
          :stroke-width="strokeWidth"
          :stroke="projectCircleConfig[d]['strokeColor']"
         
          :fill="projectCircleConfig[d]['fillColor']"   
          @click="changeState(d)"
       
        />
      </g>  

      <g id="LogIdLegendText">
      </g>  
       </g>
      
    </svg> 
  
  </div>
</template>

<script>
import {mapState, mapGetters} from "vuex"
import $ from "jquery";
import * as d3 from "d3"
export default {
  name: 'projectLegend',
  props: {
    //这两个属性从父组件继承
    height: Number,
    width: Number,
    top: Number,
    left: Number,
  },
  data() {
    return {
      legendControl:30,
      lengendInterval:25,
      marginLeft: 10,
      marginTop: 20,
      marginRight:10,
      marginBottom:30,
      cicleSize:6,
      strokeWidth:2,
      tooltipContent:"",
      tooltip_css:
        "position: absolute;padding: 7px;font-size: 0.9em;pointer-events: none;background: #fff;border: 1px solid #ccc;" +
        "border-radius: 4px;-moz-box-shadow: 3px 3px 10px 0px rgba(0, 0, 0, 0.25);display:none" +
        "-webkit-box-shadow: 3px 3px 10px 0px rgba(0, 0, 0, 0.25);box-shadow: 3px 3px 10px 0px rgba(0, 0, 0, 0.25);display:none"
    };
  },
  computed:{
    ...mapState(["projectLegendState"]),
    ...mapGetters(["projectionLogList", "projectCircleConfig"]),
    svgHeight(){
      return this.height - this.legendControl - 20
    },
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
    changeState(logId){
      let state_ = this.projectLegendState[logId]["legendState"]
      console.log(state_)
      this.$store.commit('updateProjectLegendState', [logId, !state_])

    },
    hideAll(){
      let cur = this
      this.projectionLogList.forEach(logId=> cur.$store.commit('updateProjectLegendState', [logId, false]))
    },
    showAll(){
      let cur = this
      this.projectionLogList.forEach(logId=> cur.$store.commit('updateProjectLegendState', [logId, true]))
    }
  },
  mounted(){
    let cur = this
    const legendG = d3.select('#LogIdLegendText')
      legendG.selectChildren().remove()
      legendG.selectAll(".lineText").data(cur.projectionLogList).enter()
      .append("text").attr("x",10).attr("y", (d,i)=>{return 5 + i * (cur.lengendInterval)}).text(d=>d)
        .attr("text-anchor", "left")
        .style("opacity",0.95)
        .style("font-size", "12px")
   
  }
  
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
