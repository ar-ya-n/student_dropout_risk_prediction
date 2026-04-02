import { useState } from 'react';
import { predictSingle } from '../services/api';

export default function usePrediction() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const predict = async (formData) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await predictSingle(formData);
      setResult(data);
    } catch (err) {
      const msg =
        err.response?.data?.detail || err.message || 'Prediction failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return { result, loading, error, predict, reset };
}
