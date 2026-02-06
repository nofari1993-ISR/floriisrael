import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import BouquetBuilder from "@/components/BouquetBuilder";
import FeaturedShops from "@/components/FeaturedShops";
import AIChat from "@/components/AIChat";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <HowItWorks />
      <BouquetBuilder />
      <FeaturedShops />
      <AIChat />
      <Footer />
    </div>
  );
};

export default Index;
