import Axios from 'axios';

// Create Axios instance.
const axios = Axios.create({
  baseURL: '/api',
  timeout: 0
});


export default axios;
