from flask import Flask
from flask_cors import CORS
from flask import request
import pandas as pd
import json

import numpy as np
import pickle
import networkx as nx


import errno
import os
import signal
import functools
import threading
from time import ctime, sleep

class TimeoutError(Exception):
    pass

def subgraph_is_isomorphic(cmp, frame):
    
    if cmp.subgraph_is_isomorphic():
        print(frame)
        return True
        
    return False
app = Flask(__name__)

cors = CORS(app, resources={"/api/*": {"origins": "*"}})


with open('../public/dataDi.pickle', 'rb') as f:
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

def judgeBetween(range_, c):
    return c >= range_[0] and c <= range_[1]
        
def nodeM(a,b):
    for k in b.keys():
        if  a[k] != b[k]:
            return False
    return True
def edgeM(a,b):
    return a["relation"] == b["relation"]





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
        data = {}
        res = []
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
        for logId in allGraph.keys():
            threads = []
            if currentLogId == logId:
                continue
            print(logId)
            
            graph = allGraph[logId]
            
            allfrms = list(graph.keys())
            i = 0
            
            while i < len(allfrms):
                resDict = {}
            
                frm = allfrms[i]
                frmGraph = graph[frm]['graph']
                if egoFlag:
                    frmEgo = graph[frm]['egoInfos'][1]
                    if (speedConsider and not judgeBetween(speedRange, frmEgo["speed"])) | \
                        (accelerationConsider and not judgeBetween(accelerationRange, frmEgo["acceleration"])) | \
                        (yawDiffConsider and not judgeBetween(yawDiffRange, frmEgo["yawDiff"])):
                        i += 1
                        continue
                    resDict["speed"] = frmEgo["speed"]
                    resDict["acceleration"] = frmEgo["acceleration"]
                    resDict["yawDiff"] = frmEgo["yawDiff"]
                    

                flag = False
                cmp = nx.algorithms.isomorphism.DiGraphMatcher(frmGraph, searchG, node_match = nodeM,
                edge_match = edgeM)
                
                t1 = threading.Thread(target=subgraph_is_isomorphic, args=(cmp, frm))
                threads.append(t1)
                i += 1
            for t in threads:
                t.setDaemon(True)
                t.start()
            t.join(3)
    


                # cmp = nx.algorithms.isomorphism.GraphMatcher(frmGraph, searchG, node_match = nodeM,
                # edge_match = edgeM)
                # try:
                #     flag = subgraph_is_isomorphic(cmp, frm)
                # except TimeoutError:
                #     pass
                # if flag:
               
                    
                    
                    
        
        return {'searchResults': res}
    
from werkzeug.serving import run_simple
run_simple('0.0.0.0', 9001, app)

