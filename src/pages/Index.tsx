import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import ImageSlider from '@/components/ImageSlider';
import { Button } from '@/components/ui/button';
import { Swords, Trophy, X, MessageCircle, Instagram, Send } from 'lucide-react';
import ludoClassicGame from '@/assets/ludo-classic-game.png';
import nkLogo from '@/assets/nk-logo.png';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header isLoggedIn={isAuthenticated} showTermsButton={false} />

      {!isAuthenticated && (
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Welcome to APNA Club</h1>
            <p className="text-muted-foreground">Join over a million active players</p>
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/login')}
                className="w-full"
                size="lg"
              >
                Login / Sign Up
              </Button>
            </div>
          </div>
        </div>
      )}

      {isAuthenticated && (
        <div className="max-w-lg mx-auto px-4 py-6">
          {/* Image Slider */}
          <div className="mb-6">
            <ImageSlider />
          </div>

          {/* Upper separator line */}
          <div className="border-t border-gray-200 mb-4"></div>

          {/* Battle/Tournament Navigation */}
          <div className="mb-4">
            <div className="flex items-center space-x-4 text-[10px] text-gray-600">
              <div className="flex items-center space-x-1">
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <Swords className="w-3 h-3 text-white" />
                </div>
                <span>is for Battles</span>
              </div>
              <span className="text-gray-400">and</span>
              <div className="flex items-center space-x-1">
                <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Trophy className="w-3 h-3 text-white" />
                </div>
                <span>is for Tournaments.</span>
              </div>
            </div>
          </div>

          {/* Lower separator line */}
          <div className="border-t border-gray-200 mb-4"></div>

          {/* Ludo Classic Game Interface - 70% width from left */}
          <div className="mb-6 relative">
            <div
              className="w-[70%] relative bg-card rounded-lg border overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => navigate('/classic-ludo')}
            >
              <img
                src={ludoClassicGame}
                alt="Ludo Classic Game"
                className="w-full h-auto object-cover"
              />
              <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                🔴 LIVE
              </div>
              <button className="absolute bottom-2 right-2 bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold hover:bg-red-700 transition-colors">
                ×
              </button>
            </div>
          </div>

          {/* NKCLUB Information Section - Matching Reference Design */}
          <div className="bg-white border border-gray-200 rounded-lg mb-6">
            {/* NKCLUB Header with Logo */}
            <div className="p-4 border-b border-gray-200">
              {/* Upper separator line */}
              <div className="border-t border-gray-100 mb-4"></div>

              <div className="flex items-start space-x-3">
                <img
                  src={nkLogo}
                  alt="NK Club Logo"
                  className="w-10 h-10 rounded object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">APNACLUB</h3>
                  <p className="text-[10px] text-gray-600 leading-relaxed">
                    🔥 किसी भी आकर्षण के हिंदू गणेश फेस्टिवल / पैनेल में मुफ्त में अतिरिक्ता या छोटा साइड पाई जाने पर हमारे के दुरंत करने कर दी जानेगी। 🔥 कुछ भी इसमें आपने हैं आकर्षण के हिंदुस्तान करें, नाकि आपका पैमेंट मुफ्त रहेगा।
                  </p>
                </div>
              </div>

              {/* Lower separator line */}
              <div className="border-t border-gray-100 mt-4"></div>
            </div>

            {/* About Us Section */}
            <div className="p-4 border-b border-gray-200">
              <h4 className="text-gray-400 font-medium mb-3 text-xs">About Us</h4>
              <p className="text-[10px] text-gray-400 mb-4">
                APNACLUB is a real-money gaming product owned and operated by APNACLUB "We" or "Us" or "Our".
              </p>
            </div>

            {/* Our Business & Products Section */}
            <div className="p-4 border-b border-gray-200">
              <h4 className="text-gray-400 font-medium mb-3 text-xs">Our Business & Products</h4>
              <p className="text-[10px] text-gray-400 mb-4">
                We are an HTML5 game-publishing company and our mission is to make accessing games fast and easy by removing the friction of app-installs.
              </p>
              <p className="text-[10px] text-gray-400 mb-4">
                APNACLUB is a skill-based real-money gaming platform accessible only for our users in India. It is accessible on{' '}
                <a href="#" className="text-blue-400 underline">www.APNA-CLUB.in</a>. On APNACLUB, users can compete for real cash in Tournaments and Battles. They can encash their winnings via popular options such as Paytm Wallet, Amazon Pay, Bank Transfer, Mobile Recharges etc.
              </p>
            </div>

            {/* Our Games Section */}
            <div className="p-4">
              <h4 className="text-gray-400 font-medium mb-3 text-xs">Our Games</h4>
              <p className="text-[10px] text-gray-400">
                APNACLUB has a wide-variety of high-quality, premium HTML5 games. Our games are especially compressed and optimised to work on low-end devices, unreliable browsers, patchy internet connections.
              </p>
              <p className="text-[10px] text-gray-400 mt-4">
                We have games across several popular categories: Arcade, Action, Adventure, Sports & Racing, Strategy, Puzzle & Logic. We also have a strong portfolio of multiplayer games such as Ludo, Chess, 8 Ball Pool, Carrom, Tic Tac Toe, Quiz, Contest and many more! Some of our popular titles are: Escape Run, Bubble Wipeout, Tower Twist, Cricket, Ludo With Friends. If you have any suggestions around new games that we should add or if you are a game developer yourself and want to work with us, don't hesitate to drop in a line at !
              </p>
            </div>
          </div>

          {/* Support Section */}
          <div className="mt-8 mb-6 text-center">
            <h4 className="text-gray-900 font-semibold mb-4">Support</h4>
            <div className="flex justify-center items-center space-x-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer hover:bg-green-600 transition-colors">
                <MessageCircle className="w-6 h-6 text-green-500" />
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer hover:bg-pink-600 transition-colors">
                <Instagram className="w-6 h-6 text-pink-500" />
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors">
                <Send className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;

// nk