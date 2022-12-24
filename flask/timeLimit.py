# import requests
# import eventlet
# import time
 
# eventlet.monkey_patch()
 
# time_limit = 3  #set timeout time 3s
 
# with eventlet.Timeout(time_limit,False):
#     time.sleep(5)
#     r=requests.get("https://me.csdn.net/dcrmg", verify=False)
#     print('error')
# print('over')
from func_timeout import func_set_timeout
import time
import datetime
import func_timeout
#from func_timeout import exceptions

@func_set_timeout(5)
#----------------------------------------------------------------------
def test():
    """"""
    
    print('111')
    time.sleep(1)
if __name__ == '__main__':
    starttime = datetime.datetime.now()
    try:
        test()
    except func_timeout.exceptions.FunctionTimedOut:
        print('22222')
    endtime = datetime.datetime.now()
    print((endtime - starttime).seconds)