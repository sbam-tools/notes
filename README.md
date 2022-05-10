# SBAM Notes

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/donate/?business=L49FJ2VK84B8L&no_recurring=0&item_name=SBAM+Notes&currency_code=EUR)

SBAM (Seriously Built AWS Module) Notes is a serverless application that allows to easily share sensitive information. Use it on [https://notes.sbam.tools](https://notes.sbam.tools)!

Running this platform and working on it has its costs. If you enjoy this tool, [please consider a donation](https://www.paypal.com/donate/?business=L49FJ2VK84B8L&no_recurring=0&item_name=SBAM+Notes&currency_code=EUR).

This repository contains the CDK project for the infrastructure and backend part. The frontend code is on [https://github.com/sbam-tools/notes-frontend](https://github.com/sbam-tools/notes-frontend).


## How it works

When you ask SBAM Notes to encrypt a message, it generates an encryption key on the fly, and encrypts your message with it. Only the encrypted message is stored. The message id and the encryption string are sent back to you.

To decrypt a message you have to provide SBAM Notes with the message id and the encryption string. Nobody can decrypt the message besides you.

In addition, SBAM Notes is built over AWS, so you get all the [security guarantees of the AWS infrastructure](https://docs.aws.amazon.com/whitepapers/latest/introduction-aws-security/security-of-the-aws-infrastructure.html).

### Why creating another tool?

Tools like SBAM Notes already exist since a long time, and they have a better UI and are probably simpler to use.

But, in the end, can you trust them? Who can assure you that your message is deleted after the receive reads it? Who can assure you that nobody can read that message?

SBAM Notes is completely open source, so you can trust it!


Also, we find disappointing how few serverless products are released open source nowadays, and with these few examples to look at, learning how to develop serverless product is a true challenge nowadays.

## Use it on your own!

If you want to use it on your own, do it!

You can clone this project and customize the stack options to deploy your own frontend application.

## TODO

- Detail how to deploy a clone on the wiki
- Add S3 storage
- Allow to use a server-side private key for encryption, to generate shorter links
- Document everything
