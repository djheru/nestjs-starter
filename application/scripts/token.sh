export $(grep -v '^#' .env | xargs)

curl --request POST \
  --url https://dev-pdamra.auth0.com/oauth/token \
  --header 'content-type: application/json' \
  --data "{\"client_id\":\"$AUTH0_CLIENT_ID\",\"client_secret\":\"$AUTH0_CLIENT_SECRET\",\"audience\":\"https://ecs-recipes/\",\"grant_type\":\"client_credentials\"}"