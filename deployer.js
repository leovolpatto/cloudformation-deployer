var fs = require('fs');
var AWS = require("aws-sdk");

class S3FileUploader {

    constructor(bucketName) {
        this.bucketName = bucketName;
    }

    readFileFromDisk(filename) {
        return fs.readFileSync(filename);
    }

    /**
     * @returns {Promise.<boolean>}
    */    
    uploadFileToS3(filename) {
        return this.uploadToS3(filename, this.readFileFromDisk(filename));
    }

    /**
     * @returns {Promise.<boolean>}
    */
    uploadToS3(filename, fileBuffer) {
        var params = {
            Body: fileBuffer,
            Bucket: this.bucketName,
            Key: filename
        };

        return new Promise((res, rej) => {
            var s3 = new AWS.S3();
            s3.putObject(params, function (err, data) {
                if (err) {
                    console.log({ failedUploadedFile: filename, result: err });
                    return rej(false);
                }

                console.log({ uploadedFile: filename });
                return res(true);
            });
        });
    }

    createBucket(bucketName) {
        var bucketPromise = new AWS.S3({ apiVersion: '2006-03-01' }).createBucket({ Bucket: bucketName }).promise();
        bucketPromise.then(
            function (data) {
                console.log('bucket created');
            }).catch(
                function (err) {
                    console.error(err, err.stack);
                });
    }

}

class CloudFormationDeployer {

    /**
     * @type AWS.CloudFormation
     */
    cloudformation;

    constructor() {
        this.cloudformation = new AWS.CloudFormation({ apiVersion: '2010-05-15', region: 'us-east-1' });
    }

    createStackParams(stackName){
        return {
            StackName: stackName,            
            Capabilities: [
                'CAPABILITY_NAMED_IAM' // 'CAPABILITY_NAMED_IAM' | 'CAPABILITY_IAM' | 'CAPABILITY_AUTO_EXPAND'
            ],
            Parameters: [
              {
                ParameterKey: 'Sample',
                ParameterValue: 'etc123',
                ResolvedValue: 'etc123'
              },
              {
                ParameterKey: 'ProductSourcePackage',
                ParameterValue: 'src/graphql_schema/schema.graphql',
                ResolvedValue: 'src/graphql_schema/schema.graphql'
              },
              {
                ParameterKey: 'SchemaPath',
                ParameterValue: 'https://leo-cloudformation-deployer-test.s3.amazonaws.com/src/graphql_schema/schema.graphql',
                ResolvedValue: 'https://leo-cloudformation-deployer-test.s3.amazonaws.com/src/graphql_schema/schema.graphql'
              },
              {
                ParameterKey: 'Env',
                ParameterValue: 'Homol',
                ResolvedValue: 'Homol'
              },
              {
                ParameterKey: 'EnvLowerCase',
                ParameterValue: 'homol',
                ResolvedValue: 'homol'
              },
              {
                ParameterKey: 'DeployBucket',
                ParameterValue: 's3://leo-cloudformation-deployer-test/dist',
                ResolvedValue: 's3://leo-cloudformation-deployer-test/dist'
              }
            ],
            /*
            Tags: [
              {
                Key: 'STRING_VALUE',
                Value: 'STRING_VALUE'   
              }
            ],*/
            //TemplateURL: 's3://leo-cloudformation-deployer-test/template.yaml'
            TemplateURL: 'https://leo-cloudformation-deployer-test.s3.amazonaws.com/src/cloudformation/template.yaml'
          };
    }

    updateStack(stackName){
        console.info('updating stack: ' + stackName);
        var params = this.createStackParams(stackName);
        return this.cloudformation.updateStack(params).promise()
            .then((x) => {
                console.error('success');
                console.debug(x);
                return x;
            })
            .catch((f) => {
                console.error(f.toString());
                f.errors != undefined && f.errors.forEach((e) => {
                    console.error(e);
                });

                return f;
            });        

    }

    createStack(stackName){
        console.info('creating stack ' + stackName);
        var params = this.createStackParams(stackName);
        //params.EnableTerminationProtection = true;
        return this.cloudformation.createStack(params).promise()
            .then((x) => {
                console.error('success');
                console.debug(x);
                return x;
            })
            .catch((f) => {
                console.error(f.toString());
                f.errors != undefined && f.errors.forEach((e) => {
                    console.error(e);
                });

                return f;
            });
    }

    deploy(stackName){
        this.stackExists(stackName).then(() => {
            this.updateStack(stackName);
        }).catch(() => {
            this.createStack(stackName);
        });        
    }

    /**
     * @returns {Promise.<boolean>}
     */
    stackExists(stackName) {
        var params = {
            StackName: stackName
        };

        console.info('Describing Stacks, this might take some time... please wait');
        return new Promise((res, rej) => {
            var params = {
                StackName: stackName
            };

            this.cloudformation.describeStacks(params, function (err, data) {
                if (err) {
                    console.error('stack does not exists: ' + stackName);
                    return rej(false);
                }

                return res(true);
            });
        });
    }
}

class Deployer {

    /**
     * @type S3FileUploader
     */
    s3Uploader;
    bucketName = 'leo-cloudformation-deployer-test';

    test() {
        this.bucketName = 'leo-cloudformation-deployer-test';
        this.s3Uploader = new S3FileUploader(this.bucketName);
        this.uploadYamlTemplate()
            .then(() => {
                return this.s3Uploader.uploadFileToS3('src/graphql_schema/schema.graphql');
            })
            .then(() => {
                return this.uploadLambdas();
            })
            .then(() => {
                var sam = new CloudFormationDeployer();
                sam.deploy('leo-test-cloudformation-deploy');                
            })
            .catch(() => {
                console.error('unable to upload cloudformation template');
            });
    }
        
    /**
     * @returns {Promise.<boolean>}
    */    
    uploadLambdas() {
        console.info('Creating the bundle file...');
        var zipper = require('zip-local');
        console.info('Uploading lambdas... this also might take some time...');
        return this.s3Uploader.uploadToS3('dist.zip', zipper.sync.zip('./build/').memory())
            .then((ok) => {
                console.log('Lambdas uploaded');
                return ok;
            });
    }

    /**
     * @returns {Promise.<boolean>}
    */    
    uploadYamlTemplate() {
        return this.s3Uploader.uploadFileToS3('src/cloudformation/template.yaml');
    }
}

AWS.config.getCredentials(function (err) {
    if (err) {
        console.error("Your credentials are not set");
        console.error(err.stack);
    }
    else {
        console.log("Access key:", AWS.config.credentials.accessKeyId);
        console.log("Secret access key:", AWS.config.credentials.secretAccessKey);

        var deploy = new Deployer();
        deploy.test();
    }
});