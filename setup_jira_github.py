#!/usr/bin/env python3
"""
CMMS Project Setup Script
Creates or verifies Jira Project and GitHub Repository for CMMS

IMPORTANT: This script requires valid Jira and GitHub credentials.
Set via environment variables BEFORE running:

  export JIRA_HOST="https://your-instance.atlassian.net"
  export JIRA_EMAIL="your-email@example.com"
  export JIRA_TOKEN="your-jira-api-token"
  export GITHUB_TOKEN="your-github-pat"

Obtain credentials:
  - GitHub PAT: https://github.com/settings/tokens
  - Jira Token: https://id.atlassian.com/manage/api-tokens
"""

import requests
import json
import base64
import sys
import time
import os

# Configuration from environment variables
JIRA_HOST = os.getenv("JIRA_HOST", "").strip()
JIRA_EMAIL = os.getenv("JIRA_EMAIL", "").strip()
JIRA_TOKEN = os.getenv("JIRA_TOKEN", "").strip()
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "").strip()

# Verify credentials are set
if not all([JIRA_HOST, JIRA_EMAIL, JIRA_TOKEN, GITHUB_TOKEN]):
    print("❌ Error: Missing required environment variables")
    print("")
    print("Required environment variables:")
    print("  - JIRA_HOST")
    print("  - JIRA_EMAIL")
    print("  - JIRA_TOKEN")
    print("  - GITHUB_TOKEN")
    print("")
    print("Set them using:")
    print('  export JIRA_HOST="https://your-instance.atlassian.net"')
    print('  export JIRA_EMAIL="your-email@example.com"')
    print('  export JIRA_TOKEN="your-api-token"')
    print('  export GITHUB_TOKEN="your-github-pat"')
    sys.exit(1)

# Prepare auth headers
jira_auth = base64.b64encode(f"{JIRA_EMAIL}:{JIRA_TOKEN}".encode()).decode()
github_headers = {"Authorization": f"Bearer {GITHUB_TOKEN}"}

def print_status(msg):
    print(f"\n{'='*70}\n  {msg}\n{'='*70}\n")

def print_success(msg):
    print(f"✅ {msg}")

def print_error(msg):
    print(f"❌ {msg}")

def print_info(msg):
    print(f"ℹ️  {msg}")

def verify_jira():
    """Verify Jira project exists"""
    print_status("JIRA Configuration Check")
    
    try:
        response = requests.get(
            f"{JIRA_HOST}/rest/api/3/projects/CMMS",
            headers={"Authorization": f"Basic {jira_auth}"},
            timeout=10
        )
        
        if response.status_code == 200:
            project = response.json()
            print_success(f"Jira project exists: {project.get('name')}")
            print_info(f"  Key: {project.get('key')}")
            print_info(f"  URL: {JIRA_HOST}/browse/CMMS")
            return True
        elif response.status_code == 404:
            print_error("Jira project not found. Manual setup required.")
            print_info(f"  Log in to: {JIRA_HOST}")
            print_info("  Create a new Scrum project with key: CMMS")
            return False
        else:
            print_error(f"Jira API error: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Failed to connect to Jira: {str(e)}")
        return False

def verify_github():
    """Verify GitHub repository exists"""
    print_status("GitHub Configuration Check")
    
    try:
        response = requests.get(
            "https://api.github.com/repos/KhobaitUddinSimran/CMMS",
            headers=github_headers,
            timeout=10
        )
        
        if response.status_code == 200:
            repo = response.json()
            print_success(f"GitHub repository exists: {repo.get('full_name')}")
            print_info(f"  URL: {repo.get('html_url')}")
            print_info(f"  Clone: git clone {repo.get('clone_url')}")
            return True
        elif response.status_code == 404:
            print_error("GitHub repository not found")
            print_info("  Create manually at: https://github.com/KhobaitUddinSimran/CMMS")
            return False
        else:
            print_error(f"GitHub API error: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Failed to connect to GitHub: {str(e)}")
        return False

def run_verification():
    """Run all verification checks"""
    print("\n" + "="*70)
    print("  CMMS Project Setup Verification")
    print("="*70 + "\n")
    
    jira_ok = verify_jira()
    time.sleep(1)  # Rate limiting
    github_ok = verify_github()
    
    print_status("Verification Summary")
    print(f"  Jira:   {'✅ OK' if jira_ok else '❌ FAILED'}")
    print(f"  GitHub: {'✅ OK' if github_ok else '❌ FAILED'}")
    
    if jira_ok and github_ok:
        print_success("All systems configured!")
        return 0
    else:
        print_error("Some systems require manual setup")
        return 1

if __name__ == "__main__":
    sys.exit(run_verification())
