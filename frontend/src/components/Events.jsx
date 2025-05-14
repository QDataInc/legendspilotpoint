const Events = () => {
  return (
    <div
      className="min-h-screen bg-cover bg-center text-gray-800 relative"
      style={{
        backgroundImage:
          "url('https://source.unsplash.com/1600x900/?celebration,events,party')",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/30 z-0"></div>

      <div className="pt-36 relative z-10">
        <header className="bg-[#F59E0B] text-white py-8">
          <h1 className="text-center text-4xl font-bold uppercase tracking-wide">
            Host Memorable Events
          </h1>
          <p className="text-center text-lg mt-2">
            Celebrate Life's Moments with Us
          </p>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-10">
          <section className="text-center text-white mb-12">
            <h2 className="text-3xl font-semibold">
              The Perfect Venue for Every Occasion
            </h2>
            <p className="mt-4 text-lg">
              From intimate gatherings to grand celebrations, we provide the
              ideal space, flavors, and services to make your event
              unforgettable.
            </p>
          </section>

          <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-white">
            <div className="bg-white/90 p-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition duration-300">
              <img
                src="img-vid/Birthday.jpg"
                alt="Birthday Parties"
                className="w-full h-40 object-cover rounded-md mb-4"
              />
              <h3 className="font-bold text-xl text-gray-800">
                Birthday Parties
              </h3>
              <p className="text-gray-600 mt-2">
                Celebrate your special day with tailored menus, decorations, and
                a lively atmosphere.
              </p>
            </div>

            <div className="bg-white/90 p-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition duration-300">
              <img
                src="img-vid/Corporate.jpg"
                alt="Corporate Events"
                className="w-full h-40 object-cover rounded-md mb-4"
              />
              <h3 className="font-bold text-xl text-gray-800">
                Corporate Events
              </h3>
              <p className="text-gray-600 mt-2">
                Host your meetings, team celebrations, or corporate retreats in
                our private spaces.
              </p>
            </div>

            <div className="bg-white/90 p-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition duration-300">
              <img
                src="img-vid/Wedding.jpg"
                alt="Weddings & Rehearsals"
                className="w-full h-40 object-cover rounded-md mb-4"
              />
              <h3 className="font-bold text-xl text-gray-800">
                Weddings & Rehearsals
              </h3>
              <p className="text-gray-600 mt-2">
                Celebrate your love with an elegant setup and impeccable dining
                experience.
              </p>
            </div>

            <div className="bg-white/90 p-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition duration-300">
              <img
                src="img-vid/HolidayParty.jpg"
                alt="Holiday Parties"
                className="w-full h-40 object-cover rounded-md mb-4"
              />
              <h3 className="font-bold text-xl text-gray-800">
                Holiday Parties
              </h3>
              <p className="text-gray-600 mt-2">
                Bring joy to the season with festive parties featuring seasonal
                menus and decor.
              </p>
            </div>

            <div className="bg-white/90 p-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition duration-300">
              <img
                src="img-vid/Anniversary.jpg"
                alt="Anniversaries"
                className="w-full h-40 object-cover rounded-md mb-4"
              />
              <h3 className="font-bold text-xl text-gray-800">Anniversaries</h3>
              <p className="text-gray-600 mt-2">
                Mark your milestones with an unforgettable evening of fine
                dining and ambiance.
              </p>
            </div>

            <div className="bg-white/90 p-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition duration-300">
              <img
                src="img-vid/Celebrations.jpg"
                alt="Other Celebrations"
                className="w-full h-40 object-cover rounded-md mb-4"
              />
              <h3 className="font-bold text-xl text-gray-800">
                Other Celebrations
              </h3>
              <p className="text-gray-600 mt-2">
                Host graduations, reunions, or any special occasion in our
                versatile event spaces.
              </p>
            </div>
          </section>

          <section className="text-center mt-16">
            <h2 className="text-2xl font-bold text-white">What We Offer</h2>
            <p className="text-lg text-white mt-2">
              Our event services include:
            </p>
            <ul className="mt-4 text-white text-lg list-disc list-inside">
              <li>Customizable menus</li>
              <li>Decor and theme planning</li>
              <li>Professional event staff</li>
              <li>Audio-visual setup</li>
              <li>Private and semi-private spaces</li>
            </ul>
          </section>

          <section className="text-center mt-16">
            <h2 className="text-2xl font-bold text-white">
              Let’s Make Your Event Unforgettable!
            </h2>
            <p className="text-lg text-white mt-2">
              Contact us today to discuss your event needs and reserve your
              space.
            </p>
            <button className="mt-6 bg-[#6D28D9] text-white py-3 px-8 rounded-lg font-semibold shadow hover:shadow-lg transform hover:-translate-y-1 transition duration-300">
              Plan Your Event
            </button>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Events;
