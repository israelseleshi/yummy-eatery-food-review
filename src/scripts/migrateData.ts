import { collection, getDocs, addDoc, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { restaurants } from '../data/restaurants';

export const removeDuplicateRestaurants = async () => {
  const restaurantsRef = collection(db, 'restaurants');
  const snapshot = await getDocs(restaurantsRef);
  const seen = new Map();
  const duplicates: string[] = [];

  snapshot.docs.forEach(docSnap => {
    const data = docSnap.data();
    const key = [
      (data.name || '').toLowerCase().trim(),
      (data.cuisine || '').toLowerCase().trim(),
      (data.location || '').toLowerCase().trim()
    ].join('|');
    if (seen.has(key)) {
      duplicates.push(docSnap.id);
    } else {
      seen.set(key, docSnap.id);
    }
  });

  for (const id of duplicates) {
    await deleteDoc(doc(db, 'restaurants', id));
    console.log(`Deleted duplicate restaurant: ${id}`);
  }
  console.log(`Removed ${duplicates.length} duplicate restaurants.`);
};