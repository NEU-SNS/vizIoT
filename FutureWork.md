# Future work
## Minor bugs

1. When switching to another tab and then switching back to 'Overview' tab, the line in the chart becomes almost striaght and then becomes normal soon again. 
This bug doesn't happen in other tabs.
![image](https://user-images.githubusercontent.com/79139571/232959804-f2700657-a046-4606-a60d-73c5f5e0eae2.png)
![image](https://user-images.githubusercontent.com/79139571/232959844-9cd7dcc8-0898-4fd5-b5ee-3059577dab42.png)

2. Sometimes the lines don't show up at '0s ago'. There is a little gap.
![image](https://user-images.githubusercontent.com/79139571/232960354-88248576-84d3-41eb-a934-826d794fdb43.png)

## Performance improvement

1. Replace Redis with MongoDB.
2. Add a data access layer.
3. In the 'Connection' tab, it sends several http requests to the backend on a regular basis. It might be doable to use websocket instead, just like the other tabs.
4. In the 'Connection' tab, it uses dnsPromises.lookupService to look up each packet's hostname, which takes about 4-5 seconds and there are thousands of packets in one request, so it's takes a few minutes to process the first few requests. That's why in the first few minutes after the application is started, there is no chart. Since there is an object and a set collecting hostnames looked up before, the following requests are faster. However, even there is just one packet whose hostname is new, the request would take an intolerable amount of time to complete.
