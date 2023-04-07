# Pypcap
A python project to sniff the internet traffic and stored it into 
MongoDB database. 

## Python File Explanation:
1. [sniff.py](./sniff.py): Use [scapy](https://github.com/secdev/scapy) library to
sniff the data. Insert the sniffed data into a MongoDB.
2. [addIPs.py](./addIPs.py): Read the ip and name information from
a file in the router. Store the ip information into the MongoDB
3. [addDevices.py](./addDevices.py): Read the device mac and name information from
a file in the router. Store the device information into the MongoDB

## Scapy Configuration
Ask Daniel for which iface should be listened to in the router
```python
  # sniff iface en0 of all tcp and udp packets
  sniff(iface='en0', prn=http_header, filter="tcp or udp")
  
  # sniff iface en0 of tcp port 80 and 443 packets
  sniff(iface='en0', prn=http_header, filter="tcp port (80 or 443)")
  
  # sniff iface en1 of tcp port 80 and 443 packets
  sniff(iface='eth1', prn=http_header, filter="tcp port (80 or 443)", store=0)
  
  # sniff iface eth1 of all tcp and udp packets
  sniff(iface='eth1', prn=http_header, filter="tcp or udp")
```