import { Menu, X, Phone, Mail, MapPin, Facebook, Instagram, Youtube, BookOpen, MessageCircle } from 'lucide-react';

const Footer = () => {
    return (
      <footer id='contact' className="bg-gray-900 text-white">
        {/* Main Footer Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-16">
            {/* About Section */}
            <div className="text-right lg:col-span-2 lg:order-2">
              <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse mb-4">
                <div>
                  <h3 className="text-xl font-bold">أستاذ الفيزياء المحترف</h3>
                  <p className="text-gray-400 text-sm">خبرة 12 سنة في التدريس</p>
                </div>
                <div className="bg-gradient-to-r from-red-400 to-pink-500 p-3 rounded-full">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed mb-6">
                أساعد الطلاب على فهم الفيزياء بطريقة مبسطة وممتعة، مع التركيز على التطبيق العملي والاستعداد للامتحانات. هدفي هو جعل الفيزياء مادة محببة لكل طالب.
              </p>
              
              {/* Social Media */}
              <div className="flex justify-end space-x-4 rtl:space-x-reverse">
                <a href="https://www.facebook.com/share/18a8pp66qD/?mibextid=wwXIfr" className="bg-gray-800 p-3 rounded-full hover:bg-red-500 transition-colors duration-300">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="https://www.instagram.com/alouaoui_ismail?igsh=emdmN21panVhaXVx" className="bg-gray-800 p-3 rounded-full hover:bg-red-500 transition-colors duration-300">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="https://youtube.com/channel/UCZssJm0Jx-oJN51_jD3M9wg?si=cDWrqO43-Lr5y3cs" className="bg-gray-800 p-3 rounded-full hover:bg-red-500 transition-colors duration-300">
                  <Youtube className="w-5 h-5" />
                </a>
                <a href="#" className="bg-gray-800 p-3 rounded-full hover:bg-red-500 transition-colors duration-300">
                  <MessageCircle className="w-5 h-5" />
                </a>
              </div>
            </div>
  
            {/* Quick Links */}
            <div className="text-right mr-6">
              <h4 className="text-lg font-semibold mb-4 text-red-400">روابط سريعة</h4>
              <ul className="space-y-3">
                <li><a href="#home" className="text-gray-300 hover:text-white transition-colors duration-200">الرئيسية</a></li>
                <li><a href="#courses" className="text-gray-300 hover:text-white transition-colors duration-200">الدروس المتاحة</a></li>
                <li><a href="#about" className="text-gray-300 hover:text-white transition-colors duration-200">نبذة عني</a></li>
                <li><a href="#results" className="text-gray-300 hover:text-white transition-colors duration-200">نتائج الطلاب</a></li>
                <li><a href="#pricing" className="text-gray-300 hover:text-white transition-colors duration-200">الأسعار</a></li>
                <li><a href="#faq" className="text-gray-300 hover:text-white transition-colors duration-200">الأسئلة الشائعة</a></li>
              </ul>
            </div>
  
            {/* Contact Info */}
            <div className="text-right">
              <h4 className="text-lg font-semibold mb-4 text-red-400">معلومات التواصل</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse">
                  <div>
                    <p className="text-gray-300">05 40 25 13 39</p>
                    <p className="text-gray-500 text-sm">متاح من 8ص إلى 8م</p>
                  </div>
                  <Phone className="w-5 h-5 text-red-400" />
                </div>
                
                <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse">
                  <div>
                    <p className="text-gray-300">physics.teacher@email.com</p>
                    <p className="text-gray-500 text-sm">للاستفسارات والحجز</p>
                  </div>
                  <Mail className="w-5 h-5 text-red-400" />
                </div>
                
                <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse">
                  <div>
                    <p className="text-gray-300">بوفاريك </p>
                    <p className="text-gray-500 text-sm">دروس حضورية وأونلاين</p>
                  </div>
                  <MapPin className="w-5 h-5 text-red-400" />
                </div>
              </div>
            </div>
          </div>
  
          {/* Google Maps Section */}
          <div className="border-t border-gray-800 mt-8 pt-8">
            <h4 className="text-lg font-semibold mb-6 text-red-400 text-center">موقعنا على الخريطة</h4>
            <div className="relative w-full h-64 sm:h-80 rounded-lg overflow-hidden shadow-lg">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3204.369748167107!2d2.911888674502859!3d36.569306680683304!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x128f09d1bf132eb1%3A0xd3e2d45e8b7198bb!2sDelta%20School!5e0!3m2!1sen!2sdz!4v1758274680390!5m2!1sen!2sdz"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
              <div className="absolute inset-0 bg-gradient-to-r from-red-400/10 to-pink-500/10 pointer-events-none"></div>
            </div>
            <p className="text-center text-gray-400 text-sm mt-4">
              📍  بوفاريك - دروس حضورية وأونلاين متاحة
            </p>
          </div>
        </div>
  
        {/* Bottom Footer */}
        <div className="border-t border-gray-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <div className="text-gray-400 text-sm text-center sm:text-right">
                <p>© 2025 أستاذ الفيزياء. جميع الحقوق محفوظة</p>
              </div>
              <div className="flex space-x-6 rtl:space-x-reverse text-sm">
                <a href="#privacy" className="text-gray-400 hover:text-white transition-colors duration-200">سياسة الخصوصية</a>
                <a href="#terms" className="text-gray-400 hover:text-white transition-colors duration-200">شروط الاستخدام</a>
                <a href="#sitemap" className="text-gray-400 hover:text-white transition-colors duration-200">خريطة الموقع</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    );
  };
  export default Footer;