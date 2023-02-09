from flask import Flask
from flask_cors import CORS
from flask import request
import pandas as pd
import json

import multiprocessing as mp
import numpy as np
import pickle
import networkx as nx

import argparse

from time import ctime, sleep
from func_timeout import func_set_timeout
parser = argparse.ArgumentParser(description='图匹配')
#type是要传入的参数的数据类型  help是该参数的提示信息
parser.add_argument('--dataPath', type=str, default="./public/dataDi.pickle", help='数据路径')

args = parser.parse_args()
DATAPATH = args.dataPath

@func_set_timeout(5)
def subgraph_is_isomorphic(cmp, frame):
    if cmp.subgraph_is_isomorphic():
        # print(frame)
        return True
    return False
app = Flask(__name__)

cors = CORS(app, resources={"/api/*": {"origins": "*"}})

# 读取数据

with open(DATAPATH, 'rb') as f:
    networkData = pickle.load(f)
    allGraph = {}
    for logId in list(networkData.keys()):
        logData = networkData[logId]
        graphData = {}
        for frm in logData["frames"]:
            G = nx.DiGraph()
            G.add_nodes_from(logData[str(frm)]["nodes"])
            G.add_edges_from(logData[str(frm)]["edges"])
            graphData[str(frm)] = {'graph': G, 'egoInfos': logData[str(frm)]["ego"]}
        allGraph[logId] = graphData
logList = list(networkData.keys())
def judgeBetween(range_, c):
    return c >= range_[0] and c <= range_[1]
        
def nodeM(a,b):
    for k in b.keys():
        if  a[k] != b[k]:
            return False
    return True
def edgeM(a,b):
    return a["relation"] == b["relation"]


def searchBylogId(logId_, searchG_, allGraph_, egoFlag_, speedConsider_, accelerationConsider_,
            yawDiffConsider_, speedRange_, accelerationRange_, yawDiffRange_):
    currentLog = allGraph_[logId_]
    allfrms = list(currentLog.keys())
    matchFrames = []
    for frm in allfrms:
      
        frmGraph = currentLog[frm]['graph']
        
        if egoFlag_:
            frmEgo = currentLog[frm]['egoInfos'][1]
            if (speedConsider_ and not judgeBetween(speedRange_, frmEgo["speed"])) | \
                (accelerationConsider_ and not judgeBetween(accelerationRange_, frmEgo["acceleration"])) | \
                (yawDiffConsider_ and not judgeBetween(yawDiffRange_, frmEgo["yawDiff"])):
                
                continue
               

        cmp = nx.algorithms.isomorphism.DiGraphMatcher(frmGraph, searchG_, node_match = nodeM,
        edge_match = edgeM)
        
        if subgraph_is_isomorphic(cmp, frm):
            matchFrames.append(int(frm))
    return {logId_: matchFrames}

@app.route('/api/networkx', methods=['GET', 'POST'])
def getTsData():
    if request.method == 'POST':
        egoFlag = False
        configs_ = json.loads(request.data) # configs_ 是一个字典
        egoInfos = configs_["egoInfos"]

        searchGraph = configs_["searchGraph"]
        currentLogId = configs_["logId"]
        speedConsider = egoInfos["speedConsider"]
        accelerationConsider = egoInfos["accelerationConsider"]
        yawDiffConsider = egoInfos["yawDiffConsider"]
        
        speedRange = []
        accelerationRange = []
        yawDiffRange = []
        if speedConsider or accelerationConsider or yawDiffConsider:
            egoFlag = True
            speedRange = egoInfos["speedRange"]
            accelerationRange = egoInfos["accelerationRange"]
            yawDiffRange = egoInfos["yawDiffRange"]
        
        searchStep = 20
        # print(allGraph.keys())
        #  search Graph
        searchG = nx.DiGraph()
        
        nodesList = []
        for node in searchGraph["nodes"]:
            if node["track_label_uuid"] == "ego":
                nodesList.append((node["track_label_uuid"],{'label_class':"ego"}))
            if node["consider"] and node["label_class"]!="LANE" and node["track_label_uuid"]!="ego":
                nodesList.append((node["track_label_uuid"],{'label_class':node["label_class"]}))
            if node["consider"] and node["label_class"]=="LANE":
                laneDict = {'label_class':node["label_class"]}
                if node["turnConsider"]:
                    laneDict["turn_direction"] = node["turn_direction"]
                if node["intersectionConsider"]:
                    laneDict["is_intersection"] = node["is_intersection"]
                nodesList.append((node["track_label_uuid"], laneDict))
        

        searchG.add_nodes_from(nodesList)

        edgesList = []
        for edge in searchGraph["edges"]:
            if edge["consider"]:
                edgesList.append((edge["source"]["track_label_uuid"], 
                edge["target"]["track_label_uuid"], {"relation": edge["relation"]}))
        searchG.add_edges_from(edgesList)

        num_cores = int(mp.cpu_count())
        
        pool = mp.Pool(num_cores)
        
        results = [pool.apply_async(searchBylogId, args=(logId, searchG, allGraph, egoFlag, speedConsider, accelerationConsider,
            yawDiffConsider, speedRange, accelerationRange, yawDiffRange)) for logId in logList if logId != currentLogId]
        results = [p.get() for p in results]
           
               
                    
        return {'searchResults': results}

from werkzeug.serving import run_simple
if __name__ == '__main__':
    run_simple('0.0.0.0', 9001, app)

