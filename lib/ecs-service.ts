import {
  aws_ec2,
  aws_ecs,
  aws_ecs_patterns,
  aws_iam,
  aws_route53,
  aws_ecr,
  aws_certificatemanager,
  aws_elasticloadbalancingv2,
  CfnOutput,
  RemovalPolicy,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Environment } from './note-taker-stack';

export interface AutoScalingConfig {
  maxCapacity?: number;
  minCapacity?: number;
  cpuTargetUtilizationPercent?: number;
  ramTargetUtilizationPercent?: number;
}

export interface EcsServiceProps {
  environmentName: Environment;
  hostedZoneDomainName: string;
  securityGroup: aws_ec2.SecurityGroup;
  serviceName: string;
  taskEnvironment: Record<string, string>;
  taskSecrets: Record<string, aws_ecs.Secret>;
  vpc: aws_ec2.Vpc;
  autoscalingConfig?: AutoScalingConfig;
}

export class EcsService extends Construct {
  public id: string;
  public certificate: aws_certificatemanager.Certificate;
  public domainName: string;
  public serviceName: string;
  public environmentName: Environment;
  public hostedZoneDomainName: string;
  public securityGroup: aws_ec2.SecurityGroup;
  public taskEnvironment: Record<string, string>;
  public taskSecrets: Record<string, aws_ecs.Secret>;
  public vpc: aws_ec2.Vpc;
  public autoscalingConfig: AutoScalingConfig;

  public hostedZone: aws_route53.IHostedZone;
  public clusterAdminRole: aws_iam.Role;
  public taskRole: aws_iam.Role;
  public cluster: aws_ecs.Cluster;
  public ecsExecutionRolePolicy: aws_iam.PolicyStatement;
  public service: aws_ecs_patterns.ApplicationLoadBalancedFargateService;
  public ecrRepository: aws_ecr.Repository;

  constructor(scope: Construct, id: string, props: EcsServiceProps) {
    super(scope, id);

    const {
      environmentName,
      hostedZoneDomainName,
      securityGroup,
      serviceName,
      taskEnvironment,
      taskSecrets,
      vpc,
      autoscalingConfig,
    } = props;

    this.id = id;
    this.environmentName = environmentName;

    this.hostedZoneDomainName =
      this.environmentName === 'prod'
        ? hostedZoneDomainName
        : `${this.environmentName}.${hostedZoneDomainName}`;

    this.serviceName = serviceName;

    this.domainName = `${this.serviceName}.${this.hostedZoneDomainName}`;

    this.vpc = vpc;
    this.securityGroup = securityGroup;

    this.taskEnvironment = taskEnvironment;
    this.taskSecrets = taskSecrets;
    this.autoscalingConfig = autoscalingConfig || {};

    this.buildResources();
  }

  buildResources() {
    this.buildEcrRepository();
    this.buildRoles();
    this.loadHostedZone();
    this.createCertificate();
    this.buildCluster();
    this.buildExecutionRolePolicyStatement();
    this.buildEcsService();
    this.configureServiceAutoscaling();
  }

  buildEcrRepository() {
    const ecrRepositoryId = `${this.id}-ecr-repository`;
    this.ecrRepository = new aws_ecr.Repository(this, ecrRepositoryId, {
      imageScanOnPush: true,
      repositoryName: `note-taker-${this.environmentName}/${this.serviceName}`,
      lifecycleRules: [
        {
          description: 'Remove old images',
          maxImageCount: 50,
        },
      ],
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const ecrRepositoryOutputId = `ecr-repo-uri`;
    new CfnOutput(this, ecrRepositoryOutputId, {
      value: this.ecrRepository.repositoryUri,
      exportName: `${this.id}-${ecrRepositoryOutputId}`,
    });
  }

  buildRoles() {
    const clusterAdminRoleId = `${this.id}-cluster-admin-role`;
    this.clusterAdminRole = new aws_iam.Role(this, clusterAdminRoleId, {
      assumedBy: new aws_iam.AccountRootPrincipal(),
    });

    const taskRoleId = `${this.id}-task-role`;
    this.taskRole = new aws_iam.Role(this, taskRoleId, {
      roleName: taskRoleId,
      assumedBy: new aws_iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy'
        ),
      ],
    });
  }

  private loadHostedZone() {
    const hostedZoneId = `${this.id}-hostedZone`;
    this.hostedZone = aws_route53.HostedZone.fromLookup(this, hostedZoneId, {
      domainName: this.hostedZoneDomainName,
      privateZone: false,
    });
  }

  private createCertificate() {
    const certificateId = `${this.id}-certificate`;
    this.certificate = new aws_certificatemanager.Certificate(this, certificateId, {
      domainName: this.domainName,
      validation: aws_certificatemanager.CertificateValidation.fromDns(this.hostedZone),
    });
  }

  buildCluster() {
    const clusterId = `${this.id}-cluster`;
    this.cluster = new aws_ecs.Cluster(this, clusterId, {
      vpc: this.vpc,
      clusterName: clusterId,
    });
  }

  buildExecutionRolePolicyStatement() {
    this.ecsExecutionRolePolicy = new aws_iam.PolicyStatement({
      effect: aws_iam.Effect.ALLOW,
      resources: ['*'],
      actions: [
        'ecr:GetAuthorizationToken',
        'ecr:BatchCheckLayerAvailability',
        'ecr:GetDownloadUrlForLayer',
        'ecr:BatchGetImage',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        'secretsmanager:GetSecret',
        'secretsmanager:GetSecretValue',
      ],
    });
  }

  buildEcsService() {
    const serviceId = `${this.id}-ecs`;
    this.service = new aws_ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      serviceId,
      {
        assignPublicIp: false,
        cluster: this.cluster,
        cpu: 1024,
        memoryLimitMiB: 2048,
        domainName: this.domainName,
        domainZone: this.hostedZone,
        certificate: this.certificate,
        circuitBreaker: { rollback: true },
        loadBalancerName: `${this.id}-lb`,
        platformVersion: aws_ecs.FargatePlatformVersion.VERSION1_4,
        protocol: aws_elasticloadbalancingv2.ApplicationProtocol.HTTPS,
        redirectHTTP: true,
        securityGroups: [this.securityGroup],
        serviceName: serviceId,
        taskImageOptions: {
          containerName: this.id,
          containerPort: this.taskEnvironment.PORT
            ? parseInt(this.taskEnvironment.PORT)
            : 4000,
          image: aws_ecs.ContainerImage.fromEcrRepository(
            // Default (environment UNaware repo)
            // Subsequent builds go to the environment aware repo
            // Run the command "npm run build:ecr-repo" to initialize this one BEFORE the initial deploy
            aws_ecr.Repository.fromRepositoryName(
              this,
              `${this.id}-ecr-base-repository`,
              `note-taker/${this.serviceName}`
            )
          ),
          taskRole: this.taskRole,
          environment: this.taskEnvironment,
          secrets: this.taskSecrets,
        },
      }
    );

    this.service.taskDefinition.addToExecutionRolePolicy(this.ecsExecutionRolePolicy);
    this.taskRole.addToPolicy(this.ecsExecutionRolePolicy);
  }

  configureServiceAutoscaling() {
    const {
      maxCapacity = 4,
      minCapacity = 1,
      cpuTargetUtilizationPercent = 50,
      ramTargetUtilizationPercent = 50,
    } = this.autoscalingConfig;

    const scalableTarget = this.service.service.autoScaleTaskCount({
      maxCapacity,
      minCapacity,
    });

    scalableTarget.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: cpuTargetUtilizationPercent,
    });

    scalableTarget.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: ramTargetUtilizationPercent,
    });
  }
}
