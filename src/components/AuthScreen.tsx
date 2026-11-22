import React, { useState } from 'react';
import { SignIn, SignUp } from '@clerk/react';
import centerPhoto from '../assets/images/MR FLORES.png';

export const AuthScreen: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);

  const signUpAppearance = {
    variables: {
      colorPrimary: '#8b00ff',
      colorBackground: '#ffffff',
      colorText: '#18181b',
      colorTextSecondary: '#52525b',
      colorInputBackground: '#ffffff',
      colorInputText: '#18181b',
      borderRadius: '0.5rem',
    },
    elements: {
      rootBox: 'w-full',
      cardBox: 'w-full shadow-none',
      card: 'w-full border-0 bg-transparent p-0 shadow-none',
      headerTitle: '!text-zinc-900',
      headerSubtitle: '!text-zinc-600',
      formFieldLabel: '!text-zinc-800',
      formFieldHintText: '!text-zinc-600',
      formFieldErrorText: '!text-rose-600',
      formFieldInput: 'border border-zinc-300 bg-white !text-zinc-900',
      phoneInputInput: '!text-zinc-900',
      socialButtonsBlockButton: '!border-zinc-300 !bg-white hover:!bg-zinc-50',
      socialButtonsBlockButtonText: '!text-zinc-800',
      dividerText: '!text-zinc-600',
      dividerLine: '!bg-zinc-300',
      formButtonPrimary: 'bg-[#8b00ff] hover:bg-[#7600db] shadow-none',
      footerActionText: '!text-zinc-600',
      footerActionLink: '!text-purple-700 hover:!text-purple-800',
      footerAction: '!hidden',
    },
  };
  const signInAppearance = {
    ...signUpAppearance,
    elements: {
      ...signUpAppearance.elements,
      headerTitle: '!text-center !text-zinc-900',
      headerSubtitle: '!text-center !text-zinc-600',
      identityPreviewText: '!text-zinc-900',
    },
  };

  return (
    <main className="min-h-dvh bg-white px-4 py-8 text-zinc-900 sm:flex sm:items-center sm:justify-center sm:py-12">
      <section className="mx-auto w-full max-w-md border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(0,0,0,0.08)]">
        <div className="border-b border-zinc-200 px-6 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <img src={centerPhoto} alt="Mayor Moises R. Flores Health Center" className="h-12 w-12 rounded-full border border-zinc-200 object-cover" />
            <div>
              <div className="text-sm font-bold text-zinc-900">Mayor Moises R. Flores Pateros</div>
              <div className="mt-0.5 text-xs text-zinc-600">Health Center</div>
            </div>
          </div>
        </div>

        <div className="px-6 py-7 sm:px-8">
          {isRegistering ? (
            <SignUp routing="hash" signInUrl="#" appearance={signUpAppearance} />
          ) : (
            <SignIn routing="hash" signUpUrl="#" appearance={signInAppearance} />
          )}
          <div className="mt-5 border-t border-zinc-200 pt-4 text-center text-sm text-zinc-600">
            {isRegistering ? "Already have an account? " : "Don't have an account? "}
            <button
              type="button"
              onClick={() => setIsRegistering((registering) => !registering)}
              className="font-semibold text-purple-700 hover:text-purple-800"
            >
              {isRegistering ? 'Sign in' : 'Sign up'}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};
