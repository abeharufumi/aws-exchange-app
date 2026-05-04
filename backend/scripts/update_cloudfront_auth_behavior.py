"""CloudFrontに /auth/* ビヘイビアを追加してALBへ転送する"""

import json
import os
import subprocess
from copy import deepcopy

def run(cmd: list[str]) -> str:
    return subprocess.check_output(cmd, text=True)


def get_required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"{name} is required")
    return value


def main() -> None:
    distribution_id = get_required_env("CLOUDFRONT_DISTRIBUTION_ID")
    api_path_pattern = os.getenv("CLOUDFRONT_API_PATH_PATTERN", "/api/*")
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

    behaviors = config["CacheBehaviors"].get("Items", [])
    if any(b.get("PathPattern") == auth_path_pattern for b in behaviors):
        print("already_exists")
        return

    api_behavior = None
    for b in behaviors:
        if b.get("PathPattern") == api_path_pattern:
            api_behavior = b
            break

    if api_behavior is None:
        raise RuntimeError(f"{api_path_pattern} behavior not found")

    new_behavior = deepcopy(api_behavior)
    new_behavior["PathPattern"] = auth_path_pattern
    behaviors.append(new_behavior)

    config["CacheBehaviors"]["Items"] = behaviors
    config["CacheBehaviors"]["Quantity"] = len(behaviors)

    with open("/tmp/cf-distribution-config-updated.json", "w", encoding="utf-8") as f:
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
            "file:///tmp/cf-distribution-config-updated.json",
            "--no-cli-pager",
            "--output",
            "json",
        ]
    )
    out = json.loads(updated)
    status = out["Distribution"]["Status"]
    print(f"updated_status={status}")


if __name__ == "__main__":
    main()
