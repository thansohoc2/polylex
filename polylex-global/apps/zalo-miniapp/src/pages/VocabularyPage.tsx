import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { miniVocabularyApi } from '../api/client';
import { useAuthStore } from '../store/auth.store';

interface VocabularyItem {
  id: string;
  term: string;
  language?: { code?: string; name?: string };
}

export default function VocabularyPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      if (!accessToken) {
        if (mounted) {
          setItems([]);
          setLoading(false);
        }
        return;
      }
      try {
        const response = await miniVocabularyApi.getVocabulary();
        const nextItems = (response?.items ?? response ?? []) as VocabularyItem[];
        if (mounted) {
          setItems(Array.isArray(nextItems) ? nextItems : []);
        }
      } catch {
        if (mounted) {
          setError('Không tải được danh sách từ vựng. Vui lòng thử lại.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [accessToken]);

  return (
    <div className="container">
      <div className="card" style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 4 }}>Vocabulary</h2>
            <small>{user ? `Xin chào, ${user.displayName}` : 'Bạn chưa đăng nhập'}</small>
          </div>
          <button
            className="button button-secondary"
            onClick={() => {
              clearSession();
              navigate('/login', { replace: true });
            }}
          >
            Đăng xuất
          </button>
        </div>

        {!accessToken ? <p>Bạn đang ở chế độ không đăng nhập.</p> : null}
        {loading ? <p>Đang tải dữ liệu...</p> : null}
        {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

        {!loading && !error ? (
          <ul style={{ paddingLeft: 18 }}>
            {items.length === 0 ? <li>Chưa có từ vựng.</li> : null}
            {items.map((item) => (
              <li key={item.id}>
                <strong>{item.term}</strong>
                {item.language?.name ? ` (${item.language.name})` : ''}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
