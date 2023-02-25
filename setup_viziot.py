import os
import subprocess
import time

red = '\033[31m'
green = '\033[32m'
reset = '\033[0m'

original_dir = os.getcwd()
path = 'viziot.conf'

def parseEnv(path):
    with open(path) as f:
        content = f.read()

    result = {}

    for pair in content.strip().split("\n"):
        pair_list = pair.split("=")
        result[pair_list[0].strip()] = pair_list[1].strip()
    
    return result

def kill_process(identifier):
    os.system("sudo ps -ef | grep " + identifier + " | grep -v grep | awk '{print $2}' | sudo xargs kill 2>/dev/null")
    
# ===================== pypcap =====================
def set_pypcap_config(config):
    config_content = ""
    ips_content = ""

    if config.get("pypcap", "database_username") and config.get("pypcap", "database_password"):
        mongo_uri = "mongodb://{0}:{1}@{2}:{3}/{4}".format(config.get("pypcap", "database_ip"), config.get("pypcap", "database_port"), config.get("pypcap", "database_username"), config.get("pypcap", "database_password"), config.get("pypcap", "database_name"))
    else:
        mongo_uri = "mongodb://{0}:{1}/{2}".format(config.get("pypcap", "database_ip"), config.get("pypcap", "database_port"), config.get("pypcap", "database_name"))
    config_content += "mongo_uri" + "=\"{0}\"\n".format(mongo_uri) + "iface" + "=\"{0}\"\n".format(config.get("pypcap", "iface"))

    for ip in eval(config.get("pypcap", "ips")):
        ips_content += "{0} {1}\n".format(ip["ip"], ip["name"])

    with open('./pypcap/config.py', 'w') as f:
        f.write(config_content)
    with open('./pypcap/ips.txt', 'w') as f:
        f.write(ips_content)

def execute_pypcap_command(is_first_time):
    os.chdir('./pypcap')
    if is_first_time:
        # 2>/dev/null can suppress standard error output
        print("Installing scapy...")
        os.system("sudo pip3 install scapy 2>/dev/null")
        print("Installing pymongo...")
        os.system("sudo pip3 install pymongo 2>/dev/null")

        if os.system("sudo python3 addDevices.py 2>/dev/null") == 256:
            print("{0}Error: You might have duplicate mac addresses. Please check devices.txt file{1}".format(red, reset))
        if os.system("sudo python3 addIPs.py 2>/dev/null") == 256:
            print("{0}Error: You might have duplicate ip addresses. Please check ips.txt file{1}".format(red, reset))

    # start pypcap and set stdin=subprocess.PIPE, otherwise users can't enter values in the terminal
    subprocess.Popen("sudo sh make-run.sh", shell=True, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    subprocess.Popen("sudo sh kill.sh", shell=True, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    os.chdir(original_dir)

def run_pypcap(config, is_first_time):
    set_pypcap_config(config)
    execute_pypcap_command(is_first_time)

# ===================== backend =====================
def set_backend_config(config):
    if config.get("backend", "database_username") and config.get("backend", "database_password"):
        mongo_uri = "MONGO_URI=mongodb://{0}:{1}@{2}:{3}/{4}".format(config.get("backend", "database_ip"), config.get("backend", "database_port"), config.get("backend", "database_username"), config.get("backend", "database_password"), config.get("backend", "database_name"))
    else:
        mongo_uri = "MONGO_URI=mongodb://{0}:{1}/{2}".format(config.get("backend", "database_ip"), config.get("backend", "database_port"), config.get("backend", "database_name"))

    local_ip = "LOCAL_IP={0}".format(config.get("backend", "backend_ip"))
    port = "PORT={0}".format(config.get("backend", "backend_port"))
    env_content = "{0}\n{1}\n{2}\n".format(mongo_uri, local_ip, port)
    
    with open('./backend/.env', 'w') as f:
        f.write(env_content)

def execute_backend_command(is_first_time, config):
    os.chdir('./backend')
    if is_first_time:
        print("Start installing packages for backend...")
        os.system("sudo yarn install --quiet")

    local_port = config.get("backend", "backend_port") or "3000"

    # check if the port is being used
    while os.popen("sudo lsof -i:{0} | grep LISTEN".format(local_port)).read():
        local_port = input("Port {0} is picked. Please choose a different port: ".format(local_port)).strip()
    
    # update configuration file, since the port might have changed
    config.set("backend", "backend_port", local_port)

    # start backend and set stdin=subprocess.PIPE, otherwise users can't enter values in the terminal anymore
    subprocess.Popen("sudo ./node_modules/.bin/forever -m 5 ./index.js >/dev/null", shell=True, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    os.chdir(original_dir)    

def run_backend(config, is_first_time):
    set_backend_config(config)
    execute_backend_command(is_first_time, config)

# ===================== frontend =====================
def set_frontend_config(config):
    backend_ip = "REACT_APP_BACKEND_IP={0}".format(config.get("frontend", "backend_ip"))
    backend_port = "REACT_APP_BACKEND_PORT={0}".format(config.get("frontend", "backend_port"))

    # if .env has changed, then the frontend needs to be built again
    env_changed = False
    env_path = './frontend/.env'
    env_exist = os.path.isfile(env_path)
    if env_exist:
        env_variables = parseEnv(env_path)
        if env_variables["REACT_APP_BACKEND_IP"] != config.get("frontend", "backend_ip") or env_variables["REACT_APP_BACKEND_PORT"] != config.get("frontend", "backend_port"):
            env_changed = True
    
    env_content="{0}\n{1}\n".format(backend_ip, backend_port)
    
    with open('./frontend/.env', 'w') as f:
        f.write(env_content)

    return env_changed

def execute_frontend_command(is_first_time, env_changed, config):
    # change working dir
    os.chdir('./frontend')
    backend_ip = config.get("frontend", "backend_ip")
    backend_port = config.get("frontend", "backend_port")
    # install dependencies and create a package if it's the first time
    if is_first_time:
        print("Start installing packages for frontend...")
        os.system("sudo yarn install --quiet")
        print("Start building the project... (Please ignore the warning about 'caniuse-lite is outdated.')")
        os.system("sudo npx webpack --config ./config/webpack.prod.js --env ip={0} --env port={1} --stats=errors-only".format(backend_ip, backend_port))
    else:
        if env_changed:
            print("The backend ip or port has changed. Rebuilding the project... (Please ignore the warning about 'caniuse-lite is outdated.')")
            os.system("sudo npx webpack --config ./config/webpack.prod.js --env ip={0} --env port={1} --stats=errors-only".format(backend_ip, backend_port))

    # check if the machine has 'serve' 
    if os.system("sudo yarn global list --pattern serve | grep serve >/dev/null") != 0:
        print("You need a package called 'serve' to run the frontend. Starting installing 'serve': ")
        os.system("sudo yarn global add serve@14.2.0")

    local_ip = config.get("frontend", "frontend_ip") or "localhost"
    local_port = config.get("frontend", "frontend_port") or "8080"

    # check if the port is being used
    while os.popen("sudo lsof -i:{0} | grep LISTEN".format(local_port)).read():
        local_port = input("Port {0} is picked. Please choose a different port: ".format(local_port)).strip()
    
    # start frontend and set stdin=subprocess.PIPE, otherwise users can't enter values in the terminal anymore
    subprocess.Popen("sudo serve -s dist -l tcp://{0}:{1}".format(local_ip, local_port), shell=True, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    os.chdir(original_dir) 

    # update configuration file, since the port might have changed
    config.set("frontend", "frontend_port", local_port)
    with open(path, 'w') as config_file:
        config.write(config_file)

def run_frontend(config, is_first_time):
    # It might not be necessary to have an .env file in the frontend
    env_changed = set_frontend_config(config)
    execute_frontend_command(is_first_time, env_changed, config)
    
def stop(*frontend_process_identifier):
    # stop pypcap
    kill_process("sniff.py")
    kill_process("kill.sh")
    kill_process("make-run.sh")

    # stop backend
    kill_process("forever")
    kill_process("vizIoT/backend/index.js")

    if frontend_process_identifier:
    # stop frontend
        kill_process(frontend_process_identifier[0])

def run(config, parts):
    if "pypcap" in parts:
        is_first_time = input("Is this your first time running the pypcap? (y/other keys): ").strip()
        run_pypcap(config, is_first_time == "y")
   
    if "backend" in parts:
        is_first_time = input("Is this your first time running the backend? (y/other keys): ").strip()
        run_backend(config, is_first_time == "y")
        print("Starting the backend. Please wait")
        # the frontend needs to start after the backend fully starts, otherwise, if they are using the same port, it won't be detected
        time.sleep(4)

    if "frontend" in parts:
        is_first_time = input("Is this your first time running the frontend? (y/other keys): ").strip()
        print("Starting the frontend. Please wait")
        run_frontend(config, is_first_time == "y")
    