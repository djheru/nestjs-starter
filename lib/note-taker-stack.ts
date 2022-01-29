import {
  aws_ec2,
  aws_ecs,
  aws_iam,
  aws_rds,
  aws_secretsmanager,
  CfnOutput,
  RemovalPolicy,
  Stack,
  StackProps,
} from 'aws-cdk-lib';
import { snakeCase } from 'change-case';
import { Construct } from 'constructs';
import { EcsService } from './ecs-service';
import { NoteTakerPipeline } from './note-taker-pipeline';

export type Environment = 'dev' | 'prod' | 'test' | string;
export interface NoteTakerStackProps extends StackProps {
  environmentName: Environment;
  serviceName: string;
  hostedZoneDomainName: string;
  databaseUsername?: string;
  defaultDatabaseName?: string;
  deletionProtection?: boolean;
  instanceType?: aws_ec2.InstanceType;
  maxAzs?: number;
  removalPolicy?: RemovalPolicy;
}

export class NoteTakerStack extends Stack {
  public id: string;
  public environmentName: Environment;
  public serviceName: string;
  public hostedZoneDomainName: string;

  // VPC Resources
  public vpc: aws_ec2.Vpc;
  public rdsDbSg: aws_ec2.SecurityGroup;
  public bastionHost: aws_ec2.BastionHostLinux;

  // DB Instance Resources
  public databaseCredentialsSecret: aws_secretsmanager.Secret;
  public databaseCredentialsSecretName: string;
  public databaseInstance: aws_rds.DatabaseInstance;
  public databaseProxyEndpoint: string;

  // Service
  public ecsTaskRole: aws_iam.Role;
  public ecsService: EcsService;

  // CICD Pipeline
  public noteTakerPipeline: NoteTakerPipeline;

  constructor(scope: Construct, id: string, private readonly props: NoteTakerStackProps) {
    super(scope, id, props);

    const { environmentName, hostedZoneDomainName, serviceName } = props;
    this.id = id;
    this.environmentName = environmentName;
    this.serviceName = serviceName;
    this.hostedZoneDomainName = hostedZoneDomainName;

    this.buildResources();
  }

  buildResources() {
    this.buildVpc();
    this.buildSecurityGroup();
    this.buildBastionHost();
    this.buildDatabaseCredentialsSecret();
    this.buildDatabaseInstance();
    this.buildEcsService();
    this.buildNoteTakerPipeline();
  }

  buildVpc() {
    const vpcId = `${this.id}-vpc`;
    this.vpc = new aws_ec2.Vpc(this, vpcId, {
      enableDnsHostnames: true,
      enableDnsSupport: true,
      flowLogs: {
        S3Flowlogs: {
          destination: aws_ec2.FlowLogDestination.toS3(),
        },
      },
      maxAzs: this.props.maxAzs || 2,
      gatewayEndpoints: {
        S3: { service: aws_ec2.GatewayVpcEndpointAwsService.S3 },
      },
    });
    this.vpc.addInterfaceEndpoint(`${vpcId}-endpoint-ecr-docker`, {
      service: aws_ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
    });
    this.vpc.addInterfaceEndpoint(`${vpcId}-endpoint-ecr`, {
      service: aws_ec2.InterfaceVpcEndpointAwsService.ECR,
    });
    this.vpc.addInterfaceEndpoint(`${vpcId}-endpoint-logs`, {
      service: aws_ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
    });
    this.vpc.addInterfaceEndpoint(`${vpcId}-endpoint-secrets-manager`, {
      service: aws_ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
    });
    this.vpc.addInterfaceEndpoint(`${vpcId}-endpoint-ssm`, {
      service: aws_ec2.InterfaceVpcEndpointAwsService.SSM,
    });
  }

  buildSecurityGroup() {
    const rdsDbSgId = `${this.id}-rds-db-sg`;
    this.rdsDbSg = new aws_ec2.SecurityGroup(this, rdsDbSgId, {
      vpc: this.vpc,
    });

    this.rdsDbSg.addIngressRule(
      this.rdsDbSg,
      aws_ec2.Port.tcp(5432),
      'Allow connections to RDS DB from application'
    );

    const vpcOutputId = `output-vpc-id`;
    new CfnOutput(this, vpcOutputId, {
      value: this.vpc.vpcId,
      exportName: `${this.id}-${vpcOutputId}`,
    });
  }

  buildBastionHost() {
    const bastionHostId = `${this.id}-bastion-host`;
    this.bastionHost = new aws_ec2.BastionHostLinux(this, bastionHostId, {
      vpc: this.vpc,
      instanceName: bastionHostId,
      subnetSelection: {
        subnetType: aws_ec2.SubnetType.PUBLIC,
      },
      securityGroup: this.rdsDbSg,
    });

    this.bastionHost.allowSshAccessFrom(aws_ec2.Peer.anyIpv4());

    const bastionHostnameOutputId = `output-bastion-hostname`;
    new CfnOutput(this, bastionHostnameOutputId, {
      value: this.bastionHost.instancePublicDnsName,
      exportName: `${this.id}-${bastionHostnameOutputId}`,
    });

    const bastionIdOutputId = `output-bastion-id`;
    new CfnOutput(this, bastionIdOutputId, {
      value: this.bastionHost.instanceId,
      exportName: `${this.id}-${bastionIdOutputId}`,
    });
  }

  buildDatabaseCredentialsSecret() {
    this.databaseCredentialsSecretName = `${this.id}-db-secret`;
    this.databaseCredentialsSecret = new aws_secretsmanager.Secret(
      this,
      this.databaseCredentialsSecretName,
      {
        secretName: this.databaseCredentialsSecretName,
        generateSecretString: {
          secretStringTemplate: JSON.stringify({
            username: this.props.databaseUsername || snakeCase(`${this.id}`),
          }),
          excludePunctuation: true,
          includeSpace: false,
          generateStringKey: 'password',
        },
      }
    );

    const dbCredentialsSecretNameOutputId = `db-credentials-secret-name`;
    new CfnOutput(this, dbCredentialsSecretNameOutputId, {
      value: this.databaseCredentialsSecret.secretName,
      exportName: `${this.id}-${dbCredentialsSecretNameOutputId}`,
    });
  }

  buildDatabaseInstance() {
    const databaseInstanceId = `${this.id}-db`;
    this.databaseInstance = new aws_rds.DatabaseInstance(this, databaseInstanceId, {
      deletionProtection: this.props.deletionProtection || false,
      removalPolicy: this.props.removalPolicy || RemovalPolicy.DESTROY,
      databaseName: this.props.defaultDatabaseName || snakeCase(this.id),
      engine: aws_rds.DatabaseInstanceEngine.postgres({
        version: aws_rds.PostgresEngineVersion.VER_12,
      }),
      instanceType: aws_ec2.InstanceType.of(
        aws_ec2.InstanceClass.T4G,
        aws_ec2.InstanceSize.MICRO
      ),
      instanceIdentifier: `${databaseInstanceId}-id`,
      credentials: aws_rds.Credentials.fromSecret(this.databaseCredentialsSecret),
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: aws_ec2.SubnetType.PRIVATE_WITH_NAT,
      },
      securityGroups: [this.rdsDbSg],
    });

    const rdsDbOutputId = `db-endpoint`;
    new CfnOutput(this, rdsDbOutputId, {
      value: this.databaseInstance.instanceEndpoint.hostname,
      exportName: `${this.id}-${rdsDbOutputId}`,
    });
  }

  buildEcsService() {
    const taskEnvironment = {
      NAME: this.props.serviceName,
      NODE_ENV: this.environmentName,
      ADDRESS: '0.0.0.0',
      PORT: '4000',
      NO_COLOR: 'true',
    };
    const taskSecrets = {
      PGUSER: aws_ecs.Secret.fromSecretsManager(
        this.databaseCredentialsSecret,
        'username'
      ),
      PGPASSWORD: aws_ecs.Secret.fromSecretsManager(
        this.databaseCredentialsSecret,
        'password'
      ),
      PGDATABASE: aws_ecs.Secret.fromSecretsManager(
        this.databaseCredentialsSecret,
        'dbname'
      ),
      PGHOST: aws_ecs.Secret.fromSecretsManager(this.databaseCredentialsSecret, 'host'),
      PGPORT: aws_ecs.Secret.fromSecretsManager(this.databaseCredentialsSecret, 'port'),
    };

    const ecsServiceId = `${this.id}-service`;
    this.ecsService = new EcsService(this, ecsServiceId, {
      environmentName: this.environmentName,
      hostedZoneDomainName: this.hostedZoneDomainName,
      securityGroup: this.rdsDbSg,
      serviceName: this.serviceName,
      taskEnvironment,
      taskSecrets,
      vpc: this.vpc,
      autoscalingConfig: {
        maxCapacity: 4,
        minCapacity: 1,
        cpuTargetUtilizationPercent: 50,
        ramTargetUtilizationPercent: 50,
      },
    });
  }

  buildNoteTakerPipeline() {
    const noteTakerPipelineId = `${this.id}-cicd`;
    this.noteTakerPipeline = new NoteTakerPipeline(this, noteTakerPipelineId, {
      cluster: this.ecsService.cluster,
      databaseCredentialsSecretArn: this.databaseCredentialsSecret.secretArn,
      environmentName: this.environmentName,
      repository: this.ecsService.ecrRepository,
      securityGroup: this.rdsDbSg,
      service: this.ecsService,
      vpc: this.vpc,
    });
  }
}
