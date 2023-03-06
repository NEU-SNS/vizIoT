from pymongo import MongoClient
import sys

def test_db_connection(url):

    client = MongoClient(url, serverSelectionTimeoutMS=1)
    # if fail to connect, it will throw an error
    client.server_info()
    client.close()

if __name__ == '__main__':
    test_db_connection(sys.argv[1])