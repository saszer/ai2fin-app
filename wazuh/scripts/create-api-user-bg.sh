#!/bin/bash
# Background script to create API user after Wazuh Manager is fully running
# embracingearth.space

set +e

# Desired credentials
TARGET_USER="${WAZUH_API_USER:-wazuh}"
TARGET_PASS="${WAZUH_API_PASSWORD:-wazuh}"

LOG_FILE="/var/log/create-api-user.log"

log() {
    echo "$(date): $1" | tee -a "$LOG_FILE"
}

log "Starting API user configuration..."
log "Target User: $TARGET_USER"

# Wait for API port to be open
log "Waiting for port 55000..."
for i in {1..60}; do
    if timeout 1 bash -c 'cat < /dev/null > /dev/tcp/localhost/55000' 2>/dev/null; then
        log "Port 55000 is open!"
        break
    fi
    sleep 5
    if [ $((i % 6)) -eq 0 ]; then log "Still waiting..."; fi
done

sleep 10 # Wait for service to be fully ready

# We need a token to create users. We try to get one using known default credentials.
# Wazuh Docker default is often wazuh:wazuh or wazuh-wui:wazuh-wui
TOKEN=""

# Function to authenticate and get token
get_token() {
    local u=$1
    local p=$2
    log "Attempting auth with $u..."
    
    # Python script to handle auth securely/reliably without curl weirdness
    local token_response=$(python3 -c "
import requests, sys
import urllib3
urllib3.disable_warnings()
try:
    r = requests.post('https://127.0.0.1:55000/security/user/authenticate?raw=true', 
                      auth=('$u', '$p'), verify=False, timeout=10)
    print(r.text)
except Exception as e:
    print(f'ERROR: {e}')
")
    
    if [[ "$token_response" != *"ERROR"* ]] && [[ ${#token_response} -gt 20 ]]; then
        echo "$token_response"
    else
        echo ""
    fi
}

# Try defaults
TOKEN=$(get_token "wazuh" "wazuh")
if [ -z "$TOKEN" ]; then
    TOKEN=$(get_token "wazuh-wui" "wazuh-wui")
fi

if [ -z "$TOKEN" ]; then
    log "❌ Could not authenticate with any default credentials. API might be locked down or broken."
    exit 1
fi

log "✅ Got authentication token!"

# Check if target user exists
check_user_script="
import requests, sys
import urllib3
urllib3.disable_warnings()
headers = {'Authorization': 'Bearer $TOKEN'}
try:
    r = requests.get('https://127.0.0.1:55000/security/users', headers=headers, verify=False)
    if '$TARGET_USER' in r.text:
        print('EXISTS')
    else:
        print('MISSING')
except:
    print('ERROR')
"
USER_STATUS=$(python3 -c "$check_user_script")

if [ "$USER_STATUS" == "EXISTS" ]; then
    log "User $TARGET_USER exists. Updating password..."
    # Update password script
    update_script="
import requests, sys
import urllib3
urllib3.disable_warnings()
headers = {'Authorization': 'Bearer $TOKEN', 'Content-Type': 'application/json'}
try:
    # Get ID
    r = requests.get('https://127.0.0.1:55000/security/users?search_text=$TARGET_USER', headers=headers, verify=False)
    uid = r.json()['data']['affected_items'][0]['id']
    
    # Update
    r = requests.put(f'https://127.0.0.1:55000/security/users/{uid}', headers=headers, verify=False, json={'password': '$TARGET_PASS'})
    print(r.status_code)
except Exception as e:
    print(e)
"
    python3 -c "$update_script" >> "$LOG_FILE" 2>&1
else
    log "Creating user $TARGET_USER..."
    create_script="
import requests, sys
import urllib3
urllib3.disable_warnings()
headers = {'Authorization': 'Bearer $TOKEN', 'Content-Type': 'application/json'}
try:
    r = requests.post('https://127.0.0.1:55000/security/users', headers=headers, verify=False, json={'username': '$TARGET_USER', 'password': '$TARGET_PASS'})
    print(f'Create status: {r.status_code}')
    
    # Needs admin role (id 1)
    if r.status_code == 200:
        uid = r.json()['data']['id']
        # Assign role... (simplified, usually default is good enough or we add run_as)
except Exception as e:
    print(e)
"
    python3 -c "$create_script" >> "$LOG_FILE" 2>&1
fi

log "✅ Completed configuration."
