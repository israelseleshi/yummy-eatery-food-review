import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  onSnapshot, 
  Timestamp,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  getCountFromServer,
  Query,
  and
} from 'firebase/firestore';
import { db } from './firebase';

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  location: string;
  address: string;
  rating: number;
  priceRange: string;
  image: string;
  featured: boolean;
  description: string;
  reviewsCount: number;
  openingHours: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RestaurantStats {
  total: number;
  averageRating: number;
  cuisineDistribution: Record<string, number>;
  locationDistribution: Record<string, number>;
}

const RESTAURANTS_PER_PAGE = 6;

export const uploadRestaurantImage = async (file: File): Promise<string> => {
  try {
    const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudinary upload error:', errorText);
      throw new Error('Failed to upload image');
    }
    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw error;
  }
};

export const deleteRestaurantImage = async (imageUrl: string) => {
  // Optionally implement Cloudinary delete if you have a backend endpoint for it
  // Otherwise, you can leave this as a no-op or just log
  console.warn('Image deletion from Cloudinary is not implemented client-side.');
};

export const getRestaurants = async (
  page: number = 1,
  filters?: {
    cuisine?: string;
    location?: string;
    featured?: boolean;
  }
) => {
  try {
    const restaurantsRef = collection(db, 'restaurants');
    const conditions = [];

    // Add filter conditions
    if (filters?.cuisine) {
      conditions.push(where('cuisine', '==', filters.cuisine));
    }
    if (filters?.location) {
      conditions.push(where('location', '==', filters.location));
    }
    if (filters?.featured) {
      conditions.push(where('featured', '==', true));
    }

    // Create base query with filters and ordering
    const baseQuery = conditions.length > 0
      ? query(restaurantsRef, and(...conditions), orderBy('createdAt', 'desc'))
      : query(restaurantsRef, orderBy('createdAt', 'desc'));

    // Get total count
    const snapshot = await getCountFromServer(baseQuery);
    const total = snapshot.data().count;

    // Add pagination
    let finalQuery = query(baseQuery, limit(RESTAURANTS_PER_PAGE));
    if (page > 1) {
      const prevSnapshot = await getDocs(
        query(baseQuery, limit((page - 1) * RESTAURANTS_PER_PAGE))
      );
      const lastDoc = prevSnapshot.docs[prevSnapshot.docs.length - 1];
      if (lastDoc) {
        finalQuery = query(finalQuery, startAfter(lastDoc));
      }
    }

    const querySnapshot = await getDocs(finalQuery);
    const restaurants = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Restaurant[];

    return { 
      restaurants,
      total
    };
  } catch (error) {
    console.error('Error getting restaurants:', error);
    throw error;
  }
};

export const getRestaurantStats = async (): Promise<RestaurantStats> => {
  try {
    const restaurantsRef = collection(db, 'restaurants');
    const snapshot = await getDocs(restaurantsRef);
    const restaurants = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as Restaurant));

    const cuisineDistribution: Record<string, number> = {};
    const locationDistribution: Record<string, number> = {};
    let totalRating = 0;

    restaurants.forEach(restaurant => {
      cuisineDistribution[restaurant.cuisine] = (cuisineDistribution[restaurant.cuisine] || 0) + 1;
      locationDistribution[restaurant.location] = (locationDistribution[restaurant.location] || 0) + 1;
      totalRating += restaurant.rating || 0;
    });

    return {
      total: restaurants.length,
      averageRating: restaurants.length > 0 ? totalRating / restaurants.length : 0,
      cuisineDistribution,
      locationDistribution
    };
  } catch (error) {
    console.error('Error getting restaurant stats:', error);
    throw error;
  }
};

export const getRestaurantById = async (id: string): Promise<Restaurant | null> => {
  try {
    // Ensure id is a string and not undefined/null
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid restaurant ID');
    }

    const docRef = doc(db, 'restaurants', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Restaurant;
    }
    return null;
  } catch (error) {
    console.error('Error getting restaurant:', error);
    throw error;
  }
};

export const addRestaurant = async (restaurantData: Omit<Restaurant, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviewsCount'>) => {
  try {
    const restaurantsRef = collection(db, 'restaurants');
    const docRef = await addDoc(restaurantsRef, {
      ...restaurantData,
      rating: 0,
      reviewsCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding restaurant:', error);
    throw error;
  }
};

export const updateRestaurant = async (id: string, data: Partial<Restaurant>) => {
  try {
    const restaurantRef = doc(db, 'restaurants', id);
    await updateDoc(restaurantRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating restaurant:', error);
    throw error;
  }
};

export const deleteRestaurant = async (id: string, imageUrl?: string) => {
  try {
    if (imageUrl) {
      await deleteRestaurantImage(imageUrl);
    }
    const restaurantRef = doc(db, 'restaurants', id);
    await deleteDoc(restaurantRef);
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    throw error;
  }
};

export const searchRestaurants = async (searchTerm: string) => {
  try {
    const restaurantsRef = collection(db, 'restaurants');
    const snapshot = await getDocs(restaurantsRef);
    const allRestaurants = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Restaurant[];
    const lowerTerm = searchTerm.toLowerCase();
    return allRestaurants.filter(r =>
      r.name.toLowerCase().includes(lowerTerm) ||
      r.cuisine.toLowerCase().includes(lowerTerm) ||
      r.location.toLowerCase().includes(lowerTerm)
    );
  } catch (error) {
    console.error('Error searching restaurants:', error);
    throw error;
  }
};

export const getCuisineTypes = async (): Promise<string[]> => {
  try {
    const restaurantsRef = collection(db, 'restaurants');
    const snapshot = await getDocs(restaurantsRef);
    const cuisines = new Set<string>();
    
    snapshot.docs.forEach(doc => {
      const restaurant = doc.data() as Restaurant;
      cuisines.add(restaurant.cuisine);
    });
    
    return Array.from(cuisines);
  } catch (error) {
    console.error('Error getting cuisine types:', error);
    throw error;
  }
};

export const getLocations = async (): Promise<string[]> => {
  try {
    const restaurantsRef = collection(db, 'restaurants');
    const snapshot = await getDocs(restaurantsRef);
    const locations = new Set<string>();
    
    snapshot.docs.forEach(doc => {
      const restaurant = doc.data() as Restaurant;
      locations.add(restaurant.location);
    });
    
    return Array.from(locations);
  } catch (error) {
    console.error('Error getting locations:', error);
    throw error;
  }
};

export const subscribeToRestaurants = (
  callback: (restaurants: Restaurant[]) => void,
  filters?: {
    cuisine?: string;
    location?: string;
    featured?: boolean;
  }
) => {
  const restaurantsRef = collection(db, 'restaurants');
  let q = query(restaurantsRef, orderBy('createdAt', 'desc'));

  if (filters?.cuisine) {
    q = query(q, where('cuisine', '==', filters.cuisine));
  }

  if (filters?.location) {
    q = query(q, where('location', '==', filters.location));
  }

  if (filters?.featured) {
    q = query(q, where('featured', '==', true));
  }

  return onSnapshot(q, (snapshot) => {
    const restaurants = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Restaurant[];
    callback(restaurants);
  });
};