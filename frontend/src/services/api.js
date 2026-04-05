import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

export async function predictSingle(data) {
  const res = await API.post('/predict-single', data);
  return res.data;
}

export async function predictBatch(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await API.post('/predict', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export default API;
