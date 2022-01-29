#!/bin/bash
set -eu

# Set vars
service="note-taker"
image="note-taker"
account=$(aws sts get-caller-identity --query 'Account' --output text)

# Create repository
aws ecr create-repository --repository-name note-taker/note-taker

# Log in to ecr with docker
# aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 205375198116.dkr.ecr.us-east-1.amazonaws.com
aws ecr get-login-password \
  | docker login \
  -u AWS --password-stdin \
  "https://$account.dkr.ecr.us-east-1.amazonaws.com"

# Build the initial image
docker build -t note-taker/note-taker ./application

# Tag it
docker tag "$service/$image:latest" "$account.dkr.ecr.us-east-1.amazonaws.com/$service/$image:latest"

# Push it
docker push "$account.dkr.ecr.us-east-1.amazonaws.com/$service/$image:latest"