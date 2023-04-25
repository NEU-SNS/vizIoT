

const HOSTS = {
  // DEV_HEROKU: 'https://moniotr-smart-router-server.herokuapp.com',
  // PACKET_TESTING: 'https://viziot-server-2.herokuapp.com/api/v1/',
  // PROD: 'http://129.10.231.56',
  // PROD: 'http://127.0.0.1:3000'
  PROD: process.env.NODE_ENV == 'production' ? `http://${process.env.REACT_APP_BACKEND_IP}:${process.env.REACT_APP_BACKEND_PORT}` : 'http://129.10.231.56:3000'
  // MOCK: 'https://c4bfb248-a02b-4dce-a75a-8529b5e9d2f4.mock.pstmn.io',
};

export const baseUrl = HOSTS.PROD;
export const baseUrlApi = `${HOSTS.PROD}/api/v1`;
export const newPacketUrl = HOSTS.PROD;

export const defaultNetwork = '42';

export const headers = {
  'Access-Control-Allow-Origin': '*',
};
