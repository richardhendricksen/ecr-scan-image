# Bitbucket Pipelines Pipe: ECR Scan Image

## YAML Definition

Add the following snippet to the script section of your `bitbucket-pipelines.yml` file:

```yaml
- pipe: rhendricksen/ecr-scan-image:1.0.0
  variables:
    REPOSITORY: '<string>'
    TAG: '<string>'
```

## Variables

| Variable              | Usage                                                       |
| --------------------- | ----------------------------------------------------------- |
| REPOSITORY (*)        | ECR Repository name.  |
| TAG (*)               | Tag name. |
| FAIL_THRESHOLD        | Set fail treshold. Fail if any vulnerabilities equal to or over this severity level are detected. Valid values: critical, high, medium, low, informational. Default value is high. | 
| IGNORE_LIST           | List of CVE IDs to ignore.  ⚠️ Note: The ignore_list can either be a multi-line string (like the example below) or a list (separated using commas or spaces) containing CVE IDs to be ignored. | 

_(*) = required variable._

## Examples

Basic example:

```yaml
script:
  - pipe: rhendricksen/ecr-scan-image:1.0.0
    variables:
      REPOSITORY: 'MyRepository'
      TAG: 'latest'
      FAIL_THRESHOLD: 'critical'
      IGNORE_LIST: |
        CVE-2014-7654321
        CVE-2014-456132
```
