import os
import subprocess
import time
import configparser

red = '\033[31m'
green = '\033[32m'
reset = '\033[0m'

original_dir = os.getcwd()
config = configparser.ConfigParser()
path = 'viziot.conf'

def parseEnv(path):
    with open(path) as f:
        content = f.read()

    result = {}

    for pair in content.strip().split("\n"):
        pair_list = pair.split("=")
        result[pair_list[0].strip()] = pair_list[1].strip()
    
    return result

def get_db_uri_from(config, part):
    if config.get(part, "database_username") and config.get(part, "database_password"):
        auth_source = config.get(part, "database_authsource")
        if auth_source:
            auth_source = 'authSource=' + auth_source
        mongo_uri = "mongodb://{0}:{1}@{2}:{3}/?{4}".format(config.get(part, "database_username"), config.get(part, "database_password"), config.get(part, "database_ip"), config.get(part, "database_port"), auth_source)
    else:
        mongo_uri = "mongodb://{0}:{1}/".format(config.get(part, "database_ip"), config.get(part, "database_port"))

    return mongo_uri

# ===================== pypcap =====================
def set_pypcap_config(config):
    config_content = ""
    mongo_uri = get_db_uri_from(config, "pypcap")
    config_content += "mongo_uri" + "=\"{0}\"\n".format(mongo_uri) + "database_name" + "=\"{0}\"\n".format(config.get("pypcap", "database_name")) + "iface" + "=\"{0}\"\n".format(config.get("pypcap", "iface"))

    with open('./pypcap/config.py', 'w') as f:
        f.write(config_content)

def execute_pypcap_command(is_first_time):
    os.chdir('./pypcap')
    if is_first_time:
        # 2>/dev/null can suppress standard error output
        print("Installing scapy...")
        os.system("sudo pip3 install scapy 2>/dev/null")
        print("Installing pymongo...")
        os.system("sudo pip3 install pymongo 2>/dev/null")

        if os.system("sudo python3 addDevices.py 2>/dev/null") == 256:
            print("{0}Error: Fail to add devices info to the database. Please check devices.txt file{1}".format(red, reset))
        if os.system("sudo python3 addIPs.py 2>/dev/null") == 256:
            print("{0}Error: Fail to add ips info info to the database. Please check ips.txt file{1}".format(red, reset))

    # start pypcap and set stdin=subprocess.PIPE, otherwise users can't enter values in the terminal
    # subprocess.Popen("sudo sh make-run.sh", shell=True, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    # subprocess.Popen("sudo sh kill.sh", shell=True, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    subprocess.Popen("sudo python3 sniff.py", shell=True, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    os.chdir(original_dir)

def run_pypcap(config, is_first_time):
    set_pypcap_config(config)
    execute_pypcap_command(is_first_time)

# ===================== backend =====================
def set_backend_config(config):
    if config.get("backend", "database_username") and config.get("backend", "database_password"):
        auth_source = config.get("backend", "database_authsource")
        if auth_source:
            auth_source = 'authSource=' + auth_source
        mongo_uri = "MONGO_URI=mongodb://{0}:{1}@{2}:{3}/{4}?{5}".format(config.get("backend", "database_username"), config.get("backend", "database_password"), config.get("backend", "database_ip"), config.get("backend", "database_port"), config.get("backend", "database_name"), auth_source)
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
        os.system("sudo yarn install 2>/dev/null")

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
        os.system("sudo yarn install 2>/dev/null")
        print("Start building the project...")
        os.system("sudo npx webpack --config ./config/webpack.prod.js --env ip={0} --env port={1}".format(backend_ip, backend_port))
    else:
        if env_changed:
            print("The backend ip or port has changed. Rebuilding the project...")
            os.system("sudo npx webpack --config ./config/webpack.prod.js --env ip={0} --env port={1}".format(backend_ip, backend_port))

    # check if the machine has 'serve' 
    # 'serve' is needed because it enables the frontend to run on a different system.
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

# ===================== check status =====================
def check_status(identifier):
    return os.system(f'ps -ef | grep {identifier} | grep -v grep >/dev/null') == 0

def check_status_pypcap():
    status = 'running' if check_status('sniff.py') else 'not started'
    print(f'pypcap: {status}')

def check_status_backend():
    status = 'running' if check_status('forever') and check_status('vizIoT/backend/index.js') else 'not started'
    print(f'backend: {status}')

def check_status_frontend():
    config.read(path)
    if "frontend" not in config.sections():
        print('frontend: not started')
        return
    
    frontend_ip = config.get("frontend", "frontend_ip") or "localhost"
    frontend_port = config.get("frontend", "frontend_port") or "8080"
    frontend_process_identifier = "tcp://{0}:{1}".format(frontend_ip, frontend_port)

    status = 'running' if check_status(frontend_process_identifier) else 'not started'
    print(f'frontend: {status}')

def check_status_all():
    check_status_pypcap()
    check_status_backend()
    check_status_frontend()

# ===================== stop application =====================
def kill_process(identifier):
    os.system("sudo ps -ef | grep " + identifier + " | grep -v grep | awk '{print $2}' | sudo xargs kill 2>/dev/null")

def stop(part):
    if part == 'pypcap':
        kill_process("sniff.py")
    elif part == 'backend':
        kill_process("forever")
        kill_process("vizIoT/backend/index.js")
    elif part == 'frontend':
        config.read(path)
        if "frontend" in config.sections():
            frontend_ip = config.get("frontend", "frontend_ip") or "localhost"
            frontend_port = config.get("frontend", "frontend_port") or "8080"
            # find the pid to stop the process
            frontend_process_identifier = "tcp://{0}:{1}".format(frontend_ip, frontend_port)
            kill_process(frontend_process_identifier)

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
 