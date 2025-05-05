import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs,
  Timestamp,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db } from './firebase';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  content: string;
  createdAt: Timestamp;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
}

export const sendMessage = async (message: Omit<ChatMessage, 'id' | 'createdAt'>) => {
  try {
    const messagesRef = collection(db, 'chat-messages');
    const messageData = {
      ...message,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(messagesRef, messageData);
    return docRef.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const subscribeToChatMessages = (
  userId: string,
  otherUserId: string,
  callback: (messages: ChatMessage[]) => void
) => {
  const messagesRef = collection(db, 'chat-messages');

  // Query 1: user -> otherUser
  const q1 = query(
    messagesRef,
    where('senderId', '==', userId),
    where('receiverId', '==', otherUserId),
    orderBy('createdAt', 'asc')
  );

  // Query 2: otherUser -> user
  const q2 = query(
    messagesRef,
    where('senderId', '==', otherUserId),
    where('receiverId', '==', userId),
    orderBy('createdAt', 'asc')
  );

  // Listen to both queries and merge results
  const unsub1 = onSnapshot(q1, (snapshot1) => {
    const messages1 = snapshot1.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChatMessage[];
    callbackMerger(messages1, null);
  });

  const unsub2 = onSnapshot(q2, (snapshot2) => {
    const messages2 = snapshot2.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChatMessage[];
    callbackMerger(null, messages2);
  });

  // Store last results to merge
  let last1: ChatMessage[] = [];
  let last2: ChatMessage[] = [];
  function callbackMerger(m1: ChatMessage[] | null, m2: ChatMessage[] | null) {
    if (m1 !== null) last1 = m1;
    if (m2 !== null) last2 = m2;
    // Merge and sort by createdAt
    const all = [...last1, ...last2].sort((a, b) =>
      a.createdAt?.toMillis?.() - b.createdAt?.toMillis?.()
    );
    callback(all);
  }

  // Return unsubscribe function
  return () => {
    unsub1();
    unsub2();
  };
};

export const clearChatMessages = async () => {
  const messagesRef = collection(db, 'chat-messages');
  const snapshot = await getDocs(messagesRef);
  for (const messageDoc of snapshot.docs) {
    await deleteDoc(doc(db, 'chat-messages', messageDoc.id));
    console.log(`Deleted message: ${messageDoc.id}`);
  }
};