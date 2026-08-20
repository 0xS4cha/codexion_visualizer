#!/usr/bin/env python3

import os
import json
import urllib.request
import urllib.parse
import pandas as pd
from pydantic import BaseModel, TypeAdapter
from typing import TypeAlias

class User(BaseModel):
    username: str
    avatar_url: str
    url: str

UsersList: TypeAlias = list[User]
UsersListModel = TypeAdapter(UsersList)

def fetch(token):
    params = urllib.parse.urlencode({
        "q": '"https://codexion-visualizer.sacha-dev.me" filename:README.md',
        "per_page": 100,
    })

    url = f"https://api.github.com/search/code?{params}"

    req = urllib.request.Request(
        url,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": "2026-03-10",
            "User-Agent": "Python",
        }
    )

    with urllib.request.urlopen(req) as response:
        return response.read()

def main():
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        sys.exit("GITHUB_TOKEN is not set")

    result = json.loads(fetch(token).decode("utf-8"))["items"]
    data = []
    for k, v in enumerate(result):
        data.append(User(
            username=v["repository"]["owner"]["login"],
            avatar_url=v["repository"]["owner"]["avatar_url"],
            url=f"https://github.com/{v['repository']['full_name']}" 
        ))    
    with open("../src/assets/test.json", "wb") as f:
        f.write(UsersListModel.dump_json(data))
    
if __name__ == "__main__":
    main()