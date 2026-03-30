import { SendRawEmailCommand, SESClient } from "@aws-sdk/client-ses";

export function createSesClient(region: string): SESClient {
  return new SESClient({ region });
}

export async function sendSesRawMessage(
  client: SESClient,
  raw: string,
  configurationSetName?: string,
  tags?: Array<{ Name: string; Value: string }>
): Promise<{ MessageId?: string }> {
  const rawBytes = new TextEncoder().encode(raw);
  const response = await client.send(
    new SendRawEmailCommand({
      ConfigurationSetName: configurationSetName,
      Tags: tags,
      RawMessage: {
        Data: rawBytes
      }
    })
  );

  return { MessageId: response.MessageId };
}
