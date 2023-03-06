#!/usr/bin/python3
import time
from scapy.all import *
import pymongo
from pymongo import MongoClient
from config import mongo_uri, iface, database_name



IP = 'IP'
TCP = 'TCP'
UDP = 'UDP'
ETHER = 'Ether'

writeConcern = pymongo.write_concern.WriteConcern(w=0, wtimeout=None, j=None, fsync=None)
client = MongoClient(mongo_uri, serverSelectionTimeoutMS=1)
scapy_database = client[database_name]
tcpAggregatedDataString = 'tcpAggregatedData'
tcp_aggregated_data_collection = scapy_database[tcpAggregatedDataString].with_options(write_concern=writeConcern)


def http_header(packet):
  # http_packet=str(packet)
  return GET_print(packet)
  # if http_packet.find('GET'):
  #         return GET_print(packet)


def current_milli_time():
  return int(round(time.time() * 1000))


packet_dict = {}

time_tracker = {
  'last_time': time.time()
}

def add_packet_to_packet_dict(packet):
  p_tuple = (packet['src_mac'], packet['dst_mac'])
  if p_tuple in packet_dict:
    packet_dict[p_tuple]['packetCount'] += 1
    packet_dict[p_tuple]['totalPacketSize'] += packet['packet_size']
    packet_dict[p_tuple]['endMS'] = packet['timestamp']
  else:
    obj = {
      'src_mac': packet['src_mac'],
      'dst_mac': packet['dst_mac'],
      'startMS': packet['timestamp'],
      'endMS': packet['timestamp'] + 100,
      'packetCount': 1,
      'totalPacketSize': packet['packet_size'],
    }
    packet_dict[p_tuple] = obj

  time_duration = 0.1 # 0.1s
  # if time duration > 0.1, insert the packet set into the database
  cur_time = time.time()
  # print(cur_time)
  if cur_time - time_tracker['last_time'] >= time_duration:
    time_tracker['last_time'] = cur_time
    # print(len(packet_list))
    tcp_aggregated_data_collection.insert_many(packet_dict.values())
    packet_dict.clear()


def GET_print(pkt):
  new_packet_obj = dict()
  # ret = "***************************************GET PACKET****************************************************\n"
  if ETHER in pkt:
    new_packet_obj['dst_mac'] = pkt[ETHER].dst
    new_packet_obj['src_mac'] = pkt[ETHER].src
  if IP in pkt:
    new_packet_obj['src_ip'] = pkt[IP].src
    new_packet_obj['dst_ip'] = pkt[IP].dst
  if TCP in pkt:
    new_packet_obj['src_port'] = pkt[TCP].sport
    new_packet_obj['dst_port'] = pkt[TCP].dport
    new_packet_obj['packet_size'] = len(pkt[TCP])
  if UDP in pkt:
    new_packet_obj['src_port'] = pkt[UDP].sport
    new_packet_obj['dst_port'] = pkt[UDP].dport
    new_packet_obj['packet_size'] = len(pkt[UDP])
  # new_packet_obj['dst_ip'] = packet1.sprintf("%IP.dst%")
  # new_packet_obj['src_ip'] = packet1.sprintf("%IP.src%")
  # new_packet_obj['dst_mac'] = packet1.sprintf("%Ether.dst%")
  # new_packet_obj['src_mac'] = packet1.sprintf("%Ether.src%")
  # new_packet_obj['src_port'] = packet1.sprintf("TCP.sport")
  # new_packet_obj['dst_port'] = packet1.sprintf("TCP.dport")
  new_packet_obj['timestamp'] = current_milli_time()

  # http_data_collection.insert_one(new_packet_obj)
  # add packet to the set
  add_packet_to_packet_dict(new_packet_obj)
  # print(len(pkt[TCP]))
  # print(new_packet_obj)
  # print('*****************************************************************************************************')
  # pkt.show()
  # ret += "*****************************************************************************************************\n"
  # return ret

if __name__ == '__main__':
  # sniff(iface='en0', prn=http_header, filter="tcp or udp")
  # sniff(iface='en0', prn=http_header, filter="tcp port (80 or 443)")
  # sniff(iface='eth1', prn=http_header, filter="tcp port (80 or 443)", store=0)
  sniff(iface=iface, prn=http_header, filter="tcp or udp", store=0)
