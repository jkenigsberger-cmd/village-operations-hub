import logosImage from '@/assets/logos.png';

const PartnerFooter = () => {
  return (
    <footer className="bg-gray-900 border-t border-border py-4 mt-8">
      <div className="container flex flex-col items-center gap-3">
        <img 
          src={logosImage} 
          alt="הדור הבא & GLOW Glamping" 
          className="h-16 md:h-20 w-auto rounded-lg"
        />
        <p className="text-gray-400 text-sm">
          by הדור הבא & GLOW Alternative Hospitality
        </p>
      </div>
    </footer>
  );
};

export default PartnerFooter;
