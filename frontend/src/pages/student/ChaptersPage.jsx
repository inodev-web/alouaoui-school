import React, { useState, useMemo } from 'react';
import { Search, Zap, Globe, Atom, Thermometer, Eye, Magnet, Radio, X, Play, FileText, Clock } from 'lucide-react';

const StudentChaptersPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChapter, setSelectedChapter] = useState(null);

  const chapters = [
    {
      id: 1,
      title: "الميكانيكا الكلاسيكية",
      icon: <Globe className="w-8 h-8" />,
      description: "دراسة حركة الأجسام والقوى المؤثرة عليها في الكون المرئي.",
      subject: "الميكانيكا",
      courses: [
        {
          id: 1,
          title: "الحركة في خط مستقيم",
          description: "دراسة المفاهيم الأساسية للحركة: الإزاحة، السرعة، والتسارع.",
          duration: "45 دقيقة",
          summary: "تعريف الحركة، معادلات الحركة، الرسوم البيانية للحركة، والسقوط الحر.",
          exercises: "12 مسألة محلولة ومجموعة تمارين متدرجة الصعوبة"
        },
        {
          id: 2,
          title: "قوانين نيوتن للحركة",
          description: "القوانين الثلاثة الأساسية التي تحكم حركة الأجسام.",
          duration: "50 دقيقة",
          summary: "القانون الأول (القصور الذاتي)، القانون الثاني (F=ma)، والقانون الثالث (الفعل ورد الفعل).",
          exercises: "15 تطبيق عملي مع أمثلة من الحياة اليومية"
        },
        {
          id: 3,
          title: "الشغل والطاقة",
          description: "العلاقة بين القوة والمسافة وتحويل أشكال الطاقة.",
          duration: "40 دقيقة",
          summary: "تعريف الشغل، الطاقة الحركية والكامنة، مبدأ حفظ الطاقة.",
          exercises: "10 مسائل تطبيقية مع حلول مفصلة"
        }
      ]
    },
    {
      id: 2,
      title: "الكهرباء والمغناطيسية",
      icon: <Zap className="w-8 h-8" />,
      description: "استكشاف الظواهر الكهربائية والمغناطيسية وتطبيقاتها العملية.",
      subject: "الكهرومغناطيسية",
      courses: [
        {
          id: 4,
          title: "الكهرباء الساكنة",
          description: "دراسة الشحنات الكهربائية في حالة السكون والقوى بينها.",
          duration: "55 دقيقة",
          summary: "قانون كولوم، المجال الكهربائي، الجهد الكهربائي، والسعة الكهربائية.",
          exercises: "18 تمرين مع تجارب محاكاة تفاعلية"
        },
        {
          id: 5,
          title: "التيار الكهربائي والدوائر",
          description: "حركة الشحنات الكهربائية وتحليل الدوائر الكهربائية.",
          duration: "60 دقيقة",
          summary: "قانون أوم، قوانين كيرشوف، المقاومة، والقدرة الكهربائية.",
          exercises: "20 مسألة دوائر كهربائية مع رسوم توضيحية"
        },
        {
          id: 6,
          title: "المغناطيسية",
          description: "الحقول المغناطيسية وتأثيرها على الشحنات المتحركة.",
          duration: "45 دقيقة",
          summary: "المغانط الطبيعية، المجال المغناطيسي، قانون أمبير، والحث الكهرومغناطيسي.",
          exercises: "14 تطبيق عملي مع تجارب مختبرية"
        }
      ]
    },
    {
      id: 3,
      title: "الضوء والبصريات",
      icon: <Eye className="w-8 h-8" />,
      description: "دراسة خصائص الضوء وسلوكه عند التفاعل مع المواد المختلفة.",
      subject: "البصريات",
      courses: [
        {
          id: 7,
          title: "انتشار الضوء",
          description: "الخصائص الأساسية للضوء وقوانين الانعكاس والانكسار.",
          duration: "50 دقيقة",
          summary: "طبيعة الضوء، الانعكاس المنتظم والمنتشر، قانون سنل للانكسار.",
          exercises: "16 مسألة بصرية مع رسوم هندسية دقيقة"
        },
        {
          id: 8,
          title: "العدسات والمرايا",
          description: "تكوين الصور باستخدام العدسات والمرايا المختلفة.",
          duration: "55 دقيقة",
          summary: "العدسات المحدبة والمقعرة، المرايا الكروية، معادلة العدسة الرقيقة.",
          exercises: "22 تمرين تكوين صور مع جداول ورسوم بيانية"
        }
      ]
    },
    {
      id: 4,
      title: "الحرارة والديناميكا الحرارية",
      icon: <Thermometer className="w-8 h-8" />,
      description: "دراسة الحرارة ودرجة الحرارة وتأثيرها على المواد.",
      subject: "الديناميكا الحرارية",
      courses: [
        {
          id: 9,
          title: "الحرارة ودرجة الحرارة",
          description: "الفرق بين الحرارة ودرجة الحرارة وطرق انتقال الحرارة.",
          duration: "40 دقيقة",
          summary: "وحدات قياس الحرارة، التوصيل والحمل والإشعاع، التمدد الحراري.",
          exercises: "11 مسألة حرارية مع جداول الخصائص الحرارية"
        },
        {
          id: 10,
          title: "الغازات والقوانين الحرارية",
          description: "سلوك الغازات تحت ظروف مختلفة من الضغط والحرارة.",
          duration: "50 دقيقة",
          summary: "قانون بويل، قانون شارل، قانون الغاز المثالي، النظرية الحركية للغازات.",
          exercises: "17 تطبيق عملي مع رسوم بيانية تفاعلية"
        }
      ]
    },
    {
      id: 5,
      title: "الفيزياء الذرية والنووية",
      icon: <Atom className="w-8 h-8" />,
      description: "استكشاف بنية الذرة والنواة والظواهر الكمية.",
      subject: "الفيزياء الحديثة",
      courses: [
        {
          id: 11,
          title: "بنية الذرة",
          description: "النماذج الذرية وتطورها عبر التاريخ حتى النموذج الحديث.",
          duration: "45 دقيقة",
          summary: "نموذج رذرفورد، نموذج بور، المدارات الإلكترونية، الأطياف الذرية.",
          exercises: "13 مسألة طيفية مع رسوم توضيحية للمدارات"
        },
        {
          id: 12,
          title: "النشاط الإشعاعي",
          description: "دراسة تفكك الأنوية المشعة وأنواع الإشعاعات النووية.",
          duration: "40 دقيقة",
          summary: "أنواع الإشعاع (ألفا، بيتا، جاما)، قانون التفكك الإشعاعي، عمر النصف.",
          exercises: "9 تطبيقات حسابية مع أمثلة طبية وتقنية"
        }
      ]
    },
    {
      id: 6,
      title: "الموجات والصوت",
      icon: <Radio className="w-8 h-8" />,
      description: "دراسة خصائص الموجات الميكانيكية والكهرومغناطيسية.",
      subject: "الموجات",
      courses: [
        {
          id: 13,
          title: "الموجات الميكانيكية",
          description: "الخصائص الأساسية للموجات وانتشارها في الأوساط المادية.",
          duration: "50 دقيقة",
          summary: "أنواع الموجات، الطول الموجي، التردد، سرعة الموجة، مبدأ الانعكاس.",
          exercises: "15 مسألة موجية مع محاكاة تفاعلية"
        },
        {
          id: 14,
          title: "الصوت والسمع",
          description: "دراسة الموجات الصوتية وخصائصها وتطبيقاتها العملية.",
          duration: "45 دقيقة",
          summary: "انتشار الصوت، شدة الصوت، تأثير دوبلر، الرنين الصوتي.",
          exercises: "12 تجربة صوتية مع قياسات عملية"
        }
      ]
    }
  ];

  const filteredChapters = useMemo(() => {
    return chapters.filter(chapter => 
      chapter.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chapter.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chapter.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const openDialog = (chapter) => {
    setSelectedChapter(chapter);
  };

  const closeDialog = () => {
    setSelectedChapter(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-400 to-pink-500 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">فصول الفيزياء</h1>
          <p className="text-red-100 text-lg">استكشف عالم الفيزياء من خلال فصول تفاعلية ومحتوى تعليمي شامل</p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8 max-w-md mx-auto">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="w-full pr-10 pl-4 py-3 border border-red-200 rounded-xl bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent placeholder-gray-500 text-right"
            placeholder="ابحث عن فصل أو موضوع..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Chapter Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChapters.map((chapter) => (
            <div
              key={chapter.id}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 cursor-pointer border border-white/20 hover:scale-105 hover:shadow-xl"
              onClick={() => openDialog(chapter)}
            >
              <div className="flex items-center mb-4">
                <div className="text-white ml-3">
                  {chapter.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">{chapter.title}</h3>
                  <span className="inline-block bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                    {chapter.subject}
                  </span>
                </div>
              </div>
              <p className="text-red-100 text-sm leading-relaxed">{chapter.description}</p>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-white/80 text-sm">
                  {chapter.courses.length} دروس
                </span>
                <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium">
                  عرض الدروس
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredChapters.length === 0 && (
          <div className="text-center py-12">
            <div className="text-white/60 text-lg">
              لم يتم العثور على فصول تتطابق مع بحثك
            </div>
          </div>
        )}
      </div>

      {/* Courses Dialog */}
      {selectedChapter && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] mt-16 overflow-y-auto">
            {/* Dialog Header */}
            <div className="sticky top-0 bg-gradient-to-r from-red-400 to-pink-500 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="text-white ml-3">
                    {selectedChapter.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedChapter.title}</h2>
                    <p className="text-red-100">{selectedChapter.description}</p>
                  </div>
                </div>
                <button
                  onClick={closeDialog}
                  className="text-white hover:text-red-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Courses List */}
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 text-right">قائمة الدروس</h3>
              <div className="space-y-4">
                {selectedChapter.courses.map((course, index) => (
                  <div
                    key={course.id}
                    className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-red-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm ml-3">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-800 text-right">{course.title}</h4>
                          <p className="text-gray-600 text-sm mt-1 text-right">{course.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center text-gray-500 text-sm">
                        <Clock className="w-4 h-4 ml-1" />
                        <span>{course.duration}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <Play className="w-4 h-4 text-blue-600 ml-2" />
                          <h5 className="font-semibold text-blue-800 text-right">ملخص الفيديو</h5>
                        </div>
                        <p className="text-blue-700 text-sm text-right">{course.summary}</p>
                      </div>

                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <FileText className="w-4 h-4 text-green-600 ml-2" />
                          <h5 className="font-semibold text-green-800 text-right">التمارين</h5>
                        </div>
                        <p className="text-green-700 text-sm text-right">{course.exercises}</p>
                      </div>
                    </div>

                    <div className="flex justify-start mt-4 space-x-3">
                      <button className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-colors">
                        <FileText className="w-4 h-4 ml-1" />
                        ملخص PDF
                      </button>
                      <button className="bg-green-100 hover:bg-green-200 text-green-800 px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-colors">
                        <FileText className="w-4 h-4 ml-1" />
                        تمارين PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentChaptersPage;