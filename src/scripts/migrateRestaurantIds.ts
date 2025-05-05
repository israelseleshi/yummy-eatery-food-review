import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const migrateRestaurantIds = async () => {
  const restaurantsRef = collection(db, 'restaurants');
  const reviewsRef = collection(db, 'reviews');

  // 1. Get all restaurants
  const restaurantSnapshot = await getDocs(restaurantsRef);
  const idMap: Record<string, string> = {};

  // 2. Copy numeric-ID restaurants to new docs
  for (const restaurantDoc of restaurantSnapshot.docs) {
    const oldId = restaurantDoc.id;
    if (/^\d+$/.test(oldId)) { // Only numeric IDs
      const data = restaurantDoc.data();
      const newDocRef = await addDoc(restaurantsRef, data);
      idMap[oldId] = newDocRef.id;
      console.log(`Copied restaurant ${oldId} to ${newDocRef.id}`);
    }
  }

  // 3. Update reviews to reference new restaurant IDs
  const reviewSnapshot = await getDocs(reviewsRef);
  for (const reviewDoc of reviewSnapshot.docs) {
    const review = reviewDoc.data();
    if (idMap[review.restaurantId]) {
      await updateDoc(doc(db, 'reviews', reviewDoc.id), {
        restaurantId: idMap[review.restaurantId]
      });
      console.log(`Updated review ${reviewDoc.id} to new restaurantId ${idMap[review.restaurantId]}`);
    }
  }

  // 4. Delete old numeric-ID restaurant docs
  for (const oldId of Object.keys(idMap)) {
    await deleteDoc(doc(db, 'restaurants', oldId));
    console.log(`Deleted old restaurant doc ${oldId}`);
  }

  console.log('Migration complete!');
}; 