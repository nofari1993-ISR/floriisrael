import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import AIBouquetGallery from "@/components/AIBouquetGallery";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <HowItWorks />
      <AIBouquetGallery />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
