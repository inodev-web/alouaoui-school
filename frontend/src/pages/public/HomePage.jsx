import { Link } from "react-router-dom";
import HeroSection from "../../components/public/HeroSection.jsx";
import Navbar from "../../components/common/Layout/Header.jsx";
import Footer from "../../components/common/Layout/Footer.jsx";
import Features from "../../components/public/Features.jsx";
import Events from "../../components/public/Events.jsx";
import About from "../../components/public/About.jsx";
import Testimonials from "../../components/public/testimonials.jsx";
const HomePage = () => {
  return (
    <>
      <Navbar />
      <HeroSection />
      {/* <Events /> */}
      <Features />
      <About />
      <Testimonials />
      <Footer />
    </>
  );
};

export default HomePage;
