import { errorHandler } from '../utils/errorHandler';
import ziqniApi from './index';

const api = new ziqniApi.ZiqniTechGamificationApiClient.MessagesApi();

const handleGetMessages = (memberRefId, apiKey) => {
  ziqniApi.defaultClient.authentications.OAuth2.apiKey = apiKey;
  const request = new ziqniApi.ZiqniTechGamificationApiClient.MessageRequest(memberRefId);

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

    api.getMessages(request, callback);
  });
};

const messagesApi = {
  handleGetMessages
};

export default messagesApi;
