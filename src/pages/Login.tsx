import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Squares from '@/components/utils/Backgrounds/Squares/Squares';
import ShinyText from '@/components/utils/TextAnimations/ShinyText/ShinyText';
import SplitText from '@/components/utils/TextAnimations/SplitText/SplitText';
import logo42 from '../assets/42_Logo.svg';

export default function Login() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };


  return (
    <div className="relative h-screen w-full overflow-x-hidden">
      <div className="absolute inset-0 z-0">
        <Squares
          speed={0.2}
          squareSize={40}
          direction='diagonal'
          borderColor='#363d46'
          hoverFillColor='#ffffff'
        />
      </div>

      <div className="relative z-10 h-full w-full flex flex-col justify-center items-center px-4">
        <div className="max-w-2xl w-full text-center space-y-12">
          <div className="space-y-4">
            <SplitText
              text="Welcome to Codexion visualizer"
              tag="h1"
              className="text-6xl md:text-7xl font-bold text-white mb-4"
              delay={50}
              duration={0.8}
              from={{ opacity: 0, y: 30 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0}
            />
            <p className="text-xl md:text-2xl text-gray-400 font-light">
              Connect with your 42 account to get started
            </p>
          </div>

          <div className="flex justify-center pt-8">
            <button
              onClick={handleLogin}
              className="cursor-pointer transition-transform duration-300 hover:scale-105 text-white w-auto px-7 h-[54px] flex justify-center items-center rounded-[50px] font-medium text-xs"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div className="flex items-center justify-center gap-3">
                <ShinyText
                  text="Connect with"
                  disabled={false}
                  speed={3}
                />
                <img 
                  src={logo42} 
                  alt="42 Logo" 
                  className="w-6 h-6 md:w-7 md:h-7"
                />
              </div>
            </button>
          </div>
          <div className="pt-8 text-gray-500 text-sm">
            <p>Secure authentication powered by 42 OAuth</p>
          </div>
        </div>
      </div>
    </div>
  );
}