# VizIoT Documentation

## **Sent/Received**

Note:: *Backend* refers to files in the viziot-server-2 project directory, *Frontend* refers to files in the VizIoT project directory

### Backend

- tcpData.da.js

	- Contains the getAggregateSentReceivedDataWithinNSeconds method used to populate the visualization metrics and line graph.

		Formats and returns the data as follows:

		```
		{
			size: [total, sent, received],
			startMS,
			endMS
		}
		```

		- size: *array of integers* (array)
			- total: *Total traffic over N seconds in bytes* (integer)
			- sent: *Sent traffic over N seconds in bytes* (integer)
			- received: *Received traffic over N seconds in bytes* (integer)
		- startMS: *Timestamp indicating the beginning of interval* (integer)
		- endMS *Timestamp indicating the end of interval* (integer)

	- Contains the getDeviceSentReceivedDataWithinNSeconds method used to populate the visualization device cards
		
		Formats and returns the data as follows:
		
		```
		{
			deviceData: {
				macAddress,
				sent,
				received,
				total
			},
			startMS,
			endMS
		}
		```

		- deviceData: *contains data pertaining to all devices* (object)
			- macAddress: *macAddress of the device* (string)
			- sent: *Sent traffic over N seconds in bytes* (integer)
			- received: *Received traffic over N seconds in bytes* (integer)
			- total: *Total traffic over N seconds in bytes* (integer)
		- startMS: *Timestamp indicating the beginning of interval* (integer)
		- endMS *Timestamp indicating the end of interval* (integer)

		Note:: All devices in deviceData can be found using their MAC address

- socketio.js

	- Contains setInterval calls used to push data to the frontend client
		
		- /total/IO/1s

			Uses 'splice' method on array object to remove 'total' metric from the 'size' array in the object returned from getAggregateSentReceivedDataWithinNSeconds

		- /total/IO/metric/1s

			Sends data as is returned by getAggregateSentReceivedDataWithinNSeconds

		- /data/device/IO/1s

			Formats and returns the data as follows:

			```
			[
				{
					macAddress,
					velocity,
					totalTraffic,
					inTraffic,
					outTraffic,
					data: {
						startMS,
						endMS,
						size: [sent, received]
					}
				}
			]
			```

			- macAddress: *macAddress of the device* (string)
			- velocity: *average bytes per second of total traffic over specified interval* (integer)
			- totalTraffic: *total bytes sent and received over specified interval* (integer)
			- inTraffic: *total bytes received over specified interval* (integer)
			- outTraffic: *total bytes sent over specified interval* (integer)
			- data: *contains data over last second*
				- size: *array of integers* (array)
					- sent: *Sent traffic over N seconds in bytes* (integer)
					- received: *Received traffic over N seconds in bytes* (integer)
				- startMS: *Timestamp indicating the beginning of interval* (integer)
				- endMS *Timestamp indicating the end of interval* (integer)

			Note:: To change the length of the interval over which metrics are measured, adjust the *metricLength* variable at the top of the setInterval call to the number of seconds over which data should be captured.
			
			Note:: To change the number of devices shown at the front end, change the *devicesShown* variable to the number of devices needed.

### Frontend

- SentReceivedTab.js

	Note:: To change the colors of the metrics and graph lines, change the second parameter to each *factFactory()* call.

	Note:: To change the number of devices in the device card section, refer to the Backend documentation on */data/device/IO/1s*

	Note:: To change the titles and headers of the page, adjust the following props to LineGraphPage as necessary:
	- pageTitle
	- pageSubtitle
	- graphTitle
	- chartTitle
	- chartSubtitle
	- legendTitle

- packetApi.js

	- parseDeviceIO()

		Handles grabbing device data from the message received from the backend server
		
		Passes device data in message from backend to addDeviceIOData() in DeviceDataIOAggregator.js

- DeviceDataIOAggregator.js

	- addDeviceIOData()

		Formats the data as follows:

		```
		{
			mac,
			velocity,
			dataStreams: [totalTraffic, outTraffic, inTraffic],
			data: {
				size: [sent, received],
				startMS,
				endMS
			}
		}
		```

		- mac: *MAC address of the device* (string)
		- velocity: *Average bytes sent and received over specified interval* (integer)
		- dataStreams: *Contains array of integers detailing totalTraffic, outTraffic and inTraffic* (array)
			- totaTraffic: *Total traffic sent and received over specified interval* (integer)
			- outTraffic: *Total traffic sent over specified interval* (integer)
			- inTraffic: *Total traffic received over specified interval* (integer)
		- data: *contains data over last second*
			- size: *array of integers* (array)
				- sent: *Sent traffic over N seconds in bytes* (integer)
				- received: *Received traffic over N seconds in bytes* (integer)
			- startMS: *Timestamp indicating the beginning of interval* (integer)
			- endMS *Timestamp indicating the end of interval* (integer)

		Note:: The key for each object in the deviceData object is the MAC address in each object

		Note:: The inteval recorded in totalTraffic, outTraffic, inTraffic and velocity can be specified in the backend in the setInterval call in socketio.js for the resource path */data/device/IO/1s*

	- getDeviceIOData()

		- gets the devices received in the most recent call to addDeviceIOData()

## **Protocol**

### Backend

- tcpData.da.js

	- Contains the getAggregateProtocolDataWithinNSeconds method used to populate the visualization metrics and line graph.

		Formats and returns the data as follows:

		```
		{
			size: [TCP, UDP, HTTP, DNS],
			startMS,
			endMS
		}
		```

		- size: *array of integers* (array)
			- TCP: *Total TCP traffic over N seconds in bytes* (integer)
			- UDP: *Total UDP traffic over N seconds in bytes* (integer)
			- HTTP: *Total HTTP traffic over N seconds in bytes* (integer)
			- DNS: *Total DNS traffic over N seconds in bytes* (integer)
		- startMS: *Timestamp indicating the beginning of interval* (integer)
		- endMS *Timestamp indicating the end of interval* (integer)

	- Contains the getDeviceProtocolDataWithinNSeconds method used to populate the visualization device cards
		
		Formats and returns the data as follows:
		
		```
		{
			deviceData: {
				macAddress,
				TCP,
				UDP,
				HTTP,
				DNS
			}
			startMS,
			endMS
		}
		```

		- deviceData: *Object containing data for all devices* (object)
			- macAddress: *The MAC address for the device* (string)
			- TCP: *Total TCP traffic over N seconds in bytes* (integer)
			- UDP: *Total UDP traffic over N seconds in bytes* (integer)
			- HTTP: *Total HTTP traffic over N seconds in bytes* (integer)
			- DNS: *Total DNS traffic over N seconds in bytes* (integer)
		- startMS: *Timestamp indicating the beginning of interval* (integer)
		- endMS *Timestamp indicating the end of interval* (integer)

		Note:: The key for each object in the deviceData object is the MAC address in each object 

- socketio.js

	- Contains setInterval calls used to push data to the frontend client
		
	- /total/protocol/1s

		Sends data as is returned by getAggregateProtocolDataWithinNSeconds

	- /total/protocol/metric/1s

		Sends data as is returned by getAggregateProtocolDataWithinNSeconds

	- /data/device/protocol/1s

		Formats and returns the data as follows:

		```
		[
			{
				macAddress,
				velocity,
				tcpTraffic,
				udpTraffic,
				httpTraffic,
				dnsTraffic
				data: {
					startMS,
					endMS,
					size: [TCP, UDP, HTTP, DNS]
				}
			}
		]
		```

		- macAddress: *macAddress of the device* (string)
		- velocity: *average bytes per second of total traffic over specified interval* (integer)
		- tcpTraffic: *Total TCP traffic over N seconds in bytes* (integer)
		- udpTraffic: *Total UDP traffic over N seconds in bytes* (integer)
		- httpTraffic: *Total HTTP traffic over N seconds in bytes* (integer)
		- dnsTraffic: *Total DNS traffic over N seconds in bytes* (integer)
		- data: *contains data over last second*
			- size: *array of integers* (array)
				- TCP: *Total TCP traffic over last second* (integer)
				- UDP: *Total UDP traffic over last second* (integer)
				- HTTP: *Total HTTP traffic over last second* (integer)
				- DNS: *Total DNS traffic over last second* (integer)
			- startMS: *Timestamp indicating the beginning of second interval* (integer)
			- endMS *Timestamp indicating the end of second interval* (integer)

		Note:: To change the length of the interval over which metrics are measured, adjust the *metricLength* variable at the top of the setInterval call to the number of seconds over which data should be captured.
		
		Note:: To change the number of devices shown at the front end, change the *devicesShown* variable to the number of devices needed.

### Frontend

- ProtocolTab.js

	Note:: To change the colors of the metrics and graph lines, change the second parameter to each *factFactory()* call.

	Note:: To change the number of devices in the device card section, refer to the Backend documentation on */data/device/protocol/1s*

	Note:: To change the titles and headers of the page, adjust the following props to LineGraphPage as necessary:
	- pageTitle
	- pageSubtitle
	- graphTitle
	- chartTitle
	- chartSubtitle
	- legendTitle

- packetApi.js

	- parseDeviceProtocol()

		Handles grabbing device data from the message received from the backend server
		
		Passes device data in message from backend to addDeviceProtocolData() in DeviceDataProtocolAggregator.js

- DeviceDataProtocolAggregator.js

	- addDeviceProtocolData()

		Formats the data as follows:

		```
		{
			mac,
			velocity,
			dataStreams: [tcpTraffic, udpTraffic, httpTraffic, dnsTraffic],
			data: {
				size: [TCP, UDP, HTTP, DNS]
				startMS,
				endMS
			}
		}
		```

		- macAddress: *macAddress of the device* (string)
		- velocity: *average bytes per second of total traffic over specified interval* (integer)
		- dataStreams: *array of integers* (array)
			- tcpTraffic: *Total TCP traffic over N seconds in bytes* (integer)
			- udpTraffic: *Total UDP traffic over N seconds in bytes* (integer)
			- httpTraffic: *Total HTTP traffic over N seconds in bytes* (integer)
			- dnsTraffic: *Total DNS traffic over N seconds in bytes* (integer)
		- data: *contains data over last second*
			- size: *array of integers* (array)
				- TCP: *Total TCP traffic over last second* (integer)
				- UDP: *Total UDP traffic over last second* (integer)
				- HTTP: *Total HTTP traffic over last second* (integer)
				- DNS: *Total DNS traffic over last second* (integer)
			- startMS: *Timestamp indicating the beginning of second interval* (integer)
			- endMS *Timestamp indicating the end of second interval* (integer)

		Note:: The key for each object in the deviceData object is the MAC address in each object

		Note:: The interval recorded in tcpTraffic, udpTraffic, httpTraffic, dnsTraffic and velocity can be specified in the backend in the setInterval call in socketio.js for the resource path */data/device/protocol/1s*

	- getDeviceProtocolData()

		- gets the devices received in the most recent call to addDeviceProtocolData() 

## Graphing Visualization Notes (Sent/Received + Protocol)

Note:: To change the number of metrics displayed, each 'fact' in the top-level visualization component should specify 'isGraphed' as true if the metric's values should also show up on the graph, and 'false' if they should not. 

- For each metric that is graphed, there should be a corresponding entry in the array sent from the backend detailing total data over the last second in the relative order in which they appear on the graph. For instance, Sent/Received receives second data as follows:

	```
	[
		{
			size: [sent, received],
			startMS,
			endMS
		}
	]
	```

	and receives metric data as follows:

	```
	[
		{
			size: [total, sent, received],
			startMS,
			endMS
		}
	]
	```

	Since 'total' is not graphed, there is no corresponding entry in the second data. However, 'sent' and 'received' are in relative order between both arrays. This order is important, and ensures that the appropriate metric is associated with the correct line data.

Note:: To change the length of time over which the Protocol and Sent/Received main graph details traffic data, change the *dataWindowSize* variable in the *liveLineChartConfig* object to the appropriate time in seconds within the *chartConfig.js* file.

Note:: To change the length of time over which the Protocol and Sent/Received individual device card graph details traffic data, change the *dataWindowSize* variable in the *singleDeviceChartConfig* object to the appropriate time in seconds within the *chartConfig.js* file.

## **Connection Table**

### Backend

- device.ctrl.js

	- Contains the getDeviceConnections() function that sends connection data to the frontend client

		Formats the data as follows:

		```
		{
			connections
		}
		```

		- connections: *array of objects detailing connection data between devices* (array)

- device.da.js

	- Contains the getConnections() function that returns individual connection data of captured devices.

		Formats the data as follows:

		```
		[
			{
				id,
				name,
				destName,
				country
			}
		]
		```

		- id: *key comprised of source MAC address and destination MAC address separated by '--'* (string)
		- name: *name of the local device* (string)
		- destName: *name of the destination where the device is sending/receiving data* (string)
		- country: *country where the device is sending/receiving data* (string)

		Note:: The destName may be the IP address of the destination or the hostname depending on what is returned from a DNS lookup on the destination IP address

		Note:: The country may be undefined if the IP address cannot be matched against the local country/IP database at the server

- tcpData.ctrl.js

	- Contains the getOneSecondDeviceConnectionData() function that aggregates second device connection data over the last 35 seconds 

		Formats the data as an object returned by getConnectionSentReceivedDataWithinNSeconds in tcpData.da.js

		```
		{
			connections
		}
		```

		- connections: *an array of connection data* (array)

		Note:: To change the length of the period of time over which second connection data is collected, change the *timePeriod* variable from 35 to the desired time period.

		Note:: This should only be called upon starting the front-end; continous second connection data should be requested by the frontend and served via the /data/connection/1s interval in socketio.js

	- Contains the getFiveSecondDeviceConnectionData() function that aggregates device connection data over the last 5 seconds 

		Formats the data as an object returned by getConnectionSentReceivedDataWithinNSeconds in tcpData.da.js

		```
		{
			connections
		}
		```

		- connections: *an array of connection data* (array)

	- Contains the getOneSecondDeviceConnectionData() function that aggregates device connection data over the last 30 seconds

		Formats the data as an object returned by getConnectionSentReceivedDataWithinNSeconds in tcpData.da.js

		```
		{
			connections
		}
		```

		- connections: *an array of connection data* (array)

	Note:: To add a different interval over which data is collected, create a function in tcpData.ctrl.js and use the getConnectionSentReceivedDataWithinNSeconds() to get connection data and specify the interval as a parameter to this function in milliseconds. Then, create a route int tcpData/index.js and attach it to the router object used to handle requests from the frontend. The frontend should use this route to specify this interval.

- tcpData.da.js

	- Contains the getConnectionSentReceivedDataWithinNSeconds() method that aggregates and formats connection data for individual devices to populate the connection table on the front end

		Formats the data as follows:

		```
		[
			{
				id,
				size: [sent, received],
				time
			}
		]
		```

		- id: *key comprised of source MAC address and destination MAC address separated by '--'* (string)
		- size: *array of integers* (integer)
			- sent: *data sent from device to destination over specified interval* (integer)
			- received: *data sent to device from another source over specified interval* (integer)
		- time: *the end of the specified interval in milliseconds* (integer)

- socketio.js

	- /data/connection/1s

		Formats the data as an object returned by getConnectionSentReceivedDataWithinNSeconds in tcpData.da.js

		```
		{
			connections
		}
		```

		- connections: *an array of connection data* (array)

### Frontend

- ConnectionTableTab.js

	- Parent container for the ConnectionTable object responsible for display connection data in a table.

		Note:: To change the color of Sent/Received data icons/graph, change the *sentColor* or *receivedColor* variables respectively.

		Note:: To change the interval over which graph data is shown, change the *timeFrame* variable to the desired time in seconds.

		Note:: To change the number of x-axis values displayed, change the *xTicks* variable to the desired number of x-axis values.

		Note:: To change the number of connections shown, change the *rows* variable to the desired number of connections.

- ConnectionTable.js

	- Displays the table header and table rows for connection data in devices.

		Note:: To change the metrics displayed in the rightmost columns of the table, create a new *fetchNSecondConnection* fetcher function where N is the desired length of the interval and pass this function to a useTimedFetcher call. 
			
		- For more information on how to produce this kind of function, see documentation in *connectionsApi.js* and *ConnectionAggregator.js*
		
		- To change the title associated with these metrics in the TableHeader, see documentation in *TableHeader.js*

		Note:: Remove appropriate useTimedFetcher() call depending on the metric changed.


- TableHeader.js

	- Displays the header row of the Connection Table.

	Note:: To change the title for metrics in the rightmost column of the table, change the *recentMetricTitle* variable to change the inner metric title and change the *overallMetricTitle* variable to change the outer metric title.

- connectionsApi.js

	- Contains the fetchSecondConnections() fetcher.

		Note:: This fetcher manually adds connection packet data for each object returned from the backend server.
	
	- Contains the fetchFiveSecondConnections() fetcher.

	- Contains the fetchThirtySecondConnections() fetcher.

		Note:: Each of these methods uses the addPackets() method in *ConnectionAggregator.js* and specifies an enumerable value as the second parameter to this call to specify how the connection object should be handled. To understand how these enumerables are used to specify addPackets() behavior, see documentation on *ConnectionAggregator.js*.

		Note:: To specify a particular metric to request from the backend server, specify the resource as follows:

		```
		${baseUrlApi}/tcpData/connections/{metric}
		```

		Where *metric* corresponds to the specific metric. Use axios.get() and pass in the specified url as the first parameter and *{headers}* as the second parameter. Then, retrieve the *connections* array returned from the backend server and pass to addPackets() along with the appropriate enumerable.

- ConnectionAggregator.js

	- Contains the *METRICS* enumerable object.

		Note:: To add an enumerable value, specify the name of the enumerable as the key and a unique integer as its value.

	- Contains the addPackets() function used to collect and store packet connection data.

		Assigns values to a child object in the parent *packets* object as follows:

		```
		{
			second: [
				{
					size: [sent, received],
					time
				}
			],
			metric1: [sent, received],
			metric2: [sent, received]
		}
		```

		- second: *An array containing an object specifying sent and received data over one second for a connection* (array)
			- size: *An array containing sent and received data over one second* (array)
				- sent: *Total traffic sent over connection in bytes over one second* (integer)
				- received: *Total traffic received over connection in bytes over one second* (integer)
			- time: *The timestamp indicating the end of the second interval over which data was collected in milliseconds* (integer)
		- metric1: *An array containing sent and received data over a five second interval* (array)
			- sent: *Total traffic sent over connection in bytes over five seconds* (integer)
			- received: *Total traffic received over connection in bytes over five seconds* (integer)
		- metric2: *An array containing sent and received data over a thirty second interval* (array)
			- sent: *Total traffic sent over connection in bytes over thirty seconds* (integer)
			- received: *Total traffic received over connection in bytes over thirty seconds* (integer)

		Note:: The key for each object is the 'id' object in the packet data returned from the server, which corresponds to the source mac address and destination mac address separated by '--'.

		Note:: *metric1* corresponds to the inner metric in the rightmost column of the connection table, and *metric2* corresponds to the outer metric in the rightmost column of the connection table. 
		
	Note:: In order to change the interval over which data is collected, make the appropriate changes to the backend serving the data in tcpData.ctrl.js, create a fetcher in connectionsApi.js for the new metric, assign an enumerable to the *METRICS* enumerable in this file, and create a new case in the switch statement in this function. Then, assign the new metric to either *metric1* or *metric2* depending on the column changed.

## **Pypcap**

- addDevices.py

	Places devices listed in devices.txt into the MongoDB instance.

- devices.txt

	Contains the list of devices to be monitored by the VizIoT application. Devices are specified by their MAC address followed by a space and then the name to be associated with the device. Each device is separated by a newline. The format is as follows:

	```
	<MAC address> <name>
	<MAC address> <name>
	```

	With mock data:

	```
	12:34:56:78:9a:bc amazon-home
	de:f0:12:34:56:78 echodot
	```

	Note:: To add a new device to monitor, add it to this list in this format. All MAC address values must have at least 1 character, and if the value is less than 16, do not include a '0' value before that character. For example:

	```
	0:e:f3:3b:85:e5
	```

	is the proper way to format a MAC address with a 0 value or a value less than 16.

- addIPs.py

	Places IP addresses and their static names listed in ips.txt into the MongoDB instance.

- ips.txt

	Contains the list of IP addresses with a static name to which the IP address should be associated. IP mappings are specified by the IP address followed by the name that should be associated with the IP address. Each IP mapping is separated by a newline. The format is as follows:

	```
	<IP address> <name>
	```

	With mock data:

	```
	224.0.0.251 Multicast
	```