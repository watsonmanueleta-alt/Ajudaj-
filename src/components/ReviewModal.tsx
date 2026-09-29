import React, { useState } from 'react';
import { X, Star, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ServiceRequest, Review } from '../types/index.ts';
import { doc, setDoc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase.ts';

interface ReviewModalProps {
  request: ServiceRequest;
  onClose: () => void;
  onReviewSubmitted: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  request,
  onClose,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setErrorMessage('Por favor, escreva um breve comentário sobre a qualidade do serviço prestado.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const reviewId = `rev_${request.id}`;
      const now = new Date().toISOString();

      const newReview: Review = {
        id: reviewId,
        requestId: request.id,
        customerId: request.customerId,
        customerName: request.customerName,
        professionalId: request.professionalId,
        rating,
        comment: comment.trim(),
        createdAt: now,
      };

      // 1. Save review in /reviews/{reviewId}
      await setDoc(doc(db, 'reviews', reviewId), newReview);

      // 2. Mark request as rated so client cannot rate twice
      await updateDoc(doc(db, 'service_requests', request.id), {
        isRated: true,
        updatedAt: now,
      });

      // 3. Recalculate average rating of professional
      if (request.professionalId) {
        try {
          const q = query(
            collection(db, 'reviews'),
            where('professionalId', '==', request.professionalId)
          );
          const snap = await getDocs(q);
          const allRatings: number[] = [];
          snap.forEach(d => {
            const data = d.data();
            if (typeof data.rating === 'number') {
              allRatings.push(data.rating);
            }
          });

          const totalReviews = allRatings.length;
          const avgRating = totalReviews > 0 
            ? Number((allRatings.reduce((acc, r) => acc + r, 0) / totalReviews).toFixed(1))
            : rating;

          // Find professional document
          // Could be prof_antonio_canalizador or prof_{uid}
          const profSnap = await getDocs(query(
            collection(db, 'professionals'),
            where('userId', '==', request.professionalId)
          ));

          profSnap.forEach(async (pDoc) => {
            await updateDoc(doc(db, 'professionals', pDoc.id), {
              rating: avgRating,
              reviewCount: totalReviews,
              updatedAt: now,
            });
          });
        } catch (e) {
          console.warn('Erro ao atualizar média do profissional:', e);
        }
      }

      onReviewSubmitted();
    } catch (err) {
      console.error('Falha ao submeter avaliação:', err);
      setErrorMessage('Não foi possível registrar a sua avaliação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl w-full max-w-md flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold">Avaliar Profissional</h2>
            <p className="text-xs text-amber-300 font-medium">
              {request.professionalName}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Star Rating Picker */}
          <div className="text-center py-2">
            <span className="text-xs text-slate-500 font-semibold block mb-2">
              Como avalia o serviço concluído?
            </span>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 focus:outline-hidden transition-transform hover:scale-125"
                >
                  <Star
                    className={`w-8 h-8 ${
                      (hoverRating || rating) >= star
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-slate-700 mt-2 block">
              {rating === 5 ? 'Excelente (5/5)' :
               rating === 4 ? 'Muito Bom (4/5)' :
               rating === 3 ? 'Satisfatório (3/5)' :
               rating === 2 ? 'Razoável (2/5)' : 'Fraco (1/5)'}
            </span>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Seu Comentário *
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte como foi a pontualidade, atendimento, técnica e limpeza do profissional..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'A enviar avaliação...' : 'Publicar Avaliação'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
