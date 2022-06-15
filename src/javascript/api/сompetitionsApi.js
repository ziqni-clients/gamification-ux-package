import { errorHandler } from '../utils/errorHandler';
import ziqniApi from './index';

const api = new ziqniApi.ZiqniTechGamificationApiClient.CompetitionsApi();

const handleGetCompetitions = (memberRefId, apiKey) => {
  ziqniApi.defaultClient.authentications.OAuth2.apiKey = apiKey;
  const request = new ziqniApi.ZiqniTechGamificationApiClient.CompetitionRequest(memberRefId);

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

    api.getCompetitions(request, callback);
  });
};

const competitionsApi = {
  handleGetCompetitions
};

export default competitionsApi;
