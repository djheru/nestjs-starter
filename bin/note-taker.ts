#!/usr/bin/env node
import 'source-map-support/register';
import { App, StackProps, Tags } from 'aws-cdk-lib';
import { NoteTakerStack } from '../lib/note-taker-stack';
import { snakeCase } from 'change-case';

const {
  CDK_ENV: environmentName = 'dev',
  CDK_DEFAULT_ACCOUNT,
  AWS_DEFAULT_ACCOUNT_ID,
  CDK_DEFAULT_REGION,
  AWS_DEFAULT_REGION,
} = process.env;

const account = CDK_DEFAULT_ACCOUNT || AWS_DEFAULT_ACCOUNT_ID;
const region = CDK_DEFAULT_REGION || AWS_DEFAULT_REGION;

const app = new App();

const noteTakerStackProps: StackProps = {
  description: `Summary: This stack is responsible for handling the Note Taker resources.
Deployment: This stack supports deployments to the standard environments. The stack 
can be deployed to a custom environment (e.g. a developer environment) by ensuring 
that the desired environment name (e.g. ${environmentName}) is set in the $CDK_ENV environment 
variable`,
  env: {
    account,
    region,
  },
};

const hostedZoneDomainName = 'ensomata.io';
const serviceName = 'note-taker';

const stackId = `${serviceName}-${environmentName}`;
const noteTakerStack = new NoteTakerStack(app, stackId, {
  ...noteTakerStackProps,
  defaultDatabaseName: snakeCase(serviceName),
  environmentName,
  hostedZoneDomainName,
  serviceName,
});

Tags.of(noteTakerStack).add('application', serviceName);
Tags.of(noteTakerStack).add('stack', serviceName);
Tags.of(noteTakerStack).add('environmentName', environmentName);
