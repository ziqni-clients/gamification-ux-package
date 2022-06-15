export const errorHandler = function (error, responseObj, responseString) {
  if (responseObj === null && error !== null) {
    responseObj =
      typeof responseString === 'string'
        ? JSON.parse(responseString).body
        : responseString.body;
  }

  const errors = [];

  if (responseObj.errors && responseObj.errors.length > 0) {
    responseObj.errors.forEach(error => {
      if (typeof error.detail !== 'undefined') {
        error.detail.forEach(detail => {
          errors.push(detail.message);
        });
      } else {
        errors.push(error.message);
      }
    });
  }

  return errors;
};
