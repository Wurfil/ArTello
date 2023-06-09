import {DEFAULT_LANGUAGE} from "@/shared/config";
import {config, SERVER_ERRORS} from "@/shared/api/config";
import {Simulate} from "react-dom/test-utils";
import error = Simulate.error;


interface RequestData {
  rootApi: string;
  url: string;
  method: string;
  body?: Record<string, unknown>;
  headers: Record<string, string>;
}

const getUserLanguage = () =>
  window.navigator.language
    ? window.navigator.language.split("-")[0]
    : DEFAULT_LANGUAGE;

const handleNotFoundStatus = (response: Response): Response => {
  if (response.status === 404) {
    throw {
      code: response.status,
      message: SERVER_ERRORS.NOT_FOUND
    };
  }

  return response;
}

interface ResponseWithError extends Response {
  error?: string;
}

const handleServerErrorsInResponse = (
  response: ResponseWithError
): Response => {
  if (response && response.error) {
    throw response.error;
  }

  return response;
}

export const request = (requestData: RequestData): Promise<void | Response> => {
  const {rootApi, url, method, body = null, headers = {}} = requestData

  const baseUrl = `${config.apiUrl}/${rootApi}`;

  const requestBody = body;
  const requestHeader = headers;

  requestHeader.locale = getUserLanguage();

  if (headers.authorization) {
    requestHeader.authorization = `Bearer ${config.accessToken}`;
  }

  let initOption: RequestInit = {
    method,
    headers: requestHeader
  };

  if (body !== null) {
    initOption = {
      ...initOption,
      body: JSON.stringify(requestBody),
    };
  }

  const request = new Request(`${baseUrl}${url}`, initOption);

  return fetch(request)
    .then(handleNotFoundStatus)
    .then((response) => response.json())
    .then(handleServerErrorsInResponse)
    .catch((error) => {
      const errorWithRequestData = {...error, requestData};

      config.errorHandler?.(errorWithRequestData);
    })
};

export const fakeRequest = <T = void>(
  requestData: RequestData,
  responseData: T,
): Promise<T> => {
  return Promise.resolve(responseData);
};
