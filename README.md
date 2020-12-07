# Bitbucket Pipelines Pipe: Slack Notify

Sends a custom notification to [Slack](https://slack.com).

You can configure [Slack integration](https://confluence.atlassian.com/bitbucket/bitbucket-cloud-for-slack-945096776.html) for your repository to get notifications on standard events, such as build failures and deployments. Use this pipe to send your own additional notifications at any point in your pipelines.

## YAML Definition

Add the following snippet to the script section of your `bitbucket-pipelines.yml` file:

```yaml
- pipe: atlassian/slack-notify:1.0.0
  variables:
    WEBHOOK_URL: '<string>'
    MESSAGE: '<string>'
    # DEBUG: '<boolean>' # Optional.
```

## Variables

| Variable           | Usage                                                       |
| --------------------- | ----------------------------------------------------------- |
| WEBHOOK_URL (*) | Incoming Webhook URL. It is recommended to use a secure repository variable.  |
| MESSAGE (*)     | Notification message. |
| DEBUG           | Turn on extra debug information. Default: `false`. | 

_(*) = required variable._

## Prerequisites

To send notifications to Slack, you need an Incoming Webhook URL. You can follow the instructions [here](https://api.slack.com/incoming-webhooks) to create one.

## Examples

Basic example:

```yaml
script:
  - pipe: atlassian/slack-notify:1.0.0
    variables:
      WEBHOOK_URL: $WEBHOOK_URL
      MESSAGE: 'Hello, world!'
```

## Support
If you'd like help with this pipe, or you have an issue or feature request, [let us know on Community][community].

If you're reporting an issue, please include:

* the version of the pipe
* relevant logs and error messages
* steps to reproduce

## License
Copyright (c) 2018 Atlassian and others.
Apache 2.0 licensed, see [LICENSE.txt](LICENSE.txt) file.


[community]: https://community.atlassian.com/t5/forums/postpage/board-id/bitbucket-pipelines-questions?add-tags=pipes,slack
