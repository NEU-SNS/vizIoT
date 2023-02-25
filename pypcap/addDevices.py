from pymongo import MongoClient
from config import mongo_uri

client = MongoClient(mongo_uri, serverSelectionTimeoutMS=1)
scapy_database = client['scapy']
device_collection = scapy_database['devices']
  # .with_options(write_concern=writeConcern)

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