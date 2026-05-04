"""CloudFrontのALBオリジン接続を https-only から http-only に修正する"""

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
    alb_origin_id = get_required_env("CLOUDFRONT_ALB_ORIGIN_ID")
    origin_protocol_policy = os.getenv("CLOUDFRONT_ORIGIN_PROTOCOL_POLICY", "http-only")

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

    changed = False
    for origin in config["Origins"]["Items"]:
        if origin["Id"] == alb_origin_id and "CustomOriginConfig" in origin:
            if origin["CustomOriginConfig"].get("OriginProtocolPolicy") != origin_protocol_policy:
                origin["CustomOriginConfig"]["OriginProtocolPolicy"] = origin_protocol_policy
                changed = True

    if not changed:
        print("no_change")
        return

    with open("/tmp/cf-distribution-config-fixed-origin.json", "w", encoding="utf-8") as f:
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
            "file:///tmp/cf-distribution-config-fixed-origin.json",
            "--no-cli-pager",
            "--output",
            "json",
        ]
    )
    out = json.loads(updated)
    print(f"updated_status={out['Distribution']['Status']}")


if __name__ == "__main__":
    main()
