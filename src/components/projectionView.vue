<template>
  <div class="projectView" :style="divCss">
    <el-divider> Projection View </el-divider>
    <el-row style="margin-bottom:3px"> 
      <el-col :span="12" 
      > <el-button type="primary" size="small" @click="update_legend('show')" > show legend</el-button>
    </el-col>
      <el-col :span="12" 
      > <el-button type="primary" size="small" @click="update_legend('hide')" > hide legend</el-button>
   </el-col>
      
    </el-row>
    <div> <svg :width="width" :height="svgHeight" > 
      <g id="projectYaxis" :transform="`translate(${marginLeft}, 0)`"></g>
      <g id="projectXaxis" :transform="`translate(${marginLeft}, ${svgHeight - marginTop - marginBottom})`"></g>
      <g  :transform="`translate(${marginLeft}, 0)`">
        
        <g class="frameProjectPoint">
        <circle
          v-for="(d, i) in plotCircleData"
          :key="i"
          :cx="scaleX(d.x)"
          :cy="scaleY(d.y)"
          :r="cicleSize"
          :stroke-width="strokeWidth"
          :stroke="projectCircleConfig[d.logId]['strokeColor']"
         
          :fill="projectCircleConfig[d.logId]['fillColor']"   
          @mouseover="itemMouse('over', d, $event)"
        @mouseout="itemMouse('out', d, $event)"
        />
      </g>  
       </g>
      
    </svg> </div>
    
    <div id="projectTip" :style="tooltip_css" v-html="tooltipContent"></div>
  </div>
</template>

<script>
import {mapState, mapGetters} from "vuex"
import $ from "jquery";
import * as d3 from "d3"
export default {
  name: 'projectView',
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
      marginLeft: 25,
      marginTop: 10,
      marginRight:10,
      marginBottom:30,
      cicleSize:2,
      strokeWidth:0.7,
      tooltipContent:"",
      tooltip_css:
        "position: absolute;padding: 7px;font-size: 0.9em;pointer-events: none;background: #fff;border: 1px solid #ccc;" +
        "border-radius: 4px;-moz-box-shadow: 3px 3px 10px 0px rgba(0, 0, 0, 0.25);display:none" +
        "-webkit-box-shadow: 3px 3px 10px 0px rgba(0, 0, 0, 0.25);box-shadow: 3px 3px 10px 0px rgba(0, 0, 0, 0.25);display:none;z-index: 100;"
    };
  },
  computed:{
    ...mapState(["projectionData", "projectLegendState"]),
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
    plotCircleData(){
      // let res = d3.filter(this.projectionData, d => this.projectionLogList.includes(d.logId) )
      // console.log(this.projectionData)
      return d3.filter(this.projectionData, d => this.projectLegendState[d.logId]["legendState"] )
    },
    rangeX(){
      return d3.extent(this.plotCircleData, d=> d.x)
    },
    rangeY(){
      return d3.extent(this.plotCircleData, d=> d.y)
    },
    scaleX(){
      return d3
        .scaleLinear()
        .domain(this.rangeX)
        .range([0, this.width - this.marginLeft- this.marginRight]);
    },
    scaleY(){
      return d3
        .scaleLinear()
        .domain(this.rangeY)
        .range([ this.svgHeight -  this.marginTop - this.marginBottom, 5]);
    },
  },
  methods:{
    update_legend(str_){
      if (str_=="show"){
        this.$store.commit('updateLegendState', true)
      }
      else{
        this.$store.commit('updateLegendState', false)

      }
    },
    itemMouse(action, d, $event) {
      let tooltip = $("#projectTip");
      this.tooltipContent = "logId : " + d.logId + "<br>" +
            "frames : " +
            d.frames_list;
      if (action == "over") {
        tooltip.css("display", "block");
        tooltip.css("left", $event.offsetX + 40);
        tooltip.css("top", $event.offsetY - 10);
      } else {
        tooltip.css("display", "none");
      }
    },
    plotAxis(){
      d3.select("#projectXaxis").selectChildren().remove()
      d3.select("#projectYaxis").selectChildren().remove()

      let cur = this
    d3.select("#projectXaxis")
    .call(d3.axisBottom(cur.scaleX));
    d3.select("#projectYaxis")
    .call(d3.axisLeft(cur.scaleY));

    }

  },
  watch:{
    projectLegendState:function(){
      this.plotAxis()
    }

  },
  mounted(){
    this.plotAxis()
    // console.log(cur.projectCircleConfig)
  }
  
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
