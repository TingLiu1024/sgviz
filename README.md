# sgviz
![tease](https://github.com/TingLiu1024/sgviz/src/assets/tease.png)

## Project Introduction
本项目为**自动驾驶场景图的时空可视分析**，从开源自动驾驶数据集中抽取自定义的场景图数据集，并结合可视分析技术和图算法，构建了一个可视分析系统（如上图），用于交互式地探索挖掘自动驾驶场景。原始数据集为[argoverse 1 3D Tracking数据集](https://www.argoverse.org/av1.html#tracking-link), 经过处理后的数据集存在[网盘]()中。

## Project Setup
本项目前端使用Vue3 + Vuex + antd + element-plus + d3， 后端使用python的flask和networkx(2.8.8)， python环境自行安装。
### 配置前端环境
```
npm install
```

### 把数据放在对应路径

1. images放在 assets文件夹下
3. 其他数据放在public文件夹下



### Compiles and minifies for production

```
npm run build
```

### Lints and fixes files

```
npm run lint
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).

子图匹配目前用的2.8.8  

GED用的2.8.8 timeout 为2s

算不出来的10s
