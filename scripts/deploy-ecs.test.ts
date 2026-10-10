import { expect, test } from 'bun:test';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const digest = `sha256:${'b'.repeat(64)}`;
const original = {
  family: 'oxy-website-api',
  revision: 11,
  taskDefinitionArn: 'old-definition',
  cpu: '512',
  memory: '1024',
  taskRoleArn: 'existing-role',
  containerDefinitions: [
    {
      name: 'website-api',
      image: `registry/oxy/website-api@sha256:${'a'.repeat(64)}`,
      environment: [{ name: 'PORT', value: '8080' }],
      secrets: [{ name: 'INTERCOM_MESSENGER_SECRET', valueFrom: 'existing-secret' }],
    },
    { name: 'sidecar', image: 'unchanged-sidecar' },
  ],
};

for (const wrongDigest of [false, true])
  test(`pinned deployment ${wrongDigest ? 'rejects stale running image' : 'replaces only the app image and verifies the running digest'}`, async () => {
    const dir = await mkdtemp(join(tmpdir(), 'website-deploy-test-'));
    try {
      await writeFile(join(dir, 'original.json'), JSON.stringify(original));
      await writeFile(
        join(dir, 'aws'),
        `#!/usr/bin/env python3
import sys, os, json
from pathlib import Path
args=sys.argv[1:]; root=Path(os.environ['DEPLOY_TEST_DIR']); op=args[1]
def arg(name): return args[args.index(name)+1]
if op=='describe-images': print(os.environ['EXPECTED_TEST_DIGEST'])
elif op=='describe-services':
 q=arg('--query')
 if q.endswith('.status'): print('ACTIVE')
 elif q.endswith('.taskDefinition'): print('old-definition')
 else: print('new-deployment\\tCOMPLETED\\t2026-10-09T01:00:00Z\\tHealthy')
elif op=='describe-task-definition': print((root/'original.json').read_text())
elif op=='register-task-definition':
 (root/'registered.json').write_text(Path(arg('--cli-input-json')[7:]).read_text()); print('new-definition')
elif op=='update-service':
 assert arg('--task-definition')=='new-definition'
 print('new-deployment\\t2026-10-09T01:00:00Z')
elif op=='wait': pass
elif op=='list-tasks': print('task-1\\ttask-2')
elif op=='describe-tasks': print(json.dumps({'tasks':[{'containers':[{'name':'website-api','imageDigest':os.environ['RUNNING_TEST_DIGEST']}]}]}))
else: raise Exception(args)
`,
        { mode: 0o755 },
      );
      const child = Bun.spawn(['bash', 'scripts/deploy-ecs.sh', 'oxy-cluster', 'website-api'], {
        env: {
          ...process.env,
          PATH: `${dir}:${process.env.PATH}`,
          AWS_REGION: 'us-west-2',
          ECR_REGISTRY: 'registry',
          GITHUB_SHA: 'c'.repeat(40),
          DEPLOY_TEST_DIR: dir,
          EXPECTED_TEST_DIGEST: digest,
          RUNNING_TEST_DIGEST: wrongDigest ? `sha256:${'a'.repeat(64)}` : digest,
        },
        stdout: 'pipe',
        stderr: 'pipe',
      });
      const [code, output] = await Promise.all([child.exited, new Response(child.stdout).text()]);
      expect(code).toBe(wrongDigest ? 1 : 0);
      expect(output).toContain(
        wrongDigest ? 'running tasks do not serve the built image' : `COMPLETED, ${digest}`,
      );
      const registered = JSON.parse(await readFile(join(dir, 'registered.json'), 'utf8'));
      const expected = JSON.parse(JSON.stringify(original));
      delete expected.revision;
      delete expected.taskDefinitionArn;
      expect(registered).toEqual({
        ...expected,
        containerDefinitions: [
          { ...original.containerDefinitions[0], image: `registry/oxy/website-api@${digest}` },
          original.containerDefinitions[1],
        ],
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
