import React from 'react';
import { SignIn } from '@clerk/react';
import centerPhoto from '../assets/images/MR FLORES.png';

export const AuthScreen: React.FC = () => {
  return (
    <main className="min-h-dvh bg-[#eef2ee] px-4 py-8 text-[#17312e] sm:flex sm:items-center sm:justify-center sm:py-12">
      <section className="mx-auto w-full max-w-md border border-[#d9e1dc] bg-[#fbfcfa] shadow-[0_18px_50px_rgba(23,58,55,0.12)]">
        <div className="border-b border-[#dfe6e1] px-6 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <img src={centerPhoto} alt="Mayor Moises R. Flores Health Center" className="h-12 w-12 rounded-full border border-[#dfe6e1] object-cover" />
            <div>
              <div className="text-sm font-bold">Mayor Moises R. Flores</div>
              <div className="mt-0.5 text-xs text-[#66736f]">Health Center</div>
            </div>
          </div>
        </div>

        <div className="px-6 py-7 sm:px-8">
          <SignIn
            appearance={{ elements: { rootBox: 'w-full', cardBox: 'w-full shadow-none', card: 'w-full shadow-none border-0' } }}
          />
        </div>
      </section>
    </main>
  );
};
