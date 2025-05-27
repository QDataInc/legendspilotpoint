const AboutUs = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <section
        className="bg-cover bg-center h-[500px] relative"
        style={{
          backgroundImage:
            "url('https://source.unsplash.com/1600x900/?TexMex,restaurant')",
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-6">
          <h1 className="text-5xl font-bold uppercase tracking-wider">
            Welcome to Legends Bar & Grill
          </h1>
          <p className="mt-4 text-lg max-w-3xl">
            Where the bold flavors of Texas meet the vibrant traditions of
            Mexico.
          </p>
        </div>
      </section>

      <section className="py-16 px-6 max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-center text-[#D97706] mb-10">
          Our Journey
        </h2>
        <div className="space-y-10">
          <div className="flex items-center gap-6">
            <div className="w-2 h-20 bg-[#D97706]"></div>
            <div>
              <h3 className="text-2xl font-semibold">The Beginning</h3>
              <p className="mt-2 text-gray-700">
                Legends Bar & Grill was founded with one goal in mind: to create
                a space where bold Tex-Mex flavors and heartwarming hospitality
                come together. Starting in a small corner of Texas, we’ve grown
                into a beloved gathering place for friends and family.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="w-2 h-20 bg-[#D97706]"></div>
            <div>
              <h3 className="text-2xl font-semibold">Crafting Tex-Mex Magic</h3>
              <p className="mt-2 text-gray-700">
                From sizzling fajitas to crispy tacos and freshly made
                guacamole, we’re all about honoring authentic recipes while
                adding our own innovative twist. Every dish is crafted with
                locally sourced ingredients and a lot of love.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="w-2 h-20 bg-[#D97706]"></div>
            <div>
              <h3 className="text-2xl font-semibold">A Place for Community</h3>
              <p className="mt-2 text-gray-700">
                Over the years, Legends has become more than just a
                restaurant—it’s a place where people come to connect, celebrate,
                and make memories. From festive gatherings to casual nights out,
                we love being part of your story.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F9FAFB] py-16 px-6">
        <h2 className="text-4xl font-bold text-center text-[#D97706] mb-10">
          What Sets Us Apart
        </h2>
        <div className="grid md:grid-cols-2 justify-center gap-10 max-w-4xl mx-auto">
          <div className="text-center">
            <img
              src="img-vid/meat.jpg"
              alt="Fresh Ingredients"
              className="w-full h-52 object-cover rounded-lg mb-4"
            />
            <h3 className="text-xl font-semibold">Fresh Ingredients</h3>
            <p className="mt-2 text-gray-700">
              We source the best local produce to ensure every bite bursts with
              flavor and authenticity.
            </p>
          </div>
          <div className="text-center">
            <img
              src="img-vid/texMex.jpg"
              alt="TexMex Vibes"
              className="w-full h-52 object-cover rounded-lg mb-4"
            />
            <h3 className="text-xl font-semibold">True Tex-Mex Vibes</h3>
            <p className="mt-2 text-gray-700">
              From the decor to the dishes, we bring the bold, colorful spirit
              of Tex-Mex to life.
            </p>
          </div>
        
        </div>
      </section>

      <section className="bg-[#D97706] py-16 text-white text-center">
        <h2 className="text-3xl font-bold mb-6">
          Let’s Make Memories Together
        </h2>
        <p className="text-lg max-w-3xl mx-auto mb-8">
          Whether it’s a family dinner, a night out with friends, or a festive
          celebration, we’re here to serve up unforgettable flavors and
          experiences. Stop by and see why we’re a local favorite!
        </p>
        <button
          className="bg-white text-[#D97706] py-3 px-6 rounded-lg font-semibold shadow hover:shadow-lg hover:bg-[#F59E0B] hover:text-white transition duration-300"
          onClick={() => (window.location.href = "/menu")}
        >
          Explore Our Menu
        </button>
      </section>
    </div>
  );
};

export default AboutUs;
