#!/usr/bin/env bash
#
# Roll the ECS service onto the image that was just pushed, and report whether
# the deployment this script started is the one still running.
#
# `aws ecs wait services-stable` is NOT a deploy check. The service carries a
# deployment circuit breaker with rollback, so when tasks fail to start ECS
# reverts to the previous deployment and the service becomes stable again — on
# the OLD image — and the wait exits 0. That is what it did on 2026-08-07 while
# the first Postgres image was crashing at boot for want of DATABASE_URL: the
# job went green on a deploy that never happened.
#
# A rollback and a supersede look the same from the outside — a different
# deployment is PRIMARY — and they differ in one observable way: the deployment
# that took over is OLDER in the first case and NEWER in the second. Only the
# old one is a failure.
#
# Usage: deploy-ecs.sh <cluster> <service>
set -euo pipefail

CLUSTER="${1:?cluster required}"
SERVICE="${2:?service required}"
AWS_REGION="${AWS_REGION:?AWS_REGION required}"

STATUS=$(aws ecs describe-services --cluster "$CLUSTER" --services "$SERVICE" \
  --query 'services[0].status' --output text 2>/dev/null || echo NONE)
if [ "$STATUS" != "ACTIVE" ]; then
  echo "ECS service $SERVICE not created yet — image is in ECR, skipping deploy"
  exit 0
fi

# The website API's Intercom secret is synced to SSM by the deploy workflow,
# but older live task definitions predate that secret. Keep the task definition
# update narrowly scoped to this service and clone the live definition so that
# fields managed outside the current Terraform checkout are preserved.
TASK_DEFINITION=$(aws ecs describe-services --cluster "$CLUSTER" --services "$SERVICE" \
  --region "$AWS_REGION" --query 'services[0].taskDefinition' --output text)
if [ "$SERVICE" = "website-api" ]; then
  WORK_DIR=$(mktemp -d)
  trap 'rm -rf "$WORK_DIR"' EXIT
  aws ecs describe-task-definition --task-definition "$TASK_DEFINITION" \
    --region "$AWS_REGION" --query 'taskDefinition' \
    > "$WORK_DIR/task-definition.json"

  if ! jq -e --arg name "INTERCOM_MESSENGER_SECRET" \
    '.containerDefinitions[] | (.secrets // [])[]? | .name == $name' \
    "$WORK_DIR/task-definition.json" >/dev/null; then
    # The ARN is spelled out rather than read back: the deploy role may WRITE
    # /oxy/* (the sync step above just put this parameter there) but not read
    # it, and `ssm:GetParameter` was failing the whole deploy for the sake of a
    # string this line can build. ECS resolves it at task start; if the sync
    # skipped an empty secret, that is where it surfaces.
    ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
    SECRET_ARN="arn:aws:ssm:$AWS_REGION:$ACCOUNT_ID:parameter/oxy/$SERVICE/INTERCOM_MESSENGER_SECRET"
    jq --arg container "$SERVICE" --arg name "INTERCOM_MESSENGER_SECRET" \
      --arg valueFrom "$SECRET_ARN" '
      del(.taskDefinitionArn, .revision, .status, .requiresAttributes,
          .compatibilities, .registeredAt, .registeredBy, .tags)
      | .containerDefinitions |= map(
          if .name == $container then
            .secrets = ((.secrets // []) + [{name: $name, valueFrom: $valueFrom}])
          else . end
        )
    ' "$WORK_DIR/task-definition.json" > "$WORK_DIR/task-definition-updated.json"
    TASK_DEFINITION=$(aws ecs register-task-definition \
      --region "$AWS_REGION" \
      --cli-input-json "file://$WORK_DIR/task-definition-updated.json" \
      --query 'taskDefinition.taskDefinitionArn' --output text)
    echo "registered $TASK_DEFINITION with Intercom secret"
  fi
fi

read -r ID STARTED <<<"$(aws ecs update-service --cluster "$CLUSTER" --service "$SERVICE" \
  --region "$AWS_REGION" \
  --task-definition "$TASK_DEFINITION" \
  --force-new-deployment \
  --query 'service.deployments[?status==`PRIMARY`].[id,createdAt] | [0]' --output text)"
echo "deployment $ID started $STARTED"

aws ecs wait services-stable --cluster "$CLUSTER" --services "$SERVICE" || true

# Free text last: `read` puts the remainder in the final variable.
read -r LIVE STATE LIVE_AT REASON <<<"$(aws ecs describe-services --cluster "$CLUSTER" --services "$SERVICE" \
  --query 'services[0].deployments[?status==`PRIMARY`].[id,rolloutState,createdAt,rolloutStateReason] | [0]' --output text)"

if [ "$LIVE" = "$ID" ]; then
  if [ "$STATE" != "COMPLETED" ]; then
    echo "::error::deploy did not take: $ID is $STATE — $REASON"
    aws ecs describe-services --cluster "$CLUSTER" --services "$SERVICE" \
      --query 'services[0].events[0:8].message' --output text
    exit 1
  fi
  echo "deployed $SERVICE ($STATE)"
elif [ "$(date -d "$LIVE_AT" +%s)" -gt "$(date -d "$STARTED" +%s)" ]; then
  # A newer deployment took over — another push, not a rollback. Its own run
  # owns that outcome; failing here would make every concurrent push red.
  echo "::notice::superseded by $LIVE, started after this one; that run reports its own result"
else
  echo "::error::rolled back to $LIVE (started $LIVE_AT, before this deploy) — the old image is serving"
  aws ecs describe-services --cluster "$CLUSTER" --services "$SERVICE" \
    --query 'services[0].events[0:8].message' --output text
  exit 1
fi
