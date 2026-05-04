"""ECS Fargateのワンショットタスクで init_db.py を実行する"""

import json
import os
import subprocess


def run(cmd: list[str]) -> str:
    return subprocess.check_output(cmd, text=True).strip()


def get_required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"{name} is required")
    return value


def main() -> None:
    region = os.getenv("AWS_REGION") or run(["aws", "configure", "get", "region"]) or "ap-northeast-1"
    cluster = os.getenv("ECS_CLUSTER", "my-site-cluster")

    task_def = os.getenv("ECS_TASK_DEFINITION", "").strip()
    if not task_def:
        family = os.getenv("ECS_TASK_FAMILY", "my-site-task")
        task_def = run(
            [
                "aws",
                "ecs",
                "describe-task-definition",
                "--task-definition",
                family,
                "--region",
                region,
                "--no-cli-pager",
                "--query",
                "taskDefinition.taskDefinitionArn",
                "--output",
                "text",
            ]
        )

    subnets = [s.strip() for s in get_required_env("ECS_SUBNETS").split(",") if s.strip()]
    sgs = [s.strip() for s in get_required_env("ECS_SECURITY_GROUPS").split(",") if s.strip()]
    assign_public_ip = os.getenv("ECS_ASSIGN_PUBLIC_IP", "ENABLED")
    container_name = os.getenv("ECS_CONTAINER_NAME", "my-site-container")
    init_command = os.getenv("INIT_DB_COMMAND", "python scripts/init_db.py")
    init_command_parts = [part.strip() for part in init_command.split(" ") if part.strip()]

    network = {
        "awsvpcConfiguration": {
            "subnets": subnets,
            "securityGroups": sgs,
            "assignPublicIp": assign_public_ip,
        }
    }
    overrides = {
        "containerOverrides": [
            {
                "name": container_name,
                "command": init_command_parts,
            }
        ]
    }

    out = run(
        [
            "aws",
            "ecs",
            "run-task",
            "--cluster",
            cluster,
            "--launch-type",
            "FARGATE",
            "--task-definition",
            task_def,
            "--count",
            "1",
            "--network-configuration",
            json.dumps(network),
            "--overrides",
            json.dumps(overrides),
            "--region",
            region,
            "--no-cli-pager",
            "--output",
            "json",
        ]
    )
    data = json.loads(out)
    if data.get("failures"):
        raise RuntimeError(f"run-task failure: {data['failures']}")

    task_arn = data["tasks"][0]["taskArn"]
    print(f"TASK_ARN={task_arn}")

    subprocess.check_call(
        [
            "aws",
            "ecs",
            "wait",
            "tasks-stopped",
            "--cluster",
            cluster,
            "--tasks",
            task_arn,
            "--region",
            region,
            "--no-cli-pager",
        ]
    )

    task_desc = json.loads(
        run(
            [
                "aws",
                "ecs",
                "describe-tasks",
                "--cluster",
                cluster,
                "--tasks",
                task_arn,
                "--region",
                region,
                "--no-cli-pager",
                "--output",
                "json",
            ]
        )
    )

    task = task_desc["tasks"][0]
    c = task["containers"][0]
    print(f"LAST_STATUS={task.get('lastStatus')}")
    print(f"STOPPED_REASON={task.get('stoppedReason')}")
    print(f"EXIT_CODE={c.get('exitCode')}")
    print(f"CONTAINER_REASON={c.get('reason')}")
    print(f"LOG_STREAM={c.get('logStreamName')}")


if __name__ == "__main__":
    main()
