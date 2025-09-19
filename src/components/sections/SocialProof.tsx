export const SocialProof = () => {
  const testimonials = [
    {
      quote: "BuildSmarter's report is our first checkpoint on any Texas acquisition. Sharp risk analysis gives our investment committee clarity to act decisively.",
      author: "VP of Acquisitions",
      company: "Dallas-Based Private Equity Firm"
    },
    {
      quote: "Backed by Maxx's credibility, it's a buildable plan, not theory. We identified critical utility issues and saved six months on our timeline.",
      author: "Managing Partner", 
      company: "Houston-Based Multifamily Developer"
    }
  ];

  return (
    <section className="bg-mid-gray py-20">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h3 className="font-headline text-4xl md:text-5xl text-white mb-6">
            THE INTELLIGENCE BEHIND TEXAS'S TOP DEALS
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="group">
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-8 border border-white/10 hover:bg-white/10 transition-all duration-300">
                <div className="mb-6">
                  <div className="w-8 h-8 text-maxx-red mb-4">
                    <svg fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                    </svg>
                  </div>
                  <p className="font-body text-lg text-white/90 leading-relaxed italic mb-6">
                    "{testimonial.quote}"
                  </p>
                </div>
                <div className="border-l-4 border-maxx-red pl-4">
                  <p className="font-cta font-semibold text-white">
                    {testimonial.author}
                  </p>
                  <p className="font-body text-white/70 text-sm">
                    {testimonial.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};