"""CloudFrontの /auth/* ビヘイビアを削除する"""

import json
import os
import subprocess

def run(cmd: list[str]) -> str:
    return subprocess.check_output(cmd, text=True)


def get_required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"{name} is required")
    return value


def main() -> None:
    distribution_id = get_required_env("CLOUDFRONT_DISTRIBUTION_ID")
    auth_path_pattern = os.getenv("CLOUDFRONT_AUTH_PATH_PATTERN", "/auth/*")

    raw = run(
        [
            "aws",
            "cloudfront",
            "get-distribution-config",
            "--id",
            distribution_id,
            "--no-cli-pager",
            "--output",
            "json",
        ]
    )
    obj = json.loads(raw)
    etag = obj["ETag"]
    config = obj["DistributionConfig"]

    items = config["CacheBehaviors"].get("Items", [])
    filtered = [b for b in items if b.get("PathPattern") != auth_path_pattern]

    if len(filtered) == len(items):
        print("no_change")
        return

    config["CacheBehaviors"]["Items"] = filtered
    config["CacheBehaviors"]["Quantity"] = len(filtered)

    with open("/tmp/cf-distribution-config-remove-auth.json", "w", encoding="utf-8") as f:
        json.dump(config, f)

    updated = run(
        [
            "aws",
            "cloudfront",
            "update-distribution",
            "--id",
            distribution_id,
            "--if-match",
            etag,
            "--distribution-config",
            "file:///tmp/cf-distribution-config-remove-auth.json",
            "--no-cli-pager",
            "--output",
            "json",
        ]
    )
    out = json.loads(updated)
    print(f"updated_status={out['Distribution']['Status']}")


if __name__ == "__main__":
    main()
