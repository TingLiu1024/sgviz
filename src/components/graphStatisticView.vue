<template>
  <div id="graphStatisticView" :style = "divCss">
    
  </div>
</template>

<script>
export default {
  name: 'graphStatisticView',
  props: {
    //这两个属性从父组件继承
    height:Number,
    width:Number,
    top:Number,
    left:Number,
  },
  computed:{
    divCss(){
        return "position: absolute; border: 0px solid black;" +  
              "height:" + this.height + "px;" +
              "width:" + this.width + "px;" +
              "left:" + this.left + "px;" +
              "top:" + this.top + "px;" 
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>