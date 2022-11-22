<template>
  <div id="control" :style = "divCss">
    <el-divider > Image View </el-divider>
    <el-row> 
      <el-col :span = "10" >
        <el-row align = "middle" justify = "center">
           <label style="font-size:16px"> Choose the logId of video</label>
           
        </el-row>
        
        
      </el-col>
      <el-col :span = "14">
        <el-select style="width:100%" v-model="selectLogId" class="m-2" placeholder="Select" @change="updateLogId">
        <el-option
      v-for="(item,i) in logList"
      :key="i"
      :label="item"
      :value="item"
    />
  </el-select>
      </el-col>
      
   
    </el-row>
    <img :src = "imgPath" :width="width">
    <!-- <img src = "../assets/images/ring_front_center/0ef28d5c-ae34-370b-99e7-6709e1c4b929/ring_front_center_315969338033780896.jpg"> -->
    <!-- <img src = "../assets/logo.png"> -->

    
    
  </div>
</template>

<script>
import {  mapGetters, mapState } from 'vuex'
import logToImgList from "../assets/images/ring_front_center/logToImgList.json"

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
    let logId = "0ef28d5c-ae34-370b-99e7-6709e1c4b929"
    this.$store.commit('updateLogId', logId)
    this.$store.dispatch('getDataset', logId)
    const imageType = "ring_front_center"
    
    let files = logToImgList[logId]
    files.sort()
      

    return {
      selectLogId:logId,
      imageType: imageType,
      imgList:files,
      logToImgList:logToImgList

    }
  },
  computed:{
    ...mapGetters(["logList"]),
    ...mapState(["currentTime"]),
    divCss(){
        return "position: absolute; border: 0px solid black;" +  
              "height:" + this.height + "px;" +
              "width:" + this.width + "px;" +
              "left:" + this.left + "px;" +
              "top:" + this.top + "px;" 
    },
    imgPath(){
      // https://blog.csdn.net/qq_37235616/article/details/109307700
      return require('../assets/images/' + this.imageType + '/' + this.selectLogId + '/' + this.imgList[parseInt(this.currentTime)])
    }
      
  },
  methods:{
    updateLogId(){
      // this.logId = this.selectLogId
      this.$store.commit('updateLogId', this.selectLogId)
      this.$store.dispatch('getDataset',this.selectLogId)
      let files = this.logToImgList[this.selectLogId]
      files.sort()
      this.imgList = files

    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>