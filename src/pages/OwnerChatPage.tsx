import React, { useEffect, useState } from 'react';
import ChatInterface from '../components/ChatInterface';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

const OwnerChatPage = () => {
  const [adminUid, setAdminUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminUid = async () => {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'admin'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setAdminUid(snapshot.docs[0].id);
      }
      setLoading(false);
    };
    fetchAdminUid();
  }, []);

  if (loading || !adminUid) {
    return <div className="p-6">Loading chat...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Chat with Admin</h2>
      <ChatInterface receiverId={adminUid} receiverName="Admin Support" />
    </div>
  );
};

export default OwnerChatPage; 