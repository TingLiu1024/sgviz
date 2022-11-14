<template>
  <div id="control" :style = "divCss">
    <el-divider > Console </el-divider>
    <el-row> 
      
      <el-select v-model="selectLogId" class="m-2" placeholder="Select" @change="updateLogId">
    <el-option
      v-for="(item,i) in logList"
      :key="i"
      :label="item"
      :value="item"
    />
  </el-select>
    </el-row>
    
    
  </div>
</template>

<script>
import {  mapGetters } from 'vuex'
export default {
  name: 'controlPanel',
  props: {
    //这两个属性从父组件继承
    height:Number,
    width:Number,
    top:Number,
    left:Number,
  },
  data(){
    this.$store.commit('updateLogId', "0ef28d5c-ae34-370b-99e7-6709e1c4b929")

    return {

      selectLogId:"0ef28d5c-ae34-370b-99e7-6709e1c4b929"

    }
  },
  computed:{
    ...mapGetters(["logList"]),
    divCss(){
        return "position: absolute; border: 0px solid black;" +  
              "height:" + this.height + "px;" +
              "width:" + this.width + "px;" +
              "left:" + this.left + "px;" +
              "top:" + this.top + "px;" 
    }
  },
  methods:{
    updateLogId(){
      // this.logId = this.selectLogId
      this.$store.commit('updateLogId', this.selectLogId)

    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>