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