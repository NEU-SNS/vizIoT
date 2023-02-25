import pymongo
from pymongo import MongoClient
from config import mongo_uri
import time
import logging


IP = 'IP'
TCP = 'TCP'
ETHER = 'Ether'

# writeConcern = pymongo.write_concern.WriteConcern(w=0, wtimeout=None, j=None, fsync=None)
client = MongoClient(mongo_uri, serverSelectionTimeoutMS=1)
scapy_database = client['scapy']
http_data_collection = scapy_database['tcpdatas']
tcpAggregatedDataString = 'tcpAggregatedData'
tcp_aggregated_data_collection = scapy_database[tcpAggregatedDataString]

  # .with_options(write_concern=writeConcern)

def get_timestamp_before_in_milliseconds(seconds):
  return (time.time() - seconds) * 1000

def main():
    logging.basicConfig(filename='db_rolling.log', level=logging.INFO, format='%(asctime)s %(message)s')
    logging.info('Started')
    try:
      time_to_be_deleted = get_timestamp_before_in_milliseconds(1 * 60) # 1 mins
      start_time = get_timestamp_before_in_milliseconds(2 * 60) # 2 mins
      # aggregate data
      results = http_data_collection.aggregate([
        {
          '$match': {
            'timestamp': {
              '$gt': start_time,
              '$lt': time_to_be_deleted,
            },
          },
        },
        {
          '$group': {
            '_id': {
              'src_mac': '$src_mac',
              'dst_mac': '$dst_mac',
            },
            'totalPacketSize': { '$sum': '$packet_size' },
            'packetCount': { '$sum': 1 },
          },
        },
        {
          '$project': {
            '_id': 0,
            'totalPacketSize': 1,
            'packetCount': 1,
            'src_mac': '$_id.src_mac',
            'dst_mac': '$_id.dst_mac',
          },
        },
        {
          '$addFields': {
            'startMS': start_time,
            'endMS': time_to_be_deleted,
          }
        },
        # {
        #   '$out': tcpAggregatedDataString,
        # },
      ])
      tcp_aggregated_data_collection.insert_many(results)
      # print(list(results))
      # delete data
      result = http_data_collection.delete_many({
        'timestamp': {
          '$lt': time_to_be_deleted
        }
      })
      deleted_count = result.deleted_count

      logging.info('delete entries before ' + str(time_to_be_deleted))
      logging.info('number of records deleted: ' + str(deleted_count))
    except Exception as e:
      print('Error: ' + str(e))
      logging.error('Error: ' + str(e))
    logging.info('Finished')

if __name__ == '__main__':
    main()