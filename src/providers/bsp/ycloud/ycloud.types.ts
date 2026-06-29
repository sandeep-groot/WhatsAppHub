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

export type YCloudWhatsAppBusinessAccount = {
  id: string;
  name: string;
  currency?: string;
  messageTemplateNamespace?: string;
  accountReviewStatus?: string;
  businessId?: string;
  businessStatus?: string;
  businessName?: string;
  businessVerificationStatus?: string;
  whatsappBusinessManagerMessagingLimit?: string;
  ownershipType?: string;
  primaryFundingId?: string;
  timezoneId?: string;
  paymentMethodAttached?: boolean;
  isOnBizApp?: boolean;
  [key: string]: unknown;
};

export type YCloudListWhatsAppBusinessAccountsResponse = {
  offset?: number;
  limit?: number;
  length?: number;
  items: YCloudWhatsAppBusinessAccount[];
  total?: number;
  [key: string]: unknown;
};

export type YCloudWhatsAppPhoneNumber = {
  id: string;
  phoneNumber: string;
  wabaId?: string;
  verifiedName?: string;
  qualityRating?: string;
  messagingLimit?: string;
  whatsappBusinessManagerMessagingLimit?: string;
  isOfficialBusinessAccount?: boolean;
  codeVerificationStatus?: string;
  status?: string;
  displayPhoneNumber?: string;
  nameStatus?: string;
  newName?: string;
  newNameStatus?: string;
  decision?: string;
  requestedVerifiedName?: string;
  rejectionReason?: string;
  isOnBizApp?: boolean;
  [key: string]: unknown;
};

export type YCloudListWhatsAppPhoneNumbersResponse = {
  offset?: number;
  limit?: number;
  length?: number;
  items: YCloudWhatsAppPhoneNumber[];
  total?: number;
  [key: string]: unknown;
};

export type YCloudSendTextMessagePayload = {
  from: string;
  to: string;
  type: 'text';
  text: { body: string };
};

export type YCloudTemplateParameter = {
  type: string;
  text?: string;
  [key: string]: unknown;
};

export type YCloudTemplateComponent = {
  type: string;
  sub_type?: string;
  index?: string | number;
  parameters?: YCloudTemplateParameter[];
  [key: string]: unknown;
};

export type YCloudSendTemplateMessagePayload = {
  from: string;
  to: string;
  type: 'template';
  template: {
    name: string;
    language: { code: string; policy?: string };
    components?: YCloudTemplateComponent[];
  };
};

export type YCloudSendMessagePayload =
  | YCloudSendTextMessagePayload
  | YCloudSendTemplateMessagePayload;

export type YCloudWhatsAppTemplate = {
  id?: string;
  wabaId?: string;
  name: string;
  language: string;
  category?: string;
  status?: string;
  components?: unknown[];
  [key: string]: unknown;
};

export type YCloudListTemplatesResponse = {
  page?: number;
  limit?: number;
  total?: number;
  items: YCloudWhatsAppTemplate[];
  [key: string]: unknown;
};

export type YCloudUpdateTemplatePayload = {
  category?: string;
  components?: unknown[];
  [key: string]: unknown;
};

export type YCloudSendMessageResponse = {
  id?: string;
  wamid?: string;
  wabaId?: string;
  from?: string;
  to?: string;
  type?: string;
  status?: string;
  sendTime?: string;
  createTime?: string;
  text?: { body?: string };
  [key: string]: unknown;
};