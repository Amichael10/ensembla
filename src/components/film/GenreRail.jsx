import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';

const GENRES = [
  { name: 'Action', icon: 'solar:bolt-bold', color: 'from-red-500/20 to-red-600/5' },
  { name: 'Comedy', icon: 'solar:smile-circle-bold', color: 'from-yellow-400/20 to-yellow-500/5' },
  { name: 'Drama', icon: 'solar:mask-happly-bold', color: 'from-blue-500/20 to-blue-600/5' },
  { name: 'Romance', icon: 'solar:heart-bold', color: 'from-pink-500/20 to-pink-600/5' },
  { name: 'Thriller', icon: 'solar:ghost-bold', color: 'from-purple-500/20 to-purple-600/5' },
  { name: 'Horror', icon: 'solar:skull-bold', color: 'from-gray-700/20 to-black/5' },
  { name: 'Documentary', icon: 'solar:videocamera-record-bold', color: 'from-green-500/20 to-green-600/5' },
];

export default function GenreRail() {
  return (
    <section className="py-12 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <h2 className="font-heading font-bold text-2xl text-text-primary tracking-tighter">
          Genre Moods
        </h2>
        <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60">
          Find your next obsession
        </p>
      </div>

      <div className="flex gap-4 overflow-x-auto px-4 sm:px-6 lg:px-8 pb-4 no-scrollbar">
        {GENRES.map((genre, i) => (
          <motion.div
            key={genre.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            viewport={{ once: true }}
          >
            <Link
              to={`/browse?genre=${genre.name}`}
              className={`group relative flex flex-col items-center justify-center w-32 h-32 rounded-2xl border border-border bg-gradient-to-br ${genre.color} hover:border-brand/40 transition-all duration-500 overflow-hidden`}
            >
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Icon 
                icon={genre.icon} 
                className="text-3xl text-text-primary group-hover:scale-110 group-hover:text-brand transition-all duration-500" 
              />
              <span className="mt-3 text-[10px] font-black uppercase tracking-widest text-text-primary/80 group-hover:text-text-primary transition-colors">
                {genre.name}
              </span>
              
              {/* Decorative accent */}
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand/10 rounded-full blur-xl group-hover:bg-brand/20 transition-all" />
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
