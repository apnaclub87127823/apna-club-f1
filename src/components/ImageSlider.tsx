import React, { useState, useEffect } from 'react';
import nkClubOffer from '@/assets/nk-club-offer.png';
import ludoKingPartner from '@/assets/ludo-king-partner.png';
import ludoClassicGame from '@/assets/ludo-classic-game.png';

const ImageSlider = () => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            id: 1,
            image: nkClubOffer,
            alt: "NK Club Offer - Refer & Earn 2%, Game Commission 5%",
            isLive: false
        },
        {
            id: 2,
            image: ludoKingPartner,
            alt: "NK Club Partner with Ludo King",
            isLive: false
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 2000); // Change slide every 2 seconds

        return () => clearInterval(interval);
    }, [slides.length]);

    return (
        <div className="relative w-full max-w-md mx-auto overflow-hidden rounded-lg">
            <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
                {slides.map((slide) => (
                    <div key={slide.id} className="w-full flex-shrink-0 relative">
                        <img
                            src={slide.image}
                            alt={slide.alt}
                            className="w-full h-auto object-cover"
                        />
                        {slide.isLive && (
                            <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                                🔴 LIVE
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Slide indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${currentSlide === index
                            ? 'bg-white'
                            : 'bg-white/50'
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default ImageSlider;