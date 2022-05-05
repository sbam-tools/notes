// Copyright (C) 2022 Nicola Racco
//
// SBAM Notes is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// SBAM Notes is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with SBAM Notes. If not, see <http://www.gnu.org/licenses/>.
import { inject, registry, singleton } from 'tsyringe';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';

@registry([{ token: 'CLOUDFRONT_CLIENT', useValue: new CloudFrontClient({}) }])
@singleton()
export class CloudfrontService {
  constructor(@inject('CLOUDFRONT_CLIENT') private readonly client: CloudFrontClient) {}

  async invalidate(distributionId: string, objectPaths: string[], jobId?: string): Promise<void> {
    await this.client.send(
      new CreateInvalidationCommand({
        DistributionId: distributionId,
        InvalidationBatch: {
          Paths: {
            Items: objectPaths,
            Quantity: objectPaths.length,
          },
          CallerReference: jobId,
        },
      }),
    );
  }
}
