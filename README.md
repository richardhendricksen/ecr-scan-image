# Bitbucket Pipelines Pipe: ECR Scan Image

Inspired by the [ecr-scan-image](https://github.com/alexjurkiewicz/ecr-scan-image) Github Action repository by Alex Jurkiewicz.  
I modified the code so it would work as a pipe for Bitbucket pipelines.

## YAML Definition

Add the following snippet to the script section of your `bitbucket-pipelines.yml` file:

```yaml
- pipe: rhendricksen/ecr-scan-image:1.0.0
  variables:
    REPOSITORY: '<string>'
    TAG: '<string>'
    FAIL_THRESHOLD: '<string>'
```

## Variables

| Variable              | Usage                                                       |
| --------------------- | ----------------------------------------------------------- |
| REPOSITORY (*)        | ECR Repository name.  |
| TAG (*)               | Image tag to scan. |
| FAIL_THRESHOLD        | Set fail treshold. Fail if any vulnerabilities equal to or over this severity level are detected. Valid values: critical, high, medium, low, informational. Default value is high. | 
| IGNORE_LIST           | List of CVE IDs to ignore.  ⚠️ Note: The ignore_list can either be a multi-line string (like the example below) or a list (separated using commas or spaces) containing CVE IDs to be ignored. | 
| AWS_ACCESS_KEY_ID     | Required in combination with AWS_SECRET_ACCESS_KEY for access to the ECR Repository. | 
| AWS_SECRET_ACCESS_KEY | Required in combination with AWS_ACCESS_KEY_ID for access to the ECR Repository. | 
| AWS_REGION            | Set AWS Region, e.g. 'eu-west-1'. | 
| AWS_SDK_LOAD_CONFIG   | Set to '1' when using local AWS config. | 
| AWS_PROFILE           | Local AWS profile name. | 

_(*) = required variable._

## Required ECR permissions

To use this GitHub action in your workflow, your ECR role/user will need to have the following permissions:
- `ecr:DescribeImageScanFindings`
- `ecr:StartImageScan` (unless [**scan on push**](https://docs.aws.amazon.com/AmazonECR/latest/userguide/image-scanning.html#scanning-repository) is enabled)

## Examples

Basic example:

```yaml
script:
  - pipe: rhendricksen/ecr-scan-image:1.0.0
    variables:
      REPOSITORY: 'myorg/myapp'
      TAG: 'latest'
      FAIL_THRESHOLD: 'critical'
      IGNORE_LIST: |
        CVE-2014-7654321
        CVE-2014-456132
      AWS_ACCESS_KEY_ID: 'xxx'
      AWS_SECRET_ACCESS_KEY: 'xxx'

```

## Development
You can test the pipe locally by first building the Docker image:
```
docker build -t ecr-scan-image:dev .
```

Then run as follows:
```
docker run -t \
  -e REPOSITORY=myorg/myapp \
  -e TAG=test-tag \
  -e FAIL_THRESHOLD=critical \
  -e AWS_ACCESS_KEY_ID=xxx \
  -e AWS_SECRET_ACCESS_KEY=xxx \
  -e AWS_REGION=xxx \
  ecr-scan-image:dev
```

Or when using local AWS profiles:
```
docker run -t \
  -v ~/.aws:/root/.aws \
  -e REPOSITORY=myorg/myapp \
  -e TAG=test-tag \
  -e FAIL_THRESHOLD=critical \
  -e AWS_SDK_LOAD_CONFIG=1 \
  -e AWS_PROFILE=xxx \
  -e AWS_REGION=xxx \
  ecr-scan-image:dev
```
