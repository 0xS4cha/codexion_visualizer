#!/usr/bin/env python3

import os
import sys
import json
import urllib.request
import urllib.parse

def github_request(url, token):
    req = urllib.request.Request(
        url,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": "2026-03-10",
            "User-Agent": "codexion-visualizer",
        },
    )

    with urllib.request.urlopen(req) as response:
        return json.loads(response.read())


def search_repositories(token):
    repositories = []
    seen_urls = set()

    queries = [
        ('"codexion-visualizer.sacha-dev.me" in:readme', False),
        ('"codexion-visualizer.sacha-dev.me/" in:readme', False),
        ('codexion-visualizer sacha-dev in:readme', False),
        ('"codexion-visualizer.sacha-dev.me" filename:README', True),
    ]

    for query, search_code in queries:
        page = 1
        while True:
            params = urllib.parse.urlencode({
                "q": query,
                "per_page": 100,
                "page": page,
            })

            endpoint = "code" if search_code else "repositories"
            url = f"https://api.github.com/search/{endpoint}?{params}"
            response = github_request(url, token)
            items = response.get("items", [])

            print(
                f"Query [{query}]: page={page}, "
                f"total_count={response.get('total_count')}, "
                f"items={len(items)}"
            )

            for item in items:
                repo = item["repository"] if search_code else item

                if repo["html_url"] not in seen_urls:
                    seen_urls.add(repo["html_url"])
                    repositories.append(repo)
                    print(repo["html_url"])

            if len(items) < 100:
                break

            page += 1

    return repositories


def load_previous_count(path):
    if not os.path.exists(path):
        return None

    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return len(data)
    except (json.JSONDecodeError, OSError):
        return None


def main():
    token = os.environ.get("GITHUB_TOKEN")

    if not token:
        sys.exit("GITHUB_TOKEN is not set")

    repositories = search_repositories(token)

    users = {}

    for repo in repositories:
        owner = repo["owner"]

        users[repo["html_url"]] = {
            "username": owner["login"],
            "avatar_url": owner["avatar_url"],
            "url": repo["html_url"],
        }

    users = sorted(
        users.values(),
        key=lambda user: user["username"].lower(),
    )

    new_count = len(users)
    print(f"Found {new_count} users")

    output = "../src/assets/users.json"
    previous_count = load_previous_count(output)

    if previous_count is not None and previous_count > 0:
        drop_percent = (previous_count - new_count) / previous_count * 100

        print(
            f"Previous count={previous_count}, new count={new_count}, "
            f"drop={drop_percent:.1f}%"
        )

        if drop_percent > 20:
            raise RuntimeError(
                f"User count dropped by {drop_percent:.1f}% "
                f"(from {previous_count} to {new_count}), "
                f"which exceeds the allowed 20%. "
                "Refusing to overwrite users.json."
            )
    else:
        print("No previous users.json found (or empty) — skipping drop check.")

    with open(output, "w", encoding="utf-8") as f:
        json.dump(users, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"Wrote {output}")


if __name__ == "__main__":
    try:
        main()
    except:
        print("ERROR")