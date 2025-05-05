import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { restaurants as localRestaurants } from '../data/restaurants';

export const migrateRestaurants = async () => {
  const restaurantsRef = collection(db, 'restaurants');

  for (const restaurant of localRestaurants) {
    const {
      id, // Remove local id
      reviews, // Rename to reviewsCount
      ...rest
    } = restaurant;
    try {
      await addDoc(restaurantsRef, {
        ...rest,
        reviewsCount: reviews,
        rating: restaurant.rating || 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      console.log(`Added restaurant: ${restaurant.name}`);
    } catch (error) {
      console.error(`Error adding restaurant ${restaurant.name}:`, error);
    }
  }
};