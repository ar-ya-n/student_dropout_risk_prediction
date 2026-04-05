import { collection, addDoc, query, where, getDocs, writeBatch, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";

const PREDICTIONS_COLLECTION = "predictions";

export const savePrediction = async (userId, inputData, outputData) => {
  try {
    const docRef = await addDoc(collection(db, PREDICTIONS_COLLECTION), {
      userId,
      input: inputData,
      output: outputData,
      createdAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving prediction:", error);
    throw error;
  }
};

export const getUserPredictions = async (userId) => {
  try {
    const predictionsRef = collection(db, PREDICTIONS_COLLECTION);
    const q = query(
      predictionsRef,
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    const predictions = [];
    querySnapshot.forEach((doc) => {
      predictions.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort in memory to avoid needing a Firestore composite index
    predictions.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || 0;
      const timeB = b.createdAt?.toMillis?.() || 0;
      return timeB - timeA;
    });
    
    return predictions;
  } catch (error) {
    console.error("Error fetching user predictions:", error);
    throw error;
  }
};

export const saveBatchPredictions = async (userId, results) => {
  try {
    const batches = [];
    let currentBatch = writeBatch(db);
    let count = 0;

    const collectionRef = collection(db, PREDICTIONS_COLLECTION);
    const now = new Date();

    for (const res of results) {
      if (count === 500) {
        batches.push(currentBatch.commit());
        currentBatch = writeBatch(db);
        count = 0;
      }
      
      const newDocRef = doc(collectionRef);
      const { input, ...outputData } = res;
      
      currentBatch.set(newDocRef, {
        userId,
        input: input || {},
        output: outputData,
        createdAt: now
      });
      count++;
    }
    
    if (count > 0) {
      batches.push(currentBatch.commit());
    }

    await Promise.all(batches);
    return true;
  } catch (error) {
    console.error("Error saving batch predictions:", error);
    throw error;
  }
};

/**
 * Get user daily habits for the Study Tracker
 */
export const getUserHabits = async (userId) => {
  try {
    if (!userId) return { dates: {} };
    const docRef = doc(db, `habits`, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return { dates: {} };
  } catch (err) {
    console.error("Error fetching habits: ", err);
    return { dates: {} };
  }
};

/**
 * Update user daily habits completion state
 */
export const updateUserHabits = async (userId, data) => {
  try {
    if (!userId) throw new Error("User ID required");
    const docRef = doc(db, `habits`, userId);
    await setDoc(docRef, data, { merge: true });
    return true;
  } catch (err) {
    console.error("Error updating habits: ", err);
    throw err;
  }
};
