export type YCloudWebhookStatus = 'active' | 'disabled' | 'pending';

export type YCloudEventProperty = {
  event: string;
  properties: string[];
};

export type YCloudCreateWebhookEndpointPayload = {
  url: string;
  enabledEvents: string[];
  eventProperties?: YCloudEventProperty[];
  description?: string;
  status?: YCloudWebhookStatus;
};

export type YCloudUpdateWebhookEndpointPayload = {
  url?: string;
  enabledEvents?: string[];
  eventProperties?: YCloudEventProperty[];
  description?: string;
  status?: YCloudWebhookStatus;
};

export type YCloudWebhookEndpoint = {
  id: string;
  url: string;
  enabledEvents: string[];
  eventProperties?: YCloudEventProperty[];
  description?: string;
  status: YCloudWebhookStatus;
  secret?: string;
  createTime?: string;
  updateTime?: string;
  [key: string]: unknown;
};

export type YCloudListWebhookEndpointsResponse = {
  items?: YCloudWebhookEndpoint[];
  data?: YCloudWebhookEndpoint[];
  page?: number;
  limit?: number;
  total?: number;
  [key: string]: unknown;
};