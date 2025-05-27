const HomePage = () => {
  return (
    <div className="relative w-full min-h-screen flex flex-col">
      <div className="relative w-full h-screen ">
        <video className="w-full h-full object-cover" autoPlay loop muted>
          <source src="/img-vid/homePageVid.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <div className=" absolute top-[60%] left-10 transform -translate-y-1/2 text-white max-w-2xl">
          <div className="font-['Rock_Salt'] text-7xl font-bold">
            Where Smoke Meets Spice
          </div>
          <div className="pt-5 font-['Merriweather'] text-lg leading-relaxed">
            Welcome to the ultimate backyard fiesta! From smoky BBQ classics to
            bold Tex-Mex flavors, we bring the heat and the heart of the
            Southwest right to your plate. Gather your friends, fire up the
            grill, and savor the perfect blend of spice, smoke, and sunshine.
          </div>
        </div>
      </div>
      <div className="absolute inset-0 flex  justify-center h-10 w-full"></div>
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-black text-white px-10 py-14 flex flex-col md:flex-row items-center justify-between  shadow-xl transition-transform duration-500 hover:scale-105">
        <h1
          className="text-6xl md:text-7xl font-bold font-['Libre_Baskerville'] uppercase mb-6 md:mb-0 md:w-1/2 text-center md:text-left"
          style={{
            letterSpacing: "2px",
            textShadow: "2px 2px 5px rgba(0,0,0.5,0.5)",
          }}
        >
          BBQ Done Bold, Texas Style!
        </h1>

        <div className="md:w-1/2">
          <p
            className="text-lg md:text-xl font-light leading-relaxed mb-6"
            style={{
              color: "#E2E8F0",
              fontFamily: "Lora, serif",
              textAlign: "justify",
            }}
          >
            Welcome to the flavor frontier! Here, smoky BBQ meets zesty Tex-Mex
            for a taste you won't forget. Sink your teeth into fire-grilled
            brisket quesadillas, tangy chipotle-glazed ribs, or our signature
            smoked carnitas tacos. Pair it with an ice-cold Texas Mule or a
            spicy mango margarita from our bar, and you've got yourself a
            fiesta. Not a meat lover? Our grilled street corn and smoky avocado
            bowls bring the heat for everyone at the table. So grab a seat,
            round up your crew, and let's turn up the flavor!
          </p>

          <a
            href="/menu"
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-full shadow-lg transition-transform duration-300 hover:scale-110"
          >
            Explore Our Menu
          </a>
        </div>
      </div>

      <div className="w-full h-[500px]">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12350.861523457834!2d-96.959899562585!3d33.408396534063044!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x864c4f006737c587%3A0x9f732a837670c9eb!2sFour%20Horsemen%20HOTEL!5e1!3m2!1sen!2sus!4v1734548059225!5m2!1sen!2sus"
          className="w-full h-full object-cover rounded-lg shadow-xl"
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    </div>
  );
};

export default HomePage;
