import { errorHandler } from '../utils/errorHandler';
import ziqniApi from './index';

const api = new ziqniApi.ZiqniTechGamificationApiClient.ContestsApi();

const handleGetContests = (memberRefId, apiKey) => {
  ziqniApi.defaultClient.authentications.OAuth2.apiKey = apiKey;
  const request = new ziqniApi.ZiqniTechGamificationApiClient.ContestRequest(memberRefId);

  return new Promise((resolve, reject) => {
    const callback = (error, data, responseString) => {
      const errorsFromHandler = errorHandler(error, data, responseString);
      if (error) {
        reject(error.message);
      } else if (errorsFromHandler.length) {
        const errors = errorsFromHandler.join(', ');
        reject(errors);
      } else {
        resolve(data);
      }
    };

    api.getContests(request, callback);
  });
};

const contestsApi = {
  handleGetContests
};

export default contestsApi;
