import React from 'react';

const Menu = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#FFEDD5] to-[#FDBA74] relative font-['Open_Sans'] pb-12">
      {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-5 bg-[url('/img-vid/pattern.png')] bg-repeat"></div>
      
      <div className="relative z-10 max-w-2xl md:max-w-3xl mx-auto px-2 md:px-8 pt-8">
        {/* Poster Title */}
        <div className="text-center mb-10">
          <h1 className="text-5xl md:text-7xl font-['Bebas_Neue'] font-extrabold uppercase tracking-widest text-[#7C2D12] drop-shadow-sm">
            TRUE TEXAS BBQ
          </h1>
          <p className="text-lg md:text-2xl text-[#C2410C] font-bold mt-2 tracking-wide uppercase">All food available from all kiosks</p>
        </div>

        {/* Coming Soon Message */}
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-center">
            <h2 className="text-6xl md:text-8xl font-['Dancing_Script'] text-[#7C2D12] mb-6 drop-shadow-sm">
              Coming Soon
            </h2>
            <p className="text-2xl md:text-3xl font-['Playfair_Display'] text-[#C2410C] italic">
              Our new menu will be available this fall
            </p>
            <div className="mt-8">
              <p className="text-xl text-[#7C2D12] font-['Playfair_Display']">
                Get ready for an unforgettable culinary experience
              </p>
            </div>
          </div>
        </div>

        {/* Footer Banner */}
        <div className="mt-10 text-center">
          <div className="inline-block bg-[#F59E0B] px-8 py-3 rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 border-[#7C2D12]/20">
            <span className="font-['Bebas_Neue'] text-2xl md:text-3xl font-extrabold uppercase tracking-widest text-[#7C2D12]">Stay Tuned</span>
          </div>
          <p className="text-[#C2410C] mt-2 font-bold tracking-wide">We're crafting something special for you!</p>
        </div>
      </div>
    </div>
  );
};

export default Menu;
