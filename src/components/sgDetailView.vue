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
      <el-scrollbar :height = "height">
      <a-collapse v-model:activeKey="activeKey">
    <a-collapse-panel key="nodes" :header="'Nodes (' + (1 + vehicleIds.length + 
    peopleIds.length + laneNodes.length) +')'">
      <a-collapse v-model:activeKey="activeKeyEgo">
        <!-- 可以加入当前速度信息 -->
    <a-collapse-panel key="ego" header="Ego">
      <a-row> 
        <a-tag>Speed : </a-tag>  
      <a-tag>Acceleration : </a-tag> 
      <a-tag>YawDiff : </a-tag>
      
      </a-row>
      <a-row style = "margin-top:2px" align="middle"> 
        <a-col :span ="4">  <a-tag>Speed : </a-tag>  </a-col>
        <a-col :span ="4">  <a-input placeholder="Min" size="small"> </a-input>  </a-col>
        <a-col :span ="10">   <a-slider v-model:value="speedRange" range size="small" />  </a-col>
        <a-col :span ="4">  <a-input placeholder="Max" size="small"> </a-input>  </a-col>
        <a-col :span ="2">  <a-checkbox v-model:checked="checked"></a-checkbox> </a-col>
      </a-row>
      <a-row style = "margin-top:2px" align="middle"> 
        <a-col :span ="4">  <a-tag>Acceleration : </a-tag>  </a-col>
        <a-col :span ="4">  <a-input placeholder="Min" size="small"> </a-input>  </a-col>
        <a-col :span ="10">   <a-slider v-model:value="speedRange" range size="small" />  </a-col>
        <a-col :span ="4">  <a-input placeholder="Max" size="small"> </a-input>  </a-col>
        <a-col :span ="2">  <a-checkbox v-model:checked="checked"></a-checkbox> </a-col>
      </a-row>
      <a-row style = "margin-top:2px" align="middle"> 
        <a-col :span ="4">  <a-tag>YawDiff : </a-tag>  </a-col>
        <a-col :span ="4">  <a-input placeholder="Min" size="small"> </a-input>  </a-col>
        <a-col :span ="10">   <a-slider v-model:value="speedRange" range size="small" />  </a-col>
        <a-col :span ="4">  <a-input placeholder="Max" size="small"> </a-input>  </a-col>
        <a-col :span ="2">  <a-checkbox v-model:checked="checked"></a-checkbox> </a-col>
      </a-row>
    </a-collapse-panel>
    <a-collapse-panel key="vehicle" :header="'Vehicle (' + vehicleIds.length +')'">
      <a-row v-for="(d, i) in vehicleIds" :key = "i"  style= "margin-bottom: 2px">
        <a-col :span="16">
          <a-row justify = "start"> <a-tag>{{d}}</a-tag> </a-row>
        </a-col>
        <a-col :span="8"> 
          <a-row justify = "end"> <a-checkbox v-model:checked="checked"></a-checkbox></a-row>
        </a-col>
      </a-row>
    </a-collapse-panel>
    <a-collapse-panel key="people" :header="'People (' + peopleIds.length +')'"  style= "margin-bottom: 2px">
      <a-row v-for="(d, i) in peopleIds" :key = "i">
        <a-col :span="16">
          <a-row justify = "start"> <a-tag>{{d}}</a-tag> </a-row>
        </a-col>
        <a-col :span="8"> 
          <a-row justify = "end"> <a-checkbox v-model:checked="checked"></a-checkbox></a-row>
        </a-col>
      </a-row>
      
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
          <a-row justify = "start"> <a-checkbox v-model:checked="checked"></a-checkbox></a-row>
        </a-col>
        <a-col :span="6">
          <a-row justify = "start"> <a-tag>Intersection: {{d.is_intersection}}</a-tag> </a-row>
        </a-col>
        <a-col :span="2"> 
          <a-row justify = "start"> <a-checkbox v-model:checked="checked"></a-checkbox></a-row>
        </a-col>
        <a-col :span="2"> 
          <a-row justify = "end"> <a-checkbox v-model:checked="checked"></a-checkbox></a-row>
        </a-col>
      </a-row>
      
    </a-collapse-panel>
    
  </a-collapse>

    </a-collapse-panel>
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
          <a-row justify = "end"> <a-checkbox v-model:checked="checked"></a-checkbox></a-row>
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
      // vehicleIds:["v1",'v2'],
      checked:true,
      tagColor: "#87d068",
      loading:false,
      speedRange:[10,30],
      // activeNames: ["1", "2"],
      // speedRange: "",
//       checked: { speed: true },
//       checkedSpeed: true,
//       defaultProps : {
//   children: 'children',
//   label: 'label',
//   disabled: 'disabled',
// },
      // vehicles: [{
      //   id: 1,
      //   label: "Vehicle",
      //   children: [
    //       {
    //         id: 3,
    //         label: "Level two 2-1",
    //         children: [
    //           {
    //             id: 5,
    //             label: "Level three 3-1-2",
    //             disabled: true,
    //           },
    //         ],
    //       },
    //       {
    //         id: 4,
    //         label: "People",
    //         children:[]
    //       },
    //     ],
    //   },
    //   {
    //         id: 5,
    //         label: "People",
    //         children:[]
    //       }
    // ]
    }
  },
  computed: {
    ...mapState(["sgBrushGraph"]),
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
    vehicleIds(){
      let res = []
      this.sgBrushGraph["nodes"].forEach((d)=>{
        if (d.track_label_uuid != "ego" & d.label_class == "VEHICLE"){
          res.push(d.track_label_uuid)
        }
      })
      return res
    },
    peopleIds(){
      let res = []
      this.sgBrushGraph["nodes"].forEach((d)=>{
        if ( d.label_class == "PEOPLE"){
          res.push(d.track_label_uuid)
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
    }
    
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