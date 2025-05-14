const Catering = () => {
  return (
    <div className="min-h-screen bg-[#FFF8F1]">
      <section className="relative overflow-hidden">
        <div
          className="bg-gradient-to-br from-[#FFEDD5] to-[#FDBA74] h-[600px] flex items-center justify-center text-center relative z-10"
        >
          <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{backgroundImage: "url('https://source.unsplash.com/1600x900/?tacos,party')"}}></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#FFEDD5]/80 via-transparent to-[#FDBA74]/80"></div>
          <div className="relative z-20 px-4 max-w-4xl">
            <h1 className="text-6xl font-extrabold mb-6 tracking-tight" style={{color: '#C2410C'}}>
              Catering Like Never Before 🌮🎉
            </h1>
            <p className="text-xl mb-6" style={{color: '#C2410C'}}>
              We don't just serve food – we serve unforgettable Tex-Mex vibes.
              Perfect for weddings, birthdays, corporate shindigs, or just a
              Tuesday celebration.
            </p>
            <button className="bg-[#FF7300] text-white py-3 px-8 rounded-full text-lg font-bold shadow-lg hover:scale-105 transform transition duration-300">
              Get Started Today
            </button>
          </div>
        </div>
        <div className="absolute -top-16 left-10 animate-float">
          <img
            src="https://source.unsplash.com/100x100/?taco"
            alt="Floating taco"
            className="w-24 h-24 opacity-80"
          />
        </div>
        <div className="absolute -top-20 right-20 animate-float-reverse">
          <img
            src="https://source.unsplash.com/100x100/?chips,guacamole"
            alt="Floating guacamole"
            className="w-20 h-20 opacity-80"
          />
        </div>
      </section>

      <section className="py-20 bg-[#FFECD1] text-gray-800">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-10">Why Choose Us?</h2>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="flex flex-col items-center">
              <img
                src="img-vid/catering1.jpg"
                alt="Expert Chefs"
                className=" rounded-lg mb-4 shadow-lg"
              />
              <h3 className="text-2xl font-semibold">Expert Chefs</h3>
              <p className="mt-2">
                Our chefs bring authentic Tex-Mex magic to your table.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <img
                src="img-vid/catering2.jpg"
                alt="Custom Menus"
                className=" rounded-lg mb-4 shadow-lg"
              />
              <h3 className="text-2xl font-semibold">Custom Menus</h3>
              <p className="mt-2">
                Tacos, enchiladas, churros, or a custom fiesta menu – your wish
                is our command.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <img
                src="img-vid/catering3.jpg"
                alt="Stress-Free Setup"
                className="rounded-lg mb-4 shadow-lg"
              />
              <h3 className="text-2xl font-semibold">Stress-Free Setup</h3>
              <p className="mt-2">
                We bring the party to you – setup, service, and cleanup
                included.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#FFF8F1] text-gray-800">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-16">Choose Your Vibe 🎊</h2>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="group hover:bg-[#FF7300] hover:text-white transition duration-300 p-8 rounded-lg shadow-lg">
              <div className="mb-6">
                <img
                  src="img-vid/catering1.jpg"
                  alt="Intimate Gatherings"
                  className="w-20 h-20 mx-auto group-hover:scale-110 transform transition"
                />
              </div>
              <h3 className="text-2xl font-bold mb-4">Small & Cozy</h3>
              <p>
                Perfect for 10-20 people. Includes appetizers, main courses, and
                desserts.
              </p>
            </div>
            <div className="group hover:bg-[#FF7300] hover:text-white transition duration-300 p-8 rounded-lg shadow-lg">
              <div className="mb-6">
                <img
                  src="img-vid/catering2.jpg"
                  alt="Corporate Vibes"
                  className="w-20 h-20 mx-auto group-hover:scale-110 transform transition"
                />
              </div>
              <h3 className="text-2xl font-bold mb-4">Corporate Fiesta</h3>
              <p>
                Impress your clients or team with a full Tex-Mex spread and
                professional service.
              </p>
            </div>
            <div className="group hover:bg-[#FF7300] hover:text-white transition duration-300 p-8 rounded-lg shadow-lg">
              <div className="mb-6">
                <img
                  src="img-vid/catering3.jpg"
                  alt="Weddings & Big Days"
                  className="w-20 h-20 mx-auto group-hover:scale-110 transform transition"
                />
              </div>
              <h3 className="text-2xl font-bold mb-4">Weddings & Big Days</h3>
              <p>
                All-inclusive catering for your special day, tailored to your
                dreams.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-[#FF7300] to-[#FDBA74] text-white text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold mb-6">
            Let’s Get This Party Started!
          </h2>
          <p className="text-xl mb-8">
            Ready to serve up bold flavors and unforgettable vibes? Get in touch
            with us now to plan your event.
          </p>
          <button className="bg-white text-[#FF7300] py-3 px-8 rounded-full font-bold shadow-lg hover:scale-105 transform transition">
            Contact Us Today
          </button>
        </div>
      </section>
    </div>
  );
};

export default Catering;
