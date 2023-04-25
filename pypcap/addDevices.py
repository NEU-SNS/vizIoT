from pymongo import MongoClient
import pymongo
from config import mongo_uri, database_name

client = MongoClient(mongo_uri, serverSelectionTimeoutMS=1)
scapy_database = client[database_name]
device_collection = scapy_database['devices']
  # .with_options(write_concern=writeConcern)
device_collection.create_index([('macAddress', pymongo.ASCENDING)],  unique=True)
device_collection.delete_many({})

def main():
  fname = 'devices.txt'
  deviceList = []
  with open(fname) as f:
    for line in f:
      macAddress, name = line.strip().split(' ')
      deviceList.append({
        'macAddress': macAddress,
        'name': name,
      })
  device_collection.insert_many(deviceList)

if __name__ == '__main__':
    main()