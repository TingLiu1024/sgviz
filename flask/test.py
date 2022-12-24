from flask import Flask
from flask_cors import CORS
from flask import request
import pandas as pd
import json
import math
import datetime
import multiprocessing as mp
import numpy as np
import pickle
import networkx as nx



from time import ctime, sleep
from func_timeout import func_set_timeout
import time
import datetime
import func_timeout

@func_set_timeout(20)
def subgraph_is_isomorphic(cmp, frame):
    if cmp.subgraph_is_isomorphic():
        # print(frame)
        return True
    return False

# 读取数据

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
logList = list(networkData.keys())
print(len(logList))
for i in range(0, 47, 16):
    print(i)