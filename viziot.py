import configparser
import os
from setup_viziot import run, stop
import sys

red = '\033[31m'
green = '\033[32m'
reset = '\033[0m'

config = configparser.ConfigParser()
path = 'viziot.conf'

pypcap_properties = ["iface", "database_name", "database_ip", "database_port", "database_username", "database_password", {"name": "ips", "value": ["ip", "name"]}]
pypcap_properties_names = ["iface", "database_name", "database_ip",
                           "database_port", "database_username", "database_password", "ips"]
backend_properties = ["database_name", "database_ip",
                      "database_port", "database_username", "database_password", "backend_ip", "backend_port"]
frontend_properties = ["backend_ip", "backend_port", "frontend_ip", "frontend_port"]

parts = {
    "pypcap": {
        "pypcap_properties": pypcap_properties,
        "pypcap_properties_names": pypcap_properties_names,
    },
    "backend": {
        "backend_properties": backend_properties
    },
    "frontend": {
        "frontend_properties": frontend_properties
    }
}

def add_single_value(property):
    return input("Please set {0}:\n".format(property)).strip()

def add_multiple_values(property, keys):
    result = []
    count = 1

    print("Start setting {0}. Return \"|\" anytime to stop.".format(property))

    while True:
        print('Set #{0}: '.format(count))
        dict = {}
        for key in keys:
            value = input("{0}: ".format(key)).strip()
            if value == "|":
                return result

            dict[key] = value
        result.append(dict)
        count += 1

# used when the configuration file doesn't have the corresponding section
def create_config(part, properties):
    print("\nStart setting configuration for {0}!".format(part))
    new_config = {'autostart': 'yes'}

    for property in properties:
        if isinstance(property, dict):
            new_config[property["name"]] = add_multiple_values(property["name"], property["value"])
        else:
            if property in ["database_ip", "backend_ip", "frontend_ip"]:
                ip = input("Do you want to set 'localhost' as {0}? If so, press enter. If not, please enter an ip. ".format(property)).strip()
                if ip == "":
                    new_config[property] = "localhost"
                else:
                    new_config[property] = ip
            elif property == "database_port":
                database_port = input("Do you want to set '27017' as {0}? ('27017' is the default port of MongoDB) If so, press enter. If not, please enter a port. ".format(property)).strip()
                if database_port == "":
                    new_config[property] = "27017"
                else:
                    new_config[property] = database_port
            elif property in ["database_username", "database_password"]:
                new_config[property] = input("Please set {0} (if none, just hit enter):\n".format(property)).strip()
            else:
                new_config[property] = add_single_value(property)

    config[part] = new_config

    with open(path, 'w') as config_file:
            config.write(config_file)

    print("{0}That's it for {1} configuration.{2}".format(green, part, reset))
    print("You can update the configuration in viziot.conf file later.")

def pypcap_property_convert(properties):
    for i in range(len(properties)):
        if properties[i] == 'ips':
            properties[i] = {"name": "ips", "value": ["ip", "name"]}
    return properties

def check_config(part):
    if part in config.sections():
        # print_config(part)
        if part == 'pypcap':
            all_properties = set(parts[part][part + "_properties_names"])
        else:
            all_properties = set(parts[part][part + "_properties"])

        existed_properties = set(config.options(part))
        existed_properties.remove("autostart")
        missing_properties = all_properties - existed_properties
        missing_properties_list = list(missing_properties)

        # all the properties need a value, even if it's an empty string, 
        if missing_properties:
            print("{0}Error: The following properties in {1} section need to be set: {2}{3}".format(red, part, ', '.join(missing_properties_list), reset))     
            return False
        else:
            return True
    else:
        print("\nYou haven't set configuration for {0}. Let's set the configuration now!".format(part))
        create_config(part, parts[part][part + "_properties"])
        return True

# print backend url and frontend url
def print_url(parts):
    if "backend" in parts:
        backend_ip = config.get("backend", "backend_ip") or "localhost"
        backend_port = config.get("backend", "backend_port") or "3000"
        print("The backend is running on {0}:{1}".format(backend_ip, backend_port))
    if "frontend" in parts:
        frontend_ip = config.get("frontend", "frontend_ip") or "localhost"
        frontend_port = config.get("frontend", "frontend_port") or "8080"
        print("The frontend is running on {0}:{1}".format(frontend_ip, frontend_port))

def main():
    if len(sys.argv) > 1 and sys.argv[1] == 'stop':
        config.read(path)
        if "frontend" in config.sections():
            frontend_ip = config.get("frontend", "frontend_ip") or "localhost"
            frontend_port = config.get("frontend", "frontend_port") or "8080"
            # find the pid to stop the process later
            frontend_process_identifier = "tcp://{0}:{1}".format(frontend_ip, frontend_port)
            stop(frontend_process_identifier)
        else:
            stop()

    elif "p" in sys.argv or "b" in sys.argv or "f" in sys.argv:
        parts_start = []
        if "p" in sys.argv:
            parts_start.append("pypcap")
        if "b" in sys.argv:
            parts_start.append("backend")
        if "f" in sys.argv:
            parts_start.append("frontend")

        config_exist = os.path.isfile(path)
        # if configuration exists
        if config_exist:
            config.read(path)

            if 'pypcap' in parts_start and not check_config("pypcap"):
                return
            if 'backend' in parts_start and not check_config("backend"):
                return
            if 'frontend' in parts_start and not check_config("frontend"):
                return

        # if configuration doesn't exist       
        else:
            print("Configuration file missing. Let's set the configuration now!")

            for part_name in parts_start:
                create_config(part_name, parts[part_name][part_name + "_properties"])

        print("Starting the project...")
        # for the frontend, an identifier is required to find the process, so that it can be stopped
        run(config, parts_start)
        print("{0}The project has started.{1}".format(green, reset))        
        print_url(parts_start)
        print("You can stop it by executing this command 'sudo python3 viziot.py stop'")
    else:
        print("{0}Error: command not found{1}".format(red, reset))
    return
    

if __name__ == '__main__':
    main()
