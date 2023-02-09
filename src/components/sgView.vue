<template>
  <div id="sgView" :style="divCss">
    <el-divider>Scene Graph View</el-divider>
    <svg :width="svgWidth" :height="svgWidth" id="sgsvg">
      <path
        :d="lineGenerator(lassoPol)"
        fill="none"
        stroke="grey"
        stroke-dasharray="5,5"
      ></path>
      <g id="dynamicGroup"></g>
      <!-- legend -->
      <g
        id="lineLegendSg"
        :transform="`translate(${svgWidth - marginLeft},${marginTop})`"
      >
        <g id="lineLegendTextSg"></g>

        <g
          :transform="`translate(${legendW / 2},${
            0 + 1 * (legendH + legendInterVal) + legendH / 2
          })`"
        >
          <path :d="drawStar(egoSize)" :fill="egoColor" fill-opacity="0.9" />
        </g>
        <circle
          :cx="legendW / 2"
          :cy="0 + 2 * (legendH + legendInterVal) + legendH / 2"
          r="5"
          :fill="peoColor"
        />
        <g
          :transform="`translate(${legendW / 2},${
            0 + 3 * (legendH + legendInterVal) + legendH / 2
          })`"
        >
          <path :d="drawCross(vehSize)" :fill="vehColor" />
        </g>

        <rect
          :width="legendW"
          :height="legendH"
          x="0"
          :y="0 + 4 * (legendH + legendInterVal)"
          :fill="laneColor"
          fill-opacity="0.7"
        ></rect>
      </g>
    </svg>
    <div id="sgTip" :style="tooltip_css" v-html="tooltipContent"></div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import * as d3 from "d3";
// import * as d3Lasso from "d3-lasso"
import $ from "jquery";
export default {
  name: "sgView",
  props: {
    //这两个属性从父组件继承
    height: Number,
    width: Number,
    top: Number,
    left: Number,
  },
  data() {
    return {
      fdgMargin: 20, // 用来调整比例尺保证结点都在图中
      lastFdgLayout: [], //
      // tooltip :$("#bevTip"),
      legendW: 15,
      legendH: 10,
      legendInterVal: 10,
      marginLeft: 85,
      marginTop: 350,
      egoSize: 9,
      vehSize: 100,
      relStrokeColorDict: {
        in: "#a6761d",
        frontOrBehind: "#a65628",
        leftOrRight: "#b3b3b3",
      },
      tooltipContent: "",
      lassoPol: [],
      lassoStart: "",
      lassoFlag: false,
      lineGenerator: d3.line(),
      tooltip_css:
        "position: absolute;padding: 7px;font-size: 0.9em;pointer-events: none;background: #fff;border: 1px solid #ccc;" +
        "border-radius: 4px;-moz-box-shadow: 3px 3px 10px 0px rgba(0, 0, 0, 0.25);display:none" +
        "-webkit-box-shadow: 3px 3px 10px 0px rgba(0, 0, 0, 0.25);box-shadow: 3px 3px 10px 0px rgba(0, 0, 0, 0.25);display:none;z-index: 100;",
    };
  },

  computed: {
    ...mapState(["currentSgData"]),
    ...mapState([
      "laneColor",
      "vehColor",
      "peoColor",
      "egoColor",
      "mapCenter",
      "mapRange",
      "currentTime",
    ]),
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
    svgWidth() {
      return Math.min(this.height, this.width) - 10;
    },
    scaleX() {
      return d3
        .scaleLinear()
        .domain([
          this.mapCenter[0] - this.mapRange - this.fdgMargin,
          this.mapCenter[0] + this.mapRange + this.fdgMargin,
        ])
        .range([0, this.svgWidth]);
    },
    scaleY() {
      return d3
        .scaleLinear()
        .domain([
          this.mapCenter[1] - this.mapRange - this.fdgMargin,
          this.mapCenter[1] + this.mapRange + this.fdgMargin,
        ])
        .range([this.svgWidth, 0]);
    },
  },
  mounted() {
    this.plotOneStampFdg(0, this.currentSgData);

    const legendG = d3.select("#lineLegendTextSg");
    let cur = this;
    legendG.selectChildren().remove();
    legendG
      .selectAll(".lineText")
      .data(["EGO", "PEOPLE", "VEHICLE", "LANE"])
      .enter()
      .append("text")
      .attr("x", 30)
      .attr("y", (d, i) => {
        return 10 + (i + 1) * (cur.legendInterVal + cur.legendH);
      })
      .text((d) => d)
      .attr("text-anchor", "left")
      .style("opacity", 0.95)
      .style("font-size", "12px");
  },
  methods: {
    inside(point, vs) {
      // ray-casting algorithm based on
      // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html

      var x = point[0],
        y = point[1];

      var inside = false;
      for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0],
          yi = vs[i][1];
        var xj = vs[j][0],
          yj = vs[j][1];

        var intersect =
          yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
      }

      return inside;
    },
    plotOneStampFdg(tsp, data) {
      window.sgData = data;
      if (!data) {
        return [];
      }
      // function lassoStart(){
      //   console.log('lasso start')
      // }
      let cur = this;
      let dynamicGroup = d3.select("#dynamicGroup");

      //   let lasso = d3Lasso.lasso()
      //   .closePathSelect(true)
      //       .closePathDistance(100)
      //       .on("start", lassoStart)
      // dynamicGroup.call(lasso);

      let lastFdgLayout = this.lastFdgLayout;
      let scaleFdgX = this.scaleX,
        scaleFdgY = this.scaleY,
        laneColor = this.laneColor,
        vehColor = this.vehColor,
        peoColor = this.peoColor,
        egoColor = this.egoColor;
      let maxCityX = this.mapCenter[0] + this.mapRange,
        minCityX = this.mapCenter[0] - this.mapRange,
        maxCityY = this.mapCenter[1] + this.mapRange,
        minCityY = this.mapCenter[1] - this.mapRange;

      const graph = data[tsp.toString()];

      // console.log(graph)
      let lastObjs = [];

      if (lastFdgLayout) {
        lastObjs = d3.map(lastFdgLayout, (d) => d.track_label_uuid);
        // console.log(lastObjs)
      }

      graph.nodes.forEach((d) => {
        // 车道固定位置， 已有位置按原位置分配， 没有的若能匹配到车道，则初始位置为对应车道，否则，按本身的地理位置分配

        if (d.label_class == "LANE") {
          let pol = d3.filter(
            d.polygon.slice(0, -1),
            (k) =>
              (k[0] > minCityX) &
              (k[0] < maxCityX) &
              (k[1] > minCityY) &
              (k[1] < maxCityY)
          );
          const meanX = d3.mean(d3.map(pol, (a) => a[0]));
          const meanY = d3.mean(d3.map(pol, (a) => a[1]));

          d.fx = scaleFdgX(meanX);
          d.fy = scaleFdgY(meanY);
        } else if (lastObjs.includes(d.track_label_uuid)) {
          d.x = d3.filter(
            lastFdgLayout,
            (g) => g.track_label_uuid == d.track_label_uuid
          )[0].x;
          d.y = d3.filter(
            lastFdgLayout,
            (g) => g.track_label_uuid == d.track_label_uuid
          )[0].y;
        } else if (d.track_label_uuid != "ego") {
          // 对新的object 分配一个位置使得收敛较快
          let matchLink = d3.filter(
            graph.links,
            (l) => l.source == d.track_label_uuid
          );
          // console.log(matchLink)

          if (matchLink.length) {
            const target = matchLink[0].target;
            let meanX = "",
              meanY = "";
            if (typeof target == "object") {
              meanX = d3.mean(d3.map(target.polygon, (a) => a[0]));
              meanY = d3.mean(d3.map(target.polygon, (a) => a[1]));
            } else {
              meanX = d3.mean(
                d3.map(
                  d3.filter(graph.nodes, (b) => b.track_label_uuid == target)[0]
                    .polygon,
                  (a) => a[0]
                )
              );
              meanY = d3.mean(
                d3.map(
                  d3.filter(graph.nodes, (b) => b.track_label_uuid == target)[0]
                    .polygon,
                  (a) => a[1]
                )
              );
            }
            // // console.log(meanX, meanY)
            d.x = scaleFdgX(meanX);
            d.y = scaleFdgY(meanY);
          } else {
            d.x = scaleFdgX(d.cityX);
            d.y = scaleFdgY(d.cityY);
            // d.x = width / 2
            // d.y = height / 2
          }
        }
      });

      // tsp --frame
      dynamicGroup.selectChildren().remove();
      let simulation = d3
        .forceSimulation(graph.nodes)
        // 连接力
        .force(
          "link",
          d3
            .forceLink(graph.links)
            .id((d) => d.track_label_uuid) // 每个节点的id的获取方式
            .strength(1)
        ) //
        // 万有引力
        .force("charge", d3.forceManyBody().strength(-3).distanceMax(30));

      // 定义人物节点之间连线的信息
      let link = dynamicGroup
        //#999
        .selectAll(".linkeLine") // 用line元素来绘制
        .data(graph.links) // 绑定json文件中的links数据
        .enter()
        .append("line")
        // .join("line")

        .attr("stroke-opacity", 1)
        .attr("stroke-width", 3) // 连线粗细通过线的value计算
        .attr(
          "stroke",
          "#a65628"
          // d => cur.relStrokeColorDict[d["relation"]]
        )
        .on("mouseover", function (event, d) {
          let tooltip = $("#sgTip");
          // console.log('tooltip', d)
          cur.tooltipContent =
            "<p> source: " +
            d.source.track_label_uuid +
            "<br>" +
            "target: " +
            d.target.track_label_uuid +
            "<br>" +
            "relation: " +
            d.relation +
            "</p>";
          tooltip.css("display", "block");
          tooltip.css("left", event.offsetX + 40);
          tooltip.css("top", event.offsetY - 10);
        })
        .on("mouseout", function () {
          let tooltip = $("#sgTip");
          tooltip.css("display", "none");
        });

      let node = dynamicGroup
        .selectAll(".circle")
        .data(graph.nodes)
        .enter()
        .append("g")
        // d3.symbolDiamond2 d3.symbolCircle d3.symbolPlus d3.symbolStar d3.symbolTriangle d3.symbolTriangle2
        //  d3.symbolWye   d3.symbolX  d3.symbolAsterisk
        .attr("transform", function (d) {
          return "translate(" + d.x + "," + d.y + ")";
        });
      node
        .append("path")
        .attr(
          "d",
          d3
            .symbol()
            .size(function (d) {
              if (d.label_class == "LANE") {
                return 300;
              } else if (d.label_class == "PEOPLE") {
                return 100;
              } else {
                return 150;
              }
            })
            .type(
              // d3.symbolCross
              function (d) {
                // console.log(d)
                if (d.track_label_uuid == "ego") {
                  return d3.symbolStar;
                } else if (d.label_class == "LANE") {
                  return d3.symbolSquare;
                } else if (d.label_class == "VEHICLE") {
                  return d3.symbolCross;
                } else {
                  return d3.symbolCircle;
                }
              }
            )
        )

        .attr("fill", function (d) {
          if (d.track_label_uuid == "ego") {
            return egoColor;
          } else if (d.label_class == "LANE") {
            return laneColor;
          } else if (d.label_class == "VEHICLE") {
            return vehColor;
            // "#8ac6d1"
          } else {
            return peoColor;
          }
        }) // 设置节点的填充色，通过节点的group属性来计算节点的填充颜色
        .attr("opacity", function (d) {
          if (d.label_class == "LANE") {
            return 0.7;
          } else {
            return 1;
          }
        })
        .call(
          // 以定义的这些节点为参数，调用drag()函数
          // 绑定拖拽函数的三个钩子，即拖拽开始、拖拽中、拖拽结束
          d3
            .drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)
        )
        .on("mouseover", function (event, d) {
          let tooltip = $("#sgTip");
          // console.log('tooltip', d)
          cur.tooltipContent =
            "<p> id: " +
            d.track_label_uuid +
            "<br>" +
            "class: " +
            d.label_class +
            "</p>";
          tooltip.css("display", "block");
          tooltip.css("left", event.offsetX + 40);
          tooltip.css("top", event.offsetY - 10);
          if (d.label_class == "LANE") {
            cur.$store.commit("updateSgCurrentOverLane", d.track_label_uuid);
          } else if (d.label_class == "VEHICLE") {
            cur.$store.commit("updateSgCurrentOverCar", d.track_label_uuid);
          } else if (d.label_class == "PEOPLE") {
            cur.$store.commit("updateSgCurrentOverPeo", d.track_label_uuid);
          }
        })
        .on("mouseout", function () {
          let tooltip = $("#sgTip");
          tooltip.css("display", "none");
          cur.$store.commit("updateSgCurrentOverLane", "100");
          cur.$store.commit("updateSgCurrentOverCar", "100");
          cur.$store.commit("updateSgCurrentOverPeo", "100");
        });

      // node.append("title").text(d => d.id);
      // 定义simulation内部计时器tick每次结束时的动作
      simulation.on("tick", () => {
        // 每次tick计时到时，连接线的响应动作
        link
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y);

        // 每次tick计时到时，节点的响应动作
        node
          // .attr("cx", d => d.x)
          // .attr("cy", d => d.y);
          .attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
          });
      });
      // 定义开始拖拽节点时的动作，注意v6版本是通过event返回的函数参数来处理的
      function dragstarted(event) {
        // 当开始拖动时，restart()方法重新启动模拟器的内部计时器并返回模拟器，
        // alphaTarget(0.3) => alpha将保持在0.3左右，使模拟不断移动
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      // 定义拖拽中的动作
      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      // 定义拖拽结束的动作
      // 在拖动结束时，alphaTarget被设置回0，因此再次稳定下来，这就是阻力相互作用后力返回的原因
      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      d3.select("#sgsvg")
        .on("mousedown", (event) => {
          cur.lassoFlag = true;
          cur.lassoPol = [];
          // console.log(event)
          cur.lassoStart = [event.offsetX, event.offsetY];
          cur.lassoPol.push([event.offsetX, event.offsetY]);
        })
        .on("mousemove", (event) => {
          if (cur.lassoFlag) {
            cur.lassoPol.push([event.offsetX, event.offsetY]);
          }
        })
        .on("mouseup", () => {
          cur.lassoFlag = false;
          cur.lassoPol.push(cur.lassoStart);
          let lassoEle = { nodes: [], edges: [] };
          // console.log(node.selectChildren())
          node.selectChildren().each((d) => {
            // console.log(d)
            if (cur.inside([d.x, d.y], cur.lassoPol)) {
              lassoEle["nodes"].push(d);
              // console.log(d)
            }
          });
          dynamicGroup.selectAll("line").each((d) => {
            // console.log(d)
            if (
              cur.inside([d.source.x, d.source.y], cur.lassoPol) &
              cur.inside([d.target.x, d.target.y], cur.lassoPol)
            ) {
              lassoEle["edges"].push(d);
              // console.log(d)
            }
          });
          // console.log(lassoEle)
          cur.$store.commit("updateSgBrushData", lassoEle);
        });
      return graph.nodes;
    },
    drawStar(r) {
      // 五角星的10个点
      // https://blog.csdn.net/M0_38082783/article/details/127682226

      const pi_val = Math.PI / 180;
      const min_r = (r * Math.sin(18 * pi_val)) / Math.cos(36 * pi_val);

      const A = [0, r],
        B = [r * Math.cos(18 * pi_val), r * Math.sin(18 * pi_val)],
        C = [r * Math.cos(54 * pi_val), -r * Math.sin(54 * pi_val)],
        D = [-r * Math.cos(54 * pi_val), -r * Math.sin(54 * pi_val)],
        E = [-r * Math.cos(18 * pi_val), r * Math.sin(18 * pi_val)],
        F = [min_r * Math.cos(54 * pi_val), min_r * Math.sin(54 * pi_val)],
        G = [min_r * Math.cos(18 * pi_val), -min_r * Math.sin(18 * pi_val)],
        H = [0, -min_r],
        K = [-min_r * Math.cos(18 * pi_val), -min_r * Math.sin(18 * pi_val)],
        I = [-min_r * Math.cos(54 * pi_val), min_r * Math.sin(54 * pi_val)];
      return this.lineGenerator([A, F, B, G, C, H, D, K, E, I, A]);
    },
    drawCross(size) {
      const r = Math.sqrt(size / 5) / 2;
      const A = [-3 * r, -r],
        B = [-r, -r],
        C = [-r, -3 * r],
        C1 = [r, -3 * r],
        D = [r, -r],
        E = [3 * r, -r],
        F = [3 * r, r],
        G = [r, r],
        H = [r, 3 * r],
        I = [-r, 3 * r],
        J = [-r, r],
        K = [-3 * r, r];
      return this.lineGenerator([A, B, C, C1, D, E, F, G, H, I, J, K, A]);
    },
  },
  watch: {
    currentTime: function () {
      this.lastFdgLayout = this.plotOneStampFdg(
        this.currentTime,
        this.currentSgData
      );
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>