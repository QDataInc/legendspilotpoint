import { motion } from 'framer-motion';
import { FaFacebook, FaInstagram, FaTwitter, FaLinkedin, FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="relative bg-[#1A1A1A] text-white py-6">
      {/* Wood texture overlay */}
      <div className="absolute inset-0 opacity-10 bg-[url('/img-vid/wood-texture.jpg')] bg-repeat"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Restaurant Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl font-['Cinzel'] font-semibold mb-2 text-[#F56A00]">
              Four Horsemen Restaurant
            </h2>
            <p className="text-gray-400 leading-relaxed">
              Serving the finest TexMex cuisine in Pilot Point, TX. Join us for
              a dining experience that blends tradition with modern flavors.
            </p>
          </motion.div>

          {/* Menu Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h2 className="text-xl font-['Cinzel'] font-semibold mb-2 text-[#F56A00]">Explore Our Menu</h2>
            <ul className="space-y-1">
              {[
                { label: 'Full Menu', path: '/menu' },
                { label: 'Catering Services', path: '/catering' }
                
              ].map((item, index) => (
                <motion.li
                  key={index}
                  whileHover={{ x: 5 }}
                  className="text-gray-400 hover:text-[#F56A00] transition-colors duration-300"
                >
                  <Link to={item.path} className="flex items-center">
                    <span className="w-2 h-2 bg-[#F56A00] rounded-full mr-2"></span>
                    {item.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-xl font-['Cinzel'] font-semibold mb-2 text-[#F56A00]">Contact Us</h2>
            <div className="space-y-1">
              <motion.p 
                whileHover={{ x: 5 }}
                className="text-gray-400 flex items-center"
              >
                <FaMapMarkerAlt className="text-[#F56A00] mr-2" />
                1301 US-377, Pilot Point, TX 76258
              </motion.p>
              <motion.p 
                whileHover={{ x: 5 }}
                className="text-gray-400 flex items-center"
              >
                <FaEnvelope className="text-[#F56A00] mr-2" />
                legendspilotpoint@gmail.com
              </motion.p>
              <motion.p 
                whileHover={{ x: 5 }}
                className="text-gray-400 flex items-center"
              >
                <FaPhone className="text-[#F56A00] mr-2" />
                (940) 686-2256
              </motion.p>
            </div>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h2 className="text-xl font-['Cinzel'] font-semibold mb-2 text-[#F56A00]">Follow Us</h2>
            <div className="flex space-x-4">
              {[
                { icon: FaFacebook, label: 'Facebook', url: 'https://facebook.com' },
                { icon: FaInstagram, label: 'Instagram', url: 'https://instagram.com' }
                
              ].map((social, index) => (
                <motion.a
                  key={index}
                  href={social.url}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-gray-400 hover:text-[#F56A00] transition-colors duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="w-6 h-6" />
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-6 pt-4 border-t border-gray-800 text-center text-sm"
        >
          <p className="text-gray-400">
            &copy; {new Date().getFullYear()} Four Horsemen Restaurant. All rights reserved.
          </p>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
