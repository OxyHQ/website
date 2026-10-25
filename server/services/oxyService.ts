import { OxyServer } from '@oxy.so/core/server';
import { createAwsWorkloadCredentialProvider } from '@oxy.so/core/server/aws';
import { config } from '../config.js';

/** The registered website workload; customer credentials never stand in for this process. */
export const oxyService = new OxyServer({
  baseURL: config.oxyApiBase,
  cloudURL: config.oxyFiles.cloudUrl,
  workloadCredentials: createAwsWorkloadCredentialProvider(),
});

export const oxyTransport = oxyService.createServiceClient({
  baseURL: config.oxyApiBase,
  audience: 'oxy-api',
});
