import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer-enter border-t border-white/10 bg-[#0f4d3c] px-5 py-3 text-center text-xs text-white/75 sm:py-3.5">
      <div>© {new Date().getFullYear()} Mayor Moises R. Flores Health Center — All rights reserved</div>
      <nav aria-label="Legal" className="mt-2 flex justify-center gap-4">
        <a href="/privacy-policy" className="underline underline-offset-2 hover:text-white">Privacy Policy</a>
        <a href="/terms-of-service" className="underline underline-offset-2 hover:text-white">Terms of Service</a>
      </nav>
    </footer>
  );
};
