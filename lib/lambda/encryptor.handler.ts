import 'reflect-metadata';
import { container } from "tsyringe";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { APIGatewayAdapter } from "./encryptor/api-gateway-adapter";

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  return container.resolve(APIGatewayAdapter).execute(event);
}
