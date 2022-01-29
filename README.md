# Welcome to your CDK TypeScript project!

This is a blank project for TypeScript development with CDK.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template

# Generate New CDK Application

```bash
npx cdk init --language typescript
```

# Add ESLint and Prettier

## Install Deps

```bash
npm i --save-dev \
  eslint \
  @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin \
  prettier \
  eslint-config-prettier \
  eslint-plugin-prettier
```

## ESLint Config

```json
{
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module"
  },
  "extends": [
    "plugin:@typescript-eslint/recommended",
    "prettier/@typescript-eslint",
    "plugin:prettier/recommended"
  ],
  "rules": {}
}
```

## Prettier Config

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 90,
  "tabWidth": 2
}
```

# Add NestJS Application

```bash
npx nest new application
```

## Note on file paths

You'll need to update the root directory and module path configs in the application's tsconfig, package.json and jest-e2e.json files, as shown in this commit

# Connect to RDS DB

To connect to the RDS DB, you can use the tunnelling script ./bin/db-tunnel.sh. You can't connect directly to the DB because it is in a private VPC network. You can invoke the script with the name of the environment (e.g. "dev") and the name of your private key (e.g. "~/.ssh/cdk_key") and the script will look up the instance details, the RDS details, and handle pushing up your ssh key. It will then open the tunnel and you'll be able to connect to the remote DB as though it were on your localhost.

## Example

```bash
npm run db-tunnel dev ~/.ssh/cdk_key
```
