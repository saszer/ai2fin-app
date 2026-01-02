import requests
import sys
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def test_auth(user, password):
    url = "https://localhost:55000/security/user/authenticate?raw=true"
    try:
        response = requests.post(url, auth=(user, password), verify=False, timeout=5)
        print(f"User: {user}, Status: {response.status_code}, Body: {response.text}")
    except Exception as e:
        print(f"User: {user}, Error: {e}")

if __name__ == "__main__":
    print("Testing auth...")
    test_auth("wazuh", "wazuh")
    test_auth("wazuh-wui", "wazuh-wui")
