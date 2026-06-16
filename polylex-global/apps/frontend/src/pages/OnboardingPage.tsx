import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { languageApi, userApi, pathApi } from '@/api/client';
import { useAuthStore } from '@/store/auth.store';
import { LanguageDto } from '@polylex/shared-types';

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const GOAL_PRESETS = [
  'Giao tiếp hằng ngày',
  'Du lịch',
  'Công việc & phỏng vấn',
  'Luyện thi',
  'Xem phim & giải trí',
];

export default function OnboardingPage() {
  const [languages, setLanguages] = useState<LanguageDto[]>([]);
  const [step, setStep] = useState<1 | 2>(1);
  const [nativeLanguageCode, setNativeLanguageCode] = useState('');
  const [targetLanguageCode, setTargetLanguageCode] = useState('');
  const [goal, setGoal] = useState('');
  const [cefrLevel, setCefrLevel] = useState('A1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    languageApi.getAll().then(setLanguages).catch(() => {});
  }, []);

  const targetOptions = useMemo(
    () => languages.filter((l) => l.code !== nativeLanguageCode),
    [languages, nativeLanguageCode],
  );

  const goToStep2 = () => {
    if (!nativeLanguageCode) {
      setError('Vui lòng chọn ngôn ngữ mẹ đẻ của bạn');
      return;
    }
    setError('');
    setStep(2);
  };

  const finish = async (createPath: boolean) => {
    if (createPath && (!targetLanguageCode || !goal.trim())) {
      setError('Vui lòng chọn ngôn ngữ muốn học và mục tiêu');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await userApi.updateMe({ nativeLanguageCode });

      if (createPath) {
        await userApi.addLanguage({ languageCode: targetLanguageCode, targetCefrLevel: cefrLevel });
        try {
          await pathApi.generate({
            goal: goal.trim(),
            targetLanguageCode,
            nativeLanguageCode,
            targetCefrLevel: cefrLevel,
          });
          toast.success('Đã tạo lộ trình học đầu tiên cho bạn! 🎉');
        } catch {
          toast.error('Chưa tạo được lộ trình, bạn có thể tạo lại sau.');
        }
      }

      const updated = await userApi.getMe();
      setUser(updated);
      navigate(createPath ? '/roadmap' : '/dashboard');
    } catch {
      setError('Không thể lưu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-end sm:items-center justify-center bg-[#0F0F1A] px-4 pb-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-4">
            <img src="/icons/icon.svg" alt="PolyLex" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-[#F1F5F9]">
            {step === 1 ? 'Chào mừng đến PolyLex! 🎉' : 'Bạn muốn học gì?'}
          </h1>
          <p className="text-[#94A3B8] text-sm mt-1">
            {step === 1
              ? 'Hãy cho chúng tôi biết ngôn ngữ mẹ đẻ của bạn'
              : 'Chọn ngôn ngữ và mục tiêu để tạo lộ trình đầu tiên'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-2xl mb-4">
            {error}
          </div>
        )}

        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">Ngôn ngữ mẹ đẻ</label>
              <select
                value={nativeLanguageCode}
                onChange={(e) => setNativeLanguageCode(e.target.value)}
                className="w-full bg-[#1A1A2E] border border-white/10 rounded-2xl px-4 py-3 text-[#F1F5F9] text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50"
              >
                <option value="">Chọn ngôn ngữ của bạn...</option>
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flagEmoji} {l.name} — {l.nativeName}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={goToStep2}
              disabled={!nativeLanguageCode}
              className="w-full bg-gradient-to-r from-[#6366F1] to-[#A78BFA] text-white font-semibold py-4 rounded-2xl transition-opacity disabled:opacity-50 mt-2"
            >
              Tiếp tục
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">Ngôn ngữ muốn học</label>
              <select
                value={targetLanguageCode}
                onChange={(e) => setTargetLanguageCode(e.target.value)}
                className="w-full bg-[#1A1A2E] border border-white/10 rounded-2xl px-4 py-3 text-[#F1F5F9] text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50"
              >
                <option value="">Chọn ngôn ngữ muốn học...</option>
                {targetOptions.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flagEmoji} {l.name} — {l.nativeName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">Mục tiêu của bạn</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {GOAL_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setGoal(preset)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      goal === preset
                        ? 'bg-[#6366F1] border-[#6366F1] text-white'
                        : 'bg-[#1A1A2E] border-white/10 text-[#94A3B8]'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Ví dụ: giao tiếp khi đi du lịch Nhật Bản"
                rows={2}
                className="w-full resize-none bg-[#1A1A2E] border border-white/10 rounded-2xl px-4 py-3 text-[#F1F5F9] text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">Trình độ hiện tại</label>
              <div className="grid grid-cols-6 gap-2">
                {CEFR_LEVELS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setCefrLevel(l)}
                    className={`py-2 rounded-xl text-sm font-medium border transition-colors ${
                      cefrLevel === l
                        ? 'bg-[#6366F1] border-[#6366F1] text-white'
                        : 'bg-[#1A1A2E] border-white/10 text-[#94A3B8]'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => finish(true)}
              disabled={loading || !targetLanguageCode || !goal.trim()}
              className="w-full bg-gradient-to-r from-[#6366F1] to-[#A78BFA] text-white font-semibold py-4 rounded-2xl transition-opacity disabled:opacity-50 mt-2"
            >
              {loading ? 'Đang tạo lộ trình...' : 'Tạo lộ trình & bắt đầu'}
            </button>

            <button
              type="button"
              onClick={() => finish(false)}
              disabled={loading}
              className="w-full text-[#94A3B8] text-sm py-2 disabled:opacity-50"
            >
              Bỏ qua, tạo sau
            </button>

            <button
              type="button"
              onClick={() => { setError(''); setStep(1); }}
              disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 text-[#64748B] text-xs disabled:opacity-50"
            >
              <ArrowLeft size={14} /> Quay lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
