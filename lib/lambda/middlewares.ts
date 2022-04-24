import { APIGatewayProxyResult } from "aws-lambda";

type APIGatewayMiddlewareCallback = () => Promise<APIGatewayProxyResult>;

export async function withCors(callback: APIGatewayMiddlewareCallback): Promise<APIGatewayProxyResult> {
  const response = await callback();
  const headers = response.headers ||= {};
  Object.assign(headers, {
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*',
  });
  return response;
}
