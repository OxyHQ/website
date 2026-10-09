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

# Render from the live definition, but pin this deployment to the image built
# by this run. Reusing the live image silently redeploys an old digest even when
# ECS reports a successful rollout.
RELEASE_SHA="${GITHUB_SHA:?exact built commit required}"
ECR_REGISTRY="${ECR_REGISTRY:?ECR registry required}"
[[ "$RELEASE_SHA" =~ ^[0-9a-f]{40}$ ]] || { echo "invalid release SHA" >&2; exit 1; }
EXPECTED_DIGEST=$(aws ecr describe-images --repository-name "oxy/$SERVICE" \
  --image-ids "imageTag=$RELEASE_SHA" --region "$AWS_REGION" \
  --query 'imageDetails[0].imageDigest' --output text)
[[ "$EXPECTED_DIGEST" =~ ^sha256:[0-9a-f]{64}$ ]] || { echo "built image digest missing" >&2; exit 1; }
EXPECTED_IMAGE="$ECR_REGISTRY/oxy/$SERVICE@$EXPECTED_DIGEST"
TASK_DEFINITION=$(aws ecs describe-services --cluster "$CLUSTER" --services "$SERVICE" \
  --region "$AWS_REGION" --query 'services[0].taskDefinition' --output text)
WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT
aws ecs describe-task-definition --task-definition "$TASK_DEFINITION" \
  --region "$AWS_REGION" --query 'taskDefinition' > "$WORK_DIR/task-definition.json"
jq -e --arg name "$SERVICE" '[.containerDefinitions[] | select(.name == $name)] | length == 1' \
  "$WORK_DIR/task-definition.json" >/dev/null

# Preserve the existing Intercom secret compatibility fix without changing
# other containers, environment, roles, resource limits or secret references.
SECRET_ARN=""
if [ "$SERVICE" = "website-api" ] && ! jq -e --arg name "INTERCOM_MESSENGER_SECRET" \
  'any(.containerDefinitions[] | select(.name == "website-api") | (.secrets // [])[]?; .name == $name)' \
  "$WORK_DIR/task-definition.json" >/dev/null; then
  ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
  SECRET_ARN="arn:aws:ssm:$AWS_REGION:$ACCOUNT_ID:parameter/oxy/$SERVICE/INTERCOM_MESSENGER_SECRET"
fi
jq --arg container "$SERVICE" --arg image "$EXPECTED_IMAGE" --arg secret "$SECRET_ARN" '
  del(.taskDefinitionArn, .revision, .status, .requiresAttributes,
      .compatibilities, .registeredAt, .registeredBy, .tags)
  | .containerDefinitions |= map(
      if .name == $container then
        .image = $image
        | if $secret != "" then
            .secrets = ((.secrets // []) + [{name: "INTERCOM_MESSENGER_SECRET", valueFrom: $secret}])
          else . end
      else . end
    )
' "$WORK_DIR/task-definition.json" > "$WORK_DIR/task-definition-updated.json"
TASK_DEFINITION=$(aws ecs register-task-definition --region "$AWS_REGION" \
  --cli-input-json "file://$WORK_DIR/task-definition-updated.json" \
  --query 'taskDefinition.taskDefinitionArn' --output text)
echo "registered $TASK_DEFINITION for $EXPECTED_IMAGE"

# Start both replacement tasks at once, next to the old ones: 200% with a 100%
# healthy floor. At 150% they were replaced one at a time — two waves of start,
# health checks and drain, ~470 s (2026-09-30). Two new tasks booting together
# is safe because boot migrations run under an advisory lock
# (server/db/migrationLock.ts): the second waits, then finds nothing pending.
# Set here rather than by a terraform apply, which for this service would drag
# unrelated task-definition drift along; oxy-infra declares the same 200/100.
read -r ID STARTED <<<"$(aws ecs update-service --cluster "$CLUSTER" --service "$SERVICE" \
  --region "$AWS_REGION" \
  --task-definition "$TASK_DEFINITION" \
  --deployment-configuration '{
    "deploymentCircuitBreaker": {"enable": true, "rollback": true},
    "minimumHealthyPercent": 100,
    "maximumPercent": 200
  }' \
  --force-new-deployment \
  --query 'service.deployments[?status==`PRIMARY`].[id,createdAt] | [0]' --output text)"
echo "deployment $ID started $STARTED"

aws ecs wait services-stable --cluster "$CLUSTER" --services "$SERVICE" || true

# The waiter can exhaust its fixed attempt budget while ECS is completing the
# final drain (observed one second before rolloutState became COMPLETED). Give
# only the same deployment a short final grace window; a rollback or supersede
# exits the loop immediately and is classified below.
for _ in {1..6}; do
  # Free text last: `read` puts the remainder in the final variable.
  read -r LIVE STATE LIVE_AT REASON <<<"$(aws ecs describe-services --cluster "$CLUSTER" --services "$SERVICE" \
    --query 'services[0].deployments[?status==`PRIMARY`].[id,rolloutState,createdAt,rolloutStateReason] | [0]' --output text)"
  if [ "$LIVE" != "$ID" ] || [ "$STATE" != "IN_PROGRESS" ]; then
    break
  fi
  sleep 10
done

if [ "$LIVE" = "$ID" ]; then
  if [ "$STATE" != "COMPLETED" ]; then
    echo "::error::deploy did not take: $ID is $STATE — $REASON"
    aws ecs describe-services --cluster "$CLUSTER" --services "$SERVICE" \
      --query 'services[0].events[0:8].message' --output text
    exit 1
  fi
  RUNNING_TASKS=$(aws ecs list-tasks --cluster "$CLUSTER" --service-name "$SERVICE" \
    --region "$AWS_REGION" --desired-status RUNNING --query 'taskArns' --output text)
  if [ -z "$RUNNING_TASKS" ] || [ "$RUNNING_TASKS" = "None" ]; then
    echo "::error::no running tasks to verify"; exit 1
  fi
  read -ra TASK_ARNS <<<"$RUNNING_TASKS"
  aws ecs describe-tasks --cluster "$CLUSTER" --tasks "${TASK_ARNS[@]}" \
    --region "$AWS_REGION" > "$WORK_DIR/running-tasks.json"
  if ! jq -e --arg name "$SERVICE" --arg digest "$EXPECTED_DIGEST" '
    [.tasks[].containers[] | select(.name == $name)] as $containers
    | ($containers | length > 0) and all($containers[]; .imageDigest == $digest)
  ' "$WORK_DIR/running-tasks.json" >/dev/null; then
    echo "::error::running tasks do not serve the built image $EXPECTED_DIGEST"; exit 1
  fi
  echo "deployed $SERVICE ($STATE, $EXPECTED_DIGEST)"
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
