# sgviz
![tease](https://github.com/TingLiu1024/sgviz/blob/main/src/assets/tease.png)

## Project Introduction
本项目为**自动驾驶场景图的时空可视分析**，从开源自动驾驶数据集中抽取自定义的场景图数据集，并结合可视分析技术和图算法，构建了一个可视分析系统（如上图），用于交互式地探索挖掘自动驾驶场景。原始数据集为[argoverse 1 3D Tracking数据集](https://www.argoverse.org/av1.html#tracking-link), 经过处理后的数据集存在[百度网盘](https://pan.baidu.com/s/1Qzw74BwFClX73PKSowm_dw 
)中,提取码：4lpt。

## Project Setup
本项目前端使用Vue3 + Vuex + antd + element-plus + d3， 后端使用python的flask和networkx(2.8.8)， python环境自行安装。
### 配置前端环境
git clone 仓库后， 进入**sgviz**文件夹， 启动命令行，运行
```
npm install
```

### 把数据放在对应路径

+ images放在 src/assets文件夹下
  ![dataPath](https://github.com/TingLiu1024/sgviz/blob/main/src/assets/dataPath1.png)
+ 其他数据放在public文件夹下
 ![dataPath](https://github.com/TingLiu1024/sgviz/blob/main/src/assets/dataPath2.png)


### 启动系统
start.sh中包含两部分，运行.py文件和启动前端服务
```
bash start.sh
```
### 在浏览器中打开页面


