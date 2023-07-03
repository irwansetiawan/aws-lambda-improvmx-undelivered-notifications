# Description

If you sign up for ImprovMX email forwarding for your personal or business use,
you might experience some important emails being flagged as spam and not delivered to your mailbox at all.

This serverless application hosted in AWS Lambda monitors ImprovMX logs
and sends undelivered email alerts to a Slack channel.

```mermaid
    graph TD;
        A[CloudWatch Events] ---> B[Lambda Function]
        C[ImprovMX API] --> B
        B --> D[Slack API]
```

# Requirements

* [AWS](https://aws.amazon.com/) account (Free tier eligible). Services used:
    - CloudWatch
    - Lambda
* [ImprovMX](https://improvmx.com/) account (Free plan available)
* [Slack](https://slack.com/) workspace (Free plan available)

# Setup
