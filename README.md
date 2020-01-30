# cloudformation-appsync
Uploads and creates a cloudformation stack, configuring appsync, lambdas, etc


## Setup
- Configure your AWS credentials
- Create a S3 bucket
- Find/Replace 'leo-cloudformation-deployer-test' by your S3 bucket (I had no time left to put it in var)
- Configure your template.yaml under ./src/cloudformation/template.yaml
- Configure your GraphQL schema at ./src/graphql_schema/schema.graphql
- To generate the build/js bundle, Run:
´npm run-script buildanddeploy´

Lambda function handlers can be placed in ./src/lambdas
Every lambda function is able to share and execute code placed inside ./app. Place your code inside there.

Deploy debugging is also available. If you´re using VS Code, just press CTRL+SHIFT+D and run the 'Debug Deployer' action