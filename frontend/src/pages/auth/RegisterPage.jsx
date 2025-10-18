import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  BookOpen,
  Eye,
  EyeOff,
  Phone,
  Lock,
  User,
  GraduationCap,
  Key,
} from "lucide-react";
import authService from "../../services/api/auth.service";
import branchesService from "../../services/api/branches.service";
import { loginSuccess } from "../../store/slices/authSlice";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    birth_date: "",
    address: "",
    school_name: "",
    year_of_study: "1AM",
    branch_id: "",
    phone: "",
    password: "",
    password_confirmation: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [availableBranches, setAvailableBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Load branches when year changes
  useEffect(() => {
    const loadBranches = async () => {
      if (
        formData.year_of_study &&
        ["1AS", "2AS", "3AS"].includes(formData.year_of_study)
      ) {
        setLoadingBranches(true);
        try {
          const response = await branchesService.getBranchesForYear(
            formData.year_of_study,
          );
          setAvailableBranches(response.data || []);
        } catch (error) {
          console.error("Error loading branches:", error);
          setAvailableBranches([]);
        } finally {
          setLoadingBranches(false);
        }
      } else {
        setAvailableBranches([]);
        setFormData((prev) => ({ ...prev, branch_id: "" }));
      }
    };

    loadBranches();
  }, [formData.year_of_study]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstname.trim()) {
      newErrors.firstname = "الاسم الأول مطلوب";
    }

    if (!formData.lastname.trim()) {
      newErrors.lastname = "الاسم الأخير مطلوب";
    }

    if (!formData.birth_date) {
      newErrors.birth_date = "تاريخ الميلاد مطلوب";
    }

    if (!formData.address.trim()) {
      newErrors.address = "العنوان مطلوب";
    }

    if (!formData.school_name.trim()) {
      newErrors.school_name = "اسم المدرسة مطلوب";
    }

    if (!formData.year_of_study) {
      newErrors.year_of_study = "السنة الدراسية مطلوبة";
    }

    // Validate branch for high school students
    if (
      ["1AS", "2AS", "3AS"].includes(formData.year_of_study) &&
      !formData.branch_id
    ) {
      newErrors.branch_id = "الفرع مطلوب للطلاب الثانويين";
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = "رقم الهاتف مطلوب";
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = "رقم الهاتف يجب أن يتكون من 10 أرقام";
    }

    if (!formData.password) {
      newErrors.password = "كلمة المرور مطلوبة";
    } else if (formData.password.length < 6) {
      newErrors.password = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
    }

    if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = "كلمات المرور غير متطابقة";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const userData = {
        firstname: formData.firstname.trim(),
        lastname: formData.lastname.trim(),
        birth_date: formData.birth_date,
        address: formData.address.trim(),
        school_name: formData.school_name.trim(),
        year_of_study: formData.year_of_study,
        phone: formData.phone,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      };

      // Add branch_id only for high school students
      if (
        ["1AS", "2AS", "3AS"].includes(formData.year_of_study) &&
        formData.branch_id
      ) {
        userData.branch_id = formData.branch_id;
      }

      const response = await authService.register(userData);

      const { token, user } = response;

      if (token && user) {
        // Update Redux store
        dispatch(loginSuccess({ token, user }));

        // Redirection en fonction du rôle
        navigate("/student/profile");
      }
    } catch (error) {
      console.error("Registration error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config,
      });

      // Handle validation errors from backend
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        const formattedErrors = {};
        Object.keys(backendErrors).forEach((key) => {
          formattedErrors[key] = Array.isArray(backendErrors[key])
            ? backendErrors[key][0]
            : backendErrors[key];
        });
        setErrors(formattedErrors);
      } else {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "حدث خطأ أثناء إنشاء الحساب";
        setErrors({
          submit: errorMessage,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="relative max-w-lg w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-red-400 to-pink-500 p-4 rounded-full shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            انضم إلينا اليوم
          </h2>
          <p className="text-gray-600">ابدأ رحلتك التعليمية معنا</p>
        </div>

        {/* Register Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Error Message */}
            {errors.submit && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700 text-right">
                  {errors.submit}
                </div>
              </div>
            )}

            {/* Name Fields */}
            <div className="space-y-6">
              {/* Nom et Prénom */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstname"
                    className="block text-sm font-medium text-gray-700 mb-2 text-right"
                  >
                    الاسم الأول
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="firstname"
                      name="firstname"
                      type="text"
                      required
                      className={`block w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-right placeholder-gray-400 text-gray-900 transition-all duration-200 ${
                        errors.firstname ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="الاسم الأول"
                      value={formData.firstname || ""}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.firstname && (
                    <p className="mt-1 text-sm text-red-600 text-right">
                      {errors.firstname}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="lastname"
                    className="block text-sm font-medium text-gray-700 mb-2 text-right"
                  >
                    الاسم الأخير
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="lastname"
                      name="lastname"
                      type="text"
                      required
                      className={`block w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-right placeholder-gray-400 text-gray-900 transition-all duration-200 ${
                        errors.lastname ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="الاسم الأخير"
                      value={formData.lastname || ""}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.lastname && (
                    <p className="mt-1 text-sm text-red-600 text-right">
                      {errors.lastname}
                    </p>
                  )}
                </div>
              </div>

              {/* Date de naissance */}
              <div>
                <label
                  htmlFor="birth_date"
                  className="block text-sm font-medium text-gray-700 mb-2 text-right"
                >
                  تاريخ الميلاد
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="birth_date"
                    name="birth_date"
                    type="date"
                    required
                    className={`block w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-right placeholder-gray-400 text-gray-900 transition-all duration-200 ${
                      errors.birth_date ? "border-red-500" : "border-gray-300"
                    }`}
                    value={formData.birth_date || ""}
                    onChange={handleChange}
                  />
                </div>
                {errors.birth_date && (
                  <p className="mt-1 text-sm text-red-600 text-right">
                    {errors.birth_date}
                  </p>
                )}
              </div>

              {/* Adresse */}
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 mb-2 text-right"
                >
                  العنوان
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    required
                    className={`block w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-right placeholder-gray-400 text-gray-900 transition-all duration-200 ${
                      errors.address ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="أدخل عنوانك"
                    value={formData.address || ""}
                    onChange={handleChange}
                  />
                </div>
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600 text-right">
                    {errors.address}
                  </p>
                )}
              </div>

              {/* École */}
              <div>
                <label
                  htmlFor="school_name"
                  className="block text-sm font-medium text-gray-700 mb-2 text-right"
                >
                  المدرسة
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <GraduationCap className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="school_name"
                    name="school_name"
                    type="text"
                    required
                    className={`block w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-right placeholder-gray-400 text-gray-900 transition-all duration-200 ${
                      errors.school_name ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="اسم المدرسة"
                    value={formData.school_name || ""}
                    onChange={handleChange}
                  />
                </div>
                {errors.school_name && (
                  <p className="mt-1 text-sm text-red-600 text-right">
                    {errors.school_name}
                  </p>
                )}
              </div>

              {/* Année d'étude */}
              <div>
                <label
                  htmlFor="year_of_study"
                  className="block text-sm font-medium text-gray-700 mb-2 text-right"
                >
                  السنة الدراسية
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <GraduationCap className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="year_of_study"
                    name="year_of_study"
                    required
                    className={`block w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-right text-gray-900 transition-all duration-200 ${
                      errors.year_of_study
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    value={formData.year_of_study}
                    onChange={handleChange}
                  >
                    <option value="1AM">السنة الأولى متوسط</option>
                    <option value="2AM">السنة الثانية متوسط</option>
                    <option value="3AM">السنة الثالثة متوسط</option>
                    <option value="4AM">السنة الرابعة متوسط</option>
                    <option value="1AS">السنة الأولى ثانوي</option>
                    <option value="2AS">السنة الثانية ثانوي</option>
                    <option value="3AS">السنة الثالثة ثانوي</option>
                  </select>
                </div>
                {errors.year_of_study && (
                  <p className="mt-1 text-sm text-red-600 text-right">
                    {errors.year_of_study}
                  </p>
                )}
              </div>

              {/* Branch Selection - Only for High School */}
              {["1AS", "2AS", "3AS"].includes(formData.year_of_study) && (
                <div>
                  <label
                    htmlFor="branch_id"
                    className="block text-sm font-medium text-gray-700 mb-2 text-right"
                  >
                    الفرع الدراسي
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <BookOpen className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="branch_id"
                      name="branch_id"
                      required
                      className={`block w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-right text-gray-900 transition-all duration-200 ${
                        errors.branch_id ? "border-red-500" : "border-gray-300"
                      }`}
                      value={formData.branch_id}
                      onChange={handleChange}
                      disabled={loadingBranches}
                    >
                      <option value="">
                        {loadingBranches
                          ? "جاري تحميل الفروع..."
                          : "اختر الفرع الدراسي"}
                      </option>
                      {availableBranches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.branch_id && (
                    <p className="mt-1 text-sm text-red-600 text-right">
                      {errors.branch_id}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-2 text-right"
              >
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
                    errors.phone ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="أدخل رقم هاتفك (10 أرقام)"
                  value={formData.phone || ""}
                  onChange={handleChange}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600 text-right">
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2 text-right"
              >
                كلمة المرور
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength="6"
                  className={`block w-full pr-10 pl-12 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-right placeholder-gray-400 text-gray-900 transition-all duration-200 ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="أدخل كلمة المرور (6 أحرف على الأقل)"
                  value={formData.password || ""}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 left-0 pl-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 text-right">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="password_confirmation"
                className="block text-sm font-medium text-gray-700 mb-2 text-right"
              >
                تأكيد كلمة المرور
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password_confirmation"
                  name="password_confirmation"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  className={`block w-full pr-10 pl-12 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-right placeholder-gray-400 text-gray-900 transition-all duration-200 ${
                    errors.password_confirmation
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="أعد إدخال كلمة المرور"
                  value={formData.password_confirmation || ""}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 left-0 pl-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password_confirmation && (
                <p className="mt-1 text-sm text-red-600 text-right">
                  {errors.password_confirmation}
                </p>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
              </div>
              <div className="mr-3 text-sm">
                <label htmlFor="terms" className="text-gray-700">
                  أوافق على{" "}
                  <Link
                    to="/terms"
                    className="text-red-600 hover:text-red-500 font-medium"
                  >
                    الشروط والأحكام
                  </Link>{" "}
                  و{" "}
                  <Link
                    to="/privacy"
                    className="text-red-600 hover:text-red-500 font-medium"
                  >
                    سياسة الخصوصية
                  </Link>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    جاري إنشاء الحساب...
                  </div>
                ) : (
                  "إنشاء الحساب"
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">أو</span>
              </div>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                لديك حساب بالفعل؟{" "}
                <Link
                  to="/login"
                  className="font-medium text-red-600 hover:text-red-500 transition-colors duration-200"
                >
                  سجل دخولك
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            © 2025 اسماعيل علواوي. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
