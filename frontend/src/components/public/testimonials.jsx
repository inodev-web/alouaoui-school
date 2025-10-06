import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, ChevronLeft, ChevronRight } from 'lucide-react';

const Testimonials = () => {
    // Video player states
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    
    // Animation states
    const [isPaused, setIsPaused] = useState(false);
  
    // Video player effects
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
  
      const updateTime = () => setCurrentTime(video.currentTime);
      const updateDuration = () => setDuration(video.duration);
  
      video.addEventListener('timeupdate', updateTime);
      video.addEventListener('loadedmetadata', updateDuration);
      video.addEventListener('ended', () => setIsPlaying(false));
  
      return () => {
        video.removeEventListener('timeupdate', updateTime);
        video.removeEventListener('loadedmetadata', updateDuration);
        video.removeEventListener('ended', () => setIsPlaying(false));
      };
    }, []);
  
    useEffect(() => {
      const timer = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3000);
  
      return () => clearTimeout(timer);
    }, [showControls, isPlaying]);
  
    // Video player functions
    const togglePlay = () => {
      const video = videoRef.current;
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setIsPlaying(!isPlaying);
    };
  
    const handleSeek = (e) => {
      const video = videoRef.current;
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      video.currentTime = pos * duration;
    };
  
    const handleVolumeChange = (e) => {
      const newVolume = parseFloat(e.target.value);
      setVolume(newVolume);
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    };
  
    const toggleMute = () => {
      const video = videoRef.current;
      if (isMuted) {
        video.volume = volume;
        setIsMuted(false);
      } else {
        video.volume = 0;
        setIsMuted(true);
      }
    };
  
    const skip = (seconds) => {
      const video = videoRef.current;
      video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
    };
  
    const toggleFullscreen = () => {
      const container = containerRef.current;
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        container.requestFullscreen();
      }
    };
  
    const formatTime = (time) => {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Sample testimonial data
    const testimonials = [
      {
        id: 1,
        name: "أحمد محمد",
        image: "https://i.pinimg.com/736x/fe/28/bb/fe28bbab33cc4b934770afee1f2dbc72.jpg",
        opinion: "الدروس ممتازة جداً، ساعدتني في فهم الكيمياء بطريقة سهلة وممتعة. أنصح بها بشدة!"
      },
      {
        id: 2,
        name: "فاطمة علي",
        image: "https://i.pinimg.com/736x/fe/28/bb/fe28bbab33cc4b934770afee1f2dbc72.jpg",
        opinion: "أفضل معلم كيمياء! الشرح واضح والنتائج ممتازة. حصلت على أعلى الدرجات بفضله."
      },
      {
        id: 3,
        name: "محمد حسن",
        image: "https://i.pinimg.com/736x/fe/28/bb/fe28bbab33cc4b934770afee1f2dbc72.jpg",
        opinion: "طريقة التدريس رائعة، جعلتني أحب الكيمياء. النتائج تتحدث عن نفسها!"
      },
      {
        id: 4,
        name: "نور الدين",
        image: "https://i.pinimg.com/736x/fe/28/bb/fe28bbab33cc4b934770afee1f2dbc72.jpg",
        opinion: "شرح ممتاز ومبسط، ساعدني في اجتياز الامتحان بدرجة عالية. شكراً جزيلاً!"
      },
      {
        id: 5,
        name: "سارة أحمد",
        image: "https://i.pinimg.com/736x/fe/28/bb/fe28bbab33cc4b934770afee1f2dbc72.jpg",
        opinion: "دروس رائعة ومفيدة جداً. المعلم يشرح بطريقة سهلة ومفهومة للجميع."
      },
      {
        id: 6,
        name: "يوسف محمود",
        image: "https://i.pinimg.com/736x/fe/28/bb/fe28bbab33cc4b934770afee1f2dbc72.jpg",
        opinion: "أفضل استثمار في التعليم! النتائج واضحة والتحسن ملحوظ من أول درس."
      },
      {
        id: 7,
        name: "مريم خالد",
        image: "https://i.pinimg.com/736x/fe/28/bb/fe28bbab33cc4b934770afee1f2dbc72.jpg",
        opinion: "دروس تفاعلية وممتعة، جعلتني أفهم الكيمياء بطريقة مختلفة تماماً."
      },
      {
        id: 8,
        name: "عبدالله سالم",
        image: "https://i.pinimg.com/736x/fe/28/bb/fe28bbab33cc4b934770afee1f2dbc72.jpg",
        opinion: "شرح مميز وطريقة تدريس احترافية. أنصح جميع الطلاب بهذه الدروس."
      },
      {
        id: 9,
        name: "هند محمد",
        image: "https://i.pinimg.com/736x/fe/28/bb/fe28bbab33cc4b934770afee1f2dbc72.jpg",
        opinion: "دروس رائعة ساعدتني في تحسين درجاتي بشكل كبير. شكراً للمجهود الرائع!"
      },
      {
        id: 10,
        name: "خالد أحمد",
        image: "https://i.pinimg.com/736x/fe/28/bb/fe28bbab33cc4b934770afee1f2dbc72.jpg",
        opinion: "أفضل معلم كيمياء في المنطقة! النتائج تتحدث عن نفسها والطلاب راضون جداً."
      }
    ];

    // Duplicate testimonials for seamless loop
    const duplicatedTestimonials = [...testimonials, ...testimonials];

    return (
        <div className="bg-gradient-to-r from-red-400 to-pink-500 min-h-screen py-12">
            <style jsx>{`
                @keyframes scroll {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-50%);
                    }
                }
                .paused {
                    animation-play-state: paused !important;
                }
            `}</style>
            <div className='relative flex flex-col items-center justify-center'>
                <div className="text-center col-span-2">
                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">اراء و نتائج الطلاب</h2>
                    <p className="text-white/90 text-sm md:text-lg max-w-2xl mx-auto px-4 mb-8">
                        اراء و نتائج الطلاب الذين قاموا بدراسة الدروس الخاصة بي
                    </p>
                    
                    {/* Video Player */}
                    <div className="max-w-4xl mx-auto mb-12 px-6">
                        <div 
                            ref={containerRef}
                            className="relative w-full max-w-3xl mx-auto bg-black rounded-xl overflow-hidden shadow-2xl"
                            onMouseEnter={() => setShowControls(true)}
                            onMouseMove={() => setShowControls(true)}
                            onMouseLeave={() => !isPlaying || setShowControls(false)}
                        >
                            {/* Video Element */}
                            <video
                                ref={videoRef}
                                className="w-full aspect-video object-cover scale-[1.03]"
                                src="./public/video.mp4"
                                preload="metadata"
                                onClick={togglePlay}
                            />

                            {/* Center Play Button Overlay */}
                            {!isPlaying && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 transition-opacity duration-300">
                                    <button
                                        onClick={togglePlay}
                                        className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-6 transform hover:scale-110 transition-all duration-300 shadow-2xl"
                                    >
                                        <Play className="w-16 h-16 text-gray-800 ml-1" fill="currentColor" />
                                    </button>
                                </div>
                            )}

                            {/* Controls Overlay */}
                            <div 
                                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-6 transition-opacity duration-300 ${
                                    showControls ? 'opacity-100' : 'opacity-0'
                                }`}
                            >
                                {/* Progress Bar */}
                                <div className="mb-4 flex justify-center md:block">
                                    <div 
                                        className="w-full max-w-xs md:max-w-none h-2 bg-white bg-opacity-30 rounded-full cursor-pointer hover:h-3 transition-all duration-200"
                                        onClick={handleSeek}
                                    >
                                        <div 
                                            className="h-full bg-gradient-to-r from-red-400 to-pink-500 rounded-full relative"
                                            style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                                        >
                                            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 hover:opacity-100 transition-opacity"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        {/* Play/Pause */}
                                        <button
                                            onClick={togglePlay}
                                            className="text-white hover:text-pink-300 transition-colors duration-200"
                                        >
                                            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                                        </button>

                                        {/* Time Display */}
                                        <div className="text-white text-sm font-mono">
                                            {formatTime(currentTime)} / {formatTime(duration)}
                                        </div>
                                    </div>

                                    {/* Fullscreen */}
                                    <button
                                        onClick={toggleFullscreen}
                                        className="text-white hover:text-pink-300 transition-colors duration-200"
                                    >
                                        <Maximize className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Constantly Moving Testimonials */}
                    <div className="w-[98.5vw]">
                        <div className="relative overflow-hidden">
                            {/* Moving Container */}
                            <div 
                                className={`flex space-x-6 ${isPaused ? 'paused' : ''}`}
                                style={{
                                    animation: 'scroll 30s linear infinite',
                                    width: 'calc(200% + 3rem)'
                                }}
                                onMouseEnter={() => setIsPaused(true)}
                                onMouseLeave={() => setIsPaused(false)}
                            >
                                {duplicatedTestimonials.map((testimonial, index) => (
                                    <div
                                        key={`${testimonial.id}-${index}`}
                                        className="flex-shrink-0 w-96"
                                    >
                                        {/* Testimonial Card with 3/5 aspect ratio */}
                                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl overflow-hidden" style={{ aspectRatio: '5/3' }}>
                                            <div className="flex h-full">
                                                {/* Left Side - Picture */}
                                                <div className="w-3/5 relative">
                                                    <img
                                                        src={testimonial.image}
                                                        alt={testimonial.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {/* Overlay with name and rating */}
                                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                                                        <h4 className="text-white font-bold text-xl mb-2">{testimonial.name}</h4>
                                                        <div className="flex text-yellow-400">
                                                            {[...Array(5)].map((_, i) => (
                                                                <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                </svg>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Right Side - Speech */}
                                                <div className="w-2/5 p-8 flex flex-col justify-center">
                                                    <div className="text-right">
                                                        <div className="text-6xl text-white/20 mb-4">"</div>
                                                        <p className="text-white/90 text-lg leading-relaxed mb-6 font-medium">
                                                            {testimonial.opinion}
                                                        </p>
                                                        <div className="text-right text-white/60 text-sm">
                                                            طالب في منصة الأستاذ العلاوي
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Testimonials;