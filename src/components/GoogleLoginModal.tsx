import React from 'react';

interface GoogleLoginModalProps {
  startGoogleLogin?: () => Promise<void>;
  showTempAlert: (msg: string) => void;
  setShowGoogleModal: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Google sign-in prompt overlay. Sign-in keeps user data persisted and
 * prevents others from registering with the same email.
 */
export default function GoogleLoginModal({
  startGoogleLogin,
  showTempAlert,
  setShowGoogleModal,
}: GoogleLoginModalProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#111115] border border-blue-500/20 rounded-3xl p-6 text-center max-w-[350px] w-full space-y-4 shadow-2xl relative">
        {/* Standard customized colorful mock Google Icon */}
        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto shadow-md">
          <svg className="w-8 h-8" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-black text-white">Iniciar Sesión con Google</h3>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Para garantizar la seguridad de tu AmourPhone y sincronizarte con tu pareja de forma
            exclusiva, debes autenticarte oficialmente mediante Google.{' '}
            <strong>Esto impide que terceras personas se registren con tu cuenta.</strong>
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={async () => {
              if (startGoogleLogin) {
                await startGoogleLogin();
              } else {
                showTempAlert('El sistema de inicio de sesión de Google no está disponible.');
              }
            }}
            className="w-full py-3 bg-gradient-to-r from-red-550 to-pink-500 hover:scale-[1.01] active:scale-[0.99] text-white font-sans font-black text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all cursor-pointer border-none flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12.24 10.285V13.4h6.887c-.648 2.41-2.519 4.19-5.136 4.19A5.852 5.852 0 0 1 8.13 11.74a5.857 5.857 0 0 1 5.861-5.851c1.478 0 2.825.55 3.862 1.455l2.428-2.428C18.66 3.4 16.481 2.3 13.991 2.3c-5.352 0-9.691 4.34-9.691 9.69s4.339 9.691 9.691 9.691c5.586 0 9.29-3.924 9.29-9.454 0-.6-.057-1.1-.152-1.542H12.24z" />
            </svg>
            Ingresar con Google 🔑
          </button>

          <button
            type="button"
            onClick={() => setShowGoogleModal(false)}
            className="w-full py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-bold rounded-xl transition-colors cursor-pointer border-none"
          >
            Continuar de forma Temporal (Saldrá Vacío)
          </button>
        </div>
      </div>
    </div>
  );
}
