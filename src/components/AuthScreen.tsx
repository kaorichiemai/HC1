import React, { useState } from 'react';
import { SignIn, SignUp } from '@clerk/react';
import centerPhoto from '../assets/images/MR FLORES.png';

export const AuthScreen: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);

  const signUpAppearance = {
    variables: {
      colorPrimary: '#8b00ff',
      colorBackground: '#1f1f23',
      colorText: '#f4f4f5',
      colorTextSecondary: '#a1a1aa',
      colorInputBackground: '#26262b',
      colorInputText: '#f4f4f5',
      borderRadius: '0.5rem',
    },
    elements: {
      rootBox: 'w-full',
      cardBox: 'w-full shadow-none',
      card: 'w-full border-0 bg-transparent p-0 shadow-none',
      headerTitle: '!text-white',
      headerSubtitle: '!text-zinc-300',
      formFieldLabel: '!text-zinc-100',
      formFieldHintText: '!text-zinc-300',
      formFieldErrorText: '!text-rose-300',
      formFieldInput: 'border border-zinc-700 bg-[#26262b] !text-zinc-100',
      phoneInputInput: '!text-zinc-100',
      socialButtonsBlockButton: '!border-zinc-700 !bg-[#1f1f23] hover:!bg-zinc-800',
      socialButtonsBlockButtonText: '!text-white',
      dividerText: '!text-zinc-300',
      dividerLine: '!bg-white',
      formButtonPrimary: 'bg-[#8b00ff] hover:bg-[#7600db] shadow-none',
      footerActionText: '!text-zinc-300',
      footerActionLink: '!text-purple-300 hover:!text-purple-200',
      footerAction: '!hidden',
    },
  };
  const signInAppearance = {
    ...signUpAppearance,
    elements: {
      ...signUpAppearance.elements,
      headerTitle: '!text-center !text-white',
      headerSubtitle: '!text-center !text-zinc-300',
      formFieldLabel: '!text-zinc-100',
      formFieldHintText: '!text-zinc-300',
      formFieldErrorText: '!text-rose-300',
      identityPreviewText: '!text-zinc-100',
      dividerText: '!text-zinc-300',
      socialButtonsBlockButton: '!border-zinc-700 !bg-[#1f1f23] hover:!bg-zinc-800',
      socialButtonsBlockButtonText: '!text-white',
      dividerLine: '!bg-white',
      footerActionText: '!text-zinc-300',
      footerActionLink: '!text-purple-300 hover:!text-purple-200',
    },
  };

  return (
    <main className="min-h-dvh bg-[#17171a] px-4 py-8 text-white sm:flex sm:items-center sm:justify-center sm:py-12">
      <section className="mx-auto w-full max-w-md border border-zinc-800 bg-[#1f1f23] shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
        <div className="border-b border-zinc-800 px-6 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <img src={centerPhoto} alt="Mayor Moises R. Flores Health Center" className="h-12 w-12 rounded-full border border-zinc-700 object-cover" />
            <div>
              <div className="text-sm font-bold text-white">Mayor Moises R. Flores Pateros</div>
              <div className="mt-0.5 text-xs text-zinc-400">Health Center</div>
            </div>
          </div>
        </div>

        <div className="px-6 py-7 sm:px-8">
          {isRegistering ? (
            <SignUp routing="hash" signInUrl="#" appearance={signUpAppearance} />
          ) : (
            <SignIn routing="hash" signUpUrl="#" appearance={signInAppearance} />
          )}
          <div className="mt-5 border-t border-zinc-800 pt-4 text-center text-sm text-zinc-300">
            {isRegistering ? "Already have an account? " : "Don't have an account? "}
            <button
              type="button"
              onClick={() => setIsRegistering((registering) => !registering)}
              className="font-semibold text-purple-300 hover:text-purple-200"
            >
              {isRegistering ? 'Sign in' : 'Sign up'}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};
