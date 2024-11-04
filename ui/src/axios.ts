import Axios from 'axios';

// Create Axios instance.
const axios = Axios.create({
  baseURL: '/api',
  timeout: 5000
});


export default axios;
