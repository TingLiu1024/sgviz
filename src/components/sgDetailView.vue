<template>
  <div id="sgDetailView" :style="divCss">
    <el-divider>Graph Detail View</el-divider>
    <!-- <el-card  :style="'height:' + (height-40) + 'px' "></el-card> -->
    <el-row style="margin-bottom:3px">
      <el-col :span = "12">
        <el-button type="primary" style = "width:80%" @click = "search">
          <font-awesome-icon icon="fa-solid fa-magnifying-glass" />
          <label style="margin-left:3px"> Search </label>
          </el-button>
      </el-col>
      <el-col :span = "12">
        <el-button type="primary" :loading="loading" style = "width:80%" disabled>
          <!-- <font-awesome-icon icon="fa-solid fa-spinner" /> -->
          <label style="margin-left:3px"> Loading </label>
  </el-button>
      </el-col>
    </el-row>
    <el-card  >
      <el-scrollbar >
        <!-- :height = "height" -->
      <a-collapse v-model:activeKey="activeKey">
    <a-collapse-panel key="nodes" :header="'Nodes (' + (1 + vehicleNodes.length + 
    peopleNodes.length + laneNodes.length) +')'">
      <a-collapse v-model:activeKey="activeKeyEgo">
        <!-- 可以加入当前速度信息 -->
    <a-collapse-panel key="ego" header="Ego">
      <a-row justify = "space-around"> 
        <a-tag>Speed : {{!currentEgoData["speed"]?null:currentEgoData["speed"].toFixed(2)}}</a-tag>  
      <a-tag>Acceleration : {{!currentEgoData["acceleration"]?null:currentEgoData["acceleration"].toFixed(2)}}</a-tag> 
      <a-tag>YawDiff : {{yawDiff}}</a-tag>
      
      </a-row>
      <a-row style = "margin-top:2px" align="middle"> 
        <a-col :span ="4">  <a-tag>Speed : </a-tag>  </a-col>
        <a-col :span ="4">  
          <a-input placeholder="Min" size="small" v-model:value="speedRange[0]"  >
           </a-input>  
        </a-col>
        <a-col :span ="10">   <a-slider v-model:value="speedRange" range size="small" 
        :min ="0" :max="60"/>  </a-col>
        <a-col :span ="4">  <a-input placeholder="Max" size="small"  v-model:value="speedRange[1]"> </a-input>  </a-col>
        <a-col :span ="2">  <a-checkbox v-model:checked="speedConsider"></a-checkbox> </a-col>
      </a-row>
      <a-row style = "margin-top:2px" align="middle"> 
        <a-col :span ="4">  <a-tag>Acceleration : </a-tag>  </a-col>
        <a-col :span ="4">  
          <a-input placeholder="Min" size="small" v-model:value="accelerationRange[0]"> </a-input>  
        </a-col>
        <a-col :span ="10">  
           <a-slider v-model:value="accelerationRange" range size="small"  :min ="-30" :max="30"/> 
         </a-col>
        <a-col :span ="4"> 
           <a-input placeholder="Max" size="small" v-model:value="accelerationRange[1]"> </a-input> 
         </a-col>
        <a-col :span ="2">  <a-checkbox v-model:checked="accelerationConsider"></a-checkbox> </a-col>
      </a-row>
      <a-row style = "margin-top:2px" align="middle"> 
        <a-col :span ="4">  <a-tag>YawDiff : </a-tag>  </a-col>
        <a-col :span ="4">  
          <a-input placeholder="Min" size="small"  v-model:value="yawDiffRange[0]"> </a-input> 
        </a-col>
        <a-col :span ="10">   
          <a-slider v-model:value="yawDiffRange" range size="small" :min="-10" :max="10"/>  
        </a-col>
        <a-col :span ="4">  
          <a-input placeholder="Max" size="small"  v-model:value="yawDiffRange[1]"> </a-input>  
        </a-col>
        <a-col :span ="2">  <a-checkbox v-model:checked="yawDiffConsider"
        ></a-checkbox> </a-col>
      </a-row>
    </a-collapse-panel>
    <a-collapse-panel key="vehicle" :header="'Vehicle (' + vehicleNodes.length +')'">
      <a-row v-for="(d, i) in vehicleNodes" :key = "i"  style= "margin-bottom: 2px">
        <a-col :span="16">
          <a-row justify = "start"> <a-tag>{{d.track_label_uuid}}</a-tag> </a-row>
        </a-col>
        <a-col :span="8"> 
          <a-row justify = "end"> <a-checkbox v-model:checked="d.consider"
            @change="changeConsideration(d, 'consider')"></a-checkbox></a-row>
        </a-col>
      </a-row>
    </a-collapse-panel>
    <a-collapse-panel key="people" :header="'People (' + peopleNodes.length +')'"  style= "margin-bottom: 2px">
      <a-row v-for="(d, i) in peopleNodes" :key = "i">
        <a-col :span="16">
          <a-row justify = "start"> <a-tag>{{d.track_label_uuid}}</a-tag> </a-row>
        </a-col>
        <a-col :span="8"> 
          <a-row justify = "end"> <a-checkbox v-model:checked="d.consider"
            @change="changeConsideration(d, 'consider')"></a-checkbox></a-row>
        </a-col>
      </a-row>


      <!-- nodes lane -->

    </a-collapse-panel>
    <a-collapse-panel key="lane" :header="'Lane (' + laneNodes.length +')'" >
      <a-row v-for="(d, i) in laneNodes" :key = "i"  style= "margin-bottom: 2px">
        <a-col :span="6">
          <a-row justify = "start"> <a-tag>{{d.track_label_uuid}}</a-tag> </a-row>
        </a-col>
        <a-col :span="5">
          <a-row justify = "start"> <a-tag>Turn: {{d.turn_direction}}</a-tag> </a-row>
        </a-col>
        <a-col :span="3"> 
          <a-row justify = "start"> <a-checkbox v-model:checked="d.turnConsider"
            @change="changeConsideration(d, 'turnConsider')"></a-checkbox>
          </a-row>
        </a-col>
        <a-col :span="6">
          <a-row justify = "start"> <a-tag>Intersection: {{d.is_intersection}}</a-tag> </a-row>
        </a-col>
        <a-col :span="2"> 
          <a-row justify = "start"> 
            <a-checkbox v-model:checked="d.intersectionConsider"   @change="changeConsideration(d, 'intersectionConsider')"></a-checkbox>
          </a-row>
        </a-col>
        <a-col :span="2"> 
          <a-row justify = "end"> <a-checkbox v-model:checked="d.consider" 
          @change="changeConsideration(d, 'consider')"></a-checkbox></a-row>
        </a-col>
      </a-row>
      
    </a-collapse-panel>
    
  </a-collapse>

    </a-collapse-panel>

    <!-- edge panel -->

    <a-collapse-panel key="edges" :header="'Edges (' + sgBrushGraph['edges'].length +')'">
     
      <a-row style= "margin-bottom: 5px">
        <a-col :span="10">
          <a-row justify = "start"> <a-tag :color="tagColor">Source</a-tag> </a-row>
        </a-col>
        <a-col :span="6">
          <a-row justify = "center"> <a-tag :color="tagColor">Target</a-tag> </a-row>
        </a-col>
        
        <a-col :span="6">
          <a-row justify = "center"> <a-tag :color="tagColor"> Relation</a-tag> </a-row>
        </a-col>
        
       
      </a-row>
      <a-row v-for="(d, i) in sgBrushGraph['edges']" :key = "i" style= "margin-bottom: 2px">
        <a-col :span="10">
          <a-row justify = "start"> <a-tag>{{d.source.track_label_uuid}}</a-tag> </a-row>
        </a-col>
        <a-col :span="6">
          <a-row justify = "center"> <a-tag>{{d.target.track_label_uuid}}</a-tag> </a-row>
        </a-col>
        
        <a-col :span="6">
          <a-row justify = "center"> <a-tag> {{d.relation}}</a-tag> </a-row>
        </a-col>
        
        <a-col :span="2"> 
          <a-row justify = "end"> <a-checkbox v-model:checked="d.consider"
            @change="changeConsideration(d, 'consider')"></a-checkbox></a-row>
        </a-col>
      </a-row>
    
    
    </a-collapse-panel>
  </a-collapse>
      <!-- 
        <el-collapse v-model="activeNames">
          <el-collapse-item title="Nodes" name="1">
            <el-collapse-item title="ego" name="ego">
              <el-collapse>
                <el-row align="middle">
                  <el-col :span="4"> Speed</el-col>
                  <el-col :span="18"
                    ><el-slider v-model="speedRange" range :max="10"
                  /></el-col>
                  <el-col :span="2">
                    <el-checkbox v-model="checked['speed']" label="" />
                  </el-col>
                </el-row>

                <el-row>
                  <el-col :span="6"> Acceleration</el-col>
                </el-row>
              </el-collapse>
            </el-collapse-item>

            <el-tree :data="vehicles" :props="defaultProps" show-checkbox />
          </el-collapse-item>
          <el-collapse-item title="Edges" name="2"> </el-collapse-item>
        </el-collapse>
       -->
      </el-scrollbar>
    </el-card>
  </div>
</template>

<script>
import {mapState} from "vuex"
import axios from "axios"
import * as d3 from "d3"
export default {
  name: "sgDetailView",
  props: {
    //这两个属性从父组件继承
    height: Number,
    width: Number,
    top: Number,
    left: Number,
  },
  data() {
    return {
      activeKey :['nodes','edges'],
      activeKeyEgo:["ego"],
      // vehicleNodes:["v1",'v2'],
      checked:false,
      tagColor: "#87d068",
      loading:false,
      speedRange:[15,30],
      accelerationRange:[-20, 20],
      yawDiffRange:[-5, 5],
      speedConsider:false,
      accelerationConsider:false,
      yawDiffConsider:false,

    }
  },
  computed: {
    ...mapState(["sgBrushGraph","currentEgoData", "currentLogId"]),
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
    yawDiff(){
      return !this.currentEgoData["yawDiff"]?null:this.currentEgoData["yawDiff"].toFixed(2)
    },
    vehicleNodes(){
      let res = []
      this.sgBrushGraph["nodes"].forEach((d)=>{
        if (d.track_label_uuid != "ego" & d.label_class == "VEHICLE"){
          res.push(d)
        }
      })
      return res
    },
    peopleNodes(){
      let res = []
      this.sgBrushGraph["nodes"].forEach((d)=>{
        if ( d.label_class == "PEOPLE"){
          res.push(d)
        }
      })
      return res
    },
    laneNodes(){
      let res = []
      this.sgBrushGraph["nodes"].forEach((d)=>{
        if ( d.label_class == "LANE"){
          res.push(d)
        }
      })
      return res
    },


  },
  methods: {
    search(){
      this.loading = true
      let cur = this
      this.sgBrushGraph["nodes"].forEach(d =>{
        if (d.track_label_uuid == "ego"){
          Object.assign(d, {'speedConsider': cur.speedConsider, 'accelerationConsider':cur.accelerationConsider,
        'yawDiffConsider': cur.yawDiffConsider,'speedRange': cur.speedRange,
      'accelerationRange': cur.accelerationRange, 'yawDiffRange': cur.yawDiffRange})
        }
      })
      // console.log(this.sgBrushGraph)
      let request = {'egoInfos':d3.filter(cur.sgBrushGraph["nodes"],
        d=>d.track_label_uuid == "ego")[0]
        ,'searchGraph':cur.sgBrushGraph, "logId": cur.currentLogId}
      
      axios
        .post(`http://localhost:9001/api/networkx`, request)
        .then((response) => {
          let data = response.data
          // console.log(data)
          console.log('request', request)
          console.log('result', data["searchResults"])
          let tmp = data["searchResults"].filter(d => Object.values(d)[0].length >0)
          let res = []
          tmp.forEach(d=>{
            let tmpDict = {}
            tmpDict["logId"] =  Object.keys(d)[0]
            tmpDict["frames"] =  Object.values(d)[0]
            res.push(tmpDict)
          })
          cur.$store.dispatch('readMatchLogDataset', res)
          cur.$store.commit('updateCurrentMatchData', res)
          
          
          
          // console.log('query', data["searchResults"][1])
          cur.loading = false
          // let data = response.data["paradata"]
        })
      // 计算请求数据
    },
    changeConsideration(d, str_){
      // console.log(str_)
      let checkflag = d[str_]
      d = Object.assign(d, {str_:!checkflag})
      // console.log(d)
      // 不考虑结点时删除对应边
      let cur = this
      // console.log(typeof(str_) )
      if(!Object.keys(d).includes("source") & str_ == "consider"){
        // console.log(d)
        cur.sgBrushGraph["edges"].forEach(dd=>{
          if(dd.source.track_label_uuid == d.track_label_uuid | dd.target.track_label_uuid == d.track_label_uuid ){
            // console.log(checkflag)
            dd = Object.assign(dd, {[str_]:checkflag})
            // console.log(dd)
          }
        })
      }
      
      // console.log(this.sgBrushGraph)
    },
    
  },
  mounted(){

  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.el-card {
  min-height: 88%;
  height: 88%;
}
.el-card >>> .el-card__body {
  height: 100%;
}
.el-button .custom-loading .circular .path {
  animation: loading-dash 1.5s ease-in-out infinite;
  stroke-dasharray: 90, 150;
  stroke-dashoffset: 0;
  stroke-width: 2;
  stroke: var(--el-button-text-color);
  stroke-linecap: round;
}
</style>