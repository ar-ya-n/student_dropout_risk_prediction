import { useState } from 'react';
import { predictSingle } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { savePrediction } from '../services/firestoreService';

export default function usePrediction() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  const predict = async (mlPayload, dbPayload) => {
    setLoading(true);
    setSaving(false);
    setSaveSuccess(false);
    setError(null);
    setResult(null);
    try {
      const data = await predictSingle(mlPayload);
      setResult(data);

      if (currentUser) {
        setSaving(true);
        try {
          // Save the dbPayload (which includes Name) to Firestore
          await savePrediction(currentUser.uid, dbPayload || mlPayload, data);
          setSaveSuccess(true);
        } catch (saveErr) {
          console.error("Failed to save to Firestore", saveErr);
        } finally {
          setSaving(false);
        }
      }
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
    setSaveSuccess(false);
    setSaving(false);
  };

  return { result, loading, saving, saveSuccess, error, predict, reset };
}
