import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  MessageSquare, 
  User, 
  Clock, 
  Check, 
  CheckCheck,
  Paperclip,
  Smile
} from 'lucide-react';
import { Message, ServiceRequest, UserProfile } from '../types/index.ts';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase.ts';

interface ChatModalProps {
  request: ServiceRequest;
  currentUser: UserProfile;
  onClose: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  request,
  currentUser,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const recipientId = currentUser.uid === request.customerId ? request.professionalId : request.customerId;
  const otherPartyName = currentUser.uid === request.customerId ? request.professionalName : request.customerName;

  // Real-time Firestore messages listener
  useEffect(() => {
    const messagesRef = collection(db, 'service_requests', request.id, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgs);
    }, (error) => {
      console.warn('Erro ao escutar mensagens:', error);
    });

    return () => unsubscribe();
  }, [request.id]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const text = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      const now = new Date().toISOString();
      const messageData: Omit<Message, 'id'> = {
        requestId: request.id,
        senderId: currentUser.uid,
        senderName: currentUser.name,
        senderRole: currentUser.role,
        recipientId,
        text,
        read: false,
        createdAt: now,
      };

      const messagesRef = collection(db, 'service_requests', request.id, 'messages');
      await addDoc(messagesRef, messageData);

      // Create notification for recipient
      if (recipientId) {
        const notifId = `notif_${Date.now()}`;
        await setDoc(doc(db, 'notifications', notifId), {
          id: notifId,
          userId: recipientId,
          title: `Nova mensagem de ${currentUser.name}`,
          message: text.length > 50 ? `${text.substring(0, 50)}...` : text,
          type: 'chat',
          requestId: request.id,
          read: false,
          createdAt: now,
        });
      }
    } catch (err) {
      console.error('Falha ao enviar mensagem:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl w-full max-w-lg h-[85vh] max-h-[700px] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Chat Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-sm">
              {otherPartyName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-sm font-bold truncate max-w-[200px]">
                {otherPartyName}
              </h3>
              <p className="text-[11px] text-amber-300 font-medium truncate max-w-[200px]">
                {request.title || request.categoryName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages List Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
          
          {/* Order reference banner inside chat */}
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/60 text-center text-xs text-amber-900">
            <span className="font-bold">Conversa oficial do Pedido #{request.id.slice(-6)}</span>
            <p className="text-[10px] text-amber-700 mt-0.5">
              Estado atual: <strong className="capitalize">{request.status.replace('_', ' ')}</strong>
            </p>
          </div>

          {messages.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-300" />
              <p className="text-xs">Nenhuma mensagem ainda.</p>
              <p className="text-[11px] text-slate-400">Escreva uma mensagem para combinar detalhes do serviço.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === currentUser.uid;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-xs ${
                      isMine
                        ? 'bg-amber-500 text-slate-950 font-medium rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                    }`}
                  >
                    {!isMine && (
                      <span className="block text-[10px] font-bold text-slate-400 mb-0.5">
                        {msg.senderName}
                      </span>
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    <div className="flex items-center justify-end gap-1 mt-1 text-[9px] opacity-70">
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isMine && <CheckCheck className="w-3 h-3" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Escreva a sua mensagem..."
            className="flex-1 px-4 py-2.5 rounded-full border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-md transition-colors disabled:opacity-40 shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
