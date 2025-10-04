import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, endpoints } from '../../services/axios.config';
import { BookOpen, Loader2, Phone, ArrowLeft, CheckCircle } from 'lucide-react'
import authService from '../../services/api/auth.service'

const ForgotPasswordPage = () => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await api.post(endpoints.auth.forgotPassword, {
        phone: phone.trim()
      });

      setSuccess(true);
      setMessage(response.message || 'تم إرسال رمز إعادة التعيين إلى هاتفك');
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Une erreur est survenue. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-red-400 to-pink-500 p-4 rounded-full shadow-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">تم إرسال الرمز</h2>
            <p className="text-gray-600">تحقق من هاتفك للحصول على رمز إعادة التعيين</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
            <div className="space-y-4 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-sm text-gray-700">{message}</div>
              <div className="text-sm text-gray-600">
                <p>لم يصلك الرمز؟</p>
                <button
                  className="text-red-600 font-medium mt-2"
                  onClick={() => {
                    setSuccess(false);
                    setPhone('');
                  }}
                >
                  إعادة إرسال الرمز
                </button>
              </div>

              <div className="flex items-center justify-center pt-4">
                <Link to="/login" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  العودة لتسجيل الدخول
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="relative max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-red-400 to-pink-500 p-4 rounded-full shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">نسيت كلمة المرور</h2>
          <p className="text-gray-600">أدخل رقم هاتفك لتلقي رمز إعادة التعيين</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700 text-right">{error}</div>
              </div>
            )}

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2 text-right">
                رقم الهاتف
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  className={`block w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-right placeholder-gray-400 text-gray-900 transition-all duration-200 ${
                    error ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="أدخل رقم هاتفك"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !phone.trim()}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    جاري الإرسال...
                  </div>
                ) : (
                  'إرسال الرمز'
                )}
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">أو</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                لديك حساب؟{' '}
                <Link to="/login" className="font-medium text-red-600 hover:text-red-500 transition-colors duration-200">
                  تسجيل الدخول
                </Link>
              </p>
            </div>
          </form>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">© 2025 اسماعيل علواوي. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </div>
  )
};

export default ForgotPasswordPage;