import { CloudFrontClient, CreateInvalidationCommand } from "@aws-sdk/client-cloudfront";
import { inject, registry, singleton } from "tsyringe";

@registry([
  { token: 'CLOUDFRONT_CLIENT', useValue: new CloudFrontClient({}) },
])
@singleton()
export class CloudfrontService {
  constructor(
    @inject('CLOUDFRONT_CLIENT') private readonly client: CloudFrontClient,
  ) {}

  async invalidate(distributionId: string, objectPaths: string[], jobId?: string): Promise<void> {
    await this.client.send(new CreateInvalidationCommand({
      DistributionId: distributionId,
      InvalidationBatch: {
        Paths: {
          Items: objectPaths,
          Quantity: objectPaths.length,
        },
        CallerReference: jobId,
      },
    }));
  }
}
