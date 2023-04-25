from pymongo import MongoClient
import pymongo
from config import mongo_uri, database_name

client = MongoClient(mongo_uri, serverSelectionTimeoutMS=1)
scapy_database = client[database_name]
ip_collection = scapy_database['ips']
ip_collection.create_index([('ip', pymongo.ASCENDING)],  unique=True)
ip_collection.delete_many({})

def main():
    fileName = 'ips.txt'
    ipList = []

    fileIPs = open(fileName, 'r')

    for line in fileIPs:
        ip, name = line.strip().split(' ')
        ipList.append({
            'ip': ip,
            'name': name
        })

    ip_collection.insert_many(ipList)


if __name__ == '__main__':
    main()
