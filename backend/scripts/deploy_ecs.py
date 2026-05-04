"""既存ECSサービスを最新イメージで更新するスクリプト"""

import json
import os
import subprocess
from typing import Any, Dict


def _run(cmd: list[str]) -> str:
    return subprocess.check_output(cmd, text=True).strip()


def main() -> None:
    region = os.getenv("AWS_REGION") or _run(["aws", "configure", "get", "region"]) or "ap-northeast-1"
    cluster = os.getenv("ECS_CLUSTER", "my-site-cluster")
    service = os.getenv("ECS_SERVICE", "my-site-service")
    family = os.getenv("ECS_TASK_FAMILY", "my-site-task")
    desired_count = os.getenv("ECS_DESIRED_COUNT", "1")
    app_env = os.getenv("APP_ENV", "production")
    image = os.getenv(
        "IMAGE_URI",
        "611410719225.dkr.ecr.ap-northeast-1.amazonaws.com/my-site-image:aws-exchange-app-20260503221516",
    )

    described = _run(
        [
            "aws",
            "ecs",
            "describe-task-definition",
            "--task-definition",
            family,
            "--region",
            region,
            "--no-cli-pager",
            "--output",
            "json",
        ]
    )
    td = json.loads(described)["taskDefinition"]
    container = td["containerDefinitions"][0]

    env = {e["name"]: e["value"] for e in container.get("environment", [])}
    user = env.get("DATABASE_USER", "postgres")
    password = env.get("DATABASE_PASSWORD", "")
    host = env.get("DATABASE_HOST", "")
    port = env.get("DATABASE_PORT", "5432")
    dbname = env.get("DATABASE_NAME", "postgres")
    env["DATABASE_URL"] = f"postgresql://{user}:{password}@{host}:{port}/{dbname}"
    env["APP_ENV"] = app_env
    if os.getenv("SECRET_KEY"):
        env["SECRET_KEY"] = os.getenv("SECRET_KEY", "")
    elif not env.get("SECRET_KEY"):
        env["SECRET_KEY"] = "change-this-in-ssm"

    container["image"] = image
    container["environment"] = [{"name": k, "value": v} for k, v in sorted(env.items())]

    payload: Dict[str, Any] = {
        "family": td["family"],
        "taskRoleArn": td.get("taskRoleArn"),
        "executionRoleArn": td.get("executionRoleArn"),
        "networkMode": td["networkMode"],
        "containerDefinitions": td["containerDefinitions"],
        "volumes": td.get("volumes", []),
        "placementConstraints": td.get("placementConstraints", []),
        "requiresCompatibilities": td.get("requiresCompatibilities", []),
        "cpu": td.get("cpu"),
        "memory": td.get("memory"),
        "runtimePlatform": td.get("runtimePlatform"),
    }
    payload = {k: v for k, v in payload.items() if v is not None}

    payload_path = "/tmp/aws-exchange-taskdef.json"
    with open(payload_path, "w", encoding="utf-8") as f:
        json.dump(payload, f)

    registered = _run(
        [
            "aws",
            "ecs",
            "register-task-definition",
            "--region",
            region,
            "--no-cli-pager",
            "--cli-input-json",
            f"file://{payload_path}",
            "--output",
            "json",
        ]
    )
    new_td = json.loads(registered)["taskDefinition"]["taskDefinitionArn"]

    _run(
        [
            "aws",
            "ecs",
            "update-service",
            "--region",
            region,
            "--cluster",
            cluster,
            "--service",
            service,
            "--task-definition",
            new_td,
            "--desired-count",
            desired_count,
            "--force-new-deployment",
            "--no-cli-pager",
        ]
    )

    print("UPDATED_TASK_DEFINITION=", new_td)
    print(f"SERVICE_DESIRED_COUNT={desired_count}")


if __name__ == "__main__":
    main()
