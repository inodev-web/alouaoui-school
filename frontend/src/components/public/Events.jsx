import React, { useState, useEffect, useRef } from "react";

const Events = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isNext, setIsNext] = useState(false);
  const [isPrev, setIsPrev] = useState(false);
  const timeRef = useRef(null);
  const autoNextRef = useRef(null);
  const carouselRef = useRef(null);
  const listRef = useRef(null);
  const thumbnailRef = useRef(null);

  const events = [
    {
      id: 1,
      image:
        "https://i.pinimg.com/736x/d3/fd/30/d3fd3075a906198427ea0d7112c2f797.jpg",
      author: "أستاذ الفيزياء",
      title: "محاضرة الوحدة 1",
      topic: "الفيزياء",
      description:
        "انضم إلينا في محاضرة شيقة عن الفيزياء النووية وتطبيقاتها في الحياة اليومية. سنستكشف أسرار الذرة والقوى النووية",
      thumbnailTitle: "الفيزياء النووية",
      thumbnailDescription: "محاضرة تفاعلية",
    },
    {
      id: 2,
      image:
        "https://i.pinimg.com/736x/06/ee/ec/06eeec82850b17bb073a5b5fad2b1524.jpg",
      author: "أستاذ الفيزياء",
      title: "مراجعة الوحدة 2",
      topic: "الميكانيكا",
      description:
        "ورشة عملية لفهم قوانين نيوتن وتطبيقها في حل المسائل الميكانيكية المعقدة",
      thumbnailTitle: "الميكانيكا",
      thumbnailDescription: "ورشة عملية",
    },
    {
      id: 3,
      image:
        "https://i.pinimg.com/736x/06/ee/ec/06eeec82850b17bb073a5b5fad2b1524.jpg",
      author: "أستاذ الفيزياء",
      title: "لايف اكسدة ارجاع",
      topic: "الكهرباء",
      description:
        "استكشف عالم الكهرباء والمغناطيسية وتعلم كيفية عمل الدوائر الكهربائية والمحركات",
      thumbnailTitle: "الكهرباء",
      thumbnailDescription: "ندوة تفاعلية",
    },
  ];

  const timeRunning = 3000;
  const timeAutoNext = 7000;

  const showSlider = (type) => {
    if (isAnimating) return;

    setIsAnimating(true);
    setIsNext(type === "next");
    setIsPrev(type === "prev");

    // Get DOM elements
    const listDom = listRef.current;
    const thumbnailDom = thumbnailRef.current;
    const carouselDom = carouselRef.current;

    if (listDom && thumbnailDom && carouselDom) {
      const sliderItems = listDom.querySelectorAll(".item");
      const thumbnailItems = thumbnailDom.querySelectorAll(".item");

      if (type === "next") {
        // Move first item to end
        listDom.appendChild(sliderItems[0]);
        thumbnailDom.appendChild(thumbnailItems[0]);
        carouselDom.classList.add("next");
      } else {
        // Move last item to beginning
        listDom.prepend(sliderItems[sliderItems.length - 1]);
        thumbnailDom.prepend(thumbnailItems[thumbnailItems.length - 1]);
        carouselDom.classList.add("prev");
      }
    }

    clearTimeout(timeRef.current);
    timeRef.current = setTimeout(() => {
      setIsAnimating(false);
      setIsNext(false);
      setIsPrev(false);
      if (carouselRef.current) {
        carouselRef.current.classList.remove("next");
        carouselRef.current.classList.remove("prev");
      }
    }, timeRunning);

    clearTimeout(autoNextRef.current);
    autoNextRef.current = setTimeout(() => {
      showSlider("next");
    }, timeAutoNext);
  };

  useEffect(() => {
    // Initialize thumbnail order - move first item to end (this matches the original JS)
    const initializeThumbnails = () => {
      if (thumbnailRef.current) {
        const thumbnailItems = thumbnailRef.current.querySelectorAll(".item");
        if (thumbnailItems.length > 0) {
          // Move the first thumbnail to the end to match the original behavior
          thumbnailRef.current.appendChild(thumbnailItems[0]);
        }
      }
    };

    // Use a longer delay to ensure DOM is fully rendered
    const initTimeout = setTimeout(initializeThumbnails, 200);

    autoNextRef.current = setTimeout(() => {
      showSlider("next");
    }, timeAutoNext);

    return () => {
      clearTimeout(timeRef.current);
      clearTimeout(autoNextRef.current);
      clearTimeout(initTimeout);
    };
  }, []);

  return (
    <>
      <div className="w-full flex flex-col justify-center items-center py-16">
        {/* Title */}
        <div className="text-center col-span-1 md:col-span-2">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
            الاحداث
          </h2>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
            الاحداث و الفعاليات القادمة
          </p>
        </div>
        <div
          className={`carousel ${isNext ? "next" : ""} ${isPrev ? "prev" : ""}`}
          ref={carouselRef}
        >
          <div className="list" ref={listRef}>
            {events.map((event) => (
              <div key={event.id} className="item">
                <img src={event.image} alt={event.title} />
                <div className="content">
                  <div className="title">{event.title}</div>
                  <div className="topic">{event.topic}</div>
                  <div className="des">{event.description}</div>
                  <div className="buttons">
                    <button
                      className="bg-gradient-to-r from-red-400 to-pink-500 text-white 
                               px-6 py-3 rounded-full font-medium text-base
                               hover:from-red-500 hover:to-pink-600 
                               transition-all duration-300 shadow-lg hover:shadow-xl 
                               transform hover:scale-105"
                      onClick={() => {
                        // Handle event check action
                        console.log("Checking event:", event.title);
                      }}
                    >
                      اكتشف المزيد
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Thumbnails */}
          <div className="thumbnail" ref={thumbnailRef}>
            {events.map((event) => (
              <div
                key={event.id}
                className="item"
                onClick={() => {
                  // Simple approach: just click next until we reach the desired item
                  // This is not perfect but will work for now
                }}
              >
                <img src={event.image} alt={event.title} />
                <div className="content">
                  <div className="title">{event.thumbnailTitle}</div>
                  <div className="description">
                    {event.thumbnailDescription}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Progress bar */}
          <div className="time"></div>
        </div>
        {/* Navigation arrows */}
        <div className="arrows">
          <button
            id="prev"
            onClick={() => showSlider("prev")}
            disabled={isAnimating}
          >
            &lt;
          </button>
          <button
            id="next"
            onClick={() => showSlider("next")}
            disabled={isAnimating}
          >
            &gt;
          </button>
        </div>
      </div>
    </>
  );
};

export default Events;
