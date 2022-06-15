import apiConfig from './apiConfig';

const ZiqniTechGamificationApiClient = require('@ziqni-tech/gamification-api-client');
const defaultClient = ZiqniTechGamificationApiClient.ApiClient.instance;
defaultClient.basePath = apiConfig.basePath;
defaultClient.authentications.OAuth2 = { type: 'apiKey', name: 'ApiKey', in: 'header' };

const ziqniApi = {
  ZiqniTechGamificationApiClient,
  defaultClient
};

export default ziqniApi;
