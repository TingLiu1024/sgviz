import pandas as pd
import json

import multiprocessing as mp
import numpy as np
import pickle
import networkx as nx
def nodeM(a,b):
    for k in b.keys():
        if  a[k] != b[k]:
            return False
    return True
def edgeM(a,b):
    return a["relation"] == b["relation"]

import argparse
parser = argparse.ArgumentParser(description='get distance matrix')
#type是要传入的参数的数据类型  help是该参数的提示信息
parser.add_argument('--start', type=int, default=1000, help='起始Index')
parser.add_argument('--end', type=int, default=1500, help='终止Index')
args = parser.parse_args()
index_start = args.start
index_end = args.end
# 读取数据
allFrmIndexDict = {}
idx = 0
with open('../public/data.pickle', 'rb') as f:
    networkData = pickle.load(f)
    allGraph = {}
    for logId in list(networkData.keys()):
        logData = networkData[logId]
        graphData = {}
        for frm in logData["frames"]:
            G = nx.Graph()
            G.add_nodes_from(logData[str(frm)]["nodes"])
            G.add_edges_from(logData[str(frm)]["edges"])
            graphData[str(frm)] = {'graph': G, 'egoInfos': logData[str(frm)]["ego"]}
            allFrmIndexDict[idx] = {'logId':logId, 'frame':frm}
            idx += 1
        allGraph[logId] = graphData
logList = list(networkData.keys())

def get_simpleGraph(graph_):
    VEHNUM = 0
    PEONUM = 0
    coms = []
    for c in nx.connected_components(graph_):
        if len(c)==1:
            nodeG = graph_.subgraph(c).copy()
            if nodeG.nodes[list(c)[0]]["label_class"]=="VEHICLE":
                VEHNUM += 1
            elif nodeG.nodes[list(c)[0]]["label_class"]=="PEOPLE":
                PEONUM += 1
            else: # ego游离
                coms.append(graph_.subgraph(c).copy())
        else:
            coms.append(graph_.subgraph(c).copy())
    edgesGraph = nx.Graph()
    for g_ in coms:
        edgesGraph = nx.union(edgesGraph, g_)
    return VEHNUM, PEONUM, edgesGraph

for logId in allGraph.keys():
    for frm in allGraph[logId].keys():
        gra = allGraph[logId][frm]['graph']
        freeVEH , freePEO, edgesGraph = get_simpleGraph(gra)
        allGraph[logId][frm]["nodes_num"] = len(allGraph[logId][frm]['graph'].nodes)
        allGraph[logId][frm]['freeVeh'] = freeVEH
        allGraph[logId][frm]['freePeo'] = freePEO
        allGraph[logId][frm]['edgesGraph'] = edgesGraph

same_frame_df = pd.read_csv("../public/procressData/same_frame_relationship.csv")
uniqueFrame = same_frame_df.drop_duplicates(subset=["same_frame", "logId"], keep='first')
uniqueFrame.reset_index(drop=True, inplace= True)
print(len(uniqueFrame))
unique_frame_dict = uniqueFrame[["same_frame", "logId"]].to_dict(orient="index")

def get_distances(source_index, allGraph, unique_frame_dict):
    distance_dict = {}
    frame_dictA = unique_frame_dict[source_index]
    graph_dictA = allGraph[frame_dictA["logId"]][str(frame_dictA["same_frame"])]
    for target_index in range(len(unique_frame_dict)):
        frame_dictB = unique_frame_dict[target_index]
        graph_dictB = allGraph[frame_dictB["logId"]][str(frame_dictB["same_frame"])]
        try:   
            distance = nx.graph_edit_distance(graph_dictA["edgesGraph"], graph_dictB["edgesGraph"], node_match = nodeM, edge_match = edgeM, roots = ("ego", "ego"),  timeout = 2) + \
        abs(graph_dictA['freeVeh'] - graph_dictB['freeVeh']) + abs(graph_dictA['freePeo'] - graph_dictB['freePeo'])
        except:
            distance = None
        distance_dict[target_index] = distance
    res = {source_index: distance_dict}
    jsonWriter = open("../public/procressData/distance/"+str(source_index)+".json", 'w')

    jsonWriter.write(json.dumps(res))
    jsonWriter.close()
    return {source_index: distance_dict}
if __name__ == '__main__':
    indexes = json.load(open("unCalIndex.json"))
    # print(indexes[0:10])
    num_cores = int(mp.cpu_count())
    print(num_cores)      
    pool = mp.Pool(num_cores )
    results = [pool.apply_async(get_distances, args=(source_index_, allGraph, unique_frame_dict)) for source_index_ in indexes]
    results = [p.get() for p in results]

    # jsonWriter = open("../public/procressData/distance/"+str(index_start)+"_" + str(index_end)+".json", 'w')

    # jsonWriter.write(json.dumps(results))
    # jsonWriter.close()