import { Construct } from 'constructs';
import {
  aws_codebuild,
  aws_codepipeline,
  aws_codepipeline_actions,
  aws_ec2,
  aws_ecr,
  aws_ecs,
  aws_iam,
  SecretValue,
  Stack,
} from 'aws-cdk-lib';
import { pascalCase } from 'pascal-case';
import { EcsService } from './ecs-service';
import {
  apiProjectConfig,
  infrastructureProjectConfig,
  migrationProjectConfig,
} from './project-buildspec';
import { Environment } from './note-taker-stack';

export interface RecipesPipelineProps {
  cluster: aws_ecs.ICluster;
  databaseCredentialsSecretArn: string;
  environmentName: Environment;
  repository: aws_ecr.IRepository;
  securityGroup: aws_ec2.ISecurityGroup;
  service: EcsService;
  vpc: aws_ec2.IVpc;
}

export class NoteTakerPipeline extends Construct {
  static CDK_VERSION = '2.9.0';
  static GITHUB_TOKEN_SECRET_NAME = 'github-token';
  static REPO_NAME = 'nestjs-starter';
  static REPO_OWNER = 'djheru';
  static environmentBranchMapping: Record<string, string> = {
    dev: 'dev',
    test: 'test',
    prod: 'main',
  };

  public sourceAction: aws_codepipeline_actions.GitHubSourceAction;

  public sourceArtifact = new aws_codepipeline.Artifact();
  public buildArtifact = new aws_codepipeline.Artifact();

  private infrastructureRole: aws_iam.Role;
  private infrastructureAction: aws_codepipeline_actions.CodeBuildAction;
  private apiAction: aws_codepipeline_actions.CodeBuildAction;
  private migrationAction: aws_codepipeline_actions.CodeBuildAction;
  private deployApiAction: aws_codepipeline_actions.EcsDeployAction;

  constructor(
    scope: Construct,
    public readonly id: string,
    private readonly props: RecipesPipelineProps
  ) {
    super(scope, id);

    this.id = id;

    this.buildResources();
  }

  buildResources() {
    this.buildSourceAction();
    this.buildInfrastructureRole();
    this.buildInfrastructureAction();
    this.buildApiAction();
    this.buildMigrationAction();
    this.buildDeployApiAction();
    this.buildPipeline();
  }

  buildSourceAction() {
    const branch =
      NoteTakerPipeline.environmentBranchMapping[this.props.environmentName] ||
      this.props.environmentName;
    const oauthToken = SecretValue.secretsManager(
      NoteTakerPipeline.GITHUB_TOKEN_SECRET_NAME
    );
    const sourceActionId = `source-action`;
    this.sourceAction = new aws_codepipeline_actions.GitHubSourceAction({
      actionName: pascalCase(sourceActionId),
      owner: NoteTakerPipeline.REPO_OWNER,
      repo: NoteTakerPipeline.REPO_NAME,
      branch,
      oauthToken,
      output: this.sourceArtifact,
    });
  }

  buildInfrastructureRole() {
    const infrastructureRoleId = `${this.id}-infrastructure-role`;
    this.infrastructureRole = new aws_iam.Role(this, infrastructureRoleId, {
      assumedBy: new aws_iam.ServicePrincipal('codebuild.amazonaws.com'),
      managedPolicies: [
        aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'),
      ],
      roleName: infrastructureRoleId,
    });
  }

  buildInfrastructureAction() {
    const projectConfig = infrastructureProjectConfig({
      id: this.id,
      environmentName: this.props.environmentName,
      stackName: Stack.of(this).stackName,
      role: this.infrastructureRole,
    });
    const infrastructureProjectId = `${this.id}-infrastructure-project`;
    const infrastructureProject = new aws_codebuild.PipelineProject(
      this,
      infrastructureProjectId,
      projectConfig
    );

    const infrastructureActionId = `infrastructure-action`;
    this.infrastructureAction = new aws_codepipeline_actions.CodeBuildAction({
      actionName: pascalCase(infrastructureActionId),
      input: this.sourceArtifact,
      project: infrastructureProject,
    });
  }

  buildApiAction() {
    const projectConfig = apiProjectConfig({
      id: this.id,
      environmentName: this.props.environmentName,
      serviceName: this.props.service.id,
      clusterName: this.props.cluster.clusterName,
      repositoryName: this.props.repository.repositoryName,
      repositoryUri: this.props.repository.repositoryUri,
      sourcePath: './application',
    });
    const buildApiProjectId = `${this.id}-build-api-project`;
    const buildApiProject = new aws_codebuild.PipelineProject(
      this,
      buildApiProjectId,
      projectConfig
    );

    this.props.repository.grantPullPush(<aws_iam.Role>buildApiProject.role);
    buildApiProject.addToRolePolicy(
      new aws_iam.PolicyStatement({
        actions: [
          'ecs:DescribeCluster',
          'ecr:GetAuthorizationToken',
          'ecr:BatchCheckLayerAvailability',
          'ecr:BatchGetImage',
          'ecr:GetDownloadUrlForLayer',
        ],
        resources: [this.props.cluster.clusterArn],
      })
    );

    const apiActionId = `build-api-action`;
    this.apiAction = new aws_codepipeline_actions.CodeBuildAction({
      actionName: pascalCase(apiActionId),
      input: this.sourceArtifact,
      project: buildApiProject,
      outputs: [this.buildArtifact],
    });
  }

  buildMigrationAction() {
    const projectConfig = migrationProjectConfig({
      databaseCredentialsSecretArn: this.props.databaseCredentialsSecretArn,
      environmentName: this.props.environmentName,
      id: this.id,
      securityGroup: this.props.securityGroup,
      sourcePath: './application',
      vpc: this.props.vpc,
    });
    const migrationProjectId = `${this.id}-migration-project`;
    const migrationProject = new aws_codebuild.PipelineProject(
      this,
      migrationProjectId,
      projectConfig
    );

    const migrationActionId = `run-migrations-action`;
    this.migrationAction = new aws_codepipeline_actions.CodeBuildAction({
      actionName: pascalCase(migrationActionId),
      input: this.sourceArtifact,
      project: migrationProject,
    });
  }

  buildDeployApiAction() {
    const deployApiActionId = `deploy-api-action`;
    this.deployApiAction = new aws_codepipeline_actions.EcsDeployAction({
      actionName: pascalCase(deployApiActionId),
      service: this.props.service.service.service,
      imageFile: new aws_codepipeline.ArtifactPath(
        this.buildArtifact,
        'imagedefinitions.json'
      ),
    });
  }

  buildPipeline() {
    const pipelineId = `${this.id}-pipeline`;
    new aws_codepipeline.Pipeline(this, pipelineId, {
      pipelineName: this.id,
      restartExecutionOnUpdate: true,
      stages: [
        {
          stageName: 'CheckoutSource',
          actions: [this.sourceAction],
        },
        {
          stageName: 'DeployInfrastructure',
          actions: [this.infrastructureAction],
        },
        {
          stageName: 'BuildAPI',
          actions: [this.apiAction],
        },
        {
          stageName: 'DeployAPI',
          actions: [this.deployApiAction, this.migrationAction],
        },
      ],
    });
  }
}
