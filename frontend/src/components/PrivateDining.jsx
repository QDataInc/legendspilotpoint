const PrivateDining = () => {
  return (
    <div
      className="min-h-screen bg-cover bg-center text-gray-800 relative"
      style={{
        backgroundImage:
          "url('https://unsplash.com/photos/people-sitting-on-chair-in-restaurant-kgjQ1AGDwE0')",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/30 z-0"></div>

      <div className="pt-36 relative z-10">
        <header className="bg-[#F59E0B] text-white py-8">
          <h1 className="text-center text-4xl font-bold uppercase tracking-wide">
            Private Dining
          </h1>
          <p className="text-center text-lg mt-2">
            Exclusive Spaces for Your Memorable Gatherings
          </p>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-10">
          <section className="text-center text-white mb-12">
            <h2 className="text-3xl font-semibold">
              Make Your Occasion Extra Special
            </h2>
            <p className="mt-4 text-lg">
              Experience the perfect blend of ambiance, flavors, and service in
              our exclusive private dining spaces. Ideal for birthdays,
              anniversaries, corporate events, or any special occasion.
            </p>
          </section>

          <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-white">
            <div className="bg-white/90 p-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition duration-300">
              <img
                src="img-vid/ambience1.jpg"
                alt="Elegant Ambiance"
                className="w-full h-40 object-cover rounded-md mb-4"
              />
              <h3 className="font-bold text-xl text-gray-800">
                Elegant Ambiance
              </h3>
              <p className="text-gray-600 mt-2">
                Enjoy a beautifully designed private room with a warm and
                inviting atmosphere.
              </p>
            </div>

            <div className="bg-white/90 p-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition duration-300">
              <img
                src="img-vid/ambience2.jpg"
                alt="Custom Menus"
                className="w-full h-40 object-cover rounded-md mb-4"
              />
              <h3 className="font-bold text-xl text-gray-800">Custom Menus</h3>
              <p className="text-gray-600 mt-2">
                Work with our chefs to craft a menu tailored to your event and
                preferences.
              </p>
            </div>

            <div className="bg-white/90 p-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition duration-300">
              <img
                src="img-vid/ambience3.jpg"
                alt="Dedicated Service"
                className="w-full h-40 object-cover rounded-md mb-4"
              />
              <h3 className="font-bold text-xl text-gray-800">
                Dedicated Service
              </h3>
              <p className="text-gray-600 mt-2">
                Enjoy the attention of a dedicated staff ensuring every detail
                is perfect.
              </p>
            </div>
          </section>        
          <section className="text-center mt-16">
            <h2 className="text-2xl font-bold text-white">
              Ready to Book Your Private Dining Experience?
            </h2>
            <p className="text-lg text-white mt-2">
              Contact us today to reserve your spot and plan the perfect event.
            </p>
            <button className="mt-6 bg-[#4B5563] text-white py-3 px-8 rounded-lg font-semibold shadow hover:shadow-lg transform hover:-translate-y-1 transition duration-300">
              Reserve Now
            </button>
          </section>
        </main>
      </div>
    </div>
  );
};
export default PrivateDining;
