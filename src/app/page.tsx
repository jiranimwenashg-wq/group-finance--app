import React from "react";

export default function Home() {
  const cards = [
    {
      icon: "🚀",
      title: "Super Fast",
      description: "Performance-first design, for a modern web.",
    },
    {
      icon: "🔒",
      title: "Secure",
      description: "Robust security baked in, always.",
    },
    {
      icon: "🎨",
      title: "Customizable",
      description: "Easy to adapt and expand for your needs.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-500 via-blue-500 to-green-300 flex flex-col items-center justify-center px-4">
      {/* Hero Section */}
      <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-lg mb-6 mt-12 text-center">
        Welcome to ModernApp
      </h1>
      <p className="mb-16 text-xl text-white/80 max-w-xl text-center">
        Experience intuitive design, frosted glass effects, and interactive cards.
        Built with Next.js, Tailwind, and React.
      </p>

      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full max-w-5xl">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className="group cursor-pointer relative w-full p-8 rounded-2xl bg-white/10 border border-white/20 shadow-2xl backdrop-blur-md
              transition-all duration-500 hover:scale-105 hover:shadow-3xl hover:bg-white/20
              flex flex-col items-center"
          >
            {/* Gradient Overlay */}
            <div className="absolute inset-0 h-full w-full bg-gradient-to-tr from-pink-500/20 via-violet-500/20 to-cyan-400/20 opacity-0 group-hover:opacity-100 rounded-2xl transition duration-700 pointer-events-none" />
            {/* Card Content */}
            <div className="relative z-10 flex flex-col items-center">
              <span className="text-5xl mb-4">{card.icon}</span>
              <h3 className="text-2xl font-semibold text-white text-center">{card.title}</h3>
              <p className="mt-3 text-white/80 text-center">{card.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}